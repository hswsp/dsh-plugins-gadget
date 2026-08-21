# dsh-bash-prefix

> **DeepSeek Harness 插件** —— 每次 DSH **新开一个 bash（shell）会话**时，都会先自动执行
> 一组**你预制的命令（规则列表）**，再去执行你真正让它跑的命令。
>
> 典型用途：把标准的代理 `export` 放进规则列表，这样**当你的 VPN 处于「rule」模式时，
> DSH 的每次 bash 跑命令都会自动走 VPN**。

[English README →](README.md)

---

## 一句话说明它在做什么

DSH 的 bash 工具把每次命令作为 `bash -c <command>` 在一个**全新、非交互**的 shell 里执行，
它**不读 `~/.zshrc`**，只继承启动 DSH 那个进程的环境变量。所以你在 shell 配置里设的代理
变量对 DSH 的 bash 根本不生效——即使你的系统/VPN 开着，DSH 的 bash 默认也**不会**走代理。

这个插件解决的就是这个问题：它让你维护一份**预制命令列表**，当开关处于 **Enable** 时，把
整份列表**拼到每一次 bash 命令前面**。于是每个新的 bash 会话一开起来，先跑的就是你的规则
列表，通常是：

```bash
export https_proxy=http://127.0.0.1:7897
export http_proxy=http://127.0.0.1:7897
export all_proxy=socks5://127.0.0.1:7897
```

因为这几条 `export` 在真正命令之前就执行了，该 bash 会话里后续每条命令都能看到代理变量，
从而走 VPN（例如 Clash 的 **rule** 模式）——你不用再每条命令手敲代理。

## 功能

在「设置」里新增「**Bash 预处理**」页面：

- **Enable / Disable 开关** —— 控制规则是否注入。
  - **Enable** —— 每次 bash 前都会先执行规则列表。
  - **Disable** —— bash 原样执行，不注入任何前缀。
- **规则列表（一行一条命令）** —— 在输入框输入一行命令，点「**添加**」（或按回车）加入列表；
  每条规则右侧有 **×** 可删除。
- **无需 Save 按钮** —— 每一条添加/删除/开关切换都会立即保存。
- **持久化**，重启不丢；覆盖**前台与后台**全部 bash 调用。

示例规则列表（一行一条）：

```
export https_proxy=http://127.0.0.1:7897
export http_proxy=http://127.0.0.1:7897
export all_proxy=socks5://127.0.0.1:7897
```

## 原理

DSH 的 bash 工具通过 `ctx.shell.resolve()` 解析每条命令，并把返回 spec 的 `.command`
交给 `bash -c`。本插件包装这一处（`ctx.shell.resolve()`）：当开关处于 **Enable** 且规则
列表**非空**时，把规则用换行拼接后加在命令前面（这样前置规则里的 `export` 对后续命令生效）。
只改命令字符串本身——不动 argv、沙箱、参数解析，因此提权与后台语义都不受影响。

当开关处于 **Disable**（或规则列表为空）时，bash 原样执行，不注入任何内容。

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

无需额外配置项——开关状态与规则列表存放在 `settings.bash-prefix` 命名空间，直接在设置界面
编辑。

## 使用

1. 打开 DSH web → **设置 → Bash 预处理**。
2. 把开关切到你想要的状态：**Enable** 注入、**Disable** 停止。
3. 在输入框输入一行命令，点「**添加**」（或按回车），逐条加入你要的预制命令。
4. 规则即时保存，不需要点保存按钮。
5. 之后每次 DSH bash 命令都会先执行这些行，再执行本次命令本身。

## 排错

- **安装报 `ERR_PNPM_UNEXPECTED_STORE`** —— 你的 DSH profile 的 pnpm store 路径与插件不一致。
  兜底：把本目录复制到 `profiles/web/node_modules/dsh-bash-prefix/`（hoisted 布局下的真实目录），
  并在 `cordis.patch.yml` 手动加 `- id: bash-prefix` / `name: 'dsh-bash-prefix'`。
- **安装后设置里没有「Bash 预处理」入口** —— 刷新 / 重启 dsh web 服务，让 client bundle 被加载。
- **改了 host 端（index.js）不生效** —— host 端只在启动时加载，改完 `index.js` 需要重启 dsh web
  进程（浏览器端 `client.js` 刷新页面即可）。
- **看起来没生效** —— 确认开关是 **Enable**、且至少有一条规则；检查 profile 的 settings 文件里的
  `settings.bash-prefix`。
- **还是没走 VPN** —— 插件只负责把代理 `export` 注入 bash 环境。代理软件本身（如 Clash）必须
  正在运行并处于 **rule** 模式、有可用的出口节点，且 `127.0.0.1:7897` 要与代理实际端口一致。

## 项目结构

| 文件             | 作用                                                             |
| ---------------- | ---------------------------------------------------------------- |
| `index.js`       | Host 端：`BashPrefixGateway` 服务（Typert Remote）+ shell 包装   |
| `client.js`      | 浏览器端：设置侧边栏 + Enable/Disable 开关/规则列表面板           |
| `typert.host.js` | Typert host 清单（`bashPrefix` Remote 的 strict 分发）           |
| `package.json`   | 包元数据 + DSH client inject 清单                                |

## 许可

MIT —— 见 [LICENSE](LICENSE)。
