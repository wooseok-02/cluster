1. 프로젝트 스택

프레임워크: React 19 + Vite 8
라우팅: react-router-dom 6 (BrowserRouter)
스타일: Tailwind v4 (CSS-first config, tailwind.config.js 없음)
상태관리: Context API (src/context/AuthContext.jsx)
HTTP: axios (src/api/)
PWA: vite-plugin-pwa (이미 셋업됨, 건드릴 필요 없음)
배포: Vercel

새 의존성(npm 패키지)을 추가하지 말 것. 기존 stack 내에서 해결.

2. 폴더 구조와 역할
front/src/
├── main.jsx              ← 진입점. 수정하지 말 것.
├── App.jsx               ← 라우팅 테이블. 새 페이지 추가 시에만 수정.
├── index.css             ← 🎨 디자인 토큰 정의. Tailwind 임포트 + @theme inline.
├── pages/                ← 화면(URL) 단위 컴포넌트. 13개.
├── components/           ← 재사용 가능한 UI 블록.
├── api/                  ← 백엔드 통신 (axios). 시각 작업과 무관, 건드리지 말 것.
└── context/              ← 전역 상태 (인증). 건드리지 말 것.
App.css는 죽은 파일 (Vite 템플릿 잔재). 어디서도 import 안 되므로 무시.

3. 디자인 토큰 (가장 중요)
src/index.css의 @theme inline 블록에 다음 토큰이 정의되어 있음:
css--font-sans: 'Noto Sans KR', system-ui, sans-serif;
--color-primary: #5B40E4;          → bg-primary, text-primary, border-primary 등
--color-primary-light: #EEE9FD;    → bg-primary-light 등
--color-status-new: #4C6FFF;       → text-status-new 등
--color-status-best: #FF4B8B;
--color-status-old: #9CA3AF;
--color-gray-border: #E5E7EB;
--color-text-main: #111827;
--color-text-sub: #6B7280;
규칙

