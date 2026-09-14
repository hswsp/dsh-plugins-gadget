# dsh-model-sync

> **DeepSeek Harness 插件**：一键同步 **OpenCode Go** 与 **OpenCode Zen** 的模型列表到
> DSH「设置 → 模型」，不用再手动去官网抄模型 ID。

本仓库托管该插件（包名为 `dsh-model-sync`），以 `hswsp/dsh-opencode-sync` 开源发布。

[English README →](README.md)

---

## 为什么需要它

- **opencode-go** 与 **OpenCode Zen**（你的 OpenCode 订阅计划）会频繁新增、改名、下架模型。
- OpenCode Go 在一个端点上混用**三种协议**：OpenAI Responses API（GPT-5.6 Luna、Grok）、
  OpenAI 兼容 chat completions（GLM、Kimi、DeepSeek…）、Anthropic Messages API（MiniMax、
  Qwen）。而 `dsh-llm-pi-ai` 的配置 schema **没有「每个模型一个 api」的字段**——provider
  级 `api` 会把所有模型钉死在一种协议上，其他协议直接全部失效。
- 每个模型协议的唯一通道是已安装的 pi-ai 内置目录
  （`providers/data/opencode-go.json`），它是打包时的静态快照，会过期。
- 本插件用**官方实时数据**重建该目录文件，让每个模型始终使用真正能跑的协议。

## 功能

在「设置 → 模型」侧边栏新增「模型同步」页：

- **顶部「刷新」**：一次性同步 opencode-go 与 zen（只产生一次设置写入）。
- **每张卡片各自的「同步」按钮**：OpenCode Go 与 OpenCode Zen 可单独同步，互不影响。

同步逻辑：

- **opencode-go — 重建 pi-ai 目录文件**（per-model 协议的唯一通道）：
  1. 抓取官方模型元数据 `https://models.opencode.ai/api.json`（容量、模态、是否推理）——
     与 opencode.ai 文档页、pi-ai 内置目录同源；
  2. 套用 <https://opencode.ai/docs/go#endpoints> 的权威 per-model 协议表
     （`openai-responses` / `openai-completions` / `anthropic-messages`），在 api.json
     漏标处覆盖（例如 qwen 的 messages 组）；
  3. 把重建的 33 模型目录写入 pi-ai 的每一份 `opencode-go.json`（运行时进程读取的
     pnpm store 副本 + profile 插件解析的 checkout 副本）；
  4. 保持 settings 里的 `opencode-go` **精简**——不写 `api` / `baseURL` / `models`，
     让 llm-pi-ai 从目录按模型分发协议。写 provider 级 `api` 会把所有模型压死在一个
     协议上。
  之后 Go 套餐新增模型也会自动带上正确的协议。
