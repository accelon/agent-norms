# AGENTS.md — agent-norms

> 這個資料夾是**規範與共用模組的 canonical 家**（remote：`accelon/agent-norms`），
> 不是某個產品的建置工作區。
>
> **作者 2026-11-04 指示：以後開新工作區都到這裡開始。**

## 1. 有人說「開一個新工作區」

照 [`new-workspace.md`](new-workspace.md) 做：

| 類型 | 步驟 | 模板 |
|---|---|---|
| 一般專案／研究／文件區 | `new-workspace.md` §2 | [`new-workspace-AGENTS.md`](new-workspace-AGENTS.md) |
| adb 資料庫（`*.adb`） | [`new-adb-workspace.md`](new-adb-workspace.md) | [`new-adb-AGENTS.md`](new-adb-AGENTS.md) |

- 新工作區一律建在 `D:\2026\<name>`，**不要**建在 agent-norms 裡面。
- 新工作區自己一個 git repo，與這裡分開。
- 模板複製過去之後把 `{{…}}` 填掉、刪掉用不到的段落；不要把本檔或母區 `AGENTS.md` 整份複製。

## 2. 這裡放什麼、不放什麼

跨專案的**資料模型原則**也放這裡：`D:\2026\agent-norms\shutonggui.md`（[`shutonggui.md`](shutonggui.md)）（書同軌：句級地址、最小切分、轍號、crosswalk）。
發布到官網孵化區的規範在 [`incubator.md`](incubator.md)（門檻、繁簡、背景與主題、交付、部署）；各工作區的 `AGENTS.md` 只留鏈結。

放：跨專案可重用的**規範**（`yap-software-practice.md`、`wails3-pitfalls.md`、`writing-skill.md`…）、
可重用的**模組**（`lossless-simplified/`、`self-explaining-tour/`、`corpus-to-mobile/`）、
以及開新工作區的模板。

不放：任何專案的資料、成品、伺服器帳密；專案自己的 runbook 留在該專案。

## 3. 改規範的規矩

- **canonical 只有這一份。** 消費端（如 `adb-converter`）的副本由 `ts/tools/sync-agent-norms.ts`
  同步；不要在副本上改，改這裡再 `bun run sync:norms`。
- 改動要寫「為什麼」與日期（例：`> 2026-11-04 作者指示：…`），不要只改結論。
- 同一件事不要在三份文件各寫一遍：通用放這裡，專案細節放專案的 README／HANDOVER。
- 文件用繁體中文；heading 可中英混用，程式識別字用英文。

## 4. 工作紀律

- 背景工作與子行程（[`yap-software-practice.md`](yap-software-practice.md) §12）：能前景跑就前景；
  要背景就記 job id、加 timeout，收工前連子行程一起收，回報前確認 `Get-Process bun` 沒有殘留。
- **不要** `git add -A`、`git reset --hard`、`git restore .`；這裡常有別人的未提交改動。
- 除非作者明說要 commit／push，不要自動提交。
- 要動 adb 的規則、工具或資料，回 `D:\2026\adb-converter`；這裡只放通用規範。
- 大檔、`node_modules/`、建置產物不進版控。
