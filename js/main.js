/* GM² · El Puto Circo — app */
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
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const svgEl = (tag, attrs = {}, parent) => {
    const el = document.createElementNS(NS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(el);
    return el;
  };
  const onVisible = (el, fn, opts = {}) => {
    if (!el) return;
    if (!("IntersectionObserver" in window)) { fn(el); return; }
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { fn(e.target); if (!opts.repeat) io.unobserve(e.target); }
      else if (opts.out) opts.out(e.target);
    }), { threshold: opts.threshold ?? 0.15, rootMargin: opts.margin ?? "0px 0px -5% 0px" });
    io.observe(el);
  };
  const IMG = (n) => (window.GM_IMG && window.GM_IMG[n]) || `assets/img/${n}.webp`;
  const MES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const MESL = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const fdate = (iso) => { const [y, m, d] = iso.split("-"); return `${+d} ${MES[m - 1]} ${y}`; };
  const norm = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  /* ---------------- DATOS ---------------- */
  const GROUPS = window.INCIDENTS || [];
  const ALL = GROUPS.flatMap((g) => g.items.map((i) => ({ ...i, group: g.title })));
  const BYID = Object.fromEntries(ALL.map((i, k) => [i.id, { ...i, k }]));
  const EPISODES = window.EPISODES || [];
  const EVENTS = window.EVENTS || [];
  const CHATS = window.CHATS || { incidents: {}, episodes: {}, pearls: [], rivals: {}, nicknames: {}, dict: {}, patterns: [] };
  const RIVAL = { PABLO: "Pablo", ALE: "Ale", JULIAN: "Julián", EDU: "Edu", ANTONIO: "Antonio", FERNANDO: "Fernando", RUBEN: "Rubén" };
  const VTXT = { S: "🟢 Sí", P: "🟡 Parcialmente", N: "🔴 No" };
  const WHO_META = {
    Dani:     { name: "Daniel Bruno (El Prensas)", c: "var(--c-dani)" },
    Pablo:    { name: "Pablo Valderas",            c: "var(--c-pablo)" },
    Ale:      { name: "Alejandro Manzano",         c: "var(--c-ale)" },
    Julian:   { name: "Julián (Gigasimp)",         c: "var(--c-julian)" },
    Edu:      { name: "Eduardo Merino",            c: "var(--c-edu)" },
    Antonio:  { name: "Antonio García",            c: "var(--c-antonio)" },
    Fernando: { name: "Fernando",                  c: "var(--c-fernando)" },
    Ruben:    { name: "Rubén Moya",                c: "var(--c-ruben)" },
  };
  const renderChat = (spec, opts = {}) => {
    if (!spec || (!spec.msgs?.length && !spec.more?.length)) return "";
    const outTarget = spec.out ?? opts.out ?? "Dani";
    const head = opts.head ?? spec.head ?? "El Puto Circo";
    const sub = opts.sub ?? spec.sub ?? "";
    const icon = opts.icon ?? spec.icon ?? "monster";
    const renderMsgs = (list, state = { d: "", w: "", out: null }) => (list || []).map((m) => {
      let chunk = "";
      if (m.d && m.d !== state.d) {
        state.d = m.d; state.w = "";
        chunk += `<div class="chat-date">${esc(m.d)}</div>`;
      }
      if (m.w === "SYS") {
        state.w = "";
        return chunk + `<div class="sys">${esc(m.m)}${m.t ? ` · <code>${esc(m.t)}</code>` : ""}</div>`;
      }
      const meta = WHO_META[m.w] || { name: m.w || "Grupo", c: "var(--acc-ink)" };
      const isOut = !!(m.out || (Array.isArray(outTarget) ? outTarget.includes(m.id) : outTarget === m.w));
      const isFirst = m.w !== state.w || isOut !== state.out;
      state.w = m.w; state.out = isOut;
      let inner = "";
      if (isFirst) inner += `<span class="who">${esc(meta.name)}</span>`;
      if (m.q) {
        const qm = WHO_META[m.q.w] || { name: m.q.w || "Grupo", c: "var(--acc-ink)" };
        inner += `<div class="wa-reply" style="--rc:${qm.c}"><b>${esc(qm.name)}</b><span>${esc(m.q.m)}</span></div>`;
      }
      if (m.poll) {
        const maxV = Math.max(1, ...m.poll.opts.map((o) => o[1]));
        inner += `<div class="wa-poll"><div class="wa-poll-tag">📊 Encuesta</div><div class="wa-poll-q">${esc(m.poll.q)}</div><div class="wa-poll-opts">` +
          m.poll.opts.map(([txt, v]) => `<div class="wa-poll-opt${v === maxV && v > 0 ? " win" : ""}"><span class="wa-poll-bar" style="width:${(v / maxV) * 100}%"></span><span>${esc(txt)}</span><b>${v} voto${v === 1 ? "" : "s"}</b></div>`).join("") +
          `</div></div>`;
      } else {
        if (m.med) inner += `<div class="wa-media">${esc(m.med)}</div>`;
        if (m.del) inner += `🚫 Se eliminó este mensaje`;
        else if (m.m) inner += (m.med ? `<div style="margin-top:4px">${esc(m.m).replace(/\n/g, "<br>")}</div>` : esc(m.m).replace(/\n/g, "<br>"));
      }
      inner += `<span class="meta${isOut ? " ticks" : ""}">${m.ed ? `<span class="edited">editado</span>` : ""}${esc(m.t || "")}</span>`;
      return chunk + `<div class="bubble${isOut ? " out" : ""}${isFirst ? " first" : ""}${m.del ? " deleted" : ""}" style="--who:${meta.c}">${inner}</div>`;
    }).join("");
    const st = { d: "", w: "", out: null };
    const mainHtml = renderMsgs(spec.msgs || [], st);
    const fullHtml = spec.full && spec.full.length
      ? `<details class="more inline chat-more"><summary><span>Ver escena completa en orden (${spec.full.length} mensajes)</span><span class="pm" aria-hidden="true"></span></summary><div class="more-body"><div class="chat">${renderMsgs(spec.full, { d: "", w: "", out: null })}</div></div></details>`
      : "";
    const moreHtml = !fullHtml && spec.more && spec.more.length
      ? `<details class="more inline chat-more"><summary><span>Ver escena completa (+${spec.more.length} mensajes)</span><span class="pm" aria-hidden="true"></span></summary><div class="more-body"><div class="chat">${renderMsgs(spec.more, st)}</div></div></details>`
      : "";
    return `<div class="chat-wrap"><div class="chat">${head ? `<div class="chat-head"><div class="av"><img src="${IMG(icon)}" alt=""></div><div><b>${esc(head)}</b>${sub ? `<small>${esc(sub)}</small>` : ""}</div></div>` : ""}${mainHtml}</div>${fullHtml || moreHtml}</div>`;
  };
  const EP_OF = {};
  EPISODES.forEach((e, n) => e.incs.forEach((id) => (EP_OF[id] = n)));
  const groupShort = (t) => t.replace(/\s*\(INC-\d+ a INC-\d+\).*$/, "");
  const LOGOS = [
    [/smite/i, "smite", true], [/helldivers/i, "helldivers", true], [/minecraft|mochila|server/i, "mochila", false], [/radler/i, "radler", false],
  ];
  const ART = [[/chopped/i, "i-chopped"], [/rocódromo|cuesta/i, "i-hold"], [/bonsái/i, "i-bonsai"], [/reno/i, "i-reno"], [/bermudas/i, "i-berm"], [/pizza|telepizza|papa john/i, "i-pizza"], [/kebab|durum/i, "i-durum"], [/traje|graduación/i, "i-suit"], [/100m|montaditos/i, "i-monta"]];

  /* ---------------- LOADER ---------------- */
  const loader = $("#loader");
  let seen = false;
  try { seen = sessionStorage.getItem("gm-seen") === "1"; sessionStorage.setItem("gm-seen", "1"); } catch (e) {}
  const hideLoader = () => loader.classList.add("done");
  setTimeout(hideLoader, reduce || seen ? 150 : 1200);
  loader.addEventListener("click", hideLoader);

  /* ---------------- TEMA ---------------- */
  $("#themeBtn").addEventListener("click", () => {
    const root = document.documentElement;
    const cur = root.getAttribute("data-theme") || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    const next = cur === "light" ? "dark" : "light";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("gm-theme", next); } catch (e) {}
  });

  /* tablas: envolver celdas para la vista móvil */
  $$("table.rt td").forEach((td) => { const sp = document.createElement("span"); sp.className = "cv"; while (td.firstChild) sp.appendChild(td.firstChild); td.appendChild(sp); });
  const more = $("#membersMore");
  const syncMore = () => { if (more && innerWidth >= 980) more.open = true; };
  syncMore(); window.addEventListener("resize", syncMore);

  /* ---------------- ANIMACIONES GENÉRICAS ---------------- */
  const revealAll = (root = document) => {
    $$("[data-r]:not(.in)", root).forEach((el) => onVisible(el, (t) => t.classList.add("in"), { threshold: 0.05 }));
    $$("[data-count]:not([data-done])", root).forEach((el) => { el.dataset.done = 1; onVisible(el, animateCount, { threshold: 0.4 }); });
    $$(".fl[data-w]:not([data-done]), .split i[data-w]:not([data-done])", root).forEach((el) => { el.dataset.done = 1; onVisible(el, (t) => (t.style.width = t.dataset.w + "%"), { threshold: 0.2 }); });
    $$("[data-type]:not([data-done])", root).forEach((el) => { el.dataset.done = 1; onVisible(el, (t) => setTimeout(() => t.classList.add("typed"), reduce ? 0 : 900), { threshold: 0.6 }); });
  };
  function animateCount(el) {
    const to = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0), suf = el.dataset.suffix || "";
    if (reduce) { el.textContent = fmt(to, dec) + suf; return; }
    const t0 = performance.now();
    const step = (t) => { const p = Math.min(1, (t - t0) / 1400), e = 1 - Math.pow(1 - p, 3); el.textContent = fmt(to * e, dec) + suf; if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }

  /* ---------------- TOASTS / LATAS ---------------- */
  const toasts = $("#toasts");
  const toast = (html, ms = 2600) => {
    const t = document.createElement("div"); t.className = "toast"; t.innerHTML = html; toasts.appendChild(t);
    setTimeout(() => { t.classList.add("out"); setTimeout(() => t.remove(), 320); }, ms);
    while (toasts.children.length > 3) toasts.firstChild.remove();
  };
  const burst = (x, y, color = "#9dff00") => {
    if (reduce) return;
    for (let i = 0; i < 16; i++) {
      const d = document.createElement("i"); d.className = "drop";
      Object.assign(d.style, { left: x + "px", top: y + "px", background: color, boxShadow: `0 0 8px ${color}` });
      document.body.appendChild(d);
      const a = Math.random() * Math.PI * 2, r = 40 + Math.random() * 90;
      d.animate([{ transform: "translate(-50%,-50%) scale(1)", opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(a) * r}px), calc(-50% + ${Math.sin(a) * r - 40}px)) scale(.3)`, opacity: 0 }],
        { duration: 700 + Math.random() * 400, easing: "cubic-bezier(.2,.8,.3,1)" }).onfinish = () => d.remove();
    }
  };
  let cans = 0;
  const openCan = (e, el) => {
    cans++; el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop");
    burst(e.clientX, e.clientY);
    toast(`🥤 <b>Tssssk…</b> Monster abierta · llevas <b>${cans}</b>`);
  };
  $$(".can-btn").forEach((b) => b.addEventListener("click", (e) => openCan(e, b)));

  /* ---------------- ROUTER ---------------- */
  const VIEWS = ["inicio", "timeline", "incidentes", "perlas", "stats", "rivales", "gm"];
  let current = null;
  const inited = {};
  const showView = (name, { scroll = true } = {}) => {
    if (!VIEWS.includes(name)) name = "inicio";
    if (name !== current) {
      $$(".view").forEach((v) => (v.hidden = v.dataset.view !== name));
      current = name;
      if (!inited[name] && INIT[name]) { INIT[name](); inited[name] = true; }
      revealAll($("#v-" + name));
      if (scroll) window.scrollTo(0, 0);
    }
    $$("[data-nav]").forEach((a) => a.classList.toggle("on", a.dataset.nav === name && !a.classList.contains("brand")));
  };
  const route = () => {
    const h = decodeURIComponent(location.hash.slice(1));
    if (/^INC-\d{3}$/.test(h)) { if (!current) showView("inicio"); openIncident(h, false); return; }
    if (/^EP-\d$/.test(h)) { if (!current) showView("inicio"); openEpisode(+h.slice(3) - 1, false); return; }
    if (/^PRL-\d+$/.test(h)) {
      closeSheet(false);
      showView("perlas", { scroll: false });
      setTimeout(() => { const el = document.getElementById(h); if (el) el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" }); }, 60);
      return;
    }
    closeSheet(false);
    showView(h || "inicio");
  };
  window.addEventListener("hashchange", route);
  const go = (view, after) => {
    if (location.hash !== "#" + view) location.hash = view; else showView(view);
    if (after) setTimeout(after, 60);
  };
  // saltos internos (data-goto)
  document.addEventListener("click", (e) => {
    const g = e.target.closest("[data-goto]");
    if (g) {
      const target = { razon: "#s-razon", records: "#s-records", ban: ".ev.ban" }[g.dataset.goto];
      setTimeout(() => { const t = $(target); if (t) t.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); }, 120);
    }
    const j = e.target.closest("[data-jump]");
    if (j) { e.preventDefault(); const t = $(j.getAttribute("href")); if (t) t.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); }
  });
  $("#searchBtn").addEventListener("click", () => go("incidentes", () => { const q = $("#q"); q.focus(); q.select(); }));

  /* ---------------- FICHA (SHEET) ---------------- */
  const sheet = $("#sheet"), sheetBody = $("#sheetBody");
  let sheetFromHash = false;
  const openSheetUI = () => {
    sheet.classList.add("open"); sheet.setAttribute("aria-hidden", "false"); document.body.style.overflow = "hidden";
    $(".sheet-panel", sheet).scrollTop = 0; setTimeout(() => $(".sheet-x", sheet).focus({ preventScroll: true }), 50);
  };
  function closeSheet(fromUser) {
    if (!sheet.classList.contains("open")) return;
    sheet.classList.remove("open"); sheet.setAttribute("aria-hidden", "true"); document.body.style.overflow = "";
    if (fromUser && /^#(INC-|EP-)/.test(location.hash)) {
      if (sheetFromHash) history.back(); else history.replaceState(null, "", "#" + (current || "inicio"));
    }
    sheetFromHash = false;
  }
  $$("[data-close]", sheet).forEach((el) => el.addEventListener("click", () => closeSheet(true)));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSheet(true);
    if (sheet.classList.contains("open") && sheetBody.dataset.id && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
      const k = BYID[sheetBody.dataset.id].k + (e.key === "ArrowRight" ? 1 : -1);
      if (ALL[k]) showIncident(ALL[k].id);
    }
  });
  // deslizar hacia abajo para cerrar (móvil)
  (() => {
    const panel = $(".sheet-panel", sheet); let y0 = null, dy = 0;
    panel.addEventListener("touchstart", (e) => { if (panel.scrollTop <= 0) { y0 = e.touches[0].clientY; dy = 0; } }, { passive: true });
    panel.addEventListener("touchmove", (e) => { if (y0 === null) return; dy = e.touches[0].clientY - y0; if (dy > 0) panel.style.transform = `translateY(${dy}px)`; }, { passive: true });
    panel.addEventListener("touchend", () => { if (y0 === null) return; panel.style.transform = ""; if (dy > 110) closeSheet(true); y0 = null; });
  })();
  const pushSheetHash = (h) => {
    if (location.hash === h) return;
    if (/^#(INC-|EP-)/.test(location.hash)) history.replaceState(null, "", h);
    else { history.pushState(null, "", h); sheetFromHash = true; }
  };
  const bold = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  function showIncident(id) {
    const i = BYID[id]; if (!i) return;
    sheetBody.dataset.id = id;
    const txt = [i.name, i.desc, i.cat].join(" ");
    const logo = LOGOS.find(([re]) => re.test(txt));
    const art = !logo && ART.find(([re]) => re.test(txt));
    const epN = EP_OF[id];
    const ep = epN !== undefined ? EPISODES[epN] : null;
    const prev = ALL[i.k - 1], next = ALL[i.k + 1];
    const rivals = i.all.map((r) => RIVAL[r]).filter(Boolean);
    const chat = CHATS.incidents?.[id];
    const chatHtml = chat ? `<p class="sh-label">Fragmento real de WhatsApp</p><div class="sh-chat">${renderChat(chat, { head: chat.head || "El Puto Circo", sub: `${fdate(i.date)} · ${i.id}`, icon: logo ? logo[1] : "monster" })}</div>` : "";
    sheetBody.innerHTML = `
      <article class="sh v-${i.v}">
        <div class="sh-top"><span class="sh-id">${i.id}</span><span class="sh-date">${fdate(i.date)} · <code>${i.date}</code></span><span class="sh-verdict">¿Tenía razón? ${VTXT[i.v]}</span></div>
        <h3 id="sheetTitle">${esc(i.name)}</h3>
        ${logo ? `<img class="sh-logo${logo[2] ? " wide" : ""}" src="${IMG(logo[1])}" alt="">` : art ? `<svg class="sh-logo" viewBox="0 0 100 100"><use href="#${art[1]}"/></svg>` : ""}
        <dl class="sh-meta">
          <div><dt>Categoría</dt><dd>${esc(i.cat)}</dd></div>
          <div><dt>Rival(es)</dt><dd>${bold(i.riv)}</dd></div>
          <div><dt>Bloque</dt><dd>${esc(groupShort(i.group))}</dd></div>
        </dl>
        <p class="sh-label">Qué Pasó (Resumen Forense)</p>
        <p class="sh-desc">${esc(i.desc)}</p>
        ${chatHtml}
        ${ep ? `<p class="sh-label">Forma parte de un gran episodio</p><div class="sh-ep"><b>★ Episodio ${epN + 1}: ${ep.title}</b>${ep.date}<div class="sh-links"><button class="btn-ghost sm" data-ep="${epN}">Leer el episodio →</button></div></div>` : ""}
        <div class="sh-links">
          <button class="btn-ghost sm" data-tl="${i.id}">Ver en el timeline</button>
          ${rivals.slice(0, 1).map((r) => `<button class="btn-ghost sm" data-rival="${i.main}">Más broncas con ${r}</button>`).join("")}
        </div>
        <div class="sh-nav">
          <button class="btn" ${prev ? `data-inc="${prev.id}"` : "disabled"}><svg viewBox="0 0 24 24"><use href="#i-left"/></svg>${prev ? prev.id : "—"}</button>
          <button class="btn" ${next ? `data-inc="${next.id}"` : "disabled"} style="justify-content:flex-end">${next ? next.id : "—"}<svg viewBox="0 0 24 24"><use href="#i-right"/></svg></button>
        </div>
      </article>`;
    $(".sheet-panel", sheet).scrollTop = 0;
    pushSheetHash("#" + id);
  }
  function openIncident(id, push = true) {
    if (!BYID[id]) return;
    if (!push) sheetFromHash = false;
    showIncident(id); openSheetUI();
  }
  function openEpisode(n, push = true) {
    const e = EPISODES[n]; if (!e) return;
    delete sheetBody.dataset.id;
    const img = e.img ? `<img class="sh-logo" src="${IMG(e.img)}" alt="">` : `<svg class="sh-logo" viewBox="0 0 100 100"><use href="#${e.art}"/></svg>`;
    const epChat = CHATS.episodes?.["EP-" + (n + 1)] || CHATS.episodes?.[n];
    const epChatHtml = epChat ? `<p class="sh-label">Escena real de WhatsApp</p><div class="sh-chat">${renderChat(epChat, { head: e.title.replace(/<[^>]+>/g, ""), sub: fdate(e.start), icon: e.img || "monster" })}</div>` : "";
    sheetBody.innerHTML = `
      <article class="sh v-P sh-ep-full">
        <div class="sh-top"><span class="sh-id">★ ${esc(e.num)}</span></div>
        <h3 id="sheetTitle">${e.title}</h3>
        ${img}
        <div class="sh-date" style="margin-bottom:12px">${e.date}</div>
        <p>${e.html}</p>
        ${epChatHtml}
        <p class="sh-label">Incidentes del episodio</p>
        <div class="sh-incs">${e.incs.map((id) => `<button class="btn-ghost sm" data-inc="${id}">${id} · ${esc(BYID[id].name.slice(0, 34))}${BYID[id].name.length > 34 ? "…" : ""}</button>`).join("")}</div>
        <div class="sh-nav">
          <button class="btn" ${n > 0 ? `data-ep="${n - 1}"` : "disabled"}><svg viewBox="0 0 24 24"><use href="#i-left"/></svg>Episodio ${n}</button>
          <button class="btn" ${n < EPISODES.length - 1 ? `data-ep="${n + 1}"` : "disabled"} style="justify-content:flex-end">Episodio ${n + 2}<svg viewBox="0 0 24 24"><use href="#i-right"/></svg></button>
        </div>
      </article>`;
    linkIncCodes(sheetBody);
    if (push) pushSheetHash("#EP-" + (n + 1)); else sheetFromHash = false;
    openSheetUI();
  }
  // delegación global de clics
  document.addEventListener("click", (e) => {
    const inc = e.target.closest("[data-inc]");
    if (inc && !inc.disabled) { e.preventDefault(); openIncident(inc.dataset.inc); return; }
    const ep = e.target.closest("[data-ep]");
    if (ep && !ep.disabled) { e.preventDefault(); openEpisode(+ep.dataset.ep); return; }
    const tl = e.target.closest("[data-tl]");
    if (tl) { const id = tl.dataset.tl; closeSheet(true); setTimeout(() => go("timeline", () => focusTimeline(id)), 50); return; }
    const rv = e.target.closest("[data-rival]");
    if (rv) { const r = rv.dataset.rival; closeSheet(true); setTimeout(() => go("incidentes", () => CAT.set({ rival: r })), 50); }
  });
  function linkIncCodes(root) {
    $$("code", root).forEach((c) => {
      if (/^INC-\d{3}$/.test(c.textContent) && !c.closest("[data-inc]") && !c.closest(".sh-top")) {
        const a = document.createElement("a"); a.href = "#" + c.textContent; a.dataset.inc = c.textContent; a.className = "inc-link";
        c.replaceWith(a); a.appendChild(c);
      }
    });
  }
  linkIncCodes($("main"));

  /* ======================================================
     INICIO
     ====================================================== */
  const INIT = {};
  INIT.inicio = () => {
    $("#epCarousel").innerHTML = EPISODES.map((e, n) => `
      <button class="ep-card" data-ep="${n}" data-r style="--d:${n * 0.04}s">
        ${e.img ? `<img class="ep-art" src="${IMG(e.img)}" alt="">` : `<svg class="ep-art" viewBox="0 0 100 100"><use href="#${e.art}"/></svg>`}
        <span class="ep-n">${String(n + 1).padStart(2, "0")}</span>
        <b>${e.title}</b>
        <span class="ep-d">${fdate(e.start)}${e.end !== e.start ? " → " + fdate(e.end) : ""} · ${e.incs.length} incidente${e.incs.length > 1 ? "s" : ""}</span>
        <span class="ep-more">Leer episodio →</span>
      </button>`).join("");
    const hp = $("#homePearls"), pearls = CHATS.pearls || [];
    if (hp && pearls.length) {
      const picks = pearls.filter((p) => p.featured).slice(0, 4);
      const showP = picks.length ? picks : pearls.slice(0, 4);
      hp.innerHTML = showP.map((p) => `<article class="pearl-card"><div class="pearl-top"><span class="pearl-cat">${esc(p.cat)}</span><span class="pearl-date">${esc(p.date || "")}</span></div><h4>${esc(p.title)}</h4><p class="pearl-cap">${esc(p.caption)}</p>${renderChat(p.chat, { head: p.head || "El Puto Circo", sub: p.sub || p.date || "", icon: p.icon || "monster" })}</article>`).join("");
    }
  };
  // parallax del hero
  (() => {
    const fl = $$(".hero [data-depth]"); let mx = 0, my = 0, tick = false;
    const upd = () => {
      tick = false; if (reduce || current !== "inicio") return;
      const y = scrollY; if (y > innerHeight) return;
      fl.forEach((f) => { const d = +f.dataset.depth; f.style.transform = `translate3d(${mx * d * 24}px, ${-y * d * 0.5 + my * d * 16}px, 0)`; });
    };
    addEventListener("scroll", () => { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
    addEventListener("pointermove", (e) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
  })();

  /* ======================================================
     TIMELINE
     ====================================================== */
  const OUT = [["2023-02-27", "2023-03-15"], ["2023-05-12", "2023-07-20"], ["2023-12-06", "2024-02-28"], ["2024-07-21", "2024-12-05"]];
  const BAN = "2025-09-23";
  const TL = { v: new Set(), big: false, rival: "" };
  function renderTimeline() {
    const box = $("#itl");
    const pass = (i) => (!TL.v.size || TL.v.has(i.v)) && (!TL.big || EP_OF[i.id] !== undefined) && (!TL.rival || i.all.includes(TL.rival));
    const items = [];
    ALL.forEach((i) => pass(i) && items.push({ d: i.date, o: 1, t: "inc", i }));
    EVENTS.forEach((e, n) => items.push({ d: e[0], o: e[1] === "ban" ? 2 : e[1] === "gm" && e[0] === BAN ? 3 : 0, t: "ev", e }));
    EPISODES.forEach((e, n) => items.push({ d: e.start, o: 0.5, t: "ep", e, n }));
    items.sort((a, b) => a.d.localeCompare(b.d) || a.o - b.o);
    let html = "", year = "", month = "", group = "", open = false;
    const close = () => { if (open) { html += "</div>"; open = false; } };
    const counts = {}; ALL.forEach((i) => { const y = i.date.slice(0, 4); counts[y] = (counts[y] || 0) + 1; });
    let shown = 0;
    items.forEach((it) => {
      const y = it.d.slice(0, 4), m = it.d.slice(0, 7);
      if (y !== year) {
        close(); year = y;
        const lbl = y === "2026" ? "Después del ban" : y === "2025" ? `${counts[y]} incidentes · expulsado el 23/09` : `${counts[y]} incidentes`;
        html += `<div class="itl-year" id="y-${y}"><b>${y}</b><span>${lbl}</span></div>`;
      }
      if (m !== month) { close(); month = m; html += `<div class="itl-month" id="m-${m}">${MESL[+m.slice(5) - 1]} ${y}</div><div class="itl-list">`; open = true; }
      if (it.t === "inc") {
        const i = it.i; shown++;
        if (i.group !== group) { group = i.group; html += `<div class="ev" style="--ec:var(--acc);border-style:solid"><span class="ev-d">BLOQUE DEL CATÁLOGO</span><b>${esc(groupShort(i.group))}</b></div>`; }
        html += `<button class="it v-${i.v}${EP_OF[i.id] !== undefined ? " big" : ""}" data-inc="${i.id}" id="t-${i.id}"><span class="it-d">${fdate(i.date)}</span><span class="it-id">${i.id}</span><b>${esc(i.name)}</b><span class="it-r">vs ${i.all.map((r) => RIVAL[r]).join(", ")} · ${VTXT[i.v]}</span></button>`;
      } else if (it.t === "ep") {
        html += `<button class="ep-mark" data-ep="${it.n}"><small>★ ${esc(it.e.num)}</small><b>${it.e.title}</b><span>Leer →</span></button>`;
      } else {
        const [d, type, title, text] = it.e;
        html += `<div class="ev ${type}"><span class="ev-d">${fdate(d)}</span><b>${title}</b>${text}</div>`;
      }
    });
    close();
    box.innerHTML = html + (shown ? "" : `<div class="tl-empty">Ningún incidente con esos filtros.</div>`);
    linkIncCodes(box);
  }
  function focusTimeline(id) {
    let el = $("#t-" + id);
    if (!el) { TL.v.clear(); TL.big = false; TL.rival = ""; $$("#tlFilters .chip").forEach((c) => c.setAttribute("aria-pressed", "false")); $("#tlRival").value = ""; renderTimeline(); el = $("#t-" + id); }
    if (!el) return;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    el.animate([{ boxShadow: "0 0 0 3px var(--vc)" }, { boxShadow: "0 0 0 0 transparent" }], { duration: 1800 });
  }
  INIT.timeline = () => {
    // mapa de calor mensual
    const heat = $("#heat"), months = [];
    for (let y = 2022, m = 5; y < 2026 || (y === 2026 && m <= 10); m++) { if (m > 12) { m = 1; y++; } months.push(`${y}-${String(m).padStart(2, "0")}`); }
    const cnt = {}; ALL.forEach((i) => { const k = i.date.slice(0, 7); cnt[k] = (cnt[k] || 0) + 1; });
    const max = Math.max(...Object.values(cnt));
    const isOut = (k) => OUT.some(([a, b]) => { const s = new Date(k + "-01"), e = new Date(s); e.setMonth(e.getMonth() + 1); const ov = Math.min(e, new Date(b)) - Math.max(s, new Date(a)); return ov / 864e5 >= 14; });
    heat.style.setProperty("--cols", months.length);
    heat.innerHTML = months.map((k) => {
      const c = cnt[k] || 0, ban = k > "2025-09", out = !c && isOut(k);
      const style = c ? `background:color-mix(in srgb, var(--acc) ${25 + (c / max) * 75}%, transparent)` : "";
      return `<button class="${ban ? "ban" : out ? "out" : ""}${k.endsWith("-01") || k === "2022-05" ? " yr" : ""}" data-y="${k.slice(0, 4)}" data-m="${k}" title="${MESL[+k.slice(5) - 1]} ${k.slice(0, 4)} · ${c} incidente${c === 1 ? "" : "s"}" aria-label="${MESL[+k.slice(5) - 1]} ${k.slice(0, 4)}: ${c} incidentes" style="${style}"></button>`;
    }).join("");
    heat.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      const m = b.dataset.m; let t = $("#m-" + m);
      if (!t) { const all = $$(".itl-month"); t = all.find((x) => x.id.slice(2) >= m) || $("#epilogo"); }
      t.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    });
    Object.entries(RIVAL).forEach(([k, v]) => $("#tlRival").insertAdjacentHTML("beforeend", `<option value="${k}">Con ${v}</option>`));
    $("#tlFilters").addEventListener("click", (e) => {
      const c = e.target.closest(".chip"); if (!c) return;
      if (c.dataset.v) { TL.v.has(c.dataset.v) ? TL.v.delete(c.dataset.v) : TL.v.add(c.dataset.v); c.setAttribute("aria-pressed", TL.v.has(c.dataset.v)); }
      if (c.dataset.big) { TL.big = !TL.big; c.setAttribute("aria-pressed", TL.big); }
      renderTimeline();
    });
    $("#tlRival").addEventListener("change", (e) => { TL.rival = e.target.value; renderTimeline(); });
    renderTimeline();
    buildMonument();
  };

  /* ======================================================
     INCIDENTES (catálogo)
     ====================================================== */
  const CAT = (() => {
    const state = { year: "", v: new Set(), rival: "", cat: "", q: "", sort: "asc" };
    let built = false;
    const accentRe = (s) => {
      const map = { a: "[aáàä]", e: "[eéèë]", i: "[iíìï]", o: "[oóòö]", u: "[uúùü]", n: "[nñ]" };
      return new RegExp("(" + norm(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/[aeioun]/g, (c) => map[c]) + ")", "gi");
    };
    const hl = (txt, re) => { const e = esc(txt); return re ? e.replace(re, "<mark>$1</mark>") : e; };
    const build = () => {
      if (built) return; built = true;
      const yf = $("#yearFilters");
      yf.innerHTML = `<button class="chip" data-y="" aria-pressed="true">Todos</button>` + ["2022", "2023", "2024", "2025"].map((y) => `<button class="chip" data-y="${y}" aria-pressed="false">${y}</button>`).join("") +
        `<span class="sep"></span><button class="chip c-s" data-v="S" aria-pressed="false">🟢 Sí · 14</button><button class="chip c-p" data-v="P" aria-pressed="false">🟡 Parcial · 69</button><button class="chip c-n" data-v="N" aria-pressed="false">🔴 No · 61</button>`;
      Object.entries(RIVAL).forEach(([k, v]) => $("#rivalSel").insertAdjacentHTML("beforeend", `<option value="${k}">Con ${v} (${ALL.filter((i) => i.all.includes(k)).length})</option>`));
      [...new Set(ALL.map((i) => i.cat))].forEach((c) => $("#catSel").insertAdjacentHTML("beforeend", `<option value="${esc(c)}">${esc(c)}</option>`));
      let qt;
      $("#q").addEventListener("input", () => { clearTimeout(qt); qt = setTimeout(() => { state.q = $("#q").value; render(); }, 120); });
      yf.addEventListener("click", (e) => {
        const c = e.target.closest(".chip"); if (!c) return;
        if (c.dataset.y !== undefined) state.year = c.dataset.y;
        if (c.dataset.v) state.v.has(c.dataset.v) ? state.v.delete(c.dataset.v) : state.v.add(c.dataset.v);
        render();
      });
      $("#rivalSel").addEventListener("change", (e) => { state.rival = e.target.value; render(); });
      $("#catSel").addEventListener("change", (e) => { state.cat = e.target.value; render(); });
      $("#sortSel").addEventListener("change", (e) => { state.sort = e.target.value; render(); });
      $("#clearF").addEventListener("click", () => set({}));
      $("#randomInc").addEventListener("click", () => { const l = $$("#incidents .irow"); if (l.length) openIncident(l[Math.floor(Math.random() * l.length)].dataset.inc); });
    };
    const syncUI = () => {
      $("#q").value = state.q; $("#rivalSel").value = state.rival; $("#catSel").value = state.cat; $("#sortSel").value = state.sort;
      $$("#yearFilters [data-y]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.y === state.year));
      $$("#yearFilters [data-v]").forEach((b) => b.setAttribute("aria-pressed", state.v.has(b.dataset.v)));
    };
    const render = () => {
      syncUI();
      const qq = norm(state.q.trim()), re = qq.length > 1 ? accentRe(state.q.trim()) : null;
      const list = ALL.filter((i) => (!state.year || i.date.startsWith(state.year)) && (!state.v.size || state.v.has(i.v)) &&
        (!state.rival || i.all.includes(state.rival)) && (!state.cat || i.cat === state.cat) &&
        (!qq || norm([i.id, i.date, i.name, i.cat, i.riv, i.desc].join(" ")).includes(qq)));
      if (state.sort === "desc") list.reverse();
      let html = `<div class="cat-head" aria-hidden="true"><span></span><span>ID</span><span>Fecha</span><span>Incidente</span><span>Rival</span><span>Categoría</span><span>¿Tenía razón?</span></div>`, group = "";
      list.forEach((i) => {
        if (i.group !== group) { if (group) html += "</div></div>"; group = i.group; html += `<div class="inc-group"><h4>${esc(i.group)}</h4><div class="inc-list">`; }
        html += `<button class="irow v-${i.v}" data-inc="${i.id}"><span class="bar"></span><span class="r-name">${hl(i.name, re)}</span><span class="r-meta"><span>${hl(i.id, re)}</span><span>${fdate(i.date)}</span><span class="riv-m">vs ${RIVAL[i.main]}</span></span><span class="r-cat">${hl(i.cat, re)}</span><span class="r-v">${VTXT[i.v]}</span></button>`;
        if (re && norm(i.desc).includes(qq) && !norm(i.name).includes(qq)) html = html.replace(/<\/button>$/, `<span class="r-snip">${hl(i.desc, re)}</span></button>`);
      });
      if (group) html += "</div></div>";
      $("#incidents").innerHTML = list.length ? html : `<div class="empty"><svg viewBox="0 0 120 80"><use href="#i-chopped"/></svg>Ningún incidente con esos filtros.<br><em>"Mentira."</em></div>`;
      $("#shown").textContent = list.length;
    };
    const set = (o) => { build(); Object.assign(state, { year: "", rival: "", cat: "", q: "", sort: "asc" }, o); state.v = new Set(o.v || []); render(); window.scrollTo(0, 0); };
    return { build, render, set, state };
  })();
  INIT.incidentes = () => { CAT.build(); CAT.render(); };

  /* ======================================================
     PERLAS DE HUMOR
     ====================================================== */
  INIT.perlas = () => {
    const pearls = CHATS.pearls || [];
    const catsEl = $("#pearlCats"), whoEl = $("#pearlWho"), qEl = $("#pearlQ"), grid = $("#pearlsGrid");
    const st = { cat: "", who: "", q: "" };
    const cats = [...new Set(pearls.map((p) => p.cat))];
    catsEl.innerHTML = `<button class="chip" data-c="" aria-pressed="true">Todas (${pearls.length})</button>` +
      cats.map((c) => `<button class="chip" data-c="${esc(c)}" aria-pressed="false">${esc(c)} (${pearls.filter((p) => p.cat === c).length})</button>`).join("");
    Object.entries(WHO_META).forEach(([k, v]) => whoEl.insertAdjacentHTML("beforeend", `<option value="${k}">Con ${esc(v.name.split(" (")[0])}</option>`));
    $("#pearlTotal").textContent = pearls.length;
    const render = () => {
      $$("#pearlCats .chip").forEach((b) => b.setAttribute("aria-pressed", b.dataset.c === st.cat));
      whoEl.value = st.who; qEl.value = st.q;
      const qq = norm(st.q.trim());
      const list = pearls.filter((p) => {
        if (st.cat && p.cat !== st.cat) return false;
        const allM = [...(p.chat?.msgs || []), ...(p.chat?.more || [])];
        if (st.who && !allM.some((m) => m.w === st.who)) return false;
        if (qq) {
          const hay = norm([p.title, p.caption, p.cat, ...allM.map((m) => (m.w || "") + " " + (m.m || ""))].join(" "));
          if (!hay.includes(qq)) return false;
        }
        return true;
      });
      $("#pearlShown").textContent = list.length;
      grid.innerHTML = list.length ? list.map((p) => `<article class="pearl-card${p.wide ? " wide" : ""}" id="${esc(p.id)}"><div class="pearl-top"><span class="pearl-cat">${esc(p.cat)}</span><span class="pearl-date">${esc(p.date || "")}</span></div><h4>${esc(p.title)}</h4><p class="pearl-cap">${esc(p.caption)}</p>${renderChat(p.chat, { head: p.head || "El Puto Circo", sub: p.sub || p.date || "", icon: p.icon || "monster" })}${p.inc ? `<div><button class="btn-ghost sm" data-inc="${esc(p.inc)}">Ver ficha ${esc(p.inc)} →</button></div>` : ""}</article>`).join("") : `<div class="empty">Ninguna perla con ese filtro.<br><em>"Aro."</em></div>`;
    };
    catsEl.addEventListener("click", (e) => { const c = e.target.closest(".chip"); if (c) { st.cat = c.dataset.c; render(); } });
    whoEl.addEventListener("change", (e) => { st.who = e.target.value; render(); });
    let pt; qEl.addEventListener("input", () => { clearTimeout(pt); pt = setTimeout(() => { st.q = qEl.value; render(); }, 120); });
    $("#pearlClear").addEventListener("click", () => { st.cat = ""; st.who = ""; st.q = ""; render(); });
    $("#pearlRandom").addEventListener("click", () => {
      const cards = $$("#pearlsGrid .pearl-card");
      if (cards.length) {
        const pick = cards[Math.floor(Math.random() * cards.length)];
        pick.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
        pick.animate([{ boxShadow: "0 0 0 3px var(--acc)" }, { boxShadow: "0 0 0 0 transparent" }], { duration: 1600 });
      }
    });
    render();
  };

  /* ======================================================
     ESTADÍSTICAS
     ====================================================== */
  INIT.stats = () => {
    // ranking
    const metrics = [{ k: "m", l: "Mensajes" }, { k: "w", l: "Palabras" }, { k: "a", l: "Media palabras/msg", dec: 2 }, { k: "x", l: "Multimedia" }, { k: "b", l: "Borrados" }, { k: "e", l: "Editados" }, { k: "q", l: "Preguntas (?)" }, { k: "j", l: "Risas (jaja/xd)" }];
    const members = $$("#membersTable tr[data-name]").map((tr) => { const o = { name: tr.dataset.name, dani: tr.classList.contains("hl") }; metrics.forEach((m) => (o[m.k] = parseFloat(tr.dataset[m.k]))); return o; });
    const bars = $("#memberBars"), tabs = $("#metricTabs");
    const draw = (k) => {
      const m = metrics.find((x) => x.k === k), sorted = [...members].sort((a, b) => b[k] - a[k]), max = sorted[0][k] || 1;
      bars.innerHTML = sorted.map((p) => `<div class="hbar${p.dani ? " dani" : ""}"><span class="nm">${p.name}</span><div class="tr"><div class="fl" data-target="${(p[k] / max) * 100}"></div><span class="vl">${fmt(p[k], m.dec || 0)}</span></div></div>`).join("");
      requestAnimationFrame(() => requestAnimationFrame(() => $$(".fl", bars).forEach((f) => (f.style.width = f.dataset.target + "%"))));
      $$(".chip", tabs).forEach((c) => c.setAttribute("aria-pressed", c.dataset.k === k));
    };
    tabs.innerHTML = metrics.map((m) => `<button class="chip" data-k="${m.k}" aria-pressed="false">${m.l}</button>`).join("");
    tabs.addEventListener("click", (e) => { const c = e.target.closest(".chip"); if (c) draw(c.dataset.k); });
    onVisible($("#memberChart"), () => draw("m"), { threshold: 0.2 });
    // anillo 27,91%
    onVisible($("#shareRing"), () => { const C = 2 * Math.PI * 50; $("#shareFg").style.strokeDasharray = `${C * 0.2791} ${C}`; }, { threshold: 0.4 });
    // montaña rusa
    (() => {
      const box = $("#timeline"); if (!box) return;
      const W = 1000, H = 250, L = 24, R = 976, Y = 112, t0 = Date.UTC(2022, 4, 21), t1 = Date.UTC(2026, 9, 16);
      const x = (y, m, d) => L + ((Date.UTC(y, m - 1, d) - t0) / (t1 - t0)) * (R - L);
      const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Línea temporal mayo 2022 - octubre 2026" });
      svgEl("rect", { class: "track", x: L, y: Y, width: R - L, height: 22, rx: 6 }, svg);
      svgEl("rect", { class: "in-seg grow", x: L, y: Y, width: x(2025, 9, 23) - L, height: 22, rx: 6 }, svg);
      [[[2023, 2, 27], [2023, 3, 15]], [[2023, 5, 12], [2023, 7, 20]], [[2023, 12, 6], [2024, 2, 28]], [[2024, 7, 21], [2024, 12, 5]]]
        .forEach(([a, b], i) => svgEl("rect", { class: "out-seg grow", x: x(...a), y: Y, width: Math.max(4, x(...b) - x(...a)), height: 22, style: `--d:${0.9 + i * 0.15}s` }, svg));
      svgEl("rect", { class: "ban-seg grow", x: x(2025, 9, 23), y: Y, width: R - x(2025, 9, 23), height: 22, rx: 6, style: "--d:1.6s" }, svg);
      for (let yr = 2023; yr <= 2026; yr++) { const xx = x(yr, 1, 1); svgEl("line", { class: "tick", x1: xx, x2: xx, y1: Y - 8, y2: Y + 30 }, svg); svgEl("text", { x: xx + 4, y: Y + 46, class: "yr" }, svg).textContent = yr; }
      svgEl("text", { x: L, y: Y + 46, class: "yr" }, svg).textContent = "2022";
      [[[2022, 5, 25], "Mayo 2022", "55,0% del grupo", "start"], [[2023, 4, 15], "Abril 2023", "929 mensajes", "middle"], [[2025, 1, 15], "Enero 2025", "837 msgs · 40,4%", "middle"]].forEach(([d, a, b, anc]) => {
        const g = svgEl("g", { class: "peak" }, svg), xx = x(...d);
        svgEl("line", { x1: xx, x2: xx, y1: 46, y2: Y }, g); svgEl("circle", { cx: xx, cy: 46, r: 4 }, g);
        svgEl("text", { x: xx, y: 22, "text-anchor": anc }, g).textContent = a; svgEl("text", { x: xx, y: 38, "text-anchor": anc, class: "pv" }, g).textContent = b;
      });
      [[[2022, 11, 14], "Golpe de Estado", 0], [[2023, 2, 27], "Ley Bruno · 16 días", 1], [[2023, 5, 12], "Exilio I · 69 días", 2], [[2023, 12, 6], "Exilio II · 84 días", 0], [[2024, 3, 13], "Nace «GM»", 1], [[2024, 7, 21], "Exilio III · 137 días", 2], [[2025, 9, 23], "«Al carajo»", 0], [[2026, 3, 8], "«Perchita se ha rajado»", 1]].forEach(([d, label, row]) => {
        const xx = x(...d), yy = Y + 70 + row * 24;
        svgEl("line", { class: "tick", x1: xx, x2: xx, y1: Y + 22, y2: yy - 11, "stroke-dasharray": "2 3" }, svg);
        svgEl("text", { x: xx, y: yy, class: "lbl", "text-anchor": xx > 900 ? "end" : "middle" }, svg).textContent = label;
      });
      box.appendChild(svg);
      onVisible(box, (b) => b.classList.add("in"), { threshold: 0.3 });
      const hint = $("#tlHint"), chk = () => (hint.style.display = box.scrollWidth > box.clientWidth + 4 ? "" : "none");
      setTimeout(chk, 50); addEventListener("resize", chk);
    })();
    // 97 chavales
    (() => {
      const phone = $("#chavalesPhone"), cnt = $("#chavalesCount"); let timer;
      const add = (h, cls = "") => { const b = document.createElement("div"); b.className = "bubble " + cls; b.innerHTML = h; phone.appendChild(b); while (phone.children.length > 22) phone.firstChild.remove(); };
      const run = () => {
        clearInterval(timer); phone.innerHTML = ""; cnt.textContent = "0";
        add('<span class="who" style="color:#e8a400">Pablo Valderas</span>Chupito cada vez que Dani manda un chavales', "out first");
        if (reduce) { add("Chavales"); add("Pablo puta"); cnt.textContent = "97"; return; }
        let n = 0;
        setTimeout(() => { timer = setInterval(() => { n++; if (n <= 96) add((n === 1 ? '<span class="who" style="color:var(--acc-ink)">Daniel Bruno (El Prensas)</span>' : "") + "Chavales", n === 1 ? "first" : ""); else { add("Pablo puta"); clearInterval(timer); } cnt.textContent = n; }, 32); }, 600);
      };
      onVisible(phone, run, { threshold: 0.5 }); $("#chavalesReplay").addEventListener("click", run);
    })();
    $("#doors").innerHTML = Array.from({ length: 9 }, (_, i) => `<span class="door dani" style="--i:${i}"></span>`).join("") + `<span class="door dani sil" style="--i:9"></span><span class="door dani sil" style="--i:10"></span><span class="door"></span>`;
    (() => {
      const s = $("#vampClock"), c = 70, r1 = 34, r2 = 66;
      for (let h = 0; h < 24; h++) {
        const a0 = (h / 24) * Math.PI * 2 - Math.PI / 2, a1 = ((h + 1) / 24) * Math.PI * 2 - Math.PI / 2 - 0.03, p = (r, a) => `${c + r * Math.cos(a)} ${c + r * Math.sin(a)}`;
        const op = h >= 4 && h < 7 ? 1 : h === 3 ? 0.55 : h >= 1 && h < 3 ? 0.2 : 0;
        svgEl("path", { d: `M${p(r1, a0)} L${p(r2, a0)} A${r2} ${r2} 0 0 1 ${p(r2, a1)} L${p(r1, a1)} A${r1} ${r1} 0 0 0 ${p(r1, a0)}Z`, style: op ? `fill:var(--acc);opacity:${op}` : "fill:var(--overlay)" }, s);
      }
      [0, 6, 12, 18].forEach((h) => { const a = (h / 24) * Math.PI * 2 - Math.PI / 2; svgEl("text", { x: c + 26 * Math.cos(a), y: c + 26 * Math.sin(a) + 3, "text-anchor": "middle", style: "fill:var(--muted);font:600 8px var(--f-mono)" }, s).textContent = String(h).padStart(2, "0"); });
      svgEl("use", { href: "#i-moon", x: 56, y: 56, width: 28, height: 28 }, s);
    })();
    if (!reduce) $("#qrain").innerHTML = Array.from({ length: 20 }, () => `<span style="left:${Math.random() * 96}%;font-size:${14 + Math.random() * 20}px;animation-duration:${2 + Math.random() * 3}s;animation-delay:${-Math.random() * 4}s">?</span>`).join("");
    // gauge
    onVisible($("#gauge"), () => { const C = 2 * Math.PI * 96; [["#gS", 9.7, 0], ["#gP", 47.9, 9.7], ["#gN", 42.4, 57.6]].forEach(([id, p, off]) => { const el = $(id); el.style.strokeDashoffset = -(off / 100) * C; el.style.strokeDasharray = `${(p / 100) * C - 2} ${C}`; }); }, { threshold: 0.4 });
    // por año
    const yrs = {}; ALL.forEach((i) => { const y = i.date.slice(0, 4); yrs[y] = yrs[y] || { S: 0, P: 0, N: 0, t: 0 }; yrs[y][i.v]++; yrs[y].t++; });
    const yb = $("#yearBars");
    yb.innerHTML = Object.keys(yrs).sort().map((y) => { const o = yrs[y]; return `<div class="year-row"><span class="y">${y}</span><div><div class="stack">${["S", "P", "N"].map((v) => `<i class="${v.toLowerCase()}" data-target="${(o[v] / o.t) * 100}">${o[v]}</i>`).join("")}</div><div style="font:600 11px var(--f-mono);color:var(--muted);margin-top:4px">${o.t} incidentes · ${fmt((o.S / o.t) * 100, 1)}% con razón</div></div></div>`; }).join("");
    onVisible(yb, () => $$(".stack i", yb).forEach((el, k) => setTimeout(() => (el.style.width = el.dataset.target + "%"), k * 50)), { threshold: 0.3 });
    // categorías
    const cats = {}; ALL.forEach((i) => { cats[i.cat] = cats[i.cat] || { S: 0, P: 0, N: 0, t: 0 }; cats[i.cat][i.v]++; cats[i.cat].t++; });
    const list = Object.entries(cats).sort((a, b) => b[1].t - a[1].t), max = list[0][1].t, cb = $("#catBars");
    cb.innerHTML = list.map(([c, o]) => `<div class="cat-row" data-cat="${esc(c)}" role="button" tabindex="0" title="Ver estos incidentes"><div class="t"><span>${esc(c)}</span><b>${o.t}</b></div><div class="stack" style="height:14px;width:${(o.t / max) * 100}%">${["S", "P", "N"].map((v) => `<i class="${v.toLowerCase()}" data-target="${(o[v] / o.t) * 100}"></i>`).join("")}</div></div>`).join("");
    onVisible(cb, () => $$(".stack i", cb).forEach((el, k) => setTimeout(() => (el.style.width = el.dataset.target + "%"), k * 30)), { threshold: 0.3 });
    cb.addEventListener("click", (e) => { const r = e.target.closest("[data-cat]"); if (r) go("incidentes", () => CAT.set({ cat: r.dataset.cat })); });
    // subnav activo
    const links = $$("#v-stats .subnav a");
    links.forEach((a) => onVisible($(a.getAttribute("href")), () => { links.forEach((l) => l.classList.toggle("on", l === a)); }, { repeat: true, threshold: 0, margin: "-30% 0px -60% 0px" }));
  };

  /* ======================================================
     RIVALES
     ====================================================== */
  INIT.rivales = () => {
    const svg = $("#rivalNet"), cards = $$("#rivals .rival"), C = { x: 280, y: 230 }, R = 168;
    const edges = svgEl("g", {}, svg), nodes = svgEl("g", {}, svg);
    const KEY = { Pablo: "PABLO", Ale: "ALE", "Julián": "JULIAN", Edu: "EDU", Antonio: "ANTONIO", Fernando: "FERNANDO", "Rubén": "RUBEN" };
    cards.forEach((card, i) => {
      const a = (i / cards.length) * Math.PI * 2 - Math.PI / 2, x = C.x + R * Math.cos(a) * 1.18, y = C.y + R * Math.sin(a);
      const inv = +card.dataset.inv, main = +card.dataset.main, key = KEY[card.dataset.key];
      svgEl("line", { class: "edge", x1: C.x, y1: C.y, x2: x, y2: y, "stroke-width": 2 + (inv / 114) * 16, style: `transition-delay:${i * 0.12}s;stroke:${card.dataset.color}` }, edges);
      const g = svgEl("g", { class: "rn", tabindex: 0 }, nodes);
      svgEl("circle", { cx: x, cy: y, r: 34 + (main / 66) * 14 }, g);
      svgEl("text", { x, y: y - 3 }, g).textContent = card.dataset.key;
      svgEl("text", { x, y: y + 17, class: "pct" }, g).textContent = fmt(+card.dataset.pct, 1) + "%";
      const goCard = () => { cards.forEach((c) => c.classList.remove("on")); $$(".rn", svg).forEach((n) => n.classList.remove("on")); card.classList.add("on"); g.classList.add("on"); card.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" }); };
      g.addEventListener("click", goCard); g.addEventListener("keydown", (e) => e.key === "Enter" && goCard());
      // pie de tarjeta: veredictos como rival principal + enlace a incidentes
      const mine = ALL.filter((i) => i.main === key), tot = ALL.filter((i) => i.all.includes(key)).length;
      const vs = { S: 0, P: 0, N: 0 }; mine.forEach((i) => vs[i.v]++);
      const rchat = CHATS.rivals?.[key];
      if (rchat) card.insertAdjacentHTML("beforeend", renderChat(rchat, { head: rchat.head || `Dani vs ${card.dataset.key}`, sub: rchat.sub || "Fragmento real", icon: "monster" }));
      card.insertAdjacentHTML("beforeend", `<div class="rival-foot">${mine.length ? `<span class="mini">Veredicto cuando es el rival principal (${mine.length}): 🟢 ${vs.S} · 🟡 ${vs.P} · 🔴 ${vs.N}</span><div class="stack">${["S", "P", "N"].map((v) => `<i class="${v.toLowerCase()}" style="width:${(vs[v] / mine.length) * 100}%"></i>`).join("")}</div>` : ""}<button class="btn-ghost sm" data-rival="${key}">Ver sus ${tot} incidentes →</button></div>`);
    });
    const cg = svgEl("g", { class: "center" }, nodes);
    svgEl("circle", { cx: C.x, cy: C.y, r: 50 }, cg);
    svgEl("image", { href: IMG("monster"), x: C.x - 16, y: C.y - 40, width: 32, height: 80 }, cg);
    onVisible(svg, () => svg.classList.add("in"), { threshold: 0.3 });
    revealAll($("#v-rivales"));
  };

  /* ======================================================
     EL GM
     ====================================================== */
  INIT.gm = () => {
    // inventario
    $$(".inv").forEach((b) => b.addEventListener("click", (e) => {
      if (b.classList.contains("can-inv")) { b.classList.remove("shake"); void b.offsetWidth; b.classList.add("shake"); openCan(e, b); return; }
      go("incidentes", () => CAT.set({ q: b.dataset.search }));
    }));
    // diccionario
    const chart = $("#vocabChart"), det = $("#vocabDetail");
    const entries = $$("#dict .dict-entry").map((el) => ({ el, word: el.dataset.word, r: el.dataset.ratio === "inf" ? Infinity : parseFloat(el.dataset.ratio) }));
    const sorted = [...entries].sort((a, b) => b.r - a.r), maxLog = Math.log10(200);
    chart.innerHTML = sorted.map((e) => `<button class="vrow${e.r === Infinity ? " inf" : ""}" data-i="${entries.indexOf(e)}"><span class="w">${esc(e.word)}</span><span class="tr"><span class="fl" data-target="${e.r === Infinity ? 100 : Math.max(6, (Math.log10(e.r) / maxLog) * 100)}"></span><span class="vl">${e.r === Infinity ? "∞" : fmt(e.r, 1) + "x"}</span></span></button>`).join("");
    const show = (i) => {
      const e = entries[i];
      $$(".vrow", chart).forEach((r) => r.classList.toggle("on", +r.dataset.i === i));
      const dchat = CHATS.dict?.[e.word];
      det.innerHTML = `<div class="word">${esc(e.word)}</div><p class="fn">${$(".fn", e.el).innerHTML}</p><dl>${$$(".row span", e.el).map((s) => { const [k, ...v] = s.innerHTML.split(":"); return `<div><dt>${k}</dt><dd>${v.join(":")}</dd></div>`; }).join("")}</dl>${dchat ? `<div class="vocab-chat"><p class="vocab-chat-lbl">Uso real en el chat</p>${renderChat(dchat, { head: dchat.head || "El Puto Circo", sub: dchat.sub || "", icon: "monster" })}</div>` : ""}`;
    };
    chart.addEventListener("click", (ev) => { const b = ev.target.closest(".vrow"); if (b) show(+b.dataset.i); });
    show(entries.indexOf(sorted[0]));
    onVisible(chart, () => $$(".fl", chart).forEach((f, i) => setTimeout(() => (f.style.width = f.dataset.target + "%"), i * 50)), { threshold: 0.2 });
    // chats en Apodos y Patrones
    const evoCards = $$("#g-apodos ~ .evo .evo-card");
    ["prensas", "perchita", "gm"].forEach((k, idx) => {
      if (evoCards[idx] && CHATS.nicknames?.[k]) evoCards[idx].insertAdjacentHTML("beforeend", renderChat(CHATS.nicknames[k], { head: CHATS.nicknames[k].head || "Origen del apodo", sub: CHATS.nicknames[k].sub || "", icon: "monster" }));
    });
    $$("#g-patrones + .patterns details.pat .body").forEach((body, idx) => {
      if (CHATS.patterns?.[idx]) body.insertAdjacentHTML("beforeend", renderChat(CHATS.patterns[idx], { head: CHATS.patterns[idx].head || `Prueba · Patrón ${String(idx + 1).padStart(2, "0")}`, sub: CHATS.patterns[idx].sub || "", icon: "monster" }));
    });
    // flip
    const f = $("#flipCard"), t = () => f.classList.toggle("flipped");
    f.addEventListener("click", t); f.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); t(); } });
    // ciclo
    (() => {
      const svg = $("#cycleSvg"), items = $$("#cycleList li");
      const labels = { A: "1", B: "2", C: "3", D: "4", E: "5", F: "✗", G: "6", H: "7", I: "8" }, keys = Object.keys(labels), n = keys.length, C = 260, R = 205;
      const ang = (i) => (i / n) * Math.PI * 2 - Math.PI / 2;
      svgEl("circle", { class: "ring", cx: C, cy: C, r: R }, svg);
      keys.forEach((k, i) => {
        const a = ang(i + 0.5), px = C + R * Math.cos(a), py = C + R * Math.sin(a), deg = (a * 180) / Math.PI;
        svgEl("path", { d: "M-6 -5 L4 0 L-6 5", fill: "none", style: `stroke:${k === "E" ? "var(--part)" : "var(--acc-ink)"}`, "stroke-width": 2.5, transform: `translate(${px} ${py}) rotate(${deg})` }, svg);
        if (k === "E") svgEl("text", { x: C + (R + 30) * Math.cos(a), y: C + (R + 30) * Math.sin(a), style: "fill:var(--part);font:700 15px var(--f-body)", "text-anchor": "middle", "dominant-baseline": "central" }, svg).textContent = "Sí";
      });
      const runner = svgEl("circle", { class: "runner", r: 7, cx: C, cy: C - R }, svg);
      const nodes = keys.map((k, i) => {
        const g = svgEl("g", { class: "node" + (k === "E" ? " dec" : "") + (k === "F" ? " alt" : "") }, svg);
        svgEl("circle", { cx: C + R * Math.cos(ang(i)), cy: C + R * Math.sin(ang(i)), r: 30 }, g);
        svgEl("text", { x: C + R * Math.cos(ang(i)), y: C + R * Math.sin(ang(i)) }, g).textContent = labels[k] + (k === "E" ? "?" : "");
        return g;
      });
      let cur = 0, runAng = ang(0), paused = 0, inView = false;
      const set = (i) => {
        cur = (i + n) % n;
        nodes.forEach((g, j) => g.classList.toggle("on", j === cur)); items.forEach((li, j) => li.classList.toggle("on", j === cur));
        $("#ccN").textContent = labels[keys[cur]] + (keys[cur] === "E" ? "?" : "");
        $("#ccT").textContent = items[cur].querySelector("span").textContent.replace(/^\d\.\s*/, "");
        $("#ccB").textContent = keys[cur] === "E" ? "Sí → niega la realidad" : keys[cur] === "I" ? "↻ vuelve al paso 1" : "";
        let target = ang(cur); while (target < runAng) target += Math.PI * 2;
        const from = runAng, t0 = performance.now(), dur = reduce ? 1 : 700;
        const step = (t) => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); runAng = from + (target - from) * e; runner.setAttribute("cx", C + R * Math.cos(runAng)); runner.setAttribute("cy", C + R * Math.sin(runAng)); if (p < 1) requestAnimationFrame(step); };
        requestAnimationFrame(step);
      };
      const user = (i) => { paused = Date.now() + 9000; set(i); };
      nodes.forEach((g, i) => g.addEventListener("click", () => user(i))); items.forEach((li, i) => li.addEventListener("click", () => user(i)));
      set(0);
      onVisible($("#cycle"), () => (inView = true), { repeat: true, threshold: 0.3, out: () => (inView = false) });
      if (!reduce) setInterval(() => { if (inView && current === "gm" && Date.now() > paused) set(cur + 1); }, 2600);
    })();
    // botón nuclear
    let exits = 0, last = [];
    $("#nukeBtn").addEventListener("click", () => {
      exits++; $("#fabCnt").textContent = exits; const now = Date.now(); last = last.filter((x) => now - x < 60000); last.push(now);
      toast("<code>Daniel Bruno (El Prensas)</code> salió del grupo");
      setTimeout(() => toast("<code>Daniel Bruno (El Prensas)</code> se unió usando el enlace de invitación · <em>\"Vuelvo a ser poderoso\"</em>"), 1100);
      if (last.length === 4) setTimeout(() => toast("🚪 Se sale <b>4 veces en el mismo minuto</b> (28/11/2023)", 3400), 2200);
      if (exits === 11) setTimeout(() => toast("☢️ Abandona el grupo (<b>11 veces en total</b>)", 3400), 2200);
    });
    const links = $$("#v-gm .subnav a");
    links.forEach((a) => onVisible($(a.getAttribute("href")), () => links.forEach((l) => l.classList.toggle("on", l === a)), { repeat: true, threshold: 0, margin: "-30% 0px -60% 0px" }));
  };

  /* ---------------- MONUMENTO ---------------- */
  function buildMonument() {
    const grid = $("#mcGrid"); if (!grid) return;
    const map = ["......................", "..NNN.....N...N...YY..", ".N...N....NN.NN.....Y.", ".N........N.N.N....Y..", ".N..NN....N.N.N...Y...", ".N...N....N...N...YYY.", ".N...N....N...N.......", "..NNN.....N...N.......", "......................",
      "...SSSSSSSSSSSSSSSS...", "...SssSSssSSssSSssS...", "...SSSSSSSSSSSSSSSS...", "..SSSSSSSSSSSSSSSSSS..", "..SsSSsSSsSSsSSsSSsS..", "GGGGGGGGGGGGGGGGGGGGGG", "gGgGGgGGGgGGgGGGgGGgGg", "DDdDDDdDDDDdDDDdDDDDdD", "DdDDDDDDdDDDDDdDDDDDDD"];
    const col = { N: "#7ee000", Y: "#ffd400", S: "#8a8f93", s: "#6b7075", G: "#62bb3c", g: "#4f9a2f", D: "#8a5a2c", d: "#6a4320" };
    grid.style.setProperty("--cols", map[0].length);
    grid.innerHTML = map.map((row, r) => [...row].map((ch, c) => `<i style="${col[ch] ? "background:" + col[ch] + ";" : ""}--d:${(map.length - r) * 70 + c * 9}ms"></i>`).join("")).join("");
    onVisible(grid, () => grid.classList.add("in"), { threshold: 0.3 });
  }

  /* arranque */
  route();
})();
