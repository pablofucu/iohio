/* GM² · El Puto Circo — interacciones */
(() => {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const NS = "http://www.w3.org/2000/svg";
  const fmt = (n, dec = 0) => {
    const [i, d] = Number(n).toFixed(dec).split(".");
    return i.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + (d ? "," + d : "");
  };
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const svgEl = (tag, attrs = {}, parent) => {
    const el = document.createElementNS(NS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(el);
    return el;
  };
  const onVisible = (el, fn, opts = {}) => {
    if (!el) return;
    if (!("IntersectionObserver" in window)) { fn(el); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { fn(e.target); if (!opts.repeat) io.unobserve(e.target); }
        else if (opts.out) opts.out(e.target);
      });
    }, { threshold: opts.threshold ?? 0.15, rootMargin: opts.margin ?? "0px 0px -6% 0px" });
    io.observe(el);
  };

  /* ---------------- LOADER ---------------- */
  const loader = $("#loader");
  let seen = false;
  try { seen = sessionStorage.getItem("gm-seen") === "1"; sessionStorage.setItem("gm-seen", "1"); } catch (e) {}
  const hideLoader = () => { loader.classList.add("done"); document.body.classList.remove("locked"); };
  setTimeout(hideLoader, reduce || seen ? 250 : 1550);
  loader.addEventListener("click", hideLoader);

  /* celdas de tablas: envolver contenido para la vista móvil */
  $$("table.rt td").forEach((td) => {
    const sp = document.createElement("span"); sp.className = "cv";
    while (td.firstChild) sp.appendChild(td.firstChild);
    td.appendChild(sp);
  });

  /* tabla completa: abierta en escritorio, plegable en móvil */
  const more = $("#membersMore");
  const syncMore = () => { if (more && innerWidth >= 980) more.open = true; };
  syncMore(); window.addEventListener("resize", syncMore);

  /* ---------------- REVEAL ---------------- */
  $$("[data-r]").forEach((el) => onVisible(el, (t) => t.classList.add("in"), { threshold: 0.08 }));

  /* contadores */
  const animateCount = (el) => {
    const to = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0), suf = el.dataset.suffix || "";
    if (reduce) { el.textContent = fmt(to, dec) + suf; return; }
    const dur = 1500, t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(to * e, dec) + suf;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  $$("[data-count]").forEach((el) => onVisible(el, animateCount, { threshold: 0.4 }));

  /* barras genéricas */
  $$(".fl[data-w], .split i[data-w]").forEach((el) => onVisible(el, (t) => { t.style.width = t.dataset.w + "%"; }, { threshold: 0.2 }));

  /* burbujas escribiendo */
  $$("[data-type]").forEach((el) => onVisible(el, (t) => setTimeout(() => t.classList.add("typed"), reduce ? 0 : 1100), { threshold: 0.6 }));

  /* ---------------- TOPBAR / PROGRESO / PARALLAX ---------------- */
  const topbar = $("#topbar"), progress = $("#progress"), fab = $("#fab"), toTop = $("#toTop");
  const floaters = $$(".hero [data-depth]");
  let mx = 0, my = 0, ticking = false;
  const onScroll = () => {
    const y = window.scrollY, h = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${h > 0 ? y / h : 0})`;
    topbar.classList.toggle("show", y > 140);
    fab.classList.toggle("show", y > innerHeight * 0.9);
    toTop.classList.toggle("show", y > innerHeight * 1.6);
    if (!reduce && y < innerHeight * 1.3) {
      floaters.forEach((f) => {
        const d = parseFloat(f.dataset.depth);
        const base = f.classList.contains("gm-mega") ? "translate(-50%, -54%) " : "";
        f.style.transform = `${base}translate3d(${mx * d * 26}px, ${-y * d * 0.55 + my * d * 18}px, 0)`;
      });
    }
    epLine();
    ticking = false;
  };
  window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  const glow = $(".cursor-glow");
  window.addEventListener("pointermove", (e) => {
    mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5;
    if (glow) glow.style.transform = `translate(${e.clientX - 260}px, ${e.clientY - 260}px)`;
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }));

  /* ---------------- MENÚ ---------------- */
  const menu = $("#menu"), menuBtn = $("#menuBtn");
  const setMenu = (open) => {
    menu.classList.toggle("open", open); menuBtn.setAttribute("aria-expanded", open);
    document.body.style.overflow = open ? "hidden" : "";
  };
  menuBtn.addEventListener("click", () => setMenu(true));
  $("#menuClose").addEventListener("click", () => setMenu(false));
  $$("#menu a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

  /* ---------------- TOASTS ---------------- */
  const toasts = $("#toasts");
  const toast = (html, ms = 2600) => {
    const t = document.createElement("div");
    t.className = "toast"; t.innerHTML = html; toasts.appendChild(t);
    setTimeout(() => { t.classList.add("out"); setTimeout(() => t.remove(), 320); }, ms);
    while (toasts.children.length > 3) toasts.firstChild.remove();
  };

  /* ---------------- LATAS ---------------- */
  let cans = 0;
  const burst = (x, y, color = "#9dff00") => {
    if (reduce) return;
    for (let i = 0; i < 16; i++) {
      const d = document.createElement("i");
      d.className = "drop"; d.style.left = x + "px"; d.style.top = y + "px"; d.style.background = color; d.style.boxShadow = `0 0 8px ${color}`;
      document.body.appendChild(d);
      const a = Math.random() * Math.PI * 2, r = 40 + Math.random() * 90;
      d.animate([{ transform: "translate(-50%,-50%) scale(1)", opacity: 1 },
        { transform: `translate(calc(-50% + ${Math.cos(a) * r}px), calc(-50% + ${Math.sin(a) * r - 40}px)) scale(.3)`, opacity: 0 }],
        { duration: 700 + Math.random() * 400, easing: "cubic-bezier(.2,.8,.3,1)" }).onfinish = () => d.remove();
    }
  };
  $$(".can-btn").forEach((b) => b.addEventListener("click", (e) => {
    b.classList.toggle("open");
    if (b.classList.contains("open")) {
      cans++;
      const claw = getComputedStyle(b.querySelector("svg")).getPropertyValue("--claw").trim() || "#9dff00";
      burst(e.clientX, e.clientY, claw);
      toast(`🥤 <b>Tssssk…</b> lata abierta · llevas <b>${cans}</b>`);
    }
  }));

  /* ---------------- FAB: SALIR DEL GRUPO ---------------- */
  let exits = 0, lastExits = [];
  const fabCnt = $("#fabCnt");
  fab.addEventListener("click", () => {
    exits++; fabCnt.textContent = exits;
    const now = Date.now(); lastExits = lastExits.filter((t) => now - t < 60000); lastExits.push(now);
    toast("<code>Daniel Bruno (El Prensas)</code> salió del grupo");
    setTimeout(() => toast("<code>Daniel Bruno (El Prensas)</code> se unió usando el enlace de invitación · <em>\"Vuelvo a ser poderoso\"</em>"), 1100);
    if (lastExits.length === 4) setTimeout(() => toast("🚪 Se sale <b>4 veces en el mismo minuto</b> (28/11/2023)", 3400), 2200);
    if (exits === 11) setTimeout(() => toast("☢️ Abandona el grupo (<b>11 veces en total</b>)", 3400), 2200);
  });

  /* ---------------- 1.1 RANKING ---------------- */
  const metrics = [
    { k: "m", l: "Mensajes" }, { k: "w", l: "Palabras" }, { k: "a", l: "Media palabras/msg", dec: 2 },
    { k: "x", l: "Multimedia" }, { k: "b", l: "Borrados" }, { k: "e", l: "Editados" },
    { k: "q", l: "Preguntas (?)" }, { k: "j", l: "Risas (jaja/xd)" }
  ];
  const members = $$("#membersTable tr[data-name]").map((tr) => {
    const o = { name: tr.dataset.name, dani: tr.classList.contains("hl") };
    metrics.forEach((m) => (o[m.k] = parseFloat(tr.dataset[m.k])));
    return o;
  });
  const bars = $("#memberBars"), tabs = $("#metricTabs");
  let curMetric = "m";
  const drawMembers = (k) => {
    curMetric = k;
    const m = metrics.find((x) => x.k === k);
    const sorted = [...members].sort((a, b) => b[k] - a[k]);
    const max = sorted[0][k] || 1;
    bars.innerHTML = sorted.map((p) => `<div class="hbar${p.dani ? " dani" : ""}"><span class="nm">${p.name}</span><div class="tr"><div class="fl" data-target="${(p[k] / max) * 100}"></div><span class="vl">${fmt(p[k], m.dec || 0)}</span></div></div>`).join("");
    requestAnimationFrame(() => requestAnimationFrame(() => $$(".fl", bars).forEach((f) => (f.style.width = f.dataset.target + "%"))));
    $$(".chip", tabs).forEach((c) => c.setAttribute("aria-pressed", c.dataset.k === k));
  };
  tabs.innerHTML = metrics.map((m) => `<button class="chip" role="tab" data-k="${m.k}" aria-pressed="false">${m.l}</button>`).join("");
  tabs.addEventListener("click", (e) => { const c = e.target.closest(".chip"); if (c) drawMembers(c.dataset.k); });
  onVisible($("#memberChart"), () => drawMembers(curMetric), { threshold: 0.25 });

  /* ---------------- TIMELINE ---------------- */
  (() => {
    const box = $("#timeline"); if (!box) return;
    const W = 1000, H = 250, L = 24, R = 976, Y = 112;
    const t0 = Date.UTC(2022, 4, 21), t1 = Date.UTC(2026, 9, 16);
    const x = (y, m, d) => L + ((Date.UTC(y, m - 1, d) - t0) / (t1 - t0)) * (R - L);
    const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Línea temporal mayo 2022 - octubre 2026" });
    svgEl("rect", { x: L, y: Y, width: R - L, height: 22, rx: 6, fill: "rgba(255,255,255,.05)" }, svg);
    svgEl("rect", { class: "in-seg grow", x: L, y: Y, width: x(2025, 9, 23) - L, height: 22, rx: 6, style: "--d:0s" }, svg);
    const exiles = [[[2023, 2, 27], [2023, 3, 15], "16 días"], [[2023, 5, 12], [2023, 7, 20], "Exilio I · 69 días"], [[2023, 12, 6], [2024, 2, 28], "Exilio II · 84 días"], [[2024, 7, 21], [2024, 12, 5], "Exilio III · 137 días"]];
    exiles.forEach(([a, b], i) => svgEl("rect", { class: "out-seg grow", x: x(...a), y: Y, width: Math.max(4, x(...b) - x(...a)), height: 22, style: `--d:${0.9 + i * 0.15}s` }, svg));
    svgEl("rect", { class: "ban-seg grow", x: x(2025, 9, 23), y: Y, width: R - x(2025, 9, 23), height: 22, rx: 6, style: "--d:1.6s" }, svg);
    for (let yr = 2023; yr <= 2026; yr++) {
      const xx = x(yr, 1, 1);
      svgEl("line", { x1: xx, x2: xx, y1: Y - 8, y2: Y + 30, stroke: "rgba(255,255,255,.25)" }, svg);
      const t = svgEl("text", { x: xx + 4, y: Y + 46, class: "yr" }, svg); t.textContent = yr;
    }
    const t22 = svgEl("text", { x: L, y: Y + 46, class: "yr" }, svg); t22.textContent = "2022";
    const peaks = [[[2022, 5, 25], "Mayo 2022", "55,0% del grupo", "start"], [[2023, 4, 15], "Abril 2023", "929 mensajes", "middle"], [[2025, 1, 15], "Enero 2025", "837 msgs · 40,4%", "middle"]];
    peaks.forEach(([d, a, b, anc]) => {
      const g = svgEl("g", { class: "peak" }, svg), xx = x(...d);
      svgEl("line", { x1: xx, x2: xx, y1: 46, y2: Y }, g);
      svgEl("circle", { cx: xx, cy: 46, r: 4, fill: "var(--neon)" }, g);
      const t1_ = svgEl("text", { x: xx + (anc === "start" ? -2 : 0), y: 22, "text-anchor": anc }, g); t1_.textContent = a;
      const t2_ = svgEl("text", { x: xx + (anc === "start" ? -2 : 0), y: 38, "text-anchor": anc, class: "pv" }, g); t2_.textContent = b;
    });
    const evs = [[[2022, 11, 14], "Golpe de Estado", 0], [[2023, 2, 27], "Ley Bruno · 16 días", 1], [[2023, 5, 12], "Exilio I · 69 días", 2], [[2023, 12, 6], "Exilio II · 84 días", 0], [[2024, 3, 13], "Nace «GM»", 1], [[2024, 7, 21], "Exilio III · 137 días", 2], [[2025, 9, 23], "«Al carajo»", 0], [[2026, 3, 8], "«Perchita se ha rajado»", 1]];
    evs.forEach(([d, label, row]) => {
      const xx = x(...d), yy = Y + 70 + row * 24;
      svgEl("line", { x1: xx, x2: xx, y1: Y + 22, y2: yy - 11, stroke: "rgba(255,255,255,.18)", "stroke-dasharray": "2 3" }, svg);
      const t = svgEl("text", { x: xx, y: yy, class: "lbl", "text-anchor": xx > 900 ? "end" : "middle" }, svg); t.textContent = label;
    });
    box.appendChild(svg);
    onVisible(box, (b) => b.classList.add("in"), { threshold: 0.3 });
    const hint = $("#tlHint");
    const chk = () => { hint.style.display = box.scrollWidth > box.clientWidth + 4 ? "" : "none"; };
    chk(); window.addEventListener("resize", chk);
  })();

  /* ---------------- 97 CHAVALES ---------------- */
  (() => {
    const phone = $("#chavalesPhone"), cnt = $("#chavalesCount"), btn = $("#chavalesReplay");
    if (!phone) return;
    let timer = null;
    const add = (html, cls = "") => {
      const b = document.createElement("div"); b.className = "bubble " + cls; b.innerHTML = html; phone.appendChild(b);
      while (phone.children.length > 26) phone.firstChild.remove();
    };
    const run = () => {
      clearInterval(timer); phone.innerHTML = ""; cnt.textContent = "0";
      add('<span class="who" style="color:#ffc93d">Pablo Valderas</span>Chupito cada vez que Dani manda un chavales', "out first");
      let n = 0;
      if (reduce) { add("Chavales"); add("Pablo puta"); cnt.textContent = "97"; return; }
      setTimeout(() => {
        timer = setInterval(() => {
          n++;
          if (n <= 96) add((n === 1 ? '<span class="who" style="color:#9dff00">Daniel Bruno (El Prensas)</span>' : "") + "Chavales", n === 1 ? "first" : "");
          else { add("Pablo puta"); clearInterval(timer); }
          cnt.textContent = n;
        }, 32);
      }, 700);
    };
    onVisible(phone, run, { threshold: 0.5 });
    btn.addEventListener("click", run);
  })();

  /* puertas */
  (() => {
    const d = $("#doors"); if (!d) return;
    let h = "";
    for (let i = 0; i < 9; i++) h += `<span class="door dani" style="--i:${i}"></span>`;
    for (let i = 9; i < 11; i++) h += `<span class="door dani sil" style="--i:${i}"></span>`;
    h += `<span class="door"></span>`;
    d.innerHTML = h;
  })();

  /* reloj vampiro */
  (() => {
    const s = $("#vampClock"); if (!s) return;
    const c = 70, r1 = 34, r2 = 66;
    for (let h = 0; h < 24; h++) {
      const a0 = (h / 24) * Math.PI * 2 - Math.PI / 2, a1 = ((h + 1) / 24) * Math.PI * 2 - Math.PI / 2 - 0.03;
      const p = (r, a) => `${c + r * Math.cos(a)} ${c + r * Math.sin(a)}`;
      const fill = h >= 4 && h < 7 ? "#9dff00" : h === 3 ? "rgba(157,255,0,.55)" : h >= 1 && h < 3 ? "rgba(157,255,0,.18)" : "rgba(255,255,255,.06)";
      svgEl("path", { d: `M${p(r1, a0)} L${p(r2, a0)} A${r2} ${r2} 0 0 1 ${p(r2, a1)} L${p(r1, a1)} A${r1} ${r1} 0 0 0 ${p(r1, a0)}Z`, fill }, s);
    }
    [0, 6, 12, 18].forEach((h) => {
      const a = (h / 24) * Math.PI * 2 - Math.PI / 2;
      const t = svgEl("text", { x: c + 26 * Math.cos(a), y: c + 26 * Math.sin(a) + 3, "text-anchor": "middle", fill: "#8a9d93", "font-size": 8, "font-family": "JetBrains Mono, monospace" }, s);
      t.textContent = String(h).padStart(2, "0");
    });
    const g = svgEl("g", { class: "vamp-moon" }, s);
    svgEl("use", { href: "#i-moon", x: 56, y: 56, width: 28, height: 28 }, g);
  })();

  /* lluvia de ? */
  (() => {
    const q = $("#qrain"); if (!q || reduce) return;
    let h = "";
    for (let i = 0; i < 22; i++) h += `<span style="left:${Math.random() * 96}%;font-size:${14 + Math.random() * 22}px;animation-duration:${2 + Math.random() * 3}s;animation-delay:${-Math.random() * 4}s">?</span>`;
    q.innerHTML = h;
  })();

  /* ---------------- DICCIONARIO ---------------- */
  (() => {
    const chart = $("#vocabChart"), det = $("#vocabDetail"); if (!chart) return;
    const entries = $$("#dict .dict-entry").map((el) => ({ el, word: el.dataset.word, r: el.dataset.ratio === "inf" ? Infinity : parseFloat(el.dataset.ratio) }));
    const sorted = [...entries].sort((a, b) => b.r - a.r);
    const maxLog = Math.log10(200);
    chart.innerHTML = sorted.map((e, i) => {
      const w = e.r === Infinity ? 100 : Math.max(6, (Math.log10(e.r) / maxLog) * 100);
      return `<button class="vrow${e.r === Infinity ? " inf" : ""}" data-i="${entries.indexOf(e)}"><span class="w">${esc(e.word)}</span><span class="tr"><span class="fl" data-target="${w}"></span><span class="vl">${e.r === Infinity ? "∞" : fmt(e.r, 1) + "x"}</span></span></button>`;
    }).join("");
    const show = (i) => {
      const e = entries[i];
      $$(".vrow", chart).forEach((r) => r.classList.toggle("on", +r.dataset.i === i));
      const row = $$(".row span", e.el).map((s) => s.innerHTML);
      det.innerHTML = `<div class="word">${esc(e.word)}</div><p class="fn" style="margin:6px 0 0;color:var(--ink2)">${$(".fn", e.el).innerHTML}</p><dl>${row.map((h) => { const [k, ...v] = h.split(":"); return `<div><dt>${k}</dt><dd>${v.join(":")}</dd></div>`; }).join("")}</dl>`;
    };
    chart.addEventListener("click", (ev) => { const b = ev.target.closest(".vrow"); if (b) show(+b.dataset.i); });
    show(entries.indexOf(sorted[0]));
    onVisible(chart, () => $$(".fl", chart).forEach((f, i) => setTimeout(() => (f.style.width = f.dataset.target + "%"), i * 60)), { threshold: 0.2 });
  })();

  /* flip */
  (() => {
    const f = $("#flipCard"); if (!f) return;
    const t = () => f.classList.toggle("flipped");
    f.addEventListener("click", t);
    f.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); t(); } });
  })();

  /* ---------------- CICLO PERCHITA ---------------- */
  (() => {
    const svg = $("#cycleSvg"), list = $("#cycleList"); if (!svg) return;
    const items = $$("li", list);
    const labels = { A: "1", B: "2", C: "3", D: "4", E: "5", F: "✗", G: "6", H: "7", I: "8" };
    const keys = Object.keys(labels), n = keys.length, C = 260, R = 205;
    const ang = (i) => (i / n) * Math.PI * 2 - Math.PI / 2;
    svgEl("circle", { class: "ring", cx: C, cy: C, r: R }, svg);
    // flechas entre nodos
    keys.forEach((k, i) => {
      const a = ang(i + 0.5);
      const px = C + R * Math.cos(a), py = C + R * Math.sin(a), deg = (a * 180) / Math.PI + 90;
      svgEl("path", { d: "M-6 -5 L4 0 L-6 5", fill: "none", stroke: k === "E" ? "#ffc93d" : "rgba(157,255,0,.7)", "stroke-width": 2.5, transform: `translate(${px} ${py}) rotate(${deg - 90})` }, svg);
      if (k === "E") { const t = svgEl("text", { x: C + (R + 30) * Math.cos(a), y: C + (R + 30) * Math.sin(a), fill: "#ffc93d", "font-size": 15, "font-weight": 700, "text-anchor": "middle", "dominant-baseline": "central", "font-family": "Space Grotesk, sans-serif" }, svg); t.textContent = "Sí"; }
    });
    const runner = svgEl("circle", { class: "runner", r: 7, cx: C, cy: C - R }, svg);
    const nodes = keys.map((k, i) => {
      const g = svgEl("g", { class: "node" + (k === "E" ? " dec" : "") + (k === "F" ? " alt" : ""), "data-k": k }, svg);
      svgEl("circle", { cx: C + R * Math.cos(ang(i)), cy: C + R * Math.sin(ang(i)), r: 30 }, g);
      const t = svgEl("text", { x: C + R * Math.cos(ang(i)), y: C + R * Math.sin(ang(i)) }, g); t.textContent = labels[k] + (k === "E" ? "?" : "");
      return g;
    });
    const ccN = $("#ccN"), ccT = $("#ccT"), ccB = $("#ccB");
    let cur = 0, runAng = ang(0), auto = null, pausedUntil = 0, inView = false;
    const set = (i) => {
      cur = (i + n) % n;
      nodes.forEach((g, j) => g.classList.toggle("on", j === cur));
      items.forEach((li, j) => li.classList.toggle("on", j === cur));
      ccN.textContent = labels[keys[cur]] + (keys[cur] === "E" ? "?" : "");
      ccT.textContent = items[cur].querySelector("span").textContent.replace(/^\d\.\s*/, "");
      ccB.textContent = keys[cur] === "E" ? "Sí → niega la realidad" : keys[cur] === "I" ? "↻ vuelve al paso 1" : "";
      let target = ang(cur); while (target < runAng) target += Math.PI * 2;
      const from = runAng, t0 = performance.now(), dur = reduce ? 1 : 700;
      const step = (t) => {
        const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        runAng = from + (target - from) * e;
        runner.setAttribute("cx", C + R * Math.cos(runAng)); runner.setAttribute("cy", C + R * Math.sin(runAng));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const user = (i) => { pausedUntil = Date.now() + 9000; set(i); };
    nodes.forEach((g, i) => g.addEventListener("click", () => user(i)));
    items.forEach((li, i) => li.addEventListener("click", () => user(i)));
    set(0);
    onVisible($("#cycle"), () => { inView = true; }, { repeat: true, threshold: 0.3, out: () => { inView = false; } });
    if (!reduce) auto = setInterval(() => { if (inView && Date.now() > pausedUntil) set(cur + 1); }, 2600);
  })();

  /* ---------------- DATOS DEL CATÁLOGO ---------------- */
  const GROUPS = window.INCIDENTS || [];
  const ALL = GROUPS.flatMap((g) => g.items);
  const RIVAL = { PABLO: "Pablo", ALE: "Ale", JULIAN: "Julián", EDU: "Edu", ANTONIO: "Antonio", FERNANDO: "Fernando", RUBEN: "Rubén" };
  const VTXT = { S: "🟢 Sí", P: "🟡 Parcialmente", N: "🔴 No" };

  /* gauge */
  (() => {
    const C = 2 * Math.PI * 96;
    const segs = [["#gS", 9.7, 0], ["#gP", 47.9, 9.7], ["#gN", 42.4, 57.6]];
    onVisible($("#gauge"), () => segs.forEach(([id, p, off]) => {
      const el = $(id); el.style.strokeDashoffset = -(off / 100) * C;
      el.style.strokeDasharray = `${(p / 100) * C - 2} ${C}`;
    }), { threshold: 0.4 });
  })();

  /* veredictos por año */
  (() => {
    const box = $("#yearBars"); if (!box) return;
    const yrs = {};
    ALL.forEach((i) => { const y = i.date.slice(0, 4); yrs[y] = yrs[y] || { S: 0, P: 0, N: 0, t: 0 }; yrs[y][i.v]++; yrs[y].t++; });
    box.innerHTML = Object.keys(yrs).sort().map((y) => {
      const o = yrs[y];
      return `<div class="year-row"><span class="y">${y}</span><div><div class="stack">${["S", "P", "N"].map((v) => `<i class="${v.toLowerCase()}" data-target="${(o[v] / o.t) * 100}">${o[v]}</i>`).join("")}</div><div style="font:600 11.5px var(--f-mono);color:var(--muted);margin-top:4px">${o.t} incidentes · ${fmt((o.S / o.t) * 100, 1)}% con razón</div></div></div>`;
    }).join("");
    onVisible(box, () => $$(".stack i", box).forEach((el, k) => setTimeout(() => (el.style.width = el.dataset.target + "%"), k * 50)), { threshold: 0.3 });
  })();

  /* categorías */
  (() => {
    const box = $("#catBars"); if (!box) return;
    const cats = {};
    ALL.forEach((i) => { cats[i.cat] = cats[i.cat] || { S: 0, P: 0, N: 0, t: 0 }; cats[i.cat][i.v]++; cats[i.cat].t++; });
    const list = Object.entries(cats).sort((a, b) => b[1].t - a[1].t), max = list[0][1].t;
    box.innerHTML = list.map(([c, o]) => `<div class="cat-row"><div class="t"><span>${esc(c)}</span><b>${o.t}</b></div><div class="stack" style="height:16px;width:${(o.t / max) * 100}%">${["S", "P", "N"].map((v) => `<i class="${v.toLowerCase()}" data-target="${(o[v] / o.t) * 100}" title="${VTXT[v]}: ${o[v]}"></i>`).join("")}</div></div>`).join("");
    onVisible(box, () => $$(".stack i", box).forEach((el, k) => setTimeout(() => (el.style.width = el.dataset.target + "%"), k * 30)), { threshold: 0.3 });
  })();

  /* red de rivalidades */
  (() => {
    const svg = $("#rivalNet"); if (!svg) return;
    const cards = $$("#rivals .rival");
    const C = { x: 280, y: 230 }, R = 172;
    const edges = svgEl("g", {}, svg), nodesG = svgEl("g", {}, svg);
    cards.forEach((card, i) => {
      const a = (i / cards.length) * Math.PI * 2 - Math.PI / 2;
      const x = C.x + R * Math.cos(a) * 1.18, y = C.y + R * Math.sin(a);
      const inv = +card.dataset.inv, main = +card.dataset.main;
      svgEl("line", { class: "edge", x1: C.x, y1: C.y, x2: x, y2: y, "stroke-width": 2 + (inv / 114) * 16, style: `transition-delay:${i * 0.12}s;stroke:${card.dataset.color}` }, edges);
      const g = svgEl("g", { class: "rn", tabindex: 0 }, nodesG);
      svgEl("circle", { cx: x, cy: y, r: 34 + (main / 66) * 14 }, g);
      const t = svgEl("text", { x, y: y - 3 }, g); t.textContent = card.dataset.key;
      const p = svgEl("text", { x, y: y + 17, class: "pct" }, g); p.textContent = fmt(+card.dataset.pct, 1) + "%";
      const go = () => {
        cards.forEach((c) => c.classList.remove("on")); $$(".rn", svg).forEach((n) => n.classList.remove("on"));
        card.classList.add("on"); g.classList.add("on");
        card.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
      };
      g.addEventListener("click", go); g.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
    });
    const cg = svgEl("g", { class: "center" }, nodesG);
    svgEl("circle", { cx: C.x, cy: C.y, r: 44 }, cg);
    const ct = svgEl("text", { x: C.x, y: C.y + 2, "text-anchor": "middle", "dominant-baseline": "central" }, cg); ct.textContent = "GM";
    onVisible(svg, () => svg.classList.add("in"), { threshold: 0.3 });
  })();

  /* línea de episodios */
  const eps = $("#episodes"), epFill = $("#epLine");
  function epLine() {
    if (!eps) return;
    const r = eps.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (innerHeight * 0.65 - r.top) / r.height));
    epFill.style.height = p * 100 + "%";
  }

  /* ---------------- CATÁLOGO ---------------- */
  (() => {
    const root = $("#incidents"); if (!root) return;
    const q = $("#q"), yearF = $("#yearFilters"), rivalSel = $("#rivalSel"), catSel = $("#catSel"), shown = $("#shown");
    const state = { year: "", v: new Set(), rival: "", cat: "", q: "" };
    const years = ["2022", "2023", "2024", "2025"];
    yearF.innerHTML = `<button class="chip" data-y="" aria-pressed="true">Todos</button>` + years.map((y) => `<button class="chip" data-y="${y}" aria-pressed="false">${y}</button>`).join("") +
      `<span class="sep"></span><button class="chip c-s" data-v="S" aria-pressed="false">🟢 Sí · 14</button><button class="chip c-p" data-v="P" aria-pressed="false">🟡 Parcial · 69</button><button class="chip c-n" data-v="N" aria-pressed="false">🔴 No · 61</button>`;
    Object.entries(RIVAL).forEach(([k, v]) => rivalSel.insertAdjacentHTML("beforeend", `<option value="${k}">Con ${v} (${ALL.filter((i) => i.all.includes(k)).length})</option>`));
    [...new Set(ALL.map((i) => i.cat))].forEach((c) => catSel.insertAdjacentHTML("beforeend", `<option value="${esc(c)}">${esc(c)}</option>`));

    const norm = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const accentRe = (s) => {
      const map = { a: "[aáàä]", e: "[eéèë]", i: "[iíìï]", o: "[oóòö]", u: "[uúùü]", n: "[nñ]" };
      return new RegExp("(" + norm(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/[aeioun]/g, (c) => map[c]) + ")", "gi");
    };
    const hl = (txt, re) => { const e = esc(txt); return re ? e.replace(re, "<mark>$1</mark>") : e; };
    const bold = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

    const render = () => {
      const qq = norm(state.q.trim());
      const re = qq.length > 1 ? accentRe(state.q.trim()) : null;
      let count = 0, html = "";
      GROUPS.forEach((g) => {
        const items = g.items.filter((i) =>
          (!state.year || i.date.startsWith(state.year)) &&
          (!state.v.size || state.v.has(i.v)) &&
          (!state.rival || i.all.includes(state.rival)) &&
          (!state.cat || i.cat === state.cat) &&
          (!qq || norm([i.id, i.date, i.name, i.cat, i.riv, i.desc].join(" ")).includes(qq)));
        if (!items.length) return;
        count += items.length;
        html += `<div class="inc-group"><h4>${esc(g.title)}</h4><div class="inc-list">` + items.map((i) => `
          <article class="inc v-${i.v}" id="${i.id}">
            <div class="inc-top"><span class="id">${hl(i.id, re)}</span><span>${hl(i.date, re)}</span><span class="verdict">${VTXT[i.v]}</span></div>
            <h5>${hl(i.name, re)}</h5>
            <div class="meta"><span class="pill">${hl(i.cat, re)}</span><span class="pill riv">${bold(i.riv)}</span></div>
            <p>${hl(i.desc, re)}</p>
          </article>`).join("") + `</div></div>`;
      });
      root.innerHTML = html || `<div class="empty"><svg viewBox="0 0 120 80"><use href="#i-chopped"/></svg>Ningún incidente con esos filtros.<br><em>"Mentira."</em></div>`;
      shown.textContent = count;
    };
    let qt;
    q.addEventListener("input", () => { clearTimeout(qt); qt = setTimeout(() => { state.q = q.value; render(); }, 120); });
    yearF.addEventListener("click", (e) => {
      const c = e.target.closest(".chip"); if (!c) return;
      if (c.dataset.y !== undefined) { state.year = c.dataset.y; $$("[data-y]", yearF).forEach((b) => b.setAttribute("aria-pressed", b === c)); }
      if (c.dataset.v) { state.v.has(c.dataset.v) ? state.v.delete(c.dataset.v) : state.v.add(c.dataset.v); c.setAttribute("aria-pressed", state.v.has(c.dataset.v)); }
      render();
    });
    rivalSel.addEventListener("change", () => { state.rival = rivalSel.value; render(); });
    catSel.addEventListener("change", () => { state.cat = catSel.value; render(); });
    render();

    const reset = () => {
      state.year = ""; state.v.clear(); state.rival = ""; state.cat = ""; state.q = "";
      q.value = ""; rivalSel.value = ""; catSel.value = "";
      $$(".chip", yearF).forEach((b) => b.setAttribute("aria-pressed", b.dataset.y === ""));
      render();
    };
    const goto = (id) => {
      if (!$("#" + id, root)) reset();
      const el = $("#" + id, root); if (!el) return;
      el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
      el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash");
      setTimeout(() => el.classList.remove("flash"), 2600);
    };
    $("#randomInc").addEventListener("click", () => {
      const list = $$(".inc", root); if (!list.length) return;
      goto(list[Math.floor(Math.random() * list.length)].id);
    });
    // enlazar referencias INC-xxx en todo el texto
    $$("main code").forEach((c) => {
      if (/^INC-\d{3}$/.test(c.textContent) && !c.closest(".trophy") && !c.closest("#incidents")) {
        const a = document.createElement("a"); a.href = "#" + c.textContent; a.dataset.inc = c.textContent; a.className = "inc-link";
        c.replaceWith(a); a.appendChild(c);
      }
    });
    document.addEventListener("click", (e) => {
      const a = e.target.closest("[data-inc]"); if (!a) return;
      e.preventDefault(); goto(a.dataset.inc);
      history.replaceState(null, "", "#" + a.dataset.inc);
    });
    if (/^#INC-\d{3}$/.test(location.hash)) setTimeout(() => goto(location.hash.slice(1)), 1700);
  })();

  /* ---------------- MONUMENTO ---------------- */
  (() => {
    const grid = $("#mcGrid"); if (!grid) return;
    const map = [
      "......................",
      "..NNN.....N...N...YY..",
      ".N...N....NN.NN.....Y.",
      ".N........N.N.N....Y..",
      ".N..NN....N.N.N...Y...",
      ".N...N....N...N...YYY.",
      ".N...N....N...N.......",
      "..NNN.....N...N.......",
      "......................",
      "...SSSSSSSSSSSSSSSS...",
      "...SssSSssSSssSSssS...",
      "...SSSSSSSSSSSSSSSS...",
      "..SSSSSSSSSSSSSSSSSS..",
      "..SsSSsSSsSSsSSsSSsS..",
      "GGGGGGGGGGGGGGGGGGGGGG",
      "gGgGGgGGGgGGgGGGgGGgGg",
      "DDdDDDdDDDDdDDDdDDDDdD",
      "DdDDDDDDdDDDDDdDDDDDDD",
    ];
    const col = { N: "#9dff00", Y: "#ffe81f", S: "#8a8f93", s: "#6b7075", G: "#62bb3c", g: "#4f9a2f", D: "#8a5a2c", d: "#6a4320" };
    const rows = map.length, cols = map[0].length;
    grid.style.setProperty("--cols", cols);
    let h = "";
    map.forEach((row, r) => [...row].forEach((ch, c) => {
      const color = col[ch];
      const d = ((rows - r) * 70 + c * 9) + "ms";
      h += color ? `<i style="background:${color};--d:${d}${ch === "N" ? ";box-shadow:0 0 8px rgba(157,255,0,.6)" : ""}"></i>` : `<i style="--d:${d}"></i>`;
    }));
    grid.innerHTML = h;
    onVisible(grid, () => grid.classList.add("in"), { threshold: 0.3 });
  })();

  onScroll();
})();
