# 官網發布：孵化區（incubator）規範（canonical）

> 2026-11-05 作者指示：官網孵化區的發布規範（繁簡、背景、門檻、交付、部署）以本檔為 canonical；
> 用 `zhu-combined` 閱讀器的工作區（`vcpp`、`surangama`、`shl`、`hdnj`）在 `AGENTS.md` 只留鏈結，
> **不要各自再寫一份**。
>
> 網站上給外人的鏡像是 `D:\nissaya.cn\html\incubator\discipline.md`（渲染成 `discipline.html`）。
> 兩份不一致時以本檔為準；改完本檔，再回網站區同步那一份。

- 主站：<https://shutonggui.cn>（廣州）· 鏡像：<https://nissaya.cn>（東京）
- 孵化區：<https://shutonggui.cn/incubator/> · 清單：`/incubator/projects.json`

## 0. 一句話

**你只擁有自己那一個目錄；首頁、選單、別人的檔案，都歸維護者。**

## 1. 三條硬規則

1. **不要改 `D:\nissaya.cn`**（網站自己的工作區）。你的東西留在自己的 workspace，交付方式是「檔案」與「清單」。
2. **只部署自己的目錄**（`/huixintang/`、`/myproject/`…）。以下路徑任何情況都不要碰：
   `/var/www/html/index.html`、`/yap/`、`/incubator/`、`/accelon26/`。
3. **不要刪別人的檔案**。換版就覆蓋自己那一份；要清舊檔先問。

## 2. 進駐門檻

| 項目 | 標準 |
|---|---|
| 手機可用 | 390 px 寬不橫向溢出；字級 ≥ 16 px；按鈕 ≥ 44 px |
| console | 開頁 3 秒內沒有紅字 |
| 標題與描述 | `<title>`、`<meta name="description">`、`og:` 都要寫 |
| 體積 | 首屏 ≤ 1 MB；單圖 ≤ 500 KB（WebP 或壓過的 JPEG）。**單檔 ≤ 500 KB 只算文案**；應用程式不在此限 |
| 繁簡 | 見 §3 |
| 背景與主題 | 見 §4 |
| 計價 | 一律人民幣（¥）：費率、總額、圖表刻度都用 ¥，不得出現 NT$／新台幣 |
| 相依 | 不依賴外部 CDN：字型、JS、CSS 自帶或走本站 |
| 可分享 | 入口是一條乾淨的站內 URL，不是 `file://`、不是壓縮檔下載頁 |

## 3. 繁簡：繁體是母本，簡體是無損衍生物

- **繁體寫作、簡體轉出**：頁面的母本一律繁體；簡體由 `t2s` 產生，**只換字形與引號**（「」→“”），
  不換詞彙、不刪句、不重寫。
- 簡體頁**不要手改**；要改就改繁體母本再轉一次。
- **判準**：繁簡兩版 `git diff` 只該剩字形與標點差異；出現整句不同，就是重寫了，退回。
- **切換鈕**：每頁都要有。
  - 閱讀器工作區：`zhu-combined` 的 `lossless.js`（canonical 在 `agent-norms/lossless-simplified/`）
    負責轉換，標題列已有 `简` 鈕（`#simBtn`），狀態記在 localStorage。
  - 靜態文案頁：自己做一顆「簡／繁」，規則同 `writing-skill.md` §13。
- **缺省值由 hostname 決定**：`shutonggui.cn` 預設簡體、`nissaya.cn` 預設繁體；不要兩站同一個預設。
- 閱讀器改 `lossless.js` 後要重跑單檔建置，否則部署的還是舊轉換。

## 4. 背景與主題

閱讀器已有一套紙色主題（`zhu-combined/style.css`），孵化區的頁面就沿用它，不要自創第三種底色。

| 角色 | 亮色 | 暗色 |
|---|---|---|
| 頁面底 `--paper` | `#fbf8f1` | `#17140f` |
| 次要底 `--paper2` | `#f5efe3` | `#221d16` |
| 卡片 `--card` | `#fffdf8` | `#1d1914` |
| 字 `--ink` | `#241f19` | `#eae1d2` |
| 線 `--line` | `#e3dacb` | `#3a3228` |
| 主色 `--accent` | `#8a5a2f` | `#d59d61` |

- **不要大面積純白 `#fff` 或純黑 `#000`**：紙色本來就不是純白（官網首頁是 `#F6EFDA`，閱讀器是 `#fbf8f1`），
  硬接一片 `#fff` 會讓頁面看起來像另一個站。
- **明暗切換**：`body.dark` 覆寫 CSS 變數，並在 `body.dark` 設 `color-scheme: dark`；
  標題列用 `#theme`（☾）切換，跟隨系統 `prefers-color-scheme`，選擇記在 localStorage；
  深連結支援 `?theme=dark`／`?theme=light`。
- **背景不要外連圖床或 CDN**；要紙紋之類的質感就內嵌，並讓首屏仍 ≤ 1 MB。
- 三欄／面板的底色用 `--paper2`、`--card`，不要另開一組相近但不一樣的色票。

