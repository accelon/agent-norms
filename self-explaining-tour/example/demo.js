// ../format.ts
var TOUR_MAGIC = "TOUR1";
var LEGACY_MAGICS = ["AC26T"];
var TOUR_FMT = 1;
var OP = {
  text: 1,
  point: 2,
  unpoint: 3,
  click: 4,
  type: 5,
  key: 6,
  wait: 7,
  waitFor: 8,
  tab: 9,
  side: 10,
  set: 11,
  call: 12,
  user: 13,
  require: 14,
  skipIf: 15,
  tap: 16
};
var OP_NAME = Object.fromEntries(Object.entries(OP).map(([k, v]) => [v, k]));
var enc = new TextEncoder;
var dec = new TextDecoder("utf-8");
class Reader {
  d;
  i = 0;
  constructor(d) {
    this.d = d;
  }
  u8() {
    return this.d[this.i++] ?? 0;
  }
  u16() {
    const v = (this.d[this.i] ?? 0) | (this.d[this.i + 1] ?? 0) << 8;
    this.i += 2;
    return v;
  }
  u32() {
    const v = ((this.d[this.i] ?? 0) | (this.d[this.i + 1] ?? 0) << 8 | (this.d[this.i + 2] ?? 0) << 16 | (this.d[this.i + 3] ?? 0) << 24) >>> 0;
    this.i += 4;
    return v;
  }
  raw(n) {
    const r = this.d.subarray(this.i, this.i + n);
    this.i += n;
    return r;
  }
  str() {
    return dec.decode(this.raw(this.u16()));
  }
  ascii(n) {
    return String.fromCharCode(...this.raw(n));
  }
  get eof() {
    return this.i >= this.d.length;
  }
}
var CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0;n < 256; n++) {
    let c = n;
    for (let k = 0;k < 8; k++)
      c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(bytes) {
  let c = 4294967295;
  for (let i = 0;i < bytes.length; i++)
    c = CRC_TABLE[(c ^ bytes[i]) & 255] ^ c >>> 8;
  return (c ^ 4294967295) >>> 0;
}
function decodeTour(bytes, magic = TOUR_MAGIC) {
  const r = new Reader(bytes);
  const gotMagic = r.ascii(5);
  const accepted = new Set([magic, TOUR_MAGIC, ...LEGACY_MAGICS]);
  if (!accepted.has(gotMagic))
    throw new Error(`not a tour macro (magic=${JSON.stringify(gotMagic)})`);
  const fmt = r.u8();
  if (fmt !== TOUR_FMT)
    throw new Error(`tour macro format ${fmt}; this player understands ${TOUR_FMT} (update the player)`);
  r.u8();
  const want = r.u32();
  const got = crc32(bytes.subarray(r.i));
  if (want !== got)
    throw new Error(`tour macro is corrupt (CRC ${got.toString(16)} ≠ ${want.toString(16)})`);
  const tour = {
    id: r.str(),
    title: r.str(),
    intro: r.str(),
    require: r.str(),
    scenes: []
  };
  const n = r.u16();
  for (let i = 0;i < n; i++) {
    const sc = { title: r.str(), body: r.str(), steps: [] };
    const m = r.u16();
    for (let j = 0;j < m; j++) {
      const op = r.u8();
      const argc = r.u8();
      const args = [];
      for (let k = 0;k < argc; k++)
        args.push(r.str());
      if (!OP_NAME[op])
        throw new Error(`scene ${i + 1} step ${j + 1}: unknown opcode ${op}`);
      sc.steps.push({ op, args });
    }
    tour.scenes.push(sc);
  }
  if (!r.eof)
    throw new Error(`tour macro has ${bytes.length - r.i} trailing bytes`);
  return tour;
}
function fromBase64(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0;i < bin.length; i++)
    out[i] = bin.charCodeAt(i);
  return out;
}

