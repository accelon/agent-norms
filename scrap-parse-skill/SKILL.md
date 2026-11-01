# scrap-parse-skill — 網頁／PDF 語料抓取與解析

把一個網站的書（或多章文章）變成**可用的結構化資料**：先探路，再切段，最後驗證。
本文以 2026-10 抓取 `moshuyuan.com`《金剛經》（32 品、92 條註釋；站上的通論〈附錄〉不收）為例，方法可套到同類「章節頁 + 固定小標」的站點。

> 一句話原則：**用結構切，不要用文字猜**；能少抓一頁就少抓一頁；任何抓取都要能重跑。

---

## 1. 什麼時候用

- 一部書被拆成 N 個章節頁（目錄 → 章節），要一次收成 JSON / Markdown。
- 每章有固定小標（原文／註釋／譯文／讀解、白話／注釋／賞析…）。
- 要拿去做 app、對齊、全文檢索，而不是只讀一遍。

不適用：站點要登入、有反爬、內容由前端 JS 動態注入（那要先上 headless browser）。

---

## 2. 流程（七步）

```
① 探路（1 頁）→ ② 抓目錄 → ③ 抽章節連結 → ④ 逐章抓 → ⑤ 依標記切段 → ⑥ 清雜訊＋去重 → ⑦ 驗證＋產出
```

**① 探路**：先用便宜的方式看一頁（`web_fetch` 或瀏覽器），確認三件事：

1. 目錄頁在哪、章節連結長什麼樣；
2. 章節頁的小標是 `<h3>`、`<div class="...">` 還是純文字；
3. 有沒有付費牆／登入牆的殘留。

只有在確認「可以直接 HTTP GET」之後，才寫批次腳本。**不要一上來就寫爬蟲**——先看一頁，省掉一整輪猜錯。

---

## 3. 切分錨點：語意標記 > 文字比對

判斷優先序：

| 優先 | 錨點 | 例 |
|---|---|---|
| 1 | 帶 class 的標題標籤 | `<h3 class="label-yuanwen">原文</h3>` |
| 2 | 固定 id 的容器 | `<article id="chapterContent">` |
| 3 | 純文字小標 | `<h3>原文</h3>` |
| 4 | 行首文字比對 | `^原文$` |

**用第 1 種，不要用第 3、4 種。** 這次的教訓：一開始用 `indexOf('>原文</h3>')` 抓，遇到「該章沒有註釋」的頁面就整段空白——因為程式假設四個段落一定都存在、而且照順序排。

正確做法：**一次把所有小標找出來，切成 `[前, label1, 內容1, label2, 內容2, …]`，再用 label 當 key**。缺哪段就沒有那個 key，不會連累其他段。

```js
const body = html.slice(html.indexOf('id="chapterContent"'));
const parts = body.split(/<h3[^>]*class="label-([a-z]+)"[^>]*>[\s\S]*?<\/h3>/);
const sec = {};
for (let i = 1; i < parts.length; i += 2) sec[parts[i]] = parts[i + 1] || '';
// sec = { yuanwen: '…', zhushi: '…', fanyi: '…', dujie: '…' }
```

同時注意：**同一站不同章可能少段**（本例 5 品沒有「註釋」），所以下游一律用 `sec.zhushi || ''`。

---

## 4. 抓取：能重跑、有禮貌、修相對路徑

```js
const UA = { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { headers: UA });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.text();
    } catch (e) {
      if (i === tries - 1) throw e;
      await sleep(800 * (i + 1));   // 退避重試
    }
  }
}
// 每章之間 sleep(300)，不要打滿
```

三個實務細節：

- **相對連結**：目錄頁的 `href` 可能是 `/zh-tw/chapter/...`。要判斷再補域名，不要盲接：
  ```js
  const abs = (h) => (h.startsWith('http') ? h : 'https://www.example.com' + h);
  ```
  （本次就踩過：用 `BASE + href` 變成 `/zh-tw/zh-tw/...`，33 個章節全部 404。）
- **單頁失敗不要拖垮全部**：`try/catch` 包住每章，印 `SKIP url reason`，最後回報成功數。
- **驗證完整性**：抓完印一張表（每章字數、條數），一眼看出哪一章是 0。

---

## 5. 清雜訊：一份 stop 清單，切在最早出現的位置

章節頁的頁尾常混進導覽、「熱門排行」、「關於我們」、AI 浮層、抄經提示。做法不是逐字 replace，而是**找到最早出現的雜訊標記就切掉**：

```js
const STOP = /墨書院|熱門排行|工具導航|關於我們|切換為簡體|小墨 AI|上一章|下一章|回到目錄/;
const cut = (s) => {
  let t = stripTags(s);
  const i = t.search(STOP);
  if (i >= 0) t = t.slice(0, i);
  return t.replace(/[ \t\u00a0]+/g, ' ').replace(/[\s\n]+$/, '').trim();
};
```

要點：

- **用站名當 stop** 最省事（正文不會出現），但先確認正文真的沒有。
- **變體要涵蓋**：本例頁尾有「墨書院編輯整理」和「墨書院\*編輯整理」兩種（星號位置不同），逐字比對會漏；用 regex 一次解決。
- **殘留小標**：正文尾巴偶爾黏著下一個標題（「釋迦垂跡」「○依法出生分第八」），用結尾 regex 再切一刀：
  `/[\s○]*[^\s]{0,10}分第[一二三四五六七八九十]+[\s。]*$/`
- **先 strip 再 cut**：切在「純文字」上比切在 HTML 上穩，因為標籤會被拆開。

`stripTags` 的最小可用版：

