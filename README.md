# dsh-plugins-gadget

> **DeepSeek Harness（DSH）自制插件集合** —— 这里收录我自制的、给 DSH 用的各种插件，
> 每个插件一个独立子目录，可单独安装使用。

本仓库是一系列 DSH 插件（plugin）的合集，随我自己的使用需求逐步扩充。每个插件目录都是
一个完整的、可独立发布的 DSH 插件包（含各自的 `package.json` 与 README）。

[English README →](README.en.md)

---

## 收录插件

| 目录                 | 插件名            | 说明                                             |
| -------------------- | ----------------- | ------------------------------------------------ |
| [`dsh-opencode-sync/`](dsh-opencode-sync/) | `dsh-model-sync` | 一键同步 OpenCode Go 与 OpenCode Zen 模型列表到「设置 → 模型」 |
| [`dsh-bash-prefix/`](dsh-bash-prefix/) | `dsh-bash-prefix` | 每次 bash 前自动执行你自定义的前置命令（开关 + 文本框），用于一键开启 VPN 代理 |
| [`dsh-opencode-go-usage/`](dsh-opencode-go-usage/) | `dsh-ocgo-usage` | 输入框 dock 上的 OpenCode Go 用量读数（5h / 每周 / 每月 + 重置倒计时）；上游 [`v587d/dsh-opencode-go-usage`](https://github.com/v587d/dsh-opencode-go-usage) 的适配 fork，修好 dsh ≥ 0.1.2-rc.1 上 chip 不再显示的问题 |

> 更多插件持续添加中。

## 同时支持 dsh CLI 与 DSH Desktop

本仓库所有插件都是**同一份代码同时运行在两种宿主上**：

| 宿主 | 说明 |
| ---- | ---- |
| **dsh CLI** | 命令行版 Harness（`dsh web` / `dsh --profile web`） |
| **DSH Desktop** | 桌面版（打包的 Electron 应用，插件由内置插件市场管理） |

之所以能共用一份代码，是因为两者的**运行时契约完全相同** —— 同一套
`schemastery` / `typert` / `settings` / `credentials` / `shell` 服务，同样的
bundle 加载规则（[`dsh-app-boot`](https://www.npmjs.com/package/@deepseek-ai/dsh-app-boot)
的 profile 契约：凡是声明了 `dsh.bundle.patch` 的包都会被当作 bundle 加载）。

因此插件**不需要**为两个平台各写一份，也**不需要**运行时分支判断。唯一要做的是把
打包声明写全，让两边都能识别：

```jsonc
{
  "dsh": {
    // ① 声明本包是 profile bundle，并指向自己的 patch 层。
    //    缺少这一项时，包只能靠 profile 手动 insert 注册 —— Desktop 的
    //    插件迁移与市场管理都会跳过它。
    "bundle": { "patch": "./cordis.patch.yml" },
    // ② 浏览器半（设置页 UI），由宿主以 web app 加载。
    "client": { "inject": ["..."], "platform": "web" },
    // ③ 声明已验证兼容的 Harness 版本，便于宿主提示兼容性。
    "compatibility": { "dshReleases": { "0.1.5-rc.1": "compatible" } }
  }
}
```

`cordis.patch.yml` 则是这张声明的实体（loader entry 列表）：

```yaml
- insert:
    - id: <entry-id>
      name: <package-name>
```

**插件代码本身不含任何宿主判断** —— 不读 `DSH_HOME` 猜安装布局，不检测运行环境，
所有平台差异都收敛在 `package.json` 与 `cordis.patch.yml` 这两个声明文件里。

## 如何安装某个插件

```bash
# dsh CLI：装进某个 profile
dsh plugin --profile web add /path/to/dsh-plugins-gadget/dsh-opencode-sync
dsh plugin --profile web add /path/to/dsh-plugins-gadget/dsh-bash-prefix
```

**DSH Desktop**：桌面版从插件市场（dshmarket）管理插件。本地目录形式的插件可用
桌面自带的 generation 安装器装入：

```bash
# 由 Desktop 的 market-installer 提供的 API
#   POST /dsh-desktop/market-installer/install
# 或在「设置 → 插件」中通过市场界面安装。
```

装好后重启 Harness 生效（host 半在进程启动时加载）。

每个插件的具体配置方式，见其子目录内的 README。

## 目录结构

```
dsh-plugins-gadget/
├── README.md            # 本说明（中文）
├── README.en.md         # 本说明（English）
├── .gitignore
└── <plugin-a>/          # 每个插件一个独立子目录
    ├── package.json         # 含 dsh.bundle / dsh.client 声明
    ├── cordis.patch.yml     # bundle patch 层（loader entry）
    ├── index.js             # host 半（Cordis 插件）
    ├── client.js            # client 半（设置页 UI）
    ├── typert.host.js       # Typert Remote 契约
    └── README.md / README.xx.md
```

## 许可

本仓库中各插件均以 **MIT** 许可开源 —— 详见各插件目录内的 `LICENSE`。
