# QR Link

URL을 QR 코드로 만들고, QR 코드 이미지에서 URL을 읽어내는 브라우저 기반 정적 웹 앱입니다. 사용자가 입력하거나 업로드한 데이터는 서버로 전송하지 않고 브라우저에서만 처리합니다.

## 목표

- URL을 빠르게 QR 코드로 변환
- QR 이미지에 담긴 웹 주소 확인
- 라이트·다크 테마를 제공하는 편안한 사용자 경험
- 데스크톱과 모바일에서 모두 사용 가능한 반응형 UI

## 현재 완료된 기능

- URL 입력 및 유효성 검사
- 프로토콜이 없는 주소에 `https://` 자동 보완
- QR 코드 즉시 생성
- 생성된 QR 코드 PNG 저장
- 클릭 또는 드래그 앤 드롭 방식의 QR 이미지 업로드
- 업로드 이미지 내 QR 코드 디코딩
- 디코딩된 URL 표시, 복사, 새 탭 열기
- QR 인식 실패 안내 및 재시도
- 라이트 모드 / 다크 모드 전환
- 사용자 테마 선택을 `localStorage`에 저장
- 시스템 테마 기본값 감지
- 키보드 조작 및 ARIA 속성을 포함한 접근성 대응
- Lucide 아이콘 일괄 적용
- 모바일·데스크톱 반응형 레이아웃
- CSP(Content Security Policy)로 스크립트·연결·이미지 출처 제한
- 업로드 파일 형식, 10MB 용량 및 4천만 픽셀 해상도 제한
- 디코딩 링크의 `http`/`https` 프로토콜 제한 및 사용자 정보 포함 URL 차단

## 실행 경로

| 경로 | 설명 | 매개변수 |
| --- | --- | --- |
| `/` 또는 `/index.html` | QR 생성 및 이미지 디코딩 메인 화면 | 없음 |

이 앱은 단일 페이지 정적 웹사이트이며 별도의 라우트나 쿼리 매개변수를 사용하지 않습니다.

## 사용 기술

- HTML5
- CSS3
- Vanilla JavaScript
- [QRCode.js 1.0.0](https://github.com/davidshimjs/qrcodejs): QR 생성
- [jsQR 1.4.0](https://github.com/cozmo/jsQR): QR 이미지 디코딩
- [Lucide 0.468.0](https://lucide.dev/): 인터페이스 아이콘
- Google Fonts: DM Sans, Noto Sans KR

JavaScript 라이브러리는 버전을 고정해 `vendor/`에 저장하며, 실행 시 외부 CDN 스크립트에 의존하지 않습니다. Google Fonts 스타일과 폰트 파일만 Google 도메인에서 불러옵니다.

## 데이터 모델 및 저장소

서버 데이터베이스나 Table API를 사용하지 않습니다.

- URL 및 업로드 이미지: 현재 브라우저 메모리에서만 처리
- 테마 설정: 브라우저 `localStorage`의 `qr-link-theme` 키에 저장
- 업로드 이미지: 서버 전송 없음

## 프로젝트 구조

```text
index.html       메인 화면과 시맨틱 마크업
css/style.css    테마, 컴포넌트, 반응형 스타일
js/main.js       QR 생성, 디코딩, 탭, 테마 및 복사 동작
vendor/          버전 고정된 서드파티 JavaScript
.gitignore       민감 파일과 로컬 산출물 제외 규칙
SECURITY.md      취약점 비공개 제보 및 보안 정책
README.md        프로젝트 문서
```

## 공개 URL 및 API

- 프로덕션 URL: 아직 배포되지 않음
- API 엔드포인트: 없음

## 아직 구현되지 않은 기능

- 카메라를 이용한 실시간 QR 스캔
- QR 색상 및 크기 커스터마이징
- 생성 이력 저장
- URL 이외의 텍스트·연락처·Wi-Fi 형식 생성

## 권장 다음 단계

1. HTTPS 환경에서 카메라 실시간 스캔 추가
2. QR 전경색·배경색·오류 복원 수준 선택 기능 추가
3. 다양한 QR 데이터 타입 지원
4. CDN 장애에 대비한 라이브러리 자체 호스팅 검토
5. 실제 모바일 기기와 다양한 QR 이미지로 인식률 테스트

## 보안 점검 결과

GitHub 업로드 전 다음 항목을 확인하고 보완했습니다.

- API 키, 토큰, 비밀번호, 개인 키 등 하드코딩된 민감정보 없음
- `innerHTML`, `eval`, `document.write` 등 위험한 동적 실행 방식 미사용
- 사용자 및 QR 입력값은 DOM에 `textContent`로 출력
- 새 탭 링크에 `noopener noreferrer` 적용
- 외부 JavaScript를 저장소 내부의 버전 고정 파일로 전환
- CSP로 허용되지 않은 스크립트, 네트워크 연결, 플러그인 실행 차단
- 민감 파일 패턴을 `.gitignore`에 추가
- 취약점 비공개 제보 절차를 `SECURITY.md`에 명시

주의: 정적 웹앱은 QR 링크가 가리키는 외부 사이트의 신뢰성을 판별하지 않습니다. 사용자는 표시된 주소를 확인한 후 열어야 합니다. 실제 배포 플랫폼이 지원한다면 `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `Permissions-Policy`, `Strict-Transport-Security`를 HTTP 응답 헤더로도 설정하는 것을 권장합니다.

## 로컬 실행

정적 파일 서버로 프로젝트 루트를 열면 됩니다. JavaScript 기능은 저장소 내 파일로 실행되며, Google Fonts 로딩에는 인터넷 연결이 필요합니다.
