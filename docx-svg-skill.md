# docx → 圖表 → SVG：可重用的做法

> 從一份 Word 講義抽出「圖表」，轉成**和 docx 版面一致**的 SVG，再放進 Accelon 的 `.adb`。
> 全部步驟在 Windows + Word（COM）+ Python（PyMuPDF）上跑過；範例是 `fuyan`（《空之探究講義》05B，32 張圖表）。
> 2026-10-31 定稿。

---

## 0. 什麼時候用這個做法

- 圖表是 **Word 畫的**（表格、Visio 物件、文字框、框線字元 `┌─┐│`、線段），不是圖片檔。
- 要**保留版面**（字級、位置、框線），不要「重畫」成概略的示意圖。
- 產物要**能塞進 adb**，在閱讀器裡直接顯示。

若圖表本來就是 PNG/EMF 圖檔，這份文件只用得到第 6 節。

---

## 1. 為什麼不能只看 docx 的 XML

`word/document.xml` 只有**內容與樣式**，沒有「折行在哪、這行佔多寬、這條線畫到哪裡」。
同一段文字，換一台機器、換一個字型版本，折行就不同；表格的框線也只在渲染时才決定位置。
所以凡是「要長得跟 docx 一樣」的圖，**必須先讓 Word 排版一次**（第 4 節），再從排版結果取座標。

反過來說：**不要**用「逐字讀 PDF 的 bbox 再自己拼 SVG」——那是早期版本的做法，
每個字各自套 `font-size`，結果就是「字忽大忽小」。正解是第 5 節。

---

## 2. 流程總覽

```
raw.docx
  │ ① 找出圖表區塊（src/build-figs.py 之類）
  ▼
figs.json        每個圖表：起訖 block、頁碼、名字
  │ ② 一個圖表複製成一個小 docx（只留那幾個 block）
  ▼
graphs/<name>.docx      ~20 KB（不是整個 500 KB，見 3.3）
  │ ③ Word COM：docx → PDF
  ▼
out/_work05b/svgpdf/<name>.pdf
  │ ④ PyMuPDF：PDF → SVG（文字保持文字）
  ▼
out/svg/<name>.svg      ~20 KB，viewBox 已裁到內文
  │ ⑤ 打包進 adb 的 resources，正文用 <圖 n="<name>.svg" t="圖版"/>
  ▼
fuyan.adb
```

---

## 3. 抽出圖表（docx → 小 docx）

### 3.1 怎麼判定「這一段是圖表」

實務上有效的訊號（任一即可，通常要合併看）：

| 訊號 | 說明 |
|---|---|
| `w:tbl` | 真正的 Word 表格 |
| `w:pict` / `v:shape` / `wps:wsp` | Visio／文字框／快取圖案 |
| 段落裡有 `┌ ┬ ┐ │ ├ ┤ └ ┴ ┘ ─ →` | 用框線字元畫的樹狀圖 |
| 同段有長橫線（`────`）且字數少 | 手工表格 |
| 連續短行、每行都大幅縮排 | 圖表的分行內容 |

判定後把 block 索引區間記成 `{start, end}`；同一個圖表的列之間不要夾進正文段落。

### 3.2 圖表的**標題行**要一起收進來

很多圖表前面有一行「沒有句末標點」的標題，例：

```
《般若經》的「三假、二假」與阿毘達磨論師「二有、五有」之對照
（圖一）大眾部所傳之部派分化圖
各部派對蘊、界、處假實的看法
```

規則：**前一段 < 40 字、且不以 `。！？：；」）…` 收尾** → 視為圖表標題，`start` 往前收一格。
（這一條救回了 5 張圖；漏掉的話，標題會留在正文，圖表看起來像「沒有名字」。）

反例：前一段是「如下：」「對比如下：」這種帶冒號的引導句，**不要**收。

### 3.3 只留要的 block，順便把「用不到的零件」剪掉

最直覺的作法是把原 docx 複製一份、刪掉其餘 block —— 這樣每個圖表會是 **~500 KB**，
因為 zip 裡還帶著整本書的東西。實際量到（一本 349 頁的講義）：

| 零件 | 未壓縮 | 說明 |
|---|---:|---|
| `word/footnotes.xml` | **6,038 KB** | 全書 1,269 條注腳 —— 佔了九成 |
| `word/header*.xml`、`footer*.xml` | 47 個 | 頁首頁尾 |
| `docProps/thumbnail.emf` | 76 KB | 檔案縮圖 |
| `word/numbering.xml` | 58 KB | |

