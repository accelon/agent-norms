---
name: corpus-to-mobile
description: Generate 1080-wide WeChat long images for a domain knowledge base when the user says "做《X》知識庫" (or asks for the series). Five images by default; a four-page variant is supported. Uses the corpus-to-mobile playbook: three-layer architecture, human-AI loop, cost/token model, mission, and unchanged technical advantages.
---

# Corpus to mobile

When the user says **「做《X》知識庫」** or asks for the five-image WeChat series, read
[`../../corpus-to-mobile-skills.md`](../../corpus-to-mobile-skills.md) and follow it exactly.
That file is canonical; this skill is only the trigger and the guardrails.

## Must do

- Produce **five** images by default, 1080 px wide, JPEG q90, named `{{領域}}知識庫-01-三層架構.jpg` … `-05-技術優勢.jpg`. If the user explicitly asks for a **four-page** version, produce 01–04 only, set footers `/ 04`, and leave 05 for reuse.
- 01–04 are domain-specific; **05 技術優勢 is mostly unchanged** (patent, glyph library, corpus pipeline, standoff/nested exploration).
- **First four pages: Chinese only.** No `L0/L1/L2`, `claim`, `offtext`, `AI`, `token`, `API`, or `hash`; use 第一／二／三層、主張、離文標記、機器、算力單位、對外服務、內容指紋. Technical terms belong on page 05.
- Use the cost and compute model in the playbook; label every number as an estimate.
- 02 includes a three-slice cost pie (算力／專家／團隊運營) and two reasons it is now feasible; the slices must add to 100%.
- Body 42–46 px, title 112 px, footer 30 px; the audience includes elderly readers.
- Copy the reusable assets from [`../../corpus-to-mobile/`](../../corpus-to-mobile/):
  `series.css`, `05-tech.html`, `zhaocaijinbao.png`, `trim_one.py`.
- Finished examples: [`../../tcm/`](../../tcm/) (five pages); [`../../buddhist-study/`](../../buddhist-study/) (five pages) and [`../../huayen-study/`](../../huayen-study/) (vertical proposal).
- Render with Edge headless at 1080 px; trim with Pillow; inspect each image with `read_image`.
- Check: no clipped titles, no orphan single characters, footers `/ 05` (or `/ 04` for the four-page version), numbers consistent.

## Do not

- Do not redesign the layout, switch to A4/PDF, or exceed five images.
- Do not change 05's patent number, glyph-library numbers, 47億/6,357 alignments, or the 分離標記 definition.
- Do not present the Buddhist canon's 47億 chars as the new domain's corpus; call it pipeline experience.
- Do not invent classics, patents, dates, or measurements; write 「待查」 instead.
- Do not promise full automation; expert review is part of the product.
