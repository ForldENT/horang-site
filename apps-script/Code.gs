/* ============================================================
   호랑봇 안내소 — 구글 시트 연결 스크립트

   설치 방법은 SHEETS.md 를 보세요. 요약하면:
     시트 → 확장 프로그램 → Apps Script → 이 내용 전체 붙여넣기
     → ADMIN_KEY 를 바꾸고 → 배포 → 웹 앱 → 액세스 권한 "모든 사용자"
   ============================================================ */

/* 사이트 config.js 의 ADMIN_KEY 와 똑같이 맞추세요. */
const ADMIN_KEY = "horang-2026";

/* 화면 ↔ 탭 이름. 시트의 탭 이름을 바꿨다면 여기도 바꾸세요. */
const TABS = {
  commands: "명령어",
  members: "자소서",
  status: "매칭외출",
  patchnotes: "패치노트"
};

/* 탭이 없을 때 자동으로 만들 제목 줄 */
const HEADERS = {
  commands: ["명령어", "설명", "분류", "관리자전용"],
  members: ["닉네임", "나이", "키", "전공 or 직업", "쉬는 요일", "취미", "MBTI",
            "본인의 매력", "이상형", "흡연유무 & 주량", "하고싶은 말"],
  status: ["닉네임", "상태", "상대", "복귀 예정", "메모"],
  patchnotes: ["날짜", "분류", "버전", "내용"]
};

/* ---------- 공통 ---------- */

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet(kind) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
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

/* ---------- 읽기 : 사이트가 화면을 그릴 때 ---------- */

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

/* ---------- 쓰기 : 관리자가 사이트에서 저장할 때 ---------- */

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
      if (!incoming[kind]) return;          // 안 보낸 항목은 건드리지 않습니다

      const sh = getSheet(kind);
      const head = HEADERS[kind];
      const rows = incoming[kind].map(function (r) {
        const row = [];
        for (var i = 0; i < head.length; i++) row.push(r[i] == null ? "" : r[i]);
        return row;
      });

      // 제목 줄만 남기고 지운 뒤 새로 씁니다
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

/* ---------- 설치 확인용 ----------
   Apps Script 편집기에서 이 함수를 한 번 실행하면
   탭 네 개가 자동으로 만들어지고 권한 승인 창이 뜹니다. */

function 준비하기() {
  Object.keys(TABS).forEach(function (kind) { getSheet(kind); });
  SpreadsheetApp.getActiveSpreadsheet().toast("탭 준비 완료", "호랑봇 안내소", 5);
}
