# dsh-model-sync

> **DeepSeek Harness 插件**：一键同步 **OpenCode Go** 与 **OpenCode Zen** 的模型列表到
> DSH「设置 → 模型」，不用再手动去官网抄模型 ID。

本仓库托管该插件（包名为 `dsh-model-sync`），以 `hswsp/dsh-opencode-sync` 开源发布。

[English README →](README.md)

---

## 为什么需要它

- **opencode-go** 与 **OpenCode Zen**（你的 OpenCode 订阅计划）会频繁新增、改名、下架模型。
- 过去要把 DeepSeek Harness 的「设置 → 模型」保持同步，只能手动对照 opencode.ai 的目录
  逐个修改本地模型列表。
- 这个插件在 DSH Web 设置界面里一键完成。

## 功能

在「设置 → 模型」侧边栏新增「模型同步」页：

- **顶部「刷新」**：一次性同步 opencode-go 与 zen（只产生一次设置写入）。
- **每张卡片各自的「同步」按钮**：OpenCode Go 与 OpenCode Zen 可单独同步，互不影响。

同步逻辑：

- **opencode-go**：以 `https://opencode.ai/zen/go/v1/models` 的实时列表**全量替换**
  `llm-pi-ai.providers["opencode-go"].models`（新增缺失模型、移除已下架模型）。
- **zen**：以 `https://opencode.ai/zen/v1/models` **携带 workspace API Key** 调用。
  该接口只返回你在 [opencode.ai](https://opencode.ai) 上**启用的模型**（禁用列表按
  Key 过滤），因此 zen 同步的正是你启用的那部分，绝不会把全部模型写进来。
- **容量覆盖**：每个模型的 `contextWindow` / `maxTokens` / `input`（text / image）按
  opencode 官方目录（`~/.cache/opencode/models.json`，即 models.dev 数据）覆盖。目录中
  缺失的模型（如刚发布的新模型）保留原有配置值，缺省回退到 `262144 / 32768`，并在结果
  中提示，方便你人工核对。

## API Key

- opencode-go 不需要 Key。
- zen 需要 workspace API Key，按优先级从以下来源解析：
  1. DSH 凭据 / 环境变量 `OPENCODE_WORKSPACE_API_KEY`
  2. `OPENCODE_GO_API_KEY`（Go 订阅的 Key，本身也是 workspace Key）
  3. `ZEN_API_KEY`
  4. `~/.local/share/opencode/auth.json` 中 `opencode-go`（回退 `opencode`）的 `type=api` Key

没有可用 Key 时 zen 会**跳过**并给出提示。不带 Key 时该接口会返回全部模型，直接同步
会误把未启用的模型写进来，所以没有 Key 就不同步 zen。

## 安装

```bash
# 从本仓库安装
dsh plugin --profile web add /path/to/dsh-opencode-sync

# 或是在 DeepSeek Harness 源码树内开发调试
dsh plugin --profile web add ../../../plugins/dsh-model-sync
```

重启 dsh web 服务后生效（web profile 会热重载 `cordis.patch.yml`，通常无需重启）。

## 配置（cordis）

在 DSH profile 的 `cordis.patch.yml` 中新增 insert 条目：

```yaml
- insert:
    - id: model-sync
      name: 'dsh-model-sync'
      config:
        goUrl: 'https://opencode.ai/zen/go/v1/models'
        zenUrl: 'https://opencode.ai/zen/v1/models'
        cachePath: '~/.cache/opencode/models.json'
        timeoutMs: 15000
```

| 选项         | 默认值                                          | 说明                                     |
| ------------ | ----------------------------------------------- | ---------------------------------------- |
| `goUrl`      | `https://opencode.ai/zen/go/v1/models`          | opencode-go 模型列表接口                 |
| `zenUrl`     | `https://opencode.ai/zen/v1/models`             | zen 模型列表接口（携带 API Key 调用）    |
| `cachePath`  | `~/.cache/opencode/models.json`                 | 本地官方目录（models.dev 快照）          |
| `timeoutMs`  | `15000`                                         | 单次请求超时（毫秒）                     |

## 使用方法

1. 打开 DSH Web →「设置 → 模型」。
2. 确保 `opencode-go` 与 `zen` 提供商已存在于该页面 —— 插件只同步它们的模型列表，
   不会创建提供商（`api` / `baseURL` / `apiKeyEnv` 都在提供商上，只带 `models` 的
   提供商无法通过校验）。
3. 打开「模型同步」页，点击「刷新」（或某个提供商对应的「同步」按钮）。
4. 每张卡片会报告 `total` / `added` / `removed`，并列出容量回退到默认值的模型。

## 常见问题

- **zen 被跳过，提示找不到 workspace API Key** —— 配置
  `OPENCODE_WORKSPACE_API_KEY` / `OPENCODE_GO_API_KEY` / `ZEN_API_KEY` 之一，或确保
  opencode 已登录（存在 `~/.local/share/opencode/auth.json`）。
- **HTTP 401** —— workspace Key 无效或已过期，去 [opencode.ai](https://opencode.ai) 刷新。
- **安装时报 `ERR_PNPM_UNEXPECTED_STORE`** —— DSH profile 的 pnpm store 路径与插件
  不一致。手动兜底：把本插件目录复制到
  `profiles/web/node_modules/dsh-model-sync/`（hoisted 布局下即为真实目录），并在
  `cordis.patch.yml` 中手动加上 `- id: model-sync` / `name: 'dsh-model-sync'`。
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