// ../player.ts
var data = { index: [], blobs: {} };
var prefix = "tour";
var appName = "this app";
var modalIds = [];
var finishHtml = "";
var magic = TOUR_MAGIC;
var PKEY = (id) => `${prefix}.${id}`;
var app = null;
var cur = null;
var seq = 0;
var phase = "idle";
var waitKind = "none";
var note = "";
var pointSel = null;
var failed = [];
var pending = null;
var userDone = false;
var skipReq = false;
var tapped = false;
var raf = 0;
var cache = new Map;
var sleep = (ms) => new Promise((r) => setTimeout(r, ms));
var el = (id) => document.getElementById(id);
function q(sel) {
  try {
    return document.querySelector(sel);
  } catch {
    return null;
  }
}
function visible(e) {
  if (!e)
    return false;
  const r = e.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== "hidden";
}
function evalCond(cond) {
  let c = cond.trim();
  let neg = false;
  if (c.startsWith("!")) {
    neg = true;
    c = c.slice(1).trim();
  }
  let yes = false;
  try {
    yes = atom(c);
  } catch {
    yes = false;
  }
  return neg ? !yes : yes;
}
function atom(c) {
  if (c.startsWith("api:")) {
    const body = c.slice(4);
    const eq = body.indexOf("=");
    const path = (eq < 0 ? body : body.slice(0, eq)).trim();
    const want = eq < 0 ? null : body.slice(eq + 1).trim();
    let v;
    try {
      v = path.split(".").reduce((o, k) => o == null ? undefined : o[k], app?.state?.() ?? {});
    } catch {
      v = undefined;
    }
    return want === null ? !!v : String(v) === want;
  }
  if (c.startsWith("count:")) {
    const m = /^(.*?)\s*(>=|<=|==|!=|>|<)\s*(\d+)$/.exec(c.slice(6).trim());
    if (m) {
      const n = document.querySelectorAll(m[1]).length;
      const k = Number(m[3]);
      switch (m[2]) {
        case ">=":
          return n >= k;
        case "<=":
          return n <= k;
        case "==":
          return n === k;
        case "!=":
          return n !== k;
        case ">":
          return n > k;
        default:
          return n < k;
      }
    }
    try {
      return document.querySelectorAll(c.slice(6).trim()).length > 0;
    } catch {
      return false;
    }
  }
  if (c.startsWith("text:")) {
    const body = c.slice(5);
    const eq = body.indexOf("=");
    if (eq < 0)
      return false;
    const e = q(body.slice(0, eq).trim());
    return !!e && (e.textContent ?? "").includes(body.slice(eq + 1).trim());
  }
  return visible(q(c));
}
function load(id) {
  let t = cache.get(id);
  if (t)
    return t;
  const b64 = data.blobs[id];
  if (!b64)
    return null;
  try {
    t = decodeTour(fromBase64(b64), magic);
    cache.set(id, t);
    return t;
  } catch (e) {
    console.error("[tour] 宏解不開", e);
    return null;
  }
}
function tourProgress(id) {
  try {
    return Math.max(0, Number(localStorage.getItem(PKEY(id)) ?? "0") || 0);
  } catch {
    return 0;
  }
}
function saveProgress(scene) {
  if (!cur)
    return;
  try {
    localStorage.setItem(PKEY(cur.id), String(scene));
  } catch {}
}
var mdLite = (src) => src.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").split(/\n{2,}/).map((p) => "<p>" + p.replace(/\n/g, "<br>").replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/`([^`]+)`/g, "<code>$1</code>") + "</p>").join("");
function setText(md) {
  const e = el("tourText");
  if (e)
    e.innerHTML = mdLite(md);
}
function setNote(msg) {
  note = msg;
  const e = el("tourNote");
  if (e) {
    e.textContent = msg;
    e.hidden = !msg;
  }
}
function pointAt(sel) {
  pointSel = sel;
  layout();
}
function layout() {
  const spot = el("tourSpot");
  const bubble = el("tourBubble");
  if (!spot || !bubble || bubble.hidden)
    return;
  const target = pointSel ? q(pointSel) : null;
  const r = target ? target.getBoundingClientRect() : null;
  const has = !!r && r.width > 0 && r.height > 0;
  spot.hidden = !has;
  if (has && r) {
    const pad = 4;
    spot.style.left = Math.round(r.left - pad) + "px";
    spot.style.top = Math.round(r.top - pad) + "px";
    spot.style.width = Math.round(r.width + pad * 2) + "px";
    spot.style.height = Math.round(r.height + pad * 2) + "px";
    const lower = r.top + r.height / 2 > window.innerHeight / 2;
    bubble.style.top = lower ? "18px" : "";
    bubble.style.bottom = lower ? "" : "18px";
  } else {
    bubble.style.top = "";
    bubble.style.bottom = "18px";
    if (pointSel) {
      if (!note.startsWith("⚠ 找不到"))
        setNote(`⚠ 找不到「${pointSel}」，或它目前看不到`);
    }
  }
  if (has && note.startsWith("⚠ 找不到"))
    setNote("");
}
function startRaf() {
  if (raf)
    return;
  const tick = () => {
    raf = requestAnimationFrame(tick);
    layout();
  };
  raf = requestAnimationFrame(tick);
}
function stopRaf() {
  if (raf)
    cancelAnimationFrame(raf);
  raf = 0;
}
function showBubble(on) {
  const b = el("tourBubble");
  if (b)
    b.hidden = !on;
  if (!on) {
    const s = el("tourSpot");
    if (s)
      s.hidden = true;
    stopRaf();
    return;
  }
  startRaf();
}
function show(id, on, label) {
  const b = el(id);
  if (!b)
    return;
  b.hidden = !on;
  if (on && label)
    b.textContent = label;
}
function updateUi() {
  if (!cur)
    return;
  const sc = cur.tour.scenes[cur.scene];
  const where = el("tourWhere");
  if (where)
    where.textContent = `場景 ${cur.scene + 1} / ${cur.tour.scenes.length}`;
  const title = el("tourTitle");
  if (title)
    title.textContent = sc.title;
  const prog = el("tourProg");
  if (prog)
    prog.textContent = `${Math.min(cur.step, sc.steps.length)} / ${sc.steps.length}`;
  const last = cur.scene >= cur.tour.scenes.length - 1;
  show("tourNext", waitKind === "next", last ? "完成 ✓" : "下一個場景 →");
  show("tourDone", waitKind === "user");
  show("tourSkip", waitKind === "user" || waitKind === "cond" || waitKind === "pause", waitKind === "pause" ? "略過這步" : waitKind === "cond" ? "略過等待" : "略過這步");
  show("tourReplay", waitKind !== "none");
  const prev = el("tourPrev");
  if (prev) {
    prev.hidden = false;
    prev.disabled = cur.scene === 0;
  }
  const bubble = el("tourBubble");
  if (bubble)
    bubble.classList.toggle("paused", waitKind === "pause");
}
function beginScene(sc) {
  setText(sc.body);
  const title = el("tourTitle");
  if (title)
    title.textContent = sc.title;
  setNote("");
  pointSel = null;
  waitKind = "none";
  phase = "running";
  updateUi();
  layout();
}
function interrupt() {
  const p = pending;
  pending = null;
  if (p)
    p("stop");
  userDone = false;
  skipReq = false;
}
function ask(kind) {
  waitKind = kind;
  phase = kind === "next" ? "waiting" : "running";
  updateUi();
  return new Promise((res) => {
    pending = (v) => {
      pending = null;
      res(v);
    };
  });
}
function fail(msg) {
  note = msg;
  if (cur)
    failed.push({ scene: cur.scene, step: cur.step, msg });
  setNote(msg);
  return "pause";
}
async function exec(st, my) {
  const a = st.args;
  switch (st.op) {
    case OP.text:
      setText(a[0]);
      return "ok";
    case OP.point:
      pointAt(a[0]);
      return "ok";
    case OP.unpoint:
      pointAt(null);
      return "ok";
    case OP.click: {
      const e = q(a[0]);
      if (!visible(e))
        return fail(`找不到「${a[0]}」（或它目前看不到）`);
      e.click();
      await sleep(60);
      return "ok";
    }
    case OP.type: {
      const e = q(a[0]);
      if (!e)
        return fail(`找不到輸入框「${a[0]}」`);
      e.focus();
      e.value = a[1] ?? "";
      e.dispatchEvent(new Event("input", { bubbles: true }));
      await sleep(60);
      return "ok";
    }
    case OP.key: {
      const target = a[1] ? q(a[1]) : document.activeElement;
      if (!target)
        return fail(`找不到「${a[1] ?? "目前焦點"}」`);
      target.dispatchEvent(new KeyboardEvent("keydown", { key: a[0], bubbles: true, cancelable: true }));
      await sleep(60);
      return "ok";
    }
    case OP.wait:
      await sleep(Number(a[0]) || 0);
      return "ok";
    case OP.waitFor:
      return waitCond(a[0], Number(a[1]) || 5000, my);
    case OP.tab:
      app?.tab?.(a[0], a[1]);
      await sleep(120);
      return "ok";
    case OP.side:
      app?.side?.(a[0], a[1] === "on");
      await sleep(120);
      return "ok";
    case OP.set:
      if (!app?.set?.(a[0], a[1] ?? ""))
        return fail(`不認得的設定「${a[0]}」`);
      await sleep(120);
      return "ok";
    case OP.call:
      try {
        await app?.call?.(a[0], a[1] ?? "");
      } catch (e) {
        return fail(`${a[0]} 失敗：${e?.message ?? e}`);
      }
      return "ok";
    case OP.user:
      return waitUser(a[0], a[1] ?? "", my);
    case OP.tap:
      return waitTap(a[0] ?? "", my);
    case OP.require:
      return waitCond(a[0], 120000, my, `需要：${a[0]}`);
    case OP.skipIf:
      if (evalCond(a[0])) {
        note = `（本場景不適用：${a[0]}）`;
        return "skip";
      }
      return "ok";
    default:
      return fail(`未知指令 ${st.op}`);
  }
}
async function waitCond(cond, timeout, my, hint = "") {
  if (evalCond(cond))
    return "ok";
  waitKind = "cond";
  updateUi();
  const t0 = performance.now();
  while (my === seq) {
    if (skipReq) {
      skipReq = false;
      setNote(`（跳過等待：${cond}）`);
      return "ok";
    }
    if (evalCond(cond)) {
      setNote("");
      return "ok";
    }
    const waited = performance.now() - t0;
    if (waited > timeout)
      return fail(`等不到「${cond}」（${Math.round(timeout)} ms）`);
    setNote(`${hint || "等"}：${cond}…`);
    await sleep(100);
  }
  return "ok";
}
async function waitUser(text, cond, my) {
  setText(text);
  if (cond && evalCond(cond)) {
    setText(text);
    return "ok";
  }
  waitKind = "user";
  updateUi();
  while (my === seq) {
    if (userDone) {
      userDone = false;
      return "ok";
    }
    if (skipReq) {
      skipReq = false;
      return "ok";
    }
    if (cond && evalCond(cond))
      return "ok";
    await sleep(120);
  }
  return "ok";
}
async function waitTap(hint, my) {
  tapped = false;
  waitKind = "tap";
  setNote(hint || "（點畫面任何地方，或按空白鍵，繼續）");
  updateUi();
  while (my === seq) {
    if (tapped) {
      tapped = false;
      setNote("");
      return "ok";
    }
    await sleep(80);
  }
  return "ok";
}
async function play(id, from) {
  if (!app)
    return;
  const tour = load(id);
  if (!tour) {
    openTourMenu();
    return;
  }
  interrupt();
  seq++;
  const my = seq;
  const start = Math.max(0, Math.min(from ?? tourProgress(id), tour.scenes.length - 1));
  cur = { id, tour, scene: start, step: 0 };
  failed = [];
  note = "";
  closeTourMenu();
  showBubble(true);
  loop(my).catch((e) => {
    if (my !== seq)
      return;
    fail(`導覽中斷：${e?.message ?? e}`);
    phase = "paused";
    waitKind = "pause";
    updateUi();
  });
}
async function loop(my) {
  outer:
    while (my === seq && cur) {
      const sc = cur.tour.scenes[cur.scene];
      if (!sc) {
        finish();
        return;
      }
      beginScene(sc);
      while (cur.step < sc.steps.length) {
        const r = await exec(sc.steps[cur.step], my);
        if (my !== seq)
          return;
        if (r === "skip") {
          cur.scene++;
          cur.step = 0;
          continue outer;
        }
        if (r === "pause") {
          const act2 = await ask("pause");
          if (my !== seq)
            return;
          if (act2 === "stop")
            return stopTour();
          if (act2 === "replay") {
            cur.step = 0;
            beginScene(sc);
            updateUi();
            continue;
          }
        }
        cur.step++;
        updateUi();
      }
      phase = "waiting";
      waitKind = "next";
      setText(sc.body);
      setNote("");
      saveProgress(cur.scene);
      updateUi();
      const act = await ask("next");
      if (my !== seq)
        return;
      if (act === "stop")
        return stopTour();
      if (act === "replay") {
        play(cur.id, cur.scene);
        return;
      }
      if (act === "prev") {
        play(cur.id, Math.max(0, cur.scene - 1));
        return;
      }
      cur.scene++;
      cur.step = 0;
    }
  if (cur)
    cur.scene = cur.tour.scenes.length;
}
function finish() {
  phase = "done";
  waitKind = "next";
  pointSel = null;
  layout();
  const title = el("tourTitle");
  if (title)
    title.textContent = "導覽結束";
  setText(finishHtml || `這些都可以在 ${appName} 的設置裡隨時改回來。想再看一次：從「操作導覽」再開一次。`);
  setNote("");
  if (cur)
    saveProgress(cur.tour.scenes.length - 1);
  const next = el("tourNext");
  if (next) {
    next.hidden = false;
    next.textContent = "再看一次";
  }
  show("tourDone", false);
  show("tourSkip", false);
  show("tourReplay", false);
  const prev = el("tourPrev");
  if (prev)
    prev.hidden = true;
  pending = null;
}
function stopTour() {
  interrupt();
  seq++;
  cur = null;
  phase = "idle";
  waitKind = "none";
  note = "";
  pointSel = null;
  showBubble(false);
}
var escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
function renderMenu() {
  const list = el("tourList");
  if (!list)
    return;
  list.innerHTML = data.index.map((t) => {
    const done = tourProgress(t.id);
    const label = done > 0 && done < t.scenes ? `繼續（${done + 1} / ${t.scenes}）` : "開始";
    return `<div class="tourRow" data-id="${escapeHtml(t.id)}">` + `<div class="tourName">${escapeHtml(t.title)}</div>` + `<div class="tourIntro">${escapeHtml(t.intro)}</div>` + `<div class="tourMeta">${t.scenes} 個場景 · ${t.steps} 步${t.require ? " · 需要 " + escapeHtml(t.require) : ""}</div>` + `<div class="tourActs"><button type="button" class="primary" data-play="1">${label}</button>` + (done > 0 ? '<button type="button" data-restart="1">從頭</button>' : "") + "</div></div>";
  }).join("");
  list.querySelectorAll(".tourRow").forEach((row) => {
    const id = row.dataset.id ?? "";
    row.querySelector("[data-play]")?.addEventListener("click", () => {
      play(id);
    });
    row.querySelector("[data-restart]")?.addEventListener("click", () => {
      play(id, 0);
    });
  });
}
function openTourMenu() {
  if (cur)
    stopTour();
  const box = el("tourBox");
  const back = el("tourBackdrop");
  if (box)
    box.hidden = false;
  if (back)
    back.hidden = false;
  renderMenu();
}
function startTour() {
  const first = data.index[0];
  if (data.index.length === 1 && first)
    play(first.id);
  else
    openTourMenu();
}
function closeTourMenu() {
  const box = el("tourBox");
  const back = el("tourBackdrop");
  if (box)
    box.hidden = true;
  if (back)
    back.hidden = true;
}
function tourMenuOpen() {
  return el("tourBox")?.hidden === false;
}
var modalOpen = () => modalIds.some((id) => el(id)?.hidden === false);
function onKey(ev) {
  if (ev.key === "Escape") {
    if (modalOpen())
      return;
    if (tourMenuOpen()) {
      ev.preventDefault();
      ev.stopPropagation();
      closeTourMenu();
      return;
    }
    if (cur) {
      ev.preventDefault();
      ev.stopPropagation();
      stopTour();
    }
    return;
  }
  if (!cur)
    return;
  if (ev.key === "ArrowRight" || ev.key === " " || ev.key === "Enter") {
    if (waitKind === "tap") {
      ev.preventDefault();
      ev.stopPropagation();
      tapped = true;
      return;
    }
    if (waitKind !== "next")
      return;
    ev.preventDefault();
    ev.stopPropagation();
    if (phase === "done")
      play(cur.id, 0);
    else
      pending?.("next");
    return;
  }
  if (ev.key === "ArrowLeft" && cur.scene > 0) {
    ev.preventDefault();
    ev.stopPropagation();
    play(cur.id, Math.max(0, cur.scene - 1));
  }
}
function initTour(a, d, options = {}) {
  app = a;
  data = d;
  prefix = options.storagePrefix ?? "tour";
  appName = options.appName ?? "this app";
  modalIds = options.modalIds ?? [];
  finishHtml = options.finishHtml ?? "";
  magic = options.magic ?? TOUR_MAGIC;
  el("tourClose")?.addEventListener("click", () => closeTourMenu());
  el("tourBackdrop")?.addEventListener("click", () => closeTourMenu());
  el("tourX")?.addEventListener("click", () => stopTour());
  el("tourNext")?.addEventListener("click", () => {
    if (phase === "done" && cur) {
      play(cur.id, 0);
      return;
    }
    pending?.("next");
  });
  el("tourPrev")?.addEventListener("click", () => {
    if (cur)
      play(cur.id, Math.max(0, cur.scene - 1));
  });
  el("tourReplay")?.addEventListener("click", () => {
    if (cur)
      play(cur.id, cur.scene);
  });
  el("tourDone")?.addEventListener("click", () => {
    userDone = true;
  });
  el("tourSkip")?.addEventListener("click", () => {
    if (waitKind === "pause") {
      pending?.("next");
      return;
    }
    skipReq = true;
  });
  document.addEventListener("click", (ev) => {
    if (waitKind !== "tap")
      return;
    const t = ev.target;
    if (t?.closest?.("#tourBubble, #tourBox, #tourBackdrop"))
      return;
    tapped = true;
  }, true);
  window.addEventListener("keydown", onKey, true);
  renderMenu();
}

