/* ============================================================
   호랑봇 안내소 — 구글 시트 연결 스크립트

   설치는 SHEETS.md 참고. 요약:
     시트 → 확장 프로그램 → Apps Script → 이 내용 전체 붙여넣기
     → ADMIN_KEY 바꾸기 → setup 실행 → 배포(웹 앱, 모든 사용자)
   ============================================================ */

/* 사이트 config.js 의 ADMIN_KEY 와 똑같이 맞추세요. */
const ADMIN_KEY = "horang-2026";

/* 시트 ID.
   시트에서 [확장 프로그램 → Apps Script] 로 만들었다면 비워둬도 됩니다.
   script.google.com 에서 따로 만들었다면 반드시 채워야 합니다. */
const SHEET_ID = "1jiInOSutI4f5mVDwJ_cxAyWcfsmKGhT-lfJLdOYtF10";

/* 화면 ↔ 탭 이름. 탭 이름을 바꿨다면 여기도 바꾸세요. */
const TABS = {
  commands: "명령어",
  members: "자소서",
  status: "매칭외출",
  patchnotes: "패치노트"
};

/* 탭을 새로 만들 때 넣을 제목 줄 */
const HEADERS = {
  commands: ["명령어", "설명", "분류", "관리자전용"],
  members: ["닉네임", "나이", "키", "전공 or 직업", "쉬는 요일", "취미", "MBTI",
            "본인의 매력", "이상형", "흡연유무 & 주량", "하고싶은 말"],
  status: ["닉네임", "상태", "상대", "복귀 예정", "메모"],
  patchnotes: ["날짜", "분류", "버전", "내용"]
};

/* ============================================================
   설치 확인 — 편집기에서 이 함수를 실행하세요.
   탭 네 개를 만들고, 결과를 아래 [실행 로그] 에 찍어줍니다.
   ============================================================ */
function setup() {
  const ss = book();
  Logger.log("연결된 시트: " + ss.getName());
  Logger.log("시트 주소: " + ss.getUrl());

  const made = [], already = [];
  Object.keys(TABS).forEach(function (kind) {
    if (ss.getSheetByName(TABS[kind])) already.push(TABS[kind]);
    else made.push(TABS[kind]);
    getSheet(kind);
  });

  Logger.log("새로 만든 탭: " + (made.length ? made.join(", ") : "없음"));
  Logger.log("이미 있던 탭: " + (already.length ? already.join(", ") : "없음"));
  Logger.log("현재 탭 전체: " + ss.getSheets().map(function (s) { return s.getName(); }).join(", "));
  Logger.log("--- 여기까지 보이면 성공입니다. 시트를 새로고침하세요. ---");

  return "완료 — 위 로그를 확인하세요.";
}

/* ============================================================
   공통
   ============================================================ */

function book() {
  let ss = null;
  try { ss = SpreadsheetApp.getActiveSpreadsheet(); } catch (e) { /* 무시 */ }
  if (!ss && SHEET_ID) {
    try { ss = SpreadsheetApp.openById(SHEET_ID); } catch (e) {
      throw new Error("SHEET_ID 로 시트를 열지 못했습니다. ID가 맞는지, 이 계정에 권한이 있는지 확인하세요. (" + e + ")");
    }
  }
  if (!ss) {
    throw new Error("시트를 찾지 못했습니다. 이 스크립트가 시트에 연결돼 있지 않다면 위쪽 SHEET_ID 를 채우세요.");
  }
  return ss;
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet(kind) {
  const ss = book();
  const name = TABS[kind];
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(HEADERS[kind]);
    sh.getRange(1, 1, 1, HEADERS[kind].length).setFontWeight("bold");
    sh.setFrozenRows(1);
  }
  return sh;
}

/* ============================================================
   읽기 — 사이트가 화면을 그릴 때
   ============================================================ */

function doGet(e) {
  try {
    const data = {};
    Object.keys(TABS).forEach(function (kind) {
      const sh = getSheet(kind);
      const last = sh.getLastRow();
      if (last < 2) { data[kind] = []; return; }

      const width = HEADERS[kind].length;
      const values = sh.getRange(2, 1, last - 1, width).getDisplayValues();

      data[kind] = values.filter(function (row) {
        return row.some(function (v) { return String(v).trim() !== ""; });
      }).map(function (row) {
        return row.map(function (v) { return String(v).trim(); });
      });
    });
    return json({ ok: true, data: data });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

/* ============================================================
   쓰기 — 관리자가 사이트에서 저장할 때
   ============================================================ */

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);   // 두 사람이 동시에 저장해도 섞이지 않도록

    const body = JSON.parse(e.postData.contents);

    if (body.key !== ADMIN_KEY) {
      return json({ ok: false, error: "관리자 키가 맞지 않습니다." });
    }

    const incoming = body.data || {};

    Object.keys(TABS).forEach(function (kind) {
      if (!incoming[kind]) return;          // 안 보낸 항목은 그대로 둡니다

      const sh = getSheet(kind);
      const head = HEADERS[kind];
      const rows = incoming[kind].map(function (r) {
        const row = [];
        for (var i = 0; i < head.length; i++) row.push(r[i] == null ? "" : r[i]);
        return row;
      });

      if (sh.getLastRow() > 1) {
        sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).clearContent();
      }
      sh.getRange(1, 1, 1, head.length).setValues([head]);
      if (rows.length) {
        sh.getRange(2, 1, rows.length, head.length).setValues(rows);
      }
    });

    return json({ ok: true, savedAt: new Date().toISOString() });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}
