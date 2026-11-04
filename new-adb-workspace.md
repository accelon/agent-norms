# 開一個新的 adb 工作區

> **2026-11-04 從 `D:\2026\adb-converter\docs\adb\` 搬到這裡**：之後 adb 新工作區的入口是這頁，
> 模板是 [`new-adb-AGENTS.md`](new-adb-AGENTS.md)。通用步驟（要不要開、骨架、交接）見
> [`new-workspace.md`](new-workspace.md)，本文只寫 adb 的差異。

## 1. 先決定

| 項目 | 說明 |
|---|---|
| 資料夾 | `D:\2026\<name>`（與 `ys`、`fuyan` 同層）；已移出的專案不放在母區內 |
| `dbname` | 小寫英數，例 `fuyan`；成品 `D:\accelon3\<name>.adb` |
| 中文名 | `dbcname`，例「福嚴佛學院講義」 |
| 來源 | CBETA XML／SAT／docx／舊 adb；寫清楚版本與路徑 |
| 分層 | 底座（經文）／功能（標注、連結）／工具；見母區 `docs/adb/stable-adb.md` |
| 例外 | sz 與其巴利譯本的 adb 放 `D:\2026\sz\accelon26`，不放 `D:\accelon3`（見母區 `AGENTS.md`） |

## 2. 建立資料夾與 AGENTS.md

```powershell
$name = 'newdb'
$dir  = "D:\2026\$name"
New-Item -ItemType Directory -Force $dir | Out-Null

Copy-Item 'D:\2026\agent-norms\new-adb-AGENTS.md' "$dir\AGENTS.md"
git -C $dir init
```

用編輯器把模板裡的佔位換掉：

- `{{DB}}` → `newdb`
- `{{TITLE}}` → 中文名
- `{{WORKDIR}}` → `D:\2026\newdb`
- `{{SOURCE}}` → 來源與版本（例「CBETA XML-P5 2026R2，T01–T55」）

> 不要直接複製母區 `D:\2026\adb-converter\AGENTS.md`：那是「工具與官網」工作區的
> 規則（成品放 `D:\accelon3`、viewer 位置、發佈權限…）。新工作區的 `AGENTS.md`
> 應該是**模板這一份**，它在 §0 要求新工作區回來讀那幾份紀律文件。

## 3. 基本骨架

```text
D:\2026\<name>\
  AGENTS.md        ← 從模板複製、填好
  README.md        ← 來源、指令、成品、限制（給下一個接手的人）
  src\             ← 轉檔／patch／pack 腳本
  raw\ 或 data\    ← 原始檔（唯讀；大檔不進版控）
  out\             ← 中間產物、測試輸出（不進版控）
  docs\            ← 這一庫的 steps／notes（可選）
```

成品不要放 `out/` 或 `dist/`：**copy 到 `D:\accelon3\<name>.adb`**。

## 4. 開工前先讀（新工作區的 agent 也要讀）

1. `D:\2026\agent-norms\README.md`、`yap-software-practice.md`（§12 背景工作）
2. 母工作區 `D:\2026\adb-converter\AGENTS.md`（母區規則）
3. 母區 `docs/adb/adb-knowhow.md`（共用 know-how：容器、VA、漢字位置、缺字、`<术>`、`<聯>`、建置六步）
4. 母區 `docs/adb/adb-version-log.md`（版本紀錄，canonical）
5. 依需要：`han-position.md`、`terms.md`、`glossary.md`、`missing-char.md`

## 5. 建置與記帳（不可省）

1. 建置、驗證、pack → `D:\accelon3\<name>.adb`
2. 在母區 `deploy/adb-notes.json` 寫這個 sha 的說明
3. 在母區 `docs/adb/adb-version-log.md` **加一列**（日期／sha 前 12／大小／
   buildTime／工作區／說明）
4. 要發布才跑 `publish-adb.ts`（大檔 `--allow-large`）；官網 exe release 仍由母區

## 6. 母區要補的文件

- `docs/README.md` 的索引加一列（這一庫的 about／steps）
- 若是公開庫：`deploy/adb-status.json`、`www/adb/index.txt`、`docs/adb/<name>-about.md`

## 7. 停用時

照 `new-adb-AGENTS.md` §7 交接：最後一次建置能重跑、版本紀錄有最後一列、
README 寫清楚「已停用，維護看母區哪一份」。