- **zen**：以 `https://opencode.ai/zen/v1/models` **携带 workspace API Key** 调用。
  该接口只返回你在 [opencode.ai](https://opencode.ai) 上**启用的模型**（禁用列表按
  Key 过滤），因此 zen 同步的正是你启用的那部分，绝不会把全部模型写进来。
- **容量覆盖**：每个模型的 `contextWindow` / `maxTokens` / `input`（text / image）按
  opencode 官方目录（`~/.cache/opencode/models.json`，即 models.dev 数据）覆盖。目录中
  缺失的模型（如刚发布的新模型）保留原有配置值，缺省回退到 `262144 / 32768`，并在结果
  中提示，方便你人工核对。

### 为什么写目录文件而不是设置里的 `models`

`llm-pi-ai` 从已安装目录解析每个模型的协议（`base?.api`）；写进
`providers.<route>.models` 的条目**没有 api 字段**，所以目录里没有的 live 模型 id 会在
设置校验时报 `needs an api`，而 provider 级 `api` 会覆盖所有模型。目录文件是三种协议
的 per-model `api` / `baseUrl` 唯一能同时存在的地方。

目录在每个 dsh 进程启动时 import 一次，因此重建后需**重启 dsh** 生效。同步结果会报告
写入的模型总数与目标路径。

## API Key

- opencode-go 不需要 Key。
- zen 需要 workspace API Key，按优先级从以下来源解析：
  1. DSH 凭据 / 环境变量 `OPENCODE_WORKSPACE_API_KEY`
  2. `OPENCODE_GO_API_KEY`（Go 订阅的 Key，本身也是 workspace Key）
  3. `ZEN_API_KEY`
  4. `~/.local/share/opencode/auth.json` 中 `opencode-go`（回退 `opencode`）的 `type=api` Key

没有可用 Key 时 zen 会**跳过**并给出提示。不带 Key 时该接口会返回全部模型，直接同步
会误把未启用的模型写进来，所以没有 Key 就不同步 zen。

## 版本兼容

需要 DSH ≥ `0.1.5-rc.1`。`@deepseek-ai/dsh-settings@0.1.5` 起移除了
`settingsNamespace()` 辅助函数，命名空间直接使用普通字符串。本插件把 `"llm-pi-ai"`
直接传给 `ctx.settings.get/update`；旧版 `dsh-settings`（`^0.1.0-rc.6`）同样接受
普通字符串，因此新旧版本均可使用。

## 安装

```bash
# 从本仓库安装
dsh plugin --profile web add /path/to/dsh-opencode-sync

# 或是在 DeepSeek Harness 源码树内开发调试
dsh plugin --profile web add ../../../plugins/dsh-model-sync
```

重启 dsh web 服务后生效（目录重建与设置变更在启动时加载）。

## 配置（cordis）

在 DSH profile 的 `cordis.patch.yml` 中新增 insert 条目：

```yaml
- insert:
    - id: model-sync
      name: 'dsh-model-sync'
      config:
        goUrl: 'https://opencode.ai/zen/go/v1/models'
        zenUrl: 'https://opencode.ai/zen/v1/models'
        modelsApi: 'https://models.opencode.ai/api.json'
        cachePath: '~/.cache/opencode/models.json'
        timeoutMs: 15000
```

| 选项         | 默认值                                              | 说明                                     |
| ------------ | --------------------------------------------------- | ---------------------------------------- |
| `goUrl`      | `https://opencode.ai/zen/go/v1/models`              | opencode-go 模型列表接口                 |
| `zenUrl`     | `https://opencode.ai/zen/v1/models`                 | zen 模型列表接口（携带 API Key 调用）    |
| `modelsApi`  | `https://models.opencode.ai/api.json`               | 重建目录用的官方模型元数据               |
| `cachePath`  | `~/.cache/opencode/models.json`                     | 本地官方目录（models.dev 快照）          |
| `timeoutMs`  | `15000`                                             | 单次请求超时（毫秒）                     |

## 使用方法

1. 打开 DSH Web →「设置 → 模型」。
2. 确保 `opencode-go` 与 `zen` 提供商已存在于该页面 —— 插件不会从零创建提供商
   （`apiKeyEnv` 仍需配置在提供商上）。
3. 打开「模型同步」页，点击「刷新」（或某个提供商对应的「同步」按钮）。Go 卡片调用
   `syncGoCatalog()`：从官方数据重建 pi-ai 目录文件，结果会报告 `total` 写入的模型数、
   `byProtocol` 协议分布和写入的路径。
4. **重启 dsh web**，让运行时进程加载重建后的目录（三种协议的 per-model 分发随即生效）。

## 常见问题

- **zen 被跳过，提示找不到 workspace API Key** —— 配置
  `OPENCODE_WORKSPACE_API_KEY` / `OPENCODE_GO_API_KEY` / `ZEN_API_KEY` 之一，或确保
  opencode 已登录（存在 `~/.local/share/opencode/auth.json`）。
- **HTTP 401** —— workspace Key 无效或已过期，去 [opencode.ai](https://opencode.ai) 刷新。
  注意还有地区限制：部分模型只对支持地区的出口 IP 提供服务，网关会对不支持的出口 IP
  返回 403 `[unsupported_country_region_territory]`。
- **安装时报 `ERR_PNPM_UNEXPECTED_STORE`** —— DSH profile 的 pnpm store 路径与插件
  不一致。手动兜底：把本插件目录复制到
  `profiles/web/node_modules/dsh-model-sync/`（hoisted 布局下即为真实目录），并在
  `cordis.patch.yml` 中手动加上 `- id: model-sync` / `name: 'dsh-model-sync'`。
- **设置写入被拒，报 `needs an api`** —— `opencode-go` provider 上残留的旧 `models`
  列表里含有已安装目录无法描述的 id。删掉 provider 的 `models`（以及 `api` / `baseURL`），
  让路由保持精简、由目录分发协议。
- **提示容量回退** —— 本地目录（`~/.cache/opencode/models.json`）过期或不存在；先运行
  一次 opencode 刷新缓存，或手动核对该模型。

## 项目结构

| 文件             | 作用                                                       |
| ---------------- | ---------------------------------------------------------- |
| `index.js`       | 服务端半边：`ModelSyncGateway` 服务（Typert Remote）与同步逻辑 |
| `client.js`      | 浏览器半边：设置侧边栏分区 + React 同步面板                |
| `typert.host.js` | Typert host 清单（`modelSync` Remote 的 strict 模式分发）  |
| `package.json`   | 包元数据 + DSH client inject 清单                          |

## 许可

MIT — 见 [LICENSE](LICENSE)。