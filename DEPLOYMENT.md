# GitHub Pages 배포 안내

[게임 실행](https://gmlduqzhd123-lab.github.io/Worms/) · [저장소](https://github.com/gmlduqzhd123-lab/Worms) · [현재 사용법](README.md)

게임 버전은 v28입니다. 자동 배포는 저장소에 보관된 이전 단일 HTML을 그대로 복사하지 않고, 현재 소스에서 새로 빌드하고 검사한 파일을 사용합니다. 게임의 전투 규칙·리소스·설정 키는 그대로 유지합니다.

## 자동 검증과 배포

워크플로는 [`.github/workflows/pages.yml`](.github/workflows/pages.yml)에 있습니다.

| 실행 계기 | 동작 |
| --- | --- |
| `main`을 대상으로 한 PR | 구조 검사·빌드·브라우저 검증. 사이트에는 배포하지 않음 |
| `main` 푸시 또는 PR 병합 | 검증·빌드가 모두 성공한 뒤 GitHub Pages에 배포 |
| Actions에서 수동 실행 | 선택한 브랜치를 검증하며, 기본 브랜치인 경우에만 배포 |

검증·빌드 작업은 Ubuntu와 Node.js 24에서 다음 순서로 실행합니다.

```sh
npm ci
npx playwright install --with-deps chromium
npm run check
npm run build
npm test
```

`npm run check`는 소스 순서·문법·버전·필수 파일을 확인합니다. `npm run build`는 오프라인 HTML과 배포 폴더를 생성합니다. `npm test`는 핵심 전투·효과음 회귀와 생성된 배포본의 기본 동작을 Chromium에서 검사합니다. 과거 보고서에 기록된 모든 플랫폼 검사를 매번 실행하는 구성은 아닙니다.

어느 단계든 실패하면 배포를 진행하지 않습니다. 검증 결과는 실행의 **Artifacts → verification-results**에서 확인할 수 있으며 14일 동안 보관합니다. 결과 파일이 만들어지기 전에 실패했다면 해당 단계의 로그를 확인합니다.

배포 작업은 검증 작업이 성공해야 시작합니다. 검증을 마친 `release/site/`만 Pages 아티팩트로 올리고, `github-pages` 환경에 배포합니다. 검증 도구·과거 버전·검수 자료는 사이트에 포함하지 않습니다.

## GitHub에서 설정·수동 실행

1. 소스와 실행 리소스, `package.json`, `package-lock.json`, `scripts/`, 워크플로를 저장소에 반영합니다. 과거 `dist/`·`versions/` 파일은 빌드 입력으로 사용하지 않습니다.
2. 저장소 **Settings → Pages → Source**를 **GitHub Actions**로 선택합니다.
3. **Actions → Publish Angle King to GitHub Pages → Run workflow**에서 기본 브랜치를 선택해 실행합니다.
4. `verify-build`와 `deploy` 작업이 모두 성공했는지 확인합니다. 배포가 환경 승인 대기 상태라면 저장소의 `github-pages` 환경 설정에 따라 승인합니다.
5. 표시된 배포 주소에서 시작 → 조준·발사 → 다음 턴, 가이드, 설정 복원, 모바일 조작을 확인합니다.

`main`에 소스 변경을 푸시하면 같은 순서로 자동 실행됩니다. PR 검사 통과는 병합 후 배포 완료와 구분합니다. 서버나 API 키는 필요하지 않습니다.

## 로컬에서 같은 검사 실행

Node.js 24와 npm을 사용합니다. 최초 설치는 다음과 같습니다.

```sh
npm ci
npx playwright install chromium
```

Linux에서는 `npx playwright install --with-deps chromium`으로 브라우저 시스템 의존성도 설치합니다. 이후에는 아래 명령을 순서대로 실행합니다.

```sh
npm run check
npm run build
npm test
```

기본 브라우저는 Playwright Chromium입니다. 설치된 Edge나 Chrome으로 검사하려면 `WORMFRONT_BROWSER_CHANNEL` 환경 변수를 `msedge` 또는 `chrome`으로 설정합니다. 결과는 `test-results/`에 저장하며 Git에는 포함하지 않습니다.

## 빌드 산출물

현재 버전 번호는 `index.html`에서 읽습니다. v28에서 생성되는 파일은 다음과 같습니다.

| 경로 | 내용 |
| --- | --- |
| `dist/wormfront-stage28-offline.html` | 이미지·음악·스크립트를 포함한 단일 HTML |
| `release/site/` | 정적 사이트로 배포할 실행 파일 |
| `release/site/offline/wormfront.html` | 위 단일 HTML의 배포용 사본 |
| `release/manifest.json` | 배포 파일의 크기와 SHA-256 명세 |

`release/site/`는 생성 전용 폴더이며 매번 빌드할 때 비운 뒤 다시 만듭니다. 보관할 파일을 이 폴더에 직접 넣지 않습니다. 기존 `versions/`와 과거 배포 보존본은 건드리지 않습니다.

소스를 수정하면 `npm run build`를 다시 실행합니다. HTML 버전과 서비스 워커 캐시 번호는 일치시켜야 하며 구조 검사에서 확인합니다. 워크플로의 단일 HTML 경로를 버전마다 직접 바꿀 필요는 없습니다.

## ZIP으로 수동 전달하기

ZIP은 선택적인 전달 방법입니다. 저장소에 ZIP이 항상 포함되어 있는 것은 아니며, `npm run build` 후 로컬에서 만듭니다. 자동 Actions 배포에는 ZIP 생성이 필요하지 않습니다.

`release/site/`의 **내용물**을 압축합니다. 압축 최상위에 `index.html`과 `.nojekyll`이 있어야 하며, `site/` 폴더 한 겹을 추가하지 않습니다. 일부 압축 명령은 점으로 시작하는 파일을 누락하므로 `.nojekyll` 포함 여부를 반드시 확인합니다.

Windows PowerShell에서는 숨김 파일도 포함하는 .NET ZIP 기능을 사용할 수 있습니다. 아래 대상 파일이 이미 있으면 새 이름을 사용합니다.

```powershell
Add-Type -AssemblyName System.IO.Compression.FileSystem
$sitePath = (Resolve-Path 'release/site').Path
$zipPath = Join-Path (Get-Location).Path 'release/wormfront-stage28-pages.zip'
[System.IO.Compression.ZipFile]::CreateFromDirectory($sitePath, $zipPath)
```

압축을 풀면 `index.html`, `.nojekyll`, `src/`, `styles/`, `assets/`, `icons/`, `offline/`과 앱 설치·QR·공유 파일이 함께 있어야 합니다. 파일 수와 해시는 `release/manifest.json`을 기준으로 확인합니다.

다른 정적 호스팅에는 압축을 푼 내용물을 사이트 루트에 올립니다. 별도의 GitHub Pages 브랜치 배포 저장소를 쓴다면 **Deploy from a branch → 해당 브랜치 → /(root)**로 설정할 수 있습니다. 이 소스 저장소의 자동 배포는 **GitHub Actions** 설정을 유지합니다.

## 실행과 확인 범위

- 로컬 미리보기는 `npm start` 또는 `node scripts/serve.cjs`를 실행하고 <http://127.0.0.1:4187>을 엽니다.
- 단일 파일은 `dist/wormfront-stage28-offline.html`을 엽니다. ZIP 내부에서는 `offline/wormfront.html`입니다.
- 분리된 `index.html`을 직접 여는 경우 브라우저의 `file://` 정책 때문에 MP3가 제한될 수 있습니다. 완전한 오프라인 파일 실행에는 단일 HTML을 사용합니다.
- 설정과 완료 기록은 브라우저 `localStorage`에 저장하며 기기 간 동기화하지 않습니다. HTTP 주소와 `file://` 파일의 저장 공간은 다를 수 있습니다.

기존 v28 공개 배포·플랫폼 검수는 [검수 보고서](verification/battle-improvements-2026-10-27/REPORT.md)에 기록되어 있습니다. 새 자동 검증 결과는 각 Actions 실행과 `test-results/`를 기준으로 확인합니다. 모바일 에뮬레이션은 실제 스마트폰·태블릿의 설치·조작·청음 확인과 구분합니다.
