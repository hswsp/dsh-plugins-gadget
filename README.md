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

> 更多插件持续添加中。

## 如何安装某个插件

以 `dsh-opencode-sync` 为例，进入对应目录后按各插件的 README 安装即可：

```bash
# 例如安装 dsh-opencode-sync
cd dsh-opencode-sync
dsh plugin --profile web add /path/to/dsh-plugins-gadget/dsh-opencode-sync
```

每个插件的具体安装与配置方式，见其子目录内的 README。

## 目录结构

```
dsh-plugins-gadget/
├── README.md            # 本说明（中文）
├── README.en.md         # 本说明（English）
├── .gitignore
└── <plugin-a>/          # 每个插件一个独立子目录
    ├── package.json
    ├── index.js
    ├── client.js
    └── README.md / README.xx.md
```

## 许可

本仓库中各插件均以 **MIT** 许可开源 —— 详见各插件目录内的 `LICENSE`。
