/* ============================================================
   store.js — 데이터 읽기 / 쓰기

   동작 모드는 config.js 가 정합니다.
     SCRIPT_URL 있음  → 구글 시트 읽기 + 쓰기 (Apps Script)
     SHEET_ID 만 있음 → 구글 시트 읽기 전용 (CSV)
     둘 다 없음        → 이 브라우저에만 저장 (localStorage)
   ============================================================ */

(function () {
  const KEY = "horang.data.v1";
  let memory = null;
  let cache = null;

  const SHEET_ID   = (window.CONFIG && CONFIG.SHEET_ID   || "").trim();
  const SCRIPT_URL = (window.CONFIG && CONFIG.SCRIPT_URL || "").trim();

  const MODE = SCRIPT_URL ? "script" : (SHEET_ID ? "sheet" : "local");
  const canWrite = MODE !== "sheet";   // 읽기 전용 시트일 때만 수정 불가

  function adminKey() {
    try { return sessionStorage.getItem("horang.key") || ""; } catch (e) { return ""; }
  }

  const SEED = {
    commands: [
      { cmd: "/신입", desc: "신입 가이드를 시작합니다.", cat: "신입 안내", admin: false },
      { cmd: "/1 ~ /5", desc: "가이드를 단계별로 실행합니다.", cat: "신입 안내", admin: false },
      { cmd: "/다시", desc: "닉네임 양식을 다시 안내합니다.", cat: "신입 안내", admin: false },
      { cmd: "/종료", desc: "신입 절차를 강제로 종료합니다.", cat: "신입 안내", admin: true },
      { cmd: "/카프", desc: "오픈프로필에서 카카오프로필로 바꾸는 방법을 안내합니다.", cat: "신입 안내", admin: false },
      { cmd: "/중복", desc: "닉네임이 겹친다고 경고합니다.", cat: "신입 안내", admin: true },
      { cmd: "/남마", desc: "남자 마감을 안내합니다.", cat: "신입 안내", admin: true },
      { cmd: "/신입질문", desc: "신입 공통 질문 양식을 띄웁니다.", cat: "신입 안내", admin: false },

      { cmd: "/도인", desc: "도용인증 방법을 자세히 안내합니다.", cat: "인증 · 규정", admin: false },
      { cmd: "/맞공", desc: "서로 얼굴을 공개하는 규정을 안내합니다.", cat: "인증 · 규정", admin: false },
      { cmd: "/보룸", desc: "보이스룸 규정을 안내합니다.", cat: "인증 · 규정", admin: false },
      { cmd: "/얼", desc: "얼굴 공개할 때 주의사항을 안내합니다.", cat: "인증 · 규정", admin: false },
      { cmd: "/하트", desc: "본방 하트 인증 방법을 안내합니다.", cat: "인증 · 규정", admin: false },

      { cmd: "/쉿", desc: "채팅 통제를 시작합니다.", cat: "운영", admin: true },
      { cmd: "/땡", desc: "채팅 통제를 해제합니다.", cat: "운영", admin: true },
      { cmd: "/단타", desc: "채팅방 독점을 경고합니다.", cat: "운영", admin: true },

      { cmd: "/서울날씨", desc: "지역별 오늘 날씨를 알려줍니다. (지역 이름을 바꿔 쓰세요)", cat: "생활 · 재미", admin: false },
      { cmd: "/안녕", desc: "봇이 인사합니다.", cat: "생활 · 재미", admin: false },
      { cmd: "/뭐먹지", desc: "오늘 먹을 메뉴를 추천합니다.", cat: "생활 · 재미", admin: false },
      { cmd: "/필수", desc: "방 필수 안내를 띄웁니다.", cat: "생활 · 재미", admin: false },
      { cmd: "/로또", desc: "로또 번호를 뽑아줍니다.", cat: "생활 · 재미", admin: false },
      { cmd: "/로또번호", desc: "로또 마지막 번호를 맞춰봅니다.", cat: "생활 · 재미", admin: false },
      { cmd: "/눈치게임", desc: "눈치게임을 시작합니다. 끝 숫자를 외치면 걸립니다.", cat: "생활 · 재미", admin: false },
      { cmd: "/가위 /바위 /보", desc: "봇과 가위바위보를 합니다.", cat: "생활 · 재미", admin: false },
      { cmd: "/게임설명", desc: "방에서 하는 게임 방법을 설명합니다.", cat: "생활 · 재미", admin: false },

      { cmd: "/심테", desc: "연애유형 테스트 링크를 보내줍니다.", cat: "연애유형", admin: false },
      { cmd: "/유형명", desc: "유형 설명과 어울리는 이성을 알려줍니다. (예: /심약핑)", cat: "연애유형", admin: false },
      { cmd: "/유형명등록", desc: "내 유형을 등록합니다. (예: /심약핑등록)", cat: "연애유형", admin: false },
      { cmd: "/유형명목록", desc: "그 유형인 사람 명단을 봅니다. (예: /심약핑목록)", cat: "연애유형", admin: false },
      { cmd: "/유형명빼기 [닉]", desc: "그 유형에서 사람을 뺍니다.", cat: "연애유형", admin: true },

      { cmd: "/도움말", desc: "전체 명령어 목록을 채팅에 출력합니다.", cat: "기본", admin: false }
    ],
    members: [
      {
        nick: "호랑", age: "30", height: "178", job: "게임 개발",
        off: "주말", hobby: "헬스, 게임", mbti: "ENTJ",
        charm: "말 잘 들어줍니다", ideal: "웃음 많은 사람",
        smoke: "비흡연 / 소주 1병", say: "잘 부탁드립니다!"
      }
    ],
    status: [
      { nick: "호랑", state: "외출", partner: "", back: "오늘 22시", note: "저녁 약속" }
    ],
    patchnotes: [
      { date: "2026-07-20", cat: "신규 기능 추가", ver: "1.0.0", body: "안내소 사이트를 열었습니다. 명령어, 멤버 소개, 매칭·외출 현황을 볼 수 있습니다." }
    ]
  };


  /* 빠진 항목이 있어도 화면이 깨지지 않게 채워줍니다. */
  function normalize(d) {
    d = d || {};
    ["commands", "members", "status", "patchnotes"].forEach(k => {
      if (!Array.isArray(d[k])) d[k] = [];
    });
    return d;
  }

  /* ---------- 분류 · 날짜 정리 ---------- */
  const CATS = ["오류 수정", "신규 기능 추가", "기존 기능 삭제"];

  function normCat(v) {
    v = (v || "").trim();
    if (CATS.indexOf(v) >= 0) return v;
    if (/오류|버그|수정|fix/i.test(v)) return "오류 수정";
    if (/삭제|제거|중단|remove/i.test(v)) return "기존 기능 삭제";
    return "신규 기능 추가";
  }

  function normDate(v) {
    v = (v || "").trim();
    if (!v) return "";
    const m = v.match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
    if (!m) return v;
    return m[1] + "-" + ("0" + m[2]).slice(-2) + "-" + ("0" + m[3]).slice(-2);
  }

  /* ---------- 표의 줄 ↔ 화면에 쓰는 값 ---------- */
  const MAP = {
    commands: {
      head: ["명령어", "설명", "분류", "관리자전용"],
      toObj: r => ({ cmd: r[0] || "", desc: r[1] || "", cat: r[2] || "기타",
                     admin: /^(y|yes|true|o|ㅇ|관리자|운영자)$/i.test(r[3] || "") }),
      toRow: c => [c.cmd, c.desc, c.cat, c.admin ? "Y" : "N"],
      keep: x => !!x.cmd
    },
    members: {
      head: ["닉네임", "나이", "키", "전공 or 직업", "쉬는 요일", "취미", "MBTI",
             "본인의 매력", "이상형", "흡연유무 & 주량", "하고싶은 말"],
      toObj: r => ({ nick: r[0] || "", age: r[1] || "", height: r[2] || "", job: r[3] || "",
                     off: r[4] || "", hobby: r[5] || "", mbti: r[6] || "", charm: r[7] || "",
                     ideal: r[8] || "", smoke: r[9] || "", say: r[10] || "" }),
      toRow: m => [m.nick, m.age, m.height, m.job, m.off, m.hobby, m.mbti, m.charm, m.ideal, m.smoke, m.say],
      keep: x => !!x.nick
    },
    status: {
      head: ["닉네임", "상태", "상대", "복귀 예정", "메모"],
      toObj: r => ({ nick: r[0] || "", state: (r[1] || "매칭").indexOf("외출") >= 0 ? "외출" : "매칭",
                     partner: r[2] || "", back: r[3] || "", note: r[4] || "" }),
      toRow: s => [s.nick, s.state, s.partner, s.back, s.note],
      keep: x => !!x.nick
    },
    patchnotes: {
      head: ["날짜", "분류", "버전", "내용"],
      toObj: r => ({ date: normDate(r[0]), cat: normCat(r[1]), ver: r[2] || "", body: r[3] || "" }),
      toRow: n => [n.date, n.cat, n.ver, n.body],
      keep: x => !!x.date && !!x.body
    }
  };

  const KINDS = Object.keys(MAP);

  function rowsToData(raw) {
    const out = {};
    KINDS.forEach(k => {
      out[k] = (raw[k] || []).map(MAP[k].toObj).filter(MAP[k].keep);
    });
    return out;
  }

  function dataToRows(d) {
    const out = {};
    KINDS.forEach(k => { out[k] = (d[k] || []).map(MAP[k].toRow); });
    return out;
  }

  /* ---------- 읽기 ---------- */
  function read() {
    if (cache) return cache;
    if (MODE !== "local") return normalize({});   // load() 전
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return normalize(JSON.parse(raw));
    } catch (e) { /* 저장소 사용 불가 */ }
    if (memory) return memory;
    return normalize(JSON.parse(JSON.stringify(SEED)));
  }

  /* ---------- CSV (읽기 전용 모드) ---------- */
  function parseCSV(text) {
    const rows = [];
    let row = [], cell = "", quoted = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (quoted) {
        if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
        else if (c === '"') quoted = false;
        else cell += c;
      } else {
        if (c === '"') quoted = true;
        else if (c === ",") { row.push(cell); cell = ""; }
        else if (c === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
        else if (c !== "\r") cell += c;
      }
    }
    if (cell.length || row.length) { row.push(cell); rows.push(row); }
    return rows.filter(r => r.some(v => v.trim() !== ""));
  }

  async function fetchTab(tab) {
    const url = "https://docs.google.com/spreadsheets/d/" + SHEET_ID
      + "/gviz/tq?tqx=out:csv&sheet=" + encodeURIComponent(tab) + "&_=" + Date.now();
    let res;
    try { res = await fetch(url, { cache: "no-store" }); }
    catch (e) { throw new Error("시트에 연결하지 못했습니다. 공유 설정을 확인해 주세요."); }
    if (!res.ok) {
      throw new Error(res.status === 404
        ? "\"" + tab + "\" 탭을 찾지 못했습니다. 탭 이름을 확인해 주세요."
        : "시트를 불러오지 못했습니다. (" + res.status + ") 공유가 '링크가 있는 모든 사용자'인지 확인해 주세요.");
    }
    return parseCSV(await res.text()).slice(1).map(r => r.map(v => (v || "").trim()));
  }

  /* ---------- 불러오기 ---------- */
  async function load() {
    if (MODE === "local") return read();

    if (MODE === "script") {
      let res, j;
      try {
        res = await fetch(SCRIPT_URL + "?action=read&_=" + Date.now(), { redirect: "follow" });
        j = await res.json();
      } catch (e) {
        throw new Error("시트를 불러오지 못했습니다. Apps Script 주소와 배포 권한을 확인해 주세요.");
      }
      if (!j || !j.ok) throw new Error((j && j.error) || "시트를 불러오지 못했습니다.");
      cache = rowsToData(j.data || {});
      return cache;
    }

    const tabs = CONFIG.SHEETS || {};
    const got = await Promise.all(KINDS.map(k => tabs[k] ? fetchTab(tabs[k]) : []));
    const raw = {};
    KINDS.forEach((k, i) => raw[k] = got[i]);
    cache = rowsToData(raw);
    return cache;
  }

  /* ---------- 저장 ---------- */
  function write(data) {
    if (!canWrite) return false;
    cache = data;
    memory = data;

    if (MODE === "script") {
      /* 화면은 이미 바뀌었고, 시트 저장은 뒤이어 진행합니다.
         Content-Type 을 text/plain 으로 보내야 브라우저가 사전 확인 요청을
         보내지 않아 Apps Script 가 그대로 받습니다. */
      fetch(SCRIPT_URL, {
        method: "POST",
        redirect: "follow",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ key: adminKey(), data: dataToRows(data) })
      })
        .then(r => r.json())
        .then(j => { if (!j || !j.ok) throw new Error((j && j.error) || "시트에 저장하지 못했습니다."); })
        .catch(e => {
          if (window.App) App.toast(e.message + " 새로고침하면 되돌아갑니다.", true);
        });
      return true;
    }

    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      return false;
    }
  }

  window.Store = {
    get: read,
    set: write,
    load: load,

    MODE: MODE,
    canWrite: canWrite,
    useSheet: MODE !== "local",
    CATS: CATS,
    normCat: normCat,
    normDate: normDate,

    sheetEditUrl() {
      return SHEET_ID ? "https://docs.google.com/spreadsheets/d/" + SHEET_ID + "/edit" : "";
    },

    reset() { write(normalize(JSON.parse(JSON.stringify(SEED)))); },

    export() {
      const blob = new Blob([JSON.stringify(read(), null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "horang-data.json";
      a.click();
      URL.revokeObjectURL(a.href);
    },

    import(file, done) {
      const fr = new FileReader();
      fr.onload = () => {
        try {
          const data = normalize(JSON.parse(fr.result));
          write(data);
          done(null);
        } catch (e) { done(new Error("파일 형식이 맞지 않습니다.")); }
      };
      fr.onerror = () => done(new Error("파일을 읽지 못했습니다."));
      fr.readAsText(file);
    },

    /* 지금 목록을 시트에 붙여넣을 CSV 로 */
    toCSV(which) {
      const q = v => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
      const m = MAP[which], d = read();
      return [m.head.join(",")].concat((d[which] || []).map(x => m.toRow(x).map(q).join(","))).join("\n");
    }
  };
})();
