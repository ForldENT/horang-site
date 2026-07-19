/* ============================================================
   app.js — 관리자 판별 + 공통 헤더 + 유틸
   ============================================================ */

(function () {
  const SESSION = "horang.admin";

  /* config.js를 못 불러온 경우 — 화면이 백지로 뜨는 대신 원인을 알려줍니다. */
  if (typeof window.CONFIG === "undefined") {
    window.CONFIG = { ROOM_NAME: "설정 없음", BOT_NAME: "봇", ADMIN_KEY: "", SHEETS: {}, SHEET_LINKS: {} };
    document.addEventListener("DOMContentLoaded", function () {
      const b = document.createElement("div");
      b.style.cssText = "position:fixed;inset:0 0 auto 0;z-index:99;background:#FF5C7A;color:#17070C;"
        + "font:600 14px/1.6 sans-serif;padding:12px 18px;text-align:center";
      b.textContent = "assets 폴더를 찾지 못했습니다. HTML 파일과 assets 폴더가 같은 위치에 있어야 합니다.";
      document.body.appendChild(b);
    });
  }

  /* 주소에 ?key=... 가 있으면 관리자 모드로 들어옵니다.
     탭을 닫으면 풀립니다. */
  const params = new URLSearchParams(location.search);
  if (params.get("key")) {
    try {
      if (params.get("key") === CONFIG.ADMIN_KEY) sessionStorage.setItem(SESSION, "1");
      else sessionStorage.removeItem(SESSION);
    } catch (e) {}
  }

  function isAdmin() {
    try { return sessionStorage.getItem(SESSION) === "1"; } catch (e) { return false; }
  }

  function link(page) {
    return isAdmin() ? page + "?key=" + encodeURIComponent(CONFIG.ADMIN_KEY) : page;
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function toast(msg, bad) {
    let t = document.querySelector(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.toggle("is-bad", !!bad);
    t.classList.add("is-on");
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove("is-on"), 2600);
  }

  function header(active) {
    const nav = [
      ["index.html", "홈"],
      ["commands.html", "명령어"],
      ["members.html", "멤버 소개"],
      ["status.html", "매칭 · 외출"]
    ];
    const el = document.querySelector("[data-header]");
    if (!el) return;
    const sub = CONFIG.ROOM_NAME === CONFIG.BOT_NAME ? "안내소" : CONFIG.BOT_NAME + " 안내소";
    el.innerHTML = `
      <a class="brand" href="${link("index.html")}">
        <span class="brand__dot" aria-hidden="true"></span>
        <span class="brand__name">${esc(CONFIG.ROOM_NAME)}</span>
        <span class="brand__sub">${esc(sub)}</span>
      </a>
      <nav class="nav">
        ${nav.map(([h, t]) =>
          `<a href="${link(h)}" class="nav__item${h === active ? " is-on" : ""}">${t}</a>`).join("")}
      </nav>
      <span class="badge ${isAdmin() ? "badge--admin" : "badge--guest"}">
        ${isAdmin() ? "관리자" : "보기 전용"}
      </span>
      ${isAdmin() ? '<button class="btn btn--ghost btn--sm" data-logout>나가기</button>' : ""}
    `;
    const out = el.querySelector("[data-logout]");
    if (out) out.onclick = () => {
      try { sessionStorage.removeItem(SESSION); } catch (e) {}
      location.href = "index.html";
    };
  }

  window.App = { isAdmin, link, esc, toast, header };
})();
