# 書同軌：語義分句、轍號與參照統一（canonical）

> 2026-11-05 作者指示：shutonggui 的指導性原則搬到 `agent-norms`，各工作區的 `AGENTS.md` 只留鏈結。
> 本文是 canonical；**不要在別區另存一份再改**。
>
> 文中 §3 的數字與檔名是**楞嚴（surangama）試點**的實測，用來舉例；新專案照方法做，不要照抄數字。

> 2026-11-05。把「以注疏找最小切分點，再切長句，形成語義層級」的方法固定下來，
> 作為後續資料模型與 UI 的共同前提。

> 2026-11-05 作者定名：中文用 **轍號**（轍＝車轍，取「承接古文之軌跡」之義），不再寫「軌號」；
> 英文是 **`rut id`**，`rut` = **rut unified text**——`rut` 就是車轍，中英同一個意象。
> 新程式與新檔案用 `rut_id`、`ruts-*.tsv`；目前實作仍是 `track_id`、`tracks-*.tsv`，
> 遷移完成前兩者指同一件事（對映見 §2.2）。

> 命名用意（作者 2026-11-05）：
> **「書同軌」**化用大家熟悉的「車同軌」，一聽就知道要解決什麼問題；
> **「轍號」**特意用這個罕見詞——車轍是前人走過留下的路——既標明承接古人走過的路，
> 又剛好接上這個時代的新工具（`rut`／`rut id`），不是把舊詞硬套在舊做法上。
> 名字要能同時說服兩邊：讀古書的人看到「轍」，寫程式的人看到 `rut id`。

> 英文用法（作者 2026-11-05）：**`track` 只當動詞**（to track＝追蹤某個變化），
> 名詞一律用 **`rut`**——避免和音軌（audio track）混用。
> 所以寫「track the alignment」，不寫「the track S0000.1」。

## 1. 目標

一部經、一套句級地址。所有注疏、科判、別譯、辭典、英譯的參照，都指向同一組
`sid` 與同一棵語義樹，而不是各自一套 `u`。這就是「書同軌」：

- 一個句子只有一個地址（`sid`／`addr`）。
- 一個注疏段落只指向一個 `sid` range。
- 一個科判節點只指向一個 hierarchy node。
- 跨注疏的「同一個位置」可以直接 join，不需要再換算。

## 2. 方法

```text
① 收集 candidate cuts
   注疏／科判已有的錨點（節點起點、疏文引文、表號）→ 全部映射到 sid

② 求最小切分點
   不是取聯集；是找一組能覆蓋／對齊所有注疏的最小 cut set
   單家、內插、塌縮的 cut 先降權或排除

③ 長句再切
   沒有注疏切點、但句長超過門檻時，用 「：『」「『』」 等標點切
   這是 editorial cut，沒有注疏證據，要單獨標記

④ 建層級
   cut set → 連續區間 → 樹
   層級由支持該 cut 的注疏節點深度決定（不是人工指定）

⑤ 建 crosswalk
   每個注疏節點／段落 → sid range → hierarchy node
   所有來源都只存這個對映，不再存自己的座標
```

關鍵在第 ② 步：**聯集是最大切分，不是最小切分。** 目前 2,418 刀是九家聯集；
其中 1,292 刀只有一家支持，1,037 刀兩家支持，只有 89 刀三家以上支持。
最小 cut set 要從這個支持度分布出發，而不是直接沿用 2,418。

## 2.1 為什麼先定上級，再定句號

平面全域編號（dense sequential）只要插入一句，後面全部位移；4,019 → 4,890 已經示範一次。
上級（章／節點）穩定後，句號在**上級內重置**：

- 插入一句，只影響該上級的 local verse，不影響其他章。
- 上級 ID 不變，crosswalk 只記「parent + base_sid + part」，local verse 只作顯示。
- 這才是 Bible chapter:verse 的穩定機制：chapter 先定，verse 在 chapter 內編。
- 「插號問題」不是靠更聰明的編號解決，而是靠**先有穩定的上級**把它局部化。

穩定到什麼程度才可以用？至少：

1. 上級邊界已由注疏共識／人工校對定案；
2. 上級 ID 與範圍不再因新切點而變；
3. 句級插入只造成 local verse 位移，crosswalk 的 `base_sid`／`part` 仍可解析；
4. 已 freeze 一個 `rev`，且有舊→新對映。

在那之前，`sentences.tsv` 的 dense `sid` 只是工作號；不要寫進下游。

## 2.2 轍號（rut id）：平行語料的共同軸

「轍號」（英文 **`rut id`**）＝ **不可變、不可重用的 alignable unit id**。一個 **rut**
（*rut unified text*）是一段可對齊、可共用的統一文本單位：它不綁傳本、不綁語言、不綁注疏，
所以能當平行語料的共同軸。轍是「承接古文之軌跡」的位置；轍號不是 dense `sid`，dense `sid` 只是顯示。