作法（`src/extract_figs.py`）：

1. 讀 `word/document.xml`，只留 `[start..end]` 的 block；
2. 把段落裡的 `sectPr`（分節符）拿掉，最後補一個乾淨的 `sectPr`（只留紙張、邊界、欄；去 `headerReference`／`footerReference`／`pgNumType`）；
3. 把圖表裡的 `w:footnoteReference` run 拿掉（圖表單獨成檔，不要拖一整頁注文）；
4. **依 `document.xml` 實際用到的 `r:id`（`r:id`／`r:embed`／`r:link`）修剪**：
   - `word/_rels/document.xml.rels` 只留「被引用」＋「document.xml 隱含需要」的 *styles／numbering／settings／webSettings／fontTable／theme*；
   - `[Content_Types].xml` 的 `Override` 只留還存在的 part；
   - `_rels/.rels` 拿掉 thumbnail 關聯；
   - 其他 part（footnotes、headers、media、thumbnail）一律不寫出。

結果：**21–38 KB／張**（34 張合計 0.75 MB，原本 17.5 MB），版面完全一樣。

### 3.4 檔名

- 書上有原編號（`y38.0014`、`y37.0337`）就用原編號；
- 講義新增的用頁碼（`35-36`、`312`）；
- 同一頁兩張圖：`234a`／`234`、`81a`／`81b`。
- **注意**：頁碼要與正文的 `<頁 id>` 一致，不要為了好看而讓「檔名頁碼 ≠ 實際頁碼」，
  否則正文會出現 `p313 → p312` 的倒退頁標（踩過）。

---

## 4. docx → PDF（用 Word，不用 LibreOffice）

```powershell
pwsh -NoProfile -File src/docx2pdf-batch.ps1 -Dir graphs -OutDir out/_work05b/svgpdf
```

要點：

```powershell
$word = New-Object -ComObject Word.Application
$word.Visible = $false; $word.DisplayAlerts = 0
$keep = $word.Documents.Add()          # Word 2007 之後：關掉最後一份文件會自己結束
foreach ($f in Get-ChildItem $dir -Filter *.docx) {
    $doc = $word.Documents.Open($f.FullName, $false, $true, $false)  # ReadOnly
    $doc.ExportAsFixedFormat($out, 17)  # 17 = wdExportFormatPDF
    $doc.Close(0)
}
$word.Quit(0)
```

**坑**：

- **不要每個檔案都開一次 Word**（`New-Object` 一次 ~10–40 秒），32 張圖會跑 20 分鐘。
  一個 Word 實例跑完只要 2–3 分鐘。
- **不要用 `$doc.SaveAs([ref]$out, [ref]17)`**：批次跑時偶發
  `Value does not fall within the expected range`，整個腳本中斷。`ExportAsFixedFormat` 沒有這個問題。
- 每個檔案用 `try/catch/finally` 包住，單張失敗不要拖垮整批。
- `Documents.Add()` 先開一份「佔位」文件，否則 `Quit` 之後 COM 物件會殘留。

---

## 5. PDF → SVG（PyMuPDF，文字保持文字）

```python
import pymupdf
page = pymupdf.open(pdf)[0]

# ① 裁到內容：去掉 A4 的大片空白
box = pymupdf.Rect()
for d in page.get_drawings(): box |= d['rect']
for b in page.get_text('blocks'): box |= pymupdf.Rect(b[:4])
page.set_cropbox((box + (-10, -10, 10, 10)) & page.rect)

# ② 匯出：text_as_path=False → 文字仍是文字
svg = page.get_svg_image(text_as_path=False)

# ③ 去掉 PDF 子集字型前綴（JBNCBX+PMingLiU → PMingLiU）
svg = re.sub(r'font-family="[A-Z]{6}\+([^"]+)"', r'font-family="\1"', svg)

# ④ 寬高換成 px（96 dpi），<圖 t="圖版"> 才有正確尺寸；CSS 再用 max-width 收窄
w, h = box.width * 96/72, box.height * 96/72
```

為什麼這樣就「像」：

- 每個 `text` 都帶著 PDF 算好的 `x`、`y`（基線）與 `font-size` → **字不會忽大忽小**；
- 表格框線、Visio 線段是 `<path>`，座標原樣；
- `viewBox` 裁到內容後，圖在閱讀器裡不會被一張 A4 空白撐開。

