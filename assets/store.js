/* ============================================================
   store.js — 데이터 저장/불러오기
   저장 위치: 브라우저 localStorage (없으면 메모리)
   ============================================================ */

(function () {
  const KEY = "horang.data.v1";
  let memory = null; // localStorage를 못 쓰는 환경용 대체 저장소

  const SEED = {
    commands: [
      { cmd: "/신입", desc: "새로 들어온 사람에게 인사 + 안내를 시작합니다.", cat: "온보딩", admin: false },
      { cmd: "/1", desc: "닉변 양식을 안내합니다. (성별 닉 나이 지역)", cat: "온보딩", admin: false },
      { cmd: "/2", desc: "매력 어필 단계로 넘어갑니다.", cat: "온보딩", admin: false },
      { cmd: "/3", desc: "얼공은 자유라고 안내합니다.", cat: "온보딩", admin: false },
      { cmd: "/4", desc: "최근 3분간 대화한 사람 목록을 띄워 이성을 지목합니다.", cat: "온보딩", admin: false },
      { cmd: "/5", desc: "도용인증 혜택과 마감일(안내일 +5일)을 알려줍니다.", cat: "온보딩", admin: false },
      { cmd: "/도움말", desc: "전체 명령어 목록을 채팅에 출력합니다.", cat: "기본", admin: false },
      { cmd: "/도인", desc: "도용인증 방법을 안내합니다.", cat: "인증", admin: false },
      { cmd: "/맞공", desc: "맞공 규칙을 안내합니다.", cat: "인증", admin: false },
      { cmd: "/보룸", desc: "보이스룸 이용 안내를 띄웁니다.", cat: "기본", admin: false },
      { cmd: "/얼", desc: "얼공 관련 규정을 안내합니다.", cat: "인증", admin: false },
      { cmd: "/쉿", desc: "신입 안내 중 다른 사람들의 발언을 통제합니다.", cat: "운영", admin: true },
      { cmd: "/땡", desc: "채팅 통제를 해제합니다.", cat: "운영", admin: true },
      { cmd: "/단타", desc: "단타방 안내를 띄웁니다.", cat: "기본", admin: false },
      { cmd: "/하트", desc: "하트를 보냅니다.", cat: "재미", admin: false },
      { cmd: "/메뉴", desc: "오늘의 메뉴를 추천합니다. (구글 시트 연동)", cat: "재미", admin: false },
      { cmd: "/로또번호", desc: "로또 번호를 뽑아줍니다.", cat: "재미", admin: false },
      { cmd: "/가위바위보", desc: "봇과 가위바위보를 합니다.", cat: "재미", admin: false },
      { cmd: "/게임설명", desc: "방에서 하는 게임 규칙을 설명합니다.", cat: "재미", admin: false }
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
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* 저장소 사용 불가 */ }
    if (memory) return memory;
    return JSON.parse(JSON.stringify(SEED));
  }

  function write(data) {
    memory = data;
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      return false; // 메모리에는 남아있음 (새로고침하면 사라짐)
    }
  }

  /* ---------- CSV ---------- */
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

  async function fetchSheet(url) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("시트를 불러오지 못했습니다 (" + res.status + ")");
    const rows = parseCSV(await res.text());
    if (rows.length < 2) throw new Error("시트에 내용이 없습니다.");
    return rows.slice(1).map(r => r.map(v => v.trim()));
  }

  window.Store = {
    get: read,
    set: write,
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

    /* 구글 시트에서 덮어쓰기 */
    async syncCommands() {
      const rows = await fetchSheet(CONFIG.SHEETS.commands);
      const data = read();
      data.commands = rows.map(r => ({
        cmd: r[0] || "", desc: r[1] || "", cat: r[2] || "기타",
        admin: /^(y|yes|true|o|관리자)$/i.test(r[3] || "")
      })).filter(c => c.cmd);
      write(data);
      return data.commands.length;
    },
    async syncMembers() {
      const rows = await fetchSheet(CONFIG.SHEETS.members);
      const data = read();
      data.members = rows.map(r => ({
        nick: r[0] || "", age: r[1] || "", height: r[2] || "", job: r[3] || "",
        off: r[4] || "", hobby: r[5] || "", mbti: r[6] || "", charm: r[7] || "",
        ideal: r[8] || "", smoke: r[9] || "", say: r[10] || ""
      })).filter(m => m.nick);
      write(data);
      return data.members.length;
    },
    async syncStatus() {
      const rows = await fetchSheet(CONFIG.SHEETS.status);
      const data = read();
      data.status = rows.map(r => ({
        nick: r[0] || "", state: r[1] || "매칭", partner: r[2] || "",
        back: r[3] || "", note: r[4] || ""
      })).filter(s => s.nick);
      write(data);
      return data.status.length;
    }
  };
})();