```js
const stripTags = (h) => h
  .replace(/<\s*(script|style)[\s\S]*?<\/\s*\1\s*>/gi, '')
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<\/(p|div|li|h\d)>/gi, '\n')   // 段落 → 換行
  .replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/[ \t\u00a0]+/g, ' ').replace(/\n{3,}/g, '\n\n')
  .trim();
```

---

## 6. 結構化：把「段」再切成「條」

很多站的「註釋」是一整段連續文字，用 ①②③ 編號。不要整段丟給下游，切成陣列：

```js
const RING = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳';
function splitNotes(text) {
  const parts = text.split(new RegExp(`([${RING}])`, 'g'));
  const out = [];
  for (let i = 1; i < parts.length; i += 2) {
    const body = (parts[i + 1] || '').trim();
    if (!body) continue;
    const m = body.match(/^([^：:]{1,24})[：:]\s*([\s\S]*)$/);  // 「詞條：解釋」
    out.push(m ? { mark: parts[i], term: m[1].trim(), text: m[2].trim() } : { mark: parts[i], term: '', text: body });
  }
  return out;
}
```

判準：**下游要用的話，一個註釋就是一筆**（有 `term` 才好對到詞、做 hover、做搜尋）。原文保留 ①②③ 不刪，才能和註釋互相對應。

---

## 7. 去重與編號

- 目錄可能有**重複項**：本例「第十品莊嚴淨土分」出現兩次（兩個不同網址、內容相同）。
  去重不要只比標題（同名章節是合理的），用 `title + 正文前 40 字` 當 key。
- 去重後**重新編號** `c.n = i + 1`，不要沿用抓取順序。
- 附錄／序／後記這種沒有小標的頁，先問「它算不算正文的一部分」再決定收不收，不要預設收。要收就單獨處理：抓 `#chapterContent` 全文、套同一組 stop、標 `appendix: true`，不要硬塞進章節陣列；不收就用一個 `WITH_APPENDIX = false` 開關把連結一起濾掉。本例附錄是 9,558 字的「金剛經通論」（源流、六譯、般若正觀…），和 32 品經文不是同一層，最後不收。

---

## 8. 驗證：四個檢查，缺一不可

1. **統計表**：`章數 / 每章 原文·註釋·譯文·讀解 字數·條數`。任何一個 0 都要能解釋（本例：5 品本來就沒有註釋）。
2. **雜訊掃描**：用同一組 stop 關鍵字回頭掃全部欄位，期望 0 命中。
3. **頭尾抽查**：每種欄位看「前 40 字 / 後 40 字」，最容易發現切歪（尾巴黏頁尾、開頭黏標題）。
4. **亂碼掃描**：`�`、`\ufffd`、連續空白、`&amp;` 殘留。

```js
const junk = /關於我們|熱門排行|切換為簡體|墨書院|上一章|下一章/;
let bad = 0;
for (const c of chapters)
  for (const k of ['yuanwen', 'yiwen', 'dujie'])
    if (junk.test(c[k])) { bad++; console.log('JUNK', c.n, k); }
console.log('junk hits', bad);   // 應為 0
```

---

## 9. 產出：兩份檔，一份給機器、一份給人

| 檔 | 用途 |
|---|---|
| `src/<book>.json` | 結構化：`{ n, title, yuanwen, notes:[{mark,term,text}], yiwen, dujie, url }` |
| `<book>.md` | 可讀版：每章 `## 標題` + `### 原文/註釋/譯文/讀解`，空段不印 |
| `build/fetch_<book>.mjs` | 可重跑腳本（重試、去重、清雜訊都寫在裡面） |

Markdown 產生時**空段直接跳過**，不要留 `### 原文` 下面一片空白（附錄就沒有原文）。

---

## 10. 常見坑（都是實際踩過的）

| 坑 | 症狀 | 解法 |
|---|---|---|
| 假設段落齊全 | 某章「原文」變空字串 | 依 label 切，缺段容錯 |
| 相對連結拼接 | 全部 404（`/zh-tw/zh-tw/…`） | `startsWith('http')` 再補域名 |
| stop 只寫一種變體 | 頁尾殘留「墨書院\*編輯整理」 | regex + 站名 |
| 只比標題去重 | 同名章節被誤刪 | `title + 正文前 40 字` |
| 沒印統計 | 以為抓完，其實 5 章空的 | 每章印字數／條數 |
| 抓太快 | 間歇性 timeout | 每章延遲 + 退避重試 |
| 逐字 replace 清雜訊 | 清不乾淨、誤刪正文 | 找最早標記一次切掉 |
| 把 HTML 存下來當資料 | 下游還要再解析一次 | 當場 stripTags，只留純文字 |

---

## 11. Checklist

- [ ] 先看目錄頁 + 1 個章節頁，記下小標的標籤與 class
- [ ] 章節連結抽出來、去重、修絕對路徑
- [ ] `get()` 有 UA、重試、退避
- [ ] 依 label 切段（不是依文字位置）
- [ ] stop 清單涵蓋頁尾／浮層／導覽的**所有變體**
- [ ] 註釋切成 `{mark, term, text}`
- [ ] 每章印統計；雜訊掃描 0 命中；頭尾抽查
- [ ] 產出 JSON + MD + 可重跑腳本

---

## 12. 附：本次成品

| 項目 | 值 |
|---|---|
| 來源 | `moshuyuan.com/zh-tw/book/zibu/jin-gang-jing.html`（32 品；另有一頁通論〈附錄〉，不收） |
| 章節頁錨點 | `#chapterContent` + `h3.label-{yuanwen,zhushi,fanyi,dujie}` |
| 產出 | `src/moshuyuan.json`（105 KB）、`moshuyuan.md`（97 KB） |
| 內容 | 原文 6,698 字、註釋 92 條、譯文 16,692 字、讀解 5,039 字 |
| 腳本 | `build/fetch_moshuyuan.mjs`（可重跑） |
