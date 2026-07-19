# 디자인 커스터마이즈 안내

고칠 파일은 **`assets/style.css` 하나**입니다. HTML은 열어볼 필요도 없습니다.

---

## 1단계 — 색부터 (가장 쉬움)

`theme-lab.html`을 브라우저로 열면 색을 눈으로 고르고 CSS를 복사할 수 있습니다.
복사한 내용을 `style.css` 맨 위 `:root { … }` 자리에 그대로 덮어쓰면 끝입니다.

직접 손으로 고치려면 여기만 보면 됩니다.

```css
:root {
  --bg:        #12141B;   /* 배경 */
  --panel:     #1B1F29;   /* 카드 배경 */
  --panel-2:   #232836;   /* 카드 안쪽, 입력창 */
  --line:      #2E3444;   /* 경계선 */
  --text:      #E8EBF3;   /* 본문 글자 */
  --text-dim:  #8B93A7;   /* 흐린 글자 */
  --accent:    #FF5C7A;   /* 강조 — 명령어 말풍선, 관리자 배지 */
  --accent-2:  #5FE1C0;   /* 보조 — 봇 이름, 매칭 상태 */
  --warn:      #FFC24B;   /* 외출 상태 */
  --radius:    14px;      /* 카드 모서리 */
  --radius-sm: 9px;       /* 버튼·입력창 모서리 */
}
```

밝은 테마로 갈 때 주의할 점 하나: `--bg`를 밝게 바꾸면 헤더 배경도 같이 바꿔야 합니다.

```css
.header { background: rgba(255, 255, 255, .82); }
```

---

## 2단계 — 글꼴

```css
:root {
  --font: "Pretendard", -apple-system, "Malgun Gothic", sans-serif;
  --font-mono: ui-monospace, "D2Coding", Menlo, monospace;
}
```

다른 한글 웹폰트를 쓰려면 파일 맨 위 `@import` 줄을 바꾸면 됩니다.
예를 들어 구글 폰트의 Gowun Dodum을 쓴다면:

```css
@import url("https://fonts.googleapis.com/css2?family=Gowun+Dodum&display=swap");
:root { --font: "Gowun Dodum", sans-serif; }
```

제목만 다른 글꼴로 두고 싶으면:

```css
.page__title, .hero__title, .member__nick { font-family: "원하는 폰트", var(--font); }
```

---

## 3단계 — 어디를 고치면 어디가 바뀌나

| 클래스 | 화면에서 보이는 곳 |
|---|---|
| `.header`, `.brand`, `.nav__item` | 맨 위 고정 바, 로고, 메뉴 |
| `.hero__title`, `.hero__desc` | 홈 큰 제목 |
| `.tile` | 홈의 세 칸 (명령어 / 멤버 / 현황) |
| `.page__eyebrow`, `.page__title` | 각 페이지 머리말 |
| `.cmds` | 명령어 목록 전체를 감싸는 상자 |
| `.cmd` | 명령어 한 줄 |
| `.cmd__key` | 왼쪽 명령어 글자 |
| `.cmd__desc` | 오른쪽 설명 글자 |
| `.cmds__group` | 분류 구분선 (신입 안내, 운영 …) |
| `.member`, `.member__nick`, `.row` | 멤버 소개 카드와 항목 줄 |
| `.status`, `.state--매칭`, `.state--외출` | 현황 카드와 상태 점 |
| `.btn`, `.btn--primary`, `.btn--danger` | 버튼 3종 |
| `.modal__box` | 추가·수정 팝업 |
| `.toast` | 저장했을 때 아래에 뜨는 알림 |
| `.empty` | 목록이 비었을 때 안내 |

---

## 4단계 — 자주 하는 커스텀

**명령어 칸 너비 조절** (긴 명령어가 잘릴 때)
```css
.cmd { grid-template-columns: 200px 1fr auto; }
```

**한 줄씩 구분선 넣기**
```css
.cmd { border-bottom: 1px solid var(--line); border-radius: 0; }
```

**카드에 그림자 넣기**
```css
.card, .tile { box-shadow: 0 6px 20px rgba(0,0,0,.25); }
```

**배경에 이미지 깔기**
```css
body {
  background: url("images/bg.jpg") center / cover fixed, var(--bg);
}
.card, .header { backdrop-filter: blur(12px); }
```

**멤버 카드를 한 줄에 3개씩**
```css
.grid--2 { grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
```

**메뉴를 알약 대신 밑줄로**
```css
.nav__item.is-on { background: none; color: var(--accent); border-bottom: 2px solid var(--accent); border-radius: 0; }
```

---

## 건드리면 안 되는 것

- `data-`로 시작하는 속성 (`data-list`, `data-modal` 등) — 자바스크립트가 찾는 표식입니다. 지우면 화면이 안 그려집니다.
- `.state--매칭`, `.state--외출` 의 한글 부분 — 데이터 값과 붙어 있어서 이름을 바꾸면 상태 색이 사라집니다.
- `assets/app.js`, `assets/store.js` — 동작 담당입니다.

---

## 확인하고 올리기

브라우저에서 새로고침할 때 CSS가 안 바뀌면 `Ctrl+Shift+R`(맥은 `Cmd+Shift+R`)로 강제 새로고침하세요.

```bash
git add assets/style.css
git commit -m "사이트 색상 테마 변경"
git push
```