하드코딩된 hex 컬러(#5B40E4, bg-[#5B40E4] 등)는 모두 토큰 클래스로 변환.

bg-[#5B40E4] → bg-primary
text-[#5B40E4] → text-primary
focus:ring-[#5B40E4]/10 → focus:ring-primary/10


Figma에서 위 토큰에 없는 새 색을 발견하면, index.css에 새 토큰으로 추가.

예: hover용 어두운 primary가 필요하면 --color-primary-dark: #4A32C3; 추가 후 hover:bg-primary-dark 사용.
하드코딩 금지.


Tailwind 기본 회색(text-gray-400, border-gray-200 등)은 그대로 사용 OK.

단, 브랜드 컬러와 헷갈리는 경우만 토큰화.




4. 모바일 반응형 (필수 — 가장 자주 어기는 룰)
핵심 원칙
이 앱은 PWA 모바일 앱임. 사용자는 다양한 폭의 폰에서 봄 (360 ~ 480px+).
"피그마 프레임 폭 = 코드 폭"이 절대 아님. 피그마의 393px는 디자인 캔버스 크기.
폭(width) 처리

❌ 절대 금지: w-[393px], w-[430px] 같은 고정 폭
✅ 사용: w-full 또는 w-full max-w-[448px] 패턴
✅ 내부 분배: flex-1, justify-between, justify-around, gap-N로 비율 분배

앱 셸 (최상위 컨테이너)

현재 index.css에 .app-shell 클래스가 width: 100%; max-width: 393px로 설정됨.
이 값을 448px로 사용함 (큰 폰에서도 자연스럽게 보이게).
모든 페이지 콘텐츠는 이 셸 안에 들어감.

하단 고정 네비게이션(BottomTabBar)
표준 패턴:
fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[448px]

w-full = 폰 폭 가득
max-w-[448px] = 큰 화면에서 너무 안 커지게 제한
left-1/2 -translate-x-1/2 = 가로 중앙 정렬

고정해도 되는 것 / 안 되는 것
항목처리폭(width)❌ 고정 px 금지. w-full + max-w-[N] 패턴.높이(height)✅ 고정 OK (h-14, h-16 등 일반적).padding✅ 고정 OK (p-4, px-6 등).gap, margin✅ 고정 OK.글자 크기✅ 고정 OK (text-sm, text-base, text-[14px]).아이콘 크기✅ 고정 OK (w-6 h-6, width="24" 등).
Figma px → Tailwind 변환 빠른 표
피그마에서 보이는 px 숫자를 4로 나누면 Tailwind 숫자가 됨:
FigmaTailwind4px1 (gap-1, p-1)8px212px316px424px632px848px1264px16

5. 절대 건드리지 말 것 (보호 영역)
시각 작업 시 다음 영역은 읽기만 하고 절대 수정하지 말 것.
이 영역을 바꿔야 한다는 판단이 들면, 수정 전에 사용자에게 물어볼 것.

라우팅 경로 문자열: App.jsx의 <Route path="..." />, 각 페이지의 navigate('/...') 호출
인증 로직: context/AuthContext.jsx, PublicRoute/PrivateRoute 컴포넌트
API 호출: src/api/*.js 전체, 페이지 안의 axios 호출 코드
폼 제출 로직: handleSubmit, handleChange, useState 폼 상태 관리
react hooks 사용: useNavigate, useLocation, useAuth, useEffect 등의 사용부
PWA 설정: vite.config.js, manifest, 서비스워커
package.json: 새 의존성 추가 금지

"어떻게 보이는지"만 손대고, "어떻게 동작하는지"는 건드리지 마.

6. 작업 흐름 (AI가 따라야 할 순서)

Figma 데이터 추출: 사용자가 제공한 Figma 노드 URL 또는 선택 정보를 Figma MCP로 읽어서 레이아웃, 색, 폰트, 컴포넌트 구조 파악.
차이점 표 작성: 현재 코드와 Figma 디자인의 차이를 표로 정리.

   | 항목 | 현재 코드 | Figma | 변경 방안 |

사용자 확인 요청: 표를 보여준 후 "수정해도 되겠냐"고 한 번 확인.
수정 적용: 승인되면 그때 코드 수정.
변경 요약: 수정 후, 어떤 파일이 어떻게 바뀌었는지 한 줄 요약.

3번을 건너뛰지 말 것. 즉시 코드를 바꾸지 말 것.

7. 발견한 버그 처리
작업 도중 기존 코드에서 버그/오류를 발견하면 (예: 잘못된 navigate 경로, 사용 안 되는 import, 오타 등):

자동 수정하지 말 것.
보고만 하고, 사용자에게 "이것도 같이 고칠까?" 개별로 질문.
사용자가 명시적으로 OK 한 것만 수정.


8. 코드 스타일

주석: 한국어로 작성 (기존 코드 스타일 유지).
컴포넌트 정의: export default function ComponentName() { ... } 패턴.
임포트 순서: React → 외부 라이브러리 → 내부 모듈 → 스타일.
JSX 속성: 같은 줄 또는 항목별 줄바꿈, 일관되게.
이모지 사용 금지 (코드 안에서).


9. 아이콘 / SVG 처리

BottomTabBar의 아이콘처럼 active/inactive 상태로 색이 바뀌는 SVG는 인라인 React 컴포넌트로 유지.
새 아이콘 라이브러리(lucide-react 등) 추가 금지.
Figma의 SVG path를 그대로 옮기되, 단순화하거나 임의 대체 금지.
색은 stroke={active ? '#5B40E4' : '#9CA3AF'} 패턴 또는 currentColor로 동적 처리.


10. 변환 검증 (선택)
작업 후 다음 폭에서 깨지지 않는지 확인 권장:

360px (작은 안드로이드)
393px (아이폰 12/13/14)
430px (아이폰 Pro Max)

크롬 개발자도구의 디바이스 토글로 확인 가능.