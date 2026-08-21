# dsh-bash-prefix

> **DeepSeek Harness 插件** —— 一个 **on/off 条形开关** + 一个**自由文本框**（preamble）。
> 开关打开时，**每次 DSH 执行 bash 命令都会先自动运行你输入的这些命令**，再运行本次命令
> 本身。典型用途：在每次 bash 前自动开启 VPN 代理。

[English README →](README.md)

---

## 为什么需要它

- DSH 的 bash 工具把每次命令作为 `bash -c <command>` 在**全新非交互 shell** 里执行，它
  **不读 `~/.zshrc`**，只继承启动 DSH 那个进程的环境变量。所以你在 shell 配置里设的代理
  变量对 DSH 的 bash 根本不生效。
- 每次手动在命令前拼 `export https_proxy=...` 既繁琐又易错。
- 本插件把这段前置命令收进**设置里的一个文本框**，用一个条形开关随时开关。

## 功能

在 DSH 设置里新增「**Bash 预处理**」页面：

- **on/off 条形开关** —— 打开时开启 preamble 功能（文本框可编辑）；关闭时禁用（文本框只读，
  不注入任何前缀）。
- **自由文本框** —— 输入任意多行命令，每次 bash 前都会先执行，例如：

  ```bash
  export https_proxy=http://127.0.0.1:7897
  export http_proxy=http://127.0.0.1:7897
  export all_proxy=socks5://127.0.0.1:7897
  ```

- **保存** —— 原样保存你输入的文本，**绝不自动清空**；只有你手动删除才会变空。
- **注入规则** —— 开关打开**且**文本框非空时才注入。
- **持久化**，重启不丢；覆盖**前台与后台**全部 bash 调用。

## 原理

DSH 的 bash 工具通过 `ctx.shell.resolve()` 解析每条命令，并把返回 spec 的 `.command`
交给 `bash -c`。本插件包装这一处（`ctx.shell.resolve()`）：当开关打开且前置命令**非空**时，
把它拼到命令前面（用换行分隔，这样前置命令里的 `export` 对后续命令生效）。只改命令字符串
本身——不动 argv、沙箱、参数解析，因此提权与后台语义都不受影响。

当开关关闭或前置命令为空时，bash 原样执行，不注入任何内容。

## 安装

```bash
# 从本仓库
dsh plugin --profile web add /path/to/dsh-plugins-gadget/dsh-bash-prefix

# 或在 DeepSeek Harness 源码树里开发时
dsh plugin --profile web add ../../../plugins/dsh-bash-prefix
```

安装后重启 dsh web 服务（web profile 会热重载 `cordis.patch.yml`，多数情况无需重启）。

## 配置（cordis）

在你的 DSH profile 的 `cordis.patch.yml` 加一条 insert：

```yaml
- insert:
    - id: bash-prefix
      name: 'dsh-bash-prefix'
```

无需额外配置项——开关状态与前置命令存放在 `settings.bash-prefix` 命名空间，直接在设置界面
编辑。

## 使用

1. 打开 DSH web → **设置 → Bash 预处理**。
2. 打开**条形开关**（此时文本框解锁）。
3. 在文本框里粘贴你要的前置命令（上面的代理 `export` 已作为占位示例）。
4. 点**保存**。
5. 之后每次 DSH bash 命令都会先执行这些命令，再执行本次命令。想停就关掉开关（或清空文本框
   并保存）。

## 排错

- **安装报 `ERR_PNPM_UNEXPECTED_STORE`** —— 你的 DSH profile 的 pnpm store 路径与插件不一致。
  兜底：把本目录复制到 `profiles/web/node_modules/dsh-bash-prefix/`（hoisted 布局下的真实目录），
  并在 `cordis.patch.yml` 手动加 `- id: bash-prefix` / `name: 'dsh-bash-prefix'`。
- **开启后设置里没有「Bash 预处理」入口** —— 刷新 / 重启 dsh web 服务，让 client bundle 被加载。
- **看起来没生效** —— 确认开关已打开、文本框非空且已保存；检查 profile 的 settings 文件里的
  `settings.bash-prefix`。

## 项目结构

| 文件             | 作用                                                                 |
| ---------------- | -------------------------------------------------------------------- |
| `index.js`       | Host 端：`BashPrefixGateway` 服务（Typert Remote）+ shell 包装       |
| `client.js`      | 浏览器端：设置侧边栏 + on/off 条形开关/文本框面板                    |
| `typert.host.js` | Typert host 清单（`bashPrefix` Remote 的 strict 分发）               |
| `package.json`   | 包元数据 + DSH client inject 清单                                    |

## 许可

MIT —— 见 [LICENSE](LICENSE)。
