/* ============================================================
   store.js — 데이터 저장/불러오기
   저장 위치: 브라우저 localStorage (없으면 메모리)
   ============================================================ */

(function () {
  const KEY = "horang.data.v1";
  let memory = null;   // localStorage를 못 쓰는 환경용 대체 저장소
  let cache = null;    // 시트에서 받아온 내용을 담아두는 곳

  /* 시트 모드 — config.js 의 SHEET_ID 가 채워져 있으면 시트가 원본입니다. */
  const SHEET_ID = (window.CONFIG && CONFIG.SHEET_ID || "").trim();
  const useSheet = !!SHEET_ID;

  /* 탭 하나를 CSV로 읽어오는 주소 */
  function sheetUrl(tab) {
    return "https://docs.google.com/spreadsheets/d/" + SHEET_ID
      + "/gviz/tq?tqx=out:csv&sheet=" + encodeURIComponent(tab)
      + "&_=" + Date.now();   // 브라우저가 옛 내용을 재활용하지 않도록
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
    ]
  };

  function read() {
    if (cache) return cache;
    if (useSheet) return { commands: [], members: [], status: [] }; // load() 전
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* 저장소 사용 불가 */ }
    if (memory) return memory;
    return JSON.parse(JSON.stringify(SEED));
  }

  /* 시트 모드에서는 쓰지 않습니다. 수정은 시트에서 합니다. */
  function write(data) {
    if (useSheet) return false;
    cache = data;
    memory = data;
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      return false; // 메모리에는 남아있음 (새로고침하면 사라짐)
    }
  }

  /* ---------- CSV 읽기 ---------- */
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

  /* 탭 하나를 읽어 제목 줄을 뺀 배열로 돌려줍니다. */
  async function fetchTab(tab) {
    let res;
    try {
      res = await fetch(sheetUrl(tab), { cache: "no-store" });
    } catch (e) {
      throw new Error("시트에 연결하지 못했습니다. 공유 설정을 확인해 주세요.");
    }
    if (!res.ok) {
      throw new Error(res.status === 404
        ? "\"" + tab + "\" 탭을 찾지 못했습니다. 탭 이름을 확인해 주세요."
        : "시트를 불러오지 못했습니다. (" + res.status + ") 공유 설정이 '링크가 있는 모든 사용자'인지 확인해 주세요.");
    }
    const rows = parseCSV(await res.text());
    return rows.slice(1).map(r => r.map(v => (v || "").trim()));
  }

  /* 페이지가 열릴 때마다 시트를 새로 읽습니다.
     시트를 안 쓰면 저장돼 있던 내용을 그대로 돌려줍니다. */
  async function load() {
    if (!useSheet) return read();

    const tabs = CONFIG.SHEETS || {};
    const [c, m, st] = await Promise.all([
      tabs.commands ? fetchTab(tabs.commands) : [],
      tabs.members ? fetchTab(tabs.members) : [],
      tabs.status ? fetchTab(tabs.status) : []
    ]);

    cache = {
      commands: c.map(r => ({
        cmd: r[0] || "", desc: r[1] || "", cat: r[2] || "기타",
        admin: /^(y|yes|true|o|ㅇ|관리자|운영자)$/i.test(r[3] || "")
      })).filter(x => x.cmd),

      members: m.map(r => ({
        nick: r[0] || "", age: r[1] || "", height: r[2] || "", job: r[3] || "",
        off: r[4] || "", hobby: r[5] || "", mbti: r[6] || "", charm: r[7] || "",
        ideal: r[8] || "", smoke: r[9] || "", say: r[10] || ""
      })).filter(x => x.nick),

      status: st.map(r => ({
        nick: r[0] || "", state: (r[1] || "매칭").indexOf("외출") >= 0 ? "외출" : "매칭",
        partner: r[2] || "", back: r[3] || "", note: r[4] || ""
      })).filter(x => x.nick)
    };
    return cache;
  }

  window.Store = {
    get: read,
    set: write,
    load: load,
    useSheet: useSheet,

    /* 시트 편집 화면 주소 */
    sheetEditUrl() {
      return useSheet ? "https://docs.google.com/spreadsheets/d/" + SHEET_ID + "/edit" : "";
    },

    reset() { write(JSON.parse(JSON.stringify(SEED))); },

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
          const data = JSON.parse(fr.result);
          if (!data.commands || !data.members || !data.status) throw new Error("형식이 맞지 않습니다.");
          write(data);
          done(null);
        } catch (e) { done(e); }
      };
      fr.onerror = () => done(new Error("파일을 읽지 못했습니다."));
      fr.readAsText(file);
    },

    /* 지금 목록을 시트에 붙여넣을 수 있는 CSV로 만들어 줍니다. */
    toCSV(which) {
      const q = v => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
      const d = read();
      if (which === "commands") {
        return ["명령어,설명,분류,관리자전용"].concat(
          d.commands.map(c => [c.cmd, c.desc, c.cat, c.admin ? "Y" : "N"].map(q).join(","))).join("\n");
      }
      if (which === "members") {
        return ["닉네임,나이,키,전공 or 직업,쉬는 요일,취미,MBTI,본인의 매력,이상형,흡연유무 & 주량,하고싶은 말"].concat(
          d.members.map(m => [m.nick, m.age, m.height, m.job, m.off, m.hobby, m.mbti, m.charm, m.ideal, m.smoke, m.say].map(q).join(","))).join("\n");
      }
      return ["닉네임,상태,상대,복귀 예정,메모"].concat(
        d.status.map(x => [x.nick, x.state, x.partner, x.back, x.note].map(q).join(","))).join("\n");
    }
  };
})();
