# 開一個新工作區（canonical）

> **2026-11-04 作者指示：「開新工作區」的做法與模板一律放在 agent-norms。**
> 以後要開新工作區，從這頁開始，不要再從某個專案工作區的 `docs/` 裡複製。
> 開完之後，新工作區的 `AGENTS.md` 會要求它回來讀這裡的紀律，以及母工作區的規則。

- adb 資料庫（`*.adb`）→ 看 §8，並用 [`new-adb-workspace.md`](new-adb-workspace.md) 與模板 [`new-adb-AGENTS.md`](new-adb-AGENTS.md)。
- 其他專案／研究／文件區 → 用 §2 的通用模板 [`new-workspace-AGENTS.md`](new-workspace-AGENTS.md)。

---

## 0. 先決定：要不要開新工作區

| 情況 | 做法 |
|---|---|
| 只是改現有專案的一部分 | 留在母工作區 |
| 一份資料／產品有自己的來源、建置流程、成品，壽命比母區長 | **開新工作區** |
| 已移出的專案（`D:\2026\ys` 等） | 不要搬回母區；跨區改動先問作者 |
| 只是實驗、可能整批丟掉 | 母區的 `build/` 或 `experiments/`，不要開新區 |

原則：**母工作區是規則與工具的家，新工作區是某一份資料與成品建置的家。**
不要把母區整份 `AGENTS.md` 複製過去——那是母區的規則，不是新區的。

## 1. 決策表（開工前填好）

| 項目 | 規則 | 例 |
|---|---|---|
| 名稱 | 小寫英數、無空格、無中文 | `fuyan`、`ys`、`hv-analysis` |
| 中文名 | 給人看的全名 | 「福嚴佛學院講義」 |
| 路徑 | `D:\2026\<name>`，與 `ys`、`fuyan` 同層；**不要**開在母區資料夾裡面 | `D:\2026\fuyan` |
| 母工作區 | 共用規則與工具來自哪一區 | `D:\2026\adb-converter` |
| 成品位置 | 固定、寫進 `AGENTS.md`；不要放 `dist/`、`build/`、`out/` | `D:\accelon3\<name>.adb` |
| 來源 | 原始資料版本與路徑；原始檔**唯讀** | CBETA XML-P5 2026R2 |
| 記帳 | 每次建置／每次換版記在哪一份檔案 | 母區 `docs/adb/adb-version-log.md` |
| 發布權 | 誰可以發布、發布去哪 | 母區，或本區（寫清楚） |

## 2. 建立（三步）

```powershell
$name = 'newdb'
$dir  = "D:\2026\$name"
New-Item -ItemType Directory -Force $dir | Out-Null

# ① 複製模板（二選一）
Copy-Item 'D:\2026\agent-norms\new-workspace-AGENTS.md' "$dir\AGENTS.md"   # 一般專案
Copy-Item 'D:\2026\agent-norms\new-adb-AGENTS.md'       "$dir\AGENTS.md"   # adb 資料庫

# ② 填佔位（見下）
# ③ 新區自己一個 repo，與母區分開
git -C $dir init
```

模板的佔位：

| 佔位 | 換成 |
|---|---|
| `{{NAME}}`／`{{DB}}` | 工作區名稱（adb 用 `{{DB}}`，同時是 `dbname`） |
| `{{TITLE}}` | 中文名 |
| `{{WORKDIR}}` | 絕對路徑，`D:\2026\<name>` |
| `{{PURPOSE}}` | 這一區要產出什麼、給誰用 |
| `{{SOURCE}}` | 來源與版本 |
| `{{PARENT}}` | 母工作區路徑 |
| `{{OUTPUT}}` | 成品路徑 |

填完把模板裡「用不到就整段刪掉」的段落刪掉，不要留一堆空洞的標題。

## 3. 骨架

```text
D:\2026\<name>\
  AGENTS.md        ← 從模板複製、填好（唯一的規則入口）
  README.md        ← 來源、指令、成品、限制（給下一個接手的人）
  src\             ← 建置／轉檔／patch 腳本
  raw\ 或 data\    ← 原始檔（唯讀；大檔不進版控）
  out\             ← 中間產物、測試輸出（不進版控）
  docs\            ← 這一區的 steps／notes（可選）
```

成品**不要**留在 `out/`、`build/`、`dist/`：copy 到決策表寫的固定位置。

## 4. 開工前必讀（新區的 agent 也要讀）

| 順序 | 文件 | 為什麼 |
|---|---|---|
| 1 | [`README.md`](README.md) | 這裡有什麼、怎麼用 |
| 2 | [`yap-software-practice.md`](yap-software-practice.md) | 作者預設做法；**§12 背景工作與行程對所有工作區有效** |
| 3 | 母工作區的 `AGENTS.md` | 母區的規則、成品位置、發布權限 |
| 4 | 母區的領域 know-how 文件 | 例 adb 的 `docs/adb/adb-knowhow.md` |
| 5 | 需要時 [`writing-skill.md`](writing-skill.md) | 代寫／改稿作者的文章之前必讀 |

這幾份**不要複製**進新區；直接讀，讓 canonical 只有一份。新區的 `AGENTS.md` 只寫「這一區的差異」。

## 5. 成品、記帳、發布

1. 建置 → 驗證 → 成品放固定位置。
2. 每一次建置在**母區的版本紀錄**加一列：日期／版本或 sha／大小／buildTime／工作區／說明。
   **這一列不是可選項**——工作區日後會停用，沒有紀錄後人只能猜。
3. 對外的說明文件：母區 `docs/` 放索引與對外頁，細節留在本區。
4. 發布（官網、線上服務、上傳）只有在作者明說時才做；發布後驗線上。

## 6. 停用前交接

- [ ] 最後一次建置指令可以從零重跑（來源、版本、參數）
- [ ] 版本紀錄有最後一列
- [ ] `README.md` 寫清楚「這個工作區已停用，維護看哪一份」
- [ ] 還沒進版控的腳本、決策紀錄收進 `src/`／`docs/`
- [ ] 背景工作與子行程都收乾淨（`yap-software-practice.md` §12）

## 7. 不要做

- 不要跨區複製檔案當「最新版」；要改就回 canonical 那一區改。
- 不要從母區 `AGENTS.md` 整份複製（會把母區的成品路徑、發布權限帶錯）。
- 不要兩個工作區同時重建同一份成品（會互相覆蓋）。
- 不要把大檔（`*.adb`、`*.zip`、原始語料）commit 進 git。
- 不要在未經作者指示時發布、覆寫線上，或改別區的狀態檔。
- 不要把 dev server／測試瀏覽器／長跑工作留在背景。

## 8. adb 資料庫（`*.adb`）

adb 有自己的額外規矩，照 [`new-adb-workspace.md`](new-adb-workspace.md) 做，模板是
[`new-adb-AGENTS.md`](new-adb-AGENTS.md)。摘要：

- `dbname` 小寫英數；成品 `D:\accelon3\<name>.adb`（sz 家族例外，見母區 `AGENTS.md`）。
- 漢字、頁座標、VA、缺字、術語、`<术>`、`<聯>` 一律用母區 `ts/` 的共用程式，不要就地重寫。
- 建置六步、版本紀錄、`publish-adb.ts` 的細節都在 `new-adb-workspace.md`。