- 一轍一單位：一句、一個咒語 phrase、一個注疏段落，都可以是一轍。
- 轍號一旦發出就不改、不重用；切分變了只新增 suffix／新轍，舊轍保留。
- 平行語料只存「轍號 → 文本」和「轍號 ↔ 轍號」的對映，不各存座標。
- 轍號可以用可讀的 `S0000.1`（舊 `sutra.json.i` ＋ part），也可以用不透明的 `T000001`；
  重點是**不可變、不重用**，不要把 hierarchy 編進轍號。

| 概念 | 英文 | 現行實作 | 遷移後 |
|---|---|---|---|
| 轍號 | `rut id` | `track_id` | `rut_id` |
| 轍 | `rut`（*rut unified text*） | `tracks-*.tsv` 的一列 | `ruts-*.tsv` 的一列 |
| 兩轍對齊 | `align` | `track_a`／`track_b` | `rut_a`／`rut_b` |

> `rev` 快照是凍結的，不回頭改檔名；改名只發生在下一個 `rev` 的生成端（腳本與新檔）。

### 最小 schema

下表沿用現行欄位名（`track_id`…）；改名後同位置即 `rut_id`，其餘同理。

`tracks.tsv`（可再分 `tracks-zh.tsv`、`tracks-bo.tsv`、`tracks-en.tsv`、`tracks-sa.tsv`）

| 欄位 | 說明 |
|---|---|
| `track_id` | 轍號，例 `S0000.1`／`T000001` |
| `base_sid` | 舊 `sutra.json.i`，穩定底座 |
| `part` | 同一個 base 的第幾段 |
| `lang` | `zh`／`bo`／`en`／`sa` |
| `source` | `T945`／`T944A`／`LUK`／`H259`… |
| `text` | 該轍的文本 |

`align.tsv`

| 欄位 | 說明 |
|---|---|
| `track_a` / `track_b` | 兩轍的轍號；單邊缺文時 `track_b` 可空 |
| `relation` | `1:1`、`1:n`、`n:1`、`gap` |
| `confidence` | `A`／`B`／`C` |

例：

```text
track_a   track_b   relation  confidence
S0000.1   Z0001     1:1       A
S0002.1   Z0002     1:1       A
S0002.1   Z0003     1:n       B
S0048.1   —         gap       A     # 藏譯/英譯缺這一段
```

### 好處

- 新增英文、藏文、梵語，只加自己的 `tracks` ＋ `align`，不動中文。
- 重新切句，只改受影響的轍；其他轍的 `track_id` 不變。
- 注疏引用只記 `track_id` range，不再換算 `u`。
- 同一位置的多家注疏，用 `align` 的多列表示，不需要先合併成一個「共識句」。
- 缺譯、節譯、咒段省略，用 `gap` 明示，不會被誤認為對齊錯誤。

這才是「書同軌」的工程形態：**轍號是軸，語言和注疏是掛在上面的層**。

## 3. 當前資料狀態

| 項目 | 數量 | 檔案 |
|---|---:|---|
| 句（leaf） | 4,890 | `data/sentences.tsv` |
| 漢文轍（track_id） | 4,890 | `data/tracks-zh.tsv` |
| xref（九家科判） | 11,007 | `data/xref-kepan.tsv` |
| xref（27 分節） | 27 | `data/xref-section.tsv` |
| 科判節點 | 11,007（九家） | `data/sentence-kepan.tsv` |
| cut（證據表） | 2,418 | `data/cuts.tsv` |
| 段（九家聯集） | 2,423 | `data/hierarchy.json` |
| 段（X265/DRBA 實錨、排除塌縮） | 1,647 | `data/hierarchy-exact.json` |
| 段（≥2 家、排除塌縮） | 1,126 | `data/hierarchy-shared2.json` |
| 段（k=3 粗層） | 642 | `data/hierarchy-coarse.json` |
| 語義分節 | 27（跨卷拆成 30 節點） | `data/ke-anchors.json`／`hierarchy*.json` |
| 卷 | 10 ＋卷首 | `sutra.json` 的 `juan` |
| 版本 | rev-2026-11-05-e | `build/rev/2026-11-05-e/rev.json` |

切點支持度（以九家科判計，同一家在同一句只算一次）：

| 支持家數 | 切點數 |
|---:|---:|
| 1 | 1,292 |
| 2 | 1,037 |
| 3 | 59 |
| 4 | 20 |
| 5 | 7 |
| 6 | 1 |
| 7 | 1 |
| 8 | 1 |
| ≥2 | 1,126 |
| ≥3 | 89 |

