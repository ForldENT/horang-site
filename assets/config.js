/* ============================================================
   config.js  —  여기만 고치면 사이트 설정이 바뀝니다.
   ============================================================ */

window.CONFIG = {
  /* 방 이름 / 봇 이름 */
  ROOM_NAME: "호랑봇",
  BOT_NAME: "호랑봇",

  /* 관리자 키.
     관리자 링크 = index.html?key=여기적은값
     Apps Script 를 쓸 때는 스크립트 쪽 ADMIN_KEY 와 똑같이 맞춰야 합니다. */
  ADMIN_KEY: "horang-2026",

  /* ============================================================
     구글 시트 연동 — 아래 두 가지 중 하나를 고르면 됩니다.

     [읽기 전용]  SHEET_ID 만 채움
        시트에 적으면 사이트에 나옵니다. 사이트에서는 수정 못 합니다.

     [읽기 + 쓰기]  SCRIPT_URL 까지 채움  ← 원하시는 방식
        사이트에서 관리자가 적으면 시트에 자동으로 저장됩니다.
        SHEETS.md 의 "Apps Script 붙이기" 를 먼저 하세요.
     ============================================================ */

  /* 시트 주소 가운데 부분 */
  SHEET_ID: "1jiInOSutI4f5mVDwJ_cxAyWcfsmKGhT-lfJLdOYtF10",

  /* Apps Script 를 배포하고 받은 주소 (.../exec 로 끝납니다)
     비워두면 읽기 전용으로 동작합니다. */
  SCRIPT_URL: "https://script.google.com/macros/s/AKfycbyNp-2YcxVnQvJ__YnrP9gI6PqV1Wr9Oj4AKMcaMAEqzzUC0KNxxAemtqv6Mu-Wf-746g/exec",

  /* 각 화면이 쓸 탭(시트) 이름 — 시트의 탭 이름과 정확히 같아야 합니다 */
  SHEETS: {
    commands: "명령어",
    members: "자소서",
    status: "매칭외출",
    patchnotes: "패치노트"
  }
};
