# 法律知識庫：四頁微信長圖

依 [`../corpus-to-mobile-skills.md`](../corpus-to-mobile-skills.md) 做的法律領域版本。
**只做前四頁**（01–04）；05 技術優勢依需求略去，所以頁腳是 `/ 04`。

| 檔案 | 內容 |
|---|---|
| `法律知識庫-01-三層架構.jpg` | 來源／L0／L1／L2，例子：契約解除 |
| `法律知識庫-02-人機合作與成本.jpg` | 四步、閘門、10,000 條成本對比、不提供個案法律意見 |
| `法律知識庫-03-算力與共建.jpg` | token 帳單、20 億 tokens、四列共建 |
| `法律知識庫-04-為什麼要做.jpg` | 以前／現在、四個目標、政策、開源、金句 |
| `01.html`–`04.html` | 原始檔（依賴同層 `series.css`） |

## 領域表（playbook §4）

| 欄位 | 法律版 |
|---|---|
| 來源 | 法典、司法解釋、判例、學說 |
| 座標 | 條／項／款；判例加字號與審級；學說加版次頁碼 |
| claim 類型 | 構成要件／法律效果／程序／期限／舉證 |
| 高風險（雙簽） | 時效、管轄、罰則、期間計算 |
| 例子 | 契約解除 → 5 條主張 |
| 核心價值 | 法律保護懂法律的人（原「上工治未病」） |
| 政策 | 全面依法治國；公共法律服務、基層普法、法律援助 |
| 金句 | 「法律保護懂法律的人。」 |

只換領域內容，版型、字級、三層架構與數字模型都沿用 playbook。

## 數字（估算，不是報價）

| 項目 | 手工 | AI 輔助 |
|---|---:|---:|
| 10,000 條工時 | 60,000 h | 7,000 h |
| 人年 | 30 | 3.5 |
| 成本 | ¥900 萬 | ¥110 萬 |
| 日曆 | 5 年 | 9 個月 |
| 每條 | ¥900 | ¥80 |

每條 135k tokens；10,000 條 1.35B；含 50% 重試 2B；算力佔總成本不到 5%。

## 重出

```powershell
$base = "D:\2026\agent-norms\law"
$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$url  = "file:///D:/2026/agent-norms/law/01.html"
& $edge --headless=new --disable-gpu --hide-scrollbars `
  --force-device-scale-factor=1 --window-size=1080,9000 `
  --screenshot="$base\raw-01.png" $url
# Edge 的截圖是離開後才落盤，要等檔案出現再跑 trim
python "$base\trim_one.py" "$base\raw-01.png" "$base\法律知識庫-01-三層架構.jpg"
```

四頁一起跑見 playbook §6.3；跑完用 `read_image` 逐張看斷行與溢出。