注意：支持度低不等於錯。子璿、宣化的實錨很多是單家；交光、圓瑛、灌頂則有大量
「整棵子樹疊在同一句」的塌縮（1,803／1,126／1,426 個節點各疊在一句），那些不是真切點。
所以第 ② 步不能只看家數，還要看：

- 這個 cut 是**實錨**還是**內插**；
- 這個 cut 上有幾個節點（`nke`），是不是塌縮；
- 這個 cut 是否為某家的**必要邊界**（少了它，該家節點就無處可放）。

## 4. 建議的資料模型

### 4.1 `cuts.tsv`（新增）

| 欄位 | 說明 |
|---|---|
| `cut_id` | 切點編號 |
| `before_sid` / `after_sid` | 切點兩側的句 |
| `support_editions` | 支持的科判家數 |
| `support_nodes` | 支持的節點數 |
| `exact_nodes` | 其中實錨節點數 |
| `interpolated_nodes` | 其中內插節點數 |
| `level` | 由支持節點的最淺層決定 |
| `kind` | `commentary`／`editorial`（長句切） |
| `evidence` | `X265:19; DRBA:123; …` |

### 4.2 `hierarchy.json`（新增）

```json
{
  "id": "H0001",
  "level": 1,
  "label": "序分",
  "sid_start": 0,
  "sid_end": 68,
  "parent": null,
  "children": ["H0002"],
  "evidence": ["DRBA:0", "X265:15"]
}
```

- 節點範圍一定是連續 `sid`。
- `level` 由證據節點的深度決定；沒有證據的層級不建。
- 同一層的節點不重疊；父子只有包含關係。

### 4.3 `xref.tsv`（新增）

| 欄位 | 說明 |
|---|---|
| `work_id` | `T1799`、`X265`、`DRBA`、`LUK`… |
| `source_node` | 該書的節點／段落 id |
| `sid_start` / `sid_end` | 對到的句範圍 |
| `hierarchy_id` | 對到的語義節點（可空） |
| `kind` | `kepan`／`commentary`／`translation`／`glossary` |

所有來源只存 `xref`，不各存一套座標；新增一家注疏時，只增加 `xref` 列，不動主文。

## 5. 下一步

1. ~~出 `cuts.tsv`~~ ✅ 2,418 刀，含支持度、實錨／內插、塌縮、層級、前後文。
2. ~~候選 cut set~~ ✅ `all` 2,423、`exact` 1,647、`shared2` 1,126、`coarse`（k=3，615 刀）642 段。
3. ~~建 hierarchy~~ ✅ 三個 draft，卷→分節→段，validation 0 errors。
4. **建 xref**：九家科判 11,007 節點＋27 分節已對到 `track_start`／`track_end`；T1799 等注疏待接。`align.tsv` 目前只有 T945↔KU-PDF 17 列 pilot。
5. **最小 cut set 分兩層**：精確層（exact 1,647／all 2,423）給句級對齊；粗層（k=3，615 刀／642 段）給 hierarchy。
6. **凍結 canonical**：把新 `sid` 回寫主文，舊 `u` 全面換成 `sid`；此後只維護一棵樹。**尚未做**。

## 6. 與現有檔案的關係

| 檔案 | 在書同軌中的角色 |
|---|---|
| `data/sentences.tsv` | leaf 層（4,890 句） |
| `data/tracks-zh.tsv` | 漢文轍號（`S0000.1` 這種穩定 id；4,890 轍） |
| `data/sentence-kepan.tsv` | 科判節點的 sid 對映（11,007 列） |
| `data/cuts.tsv` | 逐刀證據表（2,418 刀） |
| `data/xref-kepan.tsv` | 九家科判節點 → track range（11,007 列） |
| `data/xref-section.tsv` | 27 分節 → track range（27 列） |
| `data/hierarchy.json` | all cut set 的樹（2,423 段） |
| `data/hierarchy-exact.json` | 實錨、排除塌縮（1,647 段） |
| `data/hierarchy-shared2.json` | ≥2 家、排除塌縮（1,126 段） |
| `data/witnesses.tsv` | 傳本清單（T945／H259／LUK／KU-PDF） |
| `data/tracks-sa.tsv` | 不空本梵句 143 轍（KU-PDF） |
| `data/align.tsv` | 對齊表（目前 T945↔KU-PDF 17 列 pilot） |
| `data/ke-anchors.json` | 27 分節（目前的 coarse 層） |
| `site/reader/kepan/kepan-data.js` | 九家科判來源（尚未回寫新 sid） |
| `data/sutra.json` | 3,732 句（**凍結，暫不動**）；新 view 4,890 句待定案 |
| `docs/sentence-index.md` | 句級定址規則 |
| `docs/chapter-unit-analysis.md` | 卷／分節的 chapter 層評估 |