驗收方式：把 SVG 用無頭瀏覽器截圖，和「docx 直接印出的 PDF」並排看：

```powershell
msedge --headless=new --disable-gpu --window-size=596,842 `
       --screenshot=out/chk.png "file:///D:/.../out/svg/312.svg"
```

（Edge 只支援 `--headless=new`；`--headless=old` 會直接報錯。）

---

## 6. 放進 adb

### 6.1 標記

正文原本只有一行 `〔圖表 312〕`，在它下一行加：

```
<圖 n="312.svg" t="圖版"/>
```

- `n` = resources 容器裡的檔名（**含副檔名**）；
- `t="圖版"` 讓渲染器把 `<svg>` 當「整張插圖」處理（尺寸取 `width` 屬性），
  不加 `t` 會走「字形圖」的樣式（1.5em），整張圖會縮成一個小點。

### 6.2 打包

`authorAdb({ resources: [{ name, bytes }] })`：

```ts
for (const f of readdirSync(resDir)) {
  if (/\.(svg|png|jpg)$/i.test(f)) resources.push({ name: f, bytes: readFileSync(join(resDir, f)) });
}
```

`accelon26` 的 `doc-pane.ts` 會把 SVG **inline 成 `<svg>`**（跟著字色、可 CSS 縮放、
點圖可放大），PNG/JPG 則轉成 blob URL 給 `<img>`。

### 6.3 檢查

```ts
const r = await AdbReader.open(new SyncIO('fuyan.adb'));
r.containers.get('resources').count   // 應 = 圖數 + logo
r.containers.get('resources').names   // 名稱要和 <圖 n="…"> 一字不差
```

---

## 7. 常見症狀 → 原因

| 症狀 | 原因 | 對策 |
|---|---|---|
| 閱讀器顯示 `▢` | `<圖 n>` 的名字在 resources 找不到 | 檔名大小寫、副檔名要一致 |
| 圖縮成一個小點 | 沒加 `t="圖版"`，走了字形圖樣式 | 加 `t="圖版"` |
| 圖很小、周圍一堆空白 | 沒裁 `cropbox` | 用 `get_drawings()`＋文字 block 算 bbox |
| 字忽大忽小 | 自己逐字拼 SVG | 改用 `get_svg_image(text_as_path=False)` |
| 每個圖表 500 KB | 整本 docx 的 footnotes 都帶進去 | 依 `r:id` 修剪 parts（3.3） |
| 圖表標題留在正文 | 沒把前一行標題收進來 | 3.2 的「<40 字、無句末標點」規則 |
| 頁碼倒退（p313 → p312） | 檔名頁碼 ≠ block 頁碼 | 頁碼一律取 layout 的實際頁 |

---

## 8. 指令摘要（fuyan 專案）

```powershell
# 抽圖表（每個圖表一個小 docx）
python src/extract_figs.py out/_work05b/src.docx out/_work05b/figs.json graphs

# docx → PDF（一個 Word 實例）
pwsh -NoProfile -File src/docx2pdf-batch.ps1 -Dir graphs -OutDir out/_work05b/svgpdf

# PDF → SVG（PyMuPDF；系統 Python 裝了 pymupdf）
C:\Python313\python.exe src/pdf2svg.py out/_work05b/svgpdf out/svg

# 重新產生標記（含 <圖 n="…" t="圖版"/>）
python src/docx2accelon.py out/_work05b/src.docx -o out/05B.txt … --figures out/_work05b/figs.json

# 打包（第 7 個參數＝圖檔資料夾）
bun run src/pack.ts out/05B.txt out/fuyan.adb fuyan 福嚴佛學院講義 logo/fuyan_logo.png out/svg
```

---

## 9. 依賴

| 工具 | 用途 | 備註 |
|---|---|---|
| Microsoft Word | docx → PDF（唯一可靠的排版來源） | COM，Windows only |
| Python + `pymupdf` | PDF → SVG | `pip install pymupdf`（用系統 Python；DSH 內建 Python 不含） |
| `lxml` | 讀寫 docx XML | 內建 Python 有 |
| Bun + `authorAdb` | 打包 adb | `adb-converter/ts/src/adbauthor` |
| Edge/Chrome（可選） | SVG 截圖驗收 | `--headless=new` |