## 5. 交付什麼

在自己的 repo 放一筆 `deploy/incubator.json`，內容就是本站 `incubator/projects.json` 裡 `projects` 的**一個元素**：

```json
{
  "id": "jingang",
  "title": "金剛經合注",
  "tradition": "釋家",
  "subtitle": "十一譯對讀 · 41 家注疏 · 梵藏逐詞",
  "status": "incubating",
  "owner": "vcpp",
  "since": "2026-10",
  "url": "/incubator/vcpp.html",
  "desc": "羅什主文配昭明三十二分，點一句即列歷代注疏……",
  "why": "上線未滿一季，注疏還在補、面板還在改",
  "meta": "純靜態單頁",
  "links": [{ "label": "操作導覽", "href": "/incubator/use.html" }],
  "path": "/var/www/html/incubator"
}
```

| 欄位 | 必填 | 說明 |
|---|---|---|
| `id` | ✓ | 小寫英數與 `-`，穩定不變 |
| `title` | ✓ | 顯示名稱，≤ 12 字 |
| `tradition` | | `釋家`／`醫家`／`儒家`／`道家`；沒填歸釋家 |
| `subtitle` | ✓ | 一句話賣點，用「·」分隔 |
| `status` | ✓ | `incubating`／`stable`／`retired` |
| `owner` | ✓ | 你的 repo／workspace 名稱 |
| `since` | ✓ | 進駐年月 `YYYY-MM` |
| `url` | ✓ | 站內絕對路徑；不可指到 `/`、`/yap/`、`/incubator/`、`/accelon26/` |
| `path` | ✓ | 伺服器目錄，供維護者部署 |
| `desc` | | 一兩句介紹，顯示在卡片上 |
| `why` | | 「為什麼還在孵化」，一句話 |
| `meta` | | 小字補充，例如「純靜態單頁」 |
| `links` | | 額外入口，最多 3 個 |

- 卡片**不放 GitHub 連結**：`repo` 欄位已移除，填了會被檢查器退回。
- 交付前自己跑一次（Node 18+，`incubator/check.mjs`）：

```powershell
node check.mjs deploy\incubator.json
```

維護者只做兩件事：把項目併進 `projects.json`、重新部署；列表是從 JSON 長出來的，**不必改 HTML**。

## 6. 部署

- 用 `pscp` 傳到 `*.tmp`，再遠端 `mv -f` 換檔（同一檔案系統，原子替換）。不要直接覆蓋、不要用網頁後台。
- 一次只動自己的目錄；上傳前後都 `ls -l` 確認。
- 傳完自己驗：`HEAD` 回 200、大小對、入口打得開。
- **兩站都要傳**（主站與鏡像），並確認兩邊大小一致。
- 既有的 `.prev` 備份留著，回滾就 `mv -f x.prev x`。

```powershell
pscp -batch -pw <PASS> .\vcpp.html yap@shutonggui.cn:/var/www/html/incubator/vcpp.html.tmp
plink -ssh -batch -pw <PASS> yap@shutonggui.cn "cd /var/www/html/incubator && mv -f vcpp.html.tmp vcpp.html"
```

## 7. 生命週期

| 階段 | 在哪裡 | 條件 |
|---|---|---|
| 孵化 | `/incubator/` 列表 | 通過 §2 門檻；介面與資料都還會大改 |
| 穩定 | 首頁四個技術方向之一 | 連續一季沒有大改、有真實使用者、資料不再大幅變動 |
| 退役 | 下架，檔案保留 | 停止維護；`status` 改 `retired`，`note` 寫原因與日期 |

升到首頁是**維護者的決定**，不是自動的；專案方可以提議，但不要自己去改首頁。

## 8. 上架前檢查清單

- [ ] 390 px 手機看過，不溢出、字夠大、按鈕 ≥ 44 px
- [ ] `<title>`、`description`、`og:` 都寫了
- [ ] console 沒有紅字
- [ ] 首屏 ≤ 1 MB、單圖 ≤ 500 KB；文案單檔 ≤ 500 KB
- [ ] 背景是紙色（`#fbf8f1`／暗 `#17140f`），沒有大片 `#fff` 或 `#000`
- [ ] 明暗切換可用（`#theme`），跟隨系統、記得選擇
- [ ] 主站簡體、鏡像繁體；轉換走 `t2s`，沒有手改簡體頁；diff 只有字形與標點
- [ ] 金額全部人民幣（¥）
- [ ] `deploy/incubator.json` 填好、`url` 用站內絕對路徑、checker 通過
- [ ] 兩站都回 200、大小一致
- [ ] 沒動別人的目錄（首頁、`yap/`、`incubator/`、`accelon26/`）

## 9. 有問題

寫信給維護者（yapcheahshen[at]gmail.com），或在 issue 說清楚：**你動了哪個目錄、哪幾個檔案、為什麼**。
含糊的請求會被退回去問。
