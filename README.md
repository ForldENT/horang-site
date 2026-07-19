# 호랑봇 안내소

카카오톡 오픈채팅방 멤버들이 봇 명령어, 멤버 소개, 매칭·외출 현황을 찾아보는 웹사이트입니다.

---

## 어떤 링크를 누구에게 주면 되나

배포 주소가 `https://forldent.github.io/horang-site/` 라고 할 때,
**주소 뒤에 `?key=...`가 붙었는지 아닌지** 하나로 갈립니다.

### 방 사람들에게 (공지·프로필에 올릴 주소)

```
https://forldent.github.io/horang-site/
```

명령어, 멤버 소개, 매칭·외출을 **보기만** 합니다.
수정 버튼은 화면에 나타나지도 않으므로, 이 주소만 아는 사람은 어떤 내용도 바꿀 수 없습니다.

### 운영진에게만 (개인 메시지로 전달)

```
https://forldent.github.io/horang-site/?key=horang-2026
```

세 페이지 모두 추가 · 수정 · 삭제 버튼이 생깁니다.
**단톡방에 올리지 마세요.** 이 주소를 받은 사람은 누구나 수정할 수 있습니다.

### 링크를 잘못 뿌렸다면

`assets/config.js`의 `ADMIN_KEY`를 다른 값으로 바꾸고 다시 push하면 기존 관리자 링크는 바로 무효가 됩니다.

```bash
git add assets/config.js
git commit -m "관리자 키 변경"
git push
```

### 참고

- 관리자 상태는 **탭을 닫으면 풀립니다.** 홈의 `나가기` 버튼으로도 풀 수 있습니다.
- 관리자로 들어가면 홈에 **일반 공유 주소 복사** 버튼이 있습니다. 방에 올릴 주소는 그 버튼으로 복사하면 실수가 없습니다.
- 특정 페이지를 바로 열게 하려면 뒤에 파일명을 붙이면 됩니다.
  - 명령어만: `.../horang-site/commands.html`
  - 멤버 소개만: `.../horang-site/members.html`
  - 매칭·외출만: `.../horang-site/status.html`

---

## 파일 구성

```
horang-site/
├─ index.html        홈 (관리자 진입도 여기)
├─ commands.html     명령어
├─ members.html      멤버 소개 (자소서)
├─ status.html       매칭 · 외출 현황
├─ theme-lab.html    디자인 색을 고르는 도구 (작업용)
├─ DESIGN.md         꾸미는 사람용 안내
└─ assets/
   ├─ config.js      ← 관리자 키, 구글 시트 주소
   ├─ style.css      ← 꾸미는 사람은 이 파일만 만지면 됩니다
   ├─ store.js       데이터 저장·불러오기
   └─ app.js         관리자 판별, 공통 헤더
```

HTML 파일과 `assets` 폴더는 **항상 같은 위치**에 있어야 합니다. 떨어지면 흰 배경에 파란 링크만 나옵니다.

---

## 처음 설정할 것

`assets/config.js`를 열어 세 가지를 확인하세요.

```js
ROOM_NAME: "호랑봇",      // 헤더에 크게 나오는 이름
BOT_NAME:  "호랑봇",      // 명령어 화면에서 답하는 쪽 이름
ADMIN_KEY: "horang-2026", // ← 반드시 다른 값으로 바꾸세요
```

---

## 구글 시트 연동

1. 시트에서 `파일 → 공유 → 웹에 게시 → 쉼표로 구분된 값(.csv)` 선택
2. 나온 주소를 `assets/config.js`의 `SHEETS`에 붙여넣기
3. 각 페이지에 **시트에서 불러오기** 버튼이 생깁니다 (관리자에게만 보임)

시트 첫 줄은 제목 줄이고, 열 순서는 아래와 같아야 합니다.

- **명령어**: 명령어 / 설명 / 분류 / 관리자전용(Y·N)
- **멤버**: 닉네임 / 나이 / 키 / 전공 / 쉬는요일 / 취미 / MBTI / 매력 / 이상형 / 흡연·주량 / 하고싶은말
- **현황**: 닉네임 / 상태(매칭·외출) / 상대 / 복귀예정 / 메모

`SHEET_LINKS`에 시트 편집 주소를 넣으면 **시트 열기** 버튼도 생깁니다.

---

## 데이터가 저장되는 곳

브라우저 localStorage입니다. 즉 **수정한 사람의 브라우저에만 남습니다.**
운영자가 여러 명이거나 기기를 바꿀 때는 둘 중 하나를 쓰세요.

- 구글 시트를 원본으로 쓰고, 사이트는 불러오기만 하기 (추천)
- 홈의 `데이터 내보내기`로 JSON 저장 → 다른 기기에서 `데이터 가져오기`

---

## 보안

관리자 키는 브라우저에서 소스를 열면 확인할 수 있는 **간이 잠금**입니다.
"아무나 실수로 고치지 못하게" 하는 용도이지, "작정한 사람을 막는" 용도는 아닙니다.
오픈채팅방 운영에는 보통 충분하지만, 남에게 보이면 안 되는 개인정보를 올릴 거라면 로그인과 DB를 갖춘 서버 버전이 필요합니다.

---

## 배포 (GitHub Pages)

```bash
cd horang-site
git init
git add .
git commit -m "호랑봇 안내소 초기 버전"
git branch -M main
git remote add origin https://github.com/ForldENT/horang-site.git
git push -u origin main
```

push한 뒤 저장소 → Settings → Pages → Source를 `main / (root)`로 두면 1~2분 뒤 주소가 열립니다.

이후 수정할 때:

```bash
git add .
git commit -m "명령어 목록 수정"
git push
```

반영까지 30초~2분 걸립니다. 안 바뀌면 `Ctrl+Shift+R`로 강제 새로고침하세요.

---

## 로컬에서 확인하기

`index.html`을 더블클릭해도 화면은 나오지만, 브라우저가 저장을 막아 수정 내용이 새로고침 때 사라질 수 있습니다. 제대로 확인하려면:

```bash
cd horang-site
python3 -m http.server 8000
```

- 일반 화면: `http://localhost:8000`
- 관리자 화면: `http://localhost:8000/?key=horang-2026`