// tour-data.ts
var TOUR_INDEX = [
  {
    id: "welcome",
    title: "第一次使用",
    intro: "一分鐘走一遍：開始、搜尋、設定。每個場景看完，點一下畫面再往下。",
    scenes: 4,
    steps: 21,
    require: "",
    bytes: 766
  }
];
var TOUR_BLOBS = {
  welcome: "VE9VUjEBAHw/FCIHAHdlbGNvbWUPAOesrOS4gOasoeS9v+eUqGAA5LiA5YiG6ZCY6LWw5LiA6YGN77ya6ZaL5aeL44CB5pCc5bCL44CB6Kit5a6a44CC5q+P5YCL5aC05pmv55yL5a6M77yM6bue5LiA5LiL55Wr6Z2i5YaN5b6A5LiL44CCAAAEABIA5YWI55yL6YCZ5YCL55Wr6Z2iUADlt6bkuIrmmK8qKumWi+Wniyoq77yM5Y+z5LiK5pivKiroqK3lrpoqKuOAguS4i+mdoueahOi8uOWFpeahhuacg+WNs+aZguaQnOWwi+OAggMAAgEJACNzdGFydEJ0bhAAAwAPAOecn+eahOaMieS4gOasoTMA5oyJ44CM6ZaL5aeL44CN5LmL5b6M77yM57WQ5p6c5pyD5Ye654++5Zyo5LiL6Z2i44CCBgACAQkAI3N0YXJ0QnRuBAEJACNzdGFydEJ0bggBBwAjcmVzdWx0AgEHACNyZXN1bHQQARIA55yL5a6M5YaN6bue5LiA5LiLAwAPAOaQnOWwi+iIh+ioreWumjMA6Ly45YWl5qGG6YKK5omT6YKK5p+l77yb6Kit5a6a6KOh5Y+v5Lul5pS55Li76aGM44CCCwACAQcAI3NlYXJjaAUCBwAjc2VhcmNoBgDoiKzoi6UQAAIBDAAjc2V0dGluZ3NCdG4EAQwAI3NldHRpbmdzQnRuCAEaACNzZXR0aW5nc0JveDpub3QoW2hpZGRlbl0pAgEMACNzZXR0aW5nc0JveBABEgDnnIvlrozlho3pu57kuIDkuIsEAQ4AI3NldHRpbmdzQ2xvc2UIARsAISNzZXR0aW5nc0JveDpub3QoW2hpZGRlbl0pAwAMAOWwseaYr+mAmeaoo1cA6Kit5a6a6YO95Y+v5Lul6Zqo5pmC5pS55Zue5L6G44CC5oOz5YaN55yL5LiA5qyh77yM5b6e44CM5pON5L2c5bCO6Ka944CN5YaN6ZaL5LiA5qyh44CCAQADAA=="
};

// demo.ts
var app2 = {
  set(key, value) {
    return key === "theme" ? !!value : false;
  },
  state() {
    return { ready: true, tab: "main" };
  }
};
initTour(app2, { index: TOUR_INDEX, blobs: TOUR_BLOBS }, {
  appName: "Tour demo",
  modalIds: ["settingsBox"],
  storagePrefix: "demo.tour"
});
startTour();
