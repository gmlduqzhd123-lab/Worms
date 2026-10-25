# GitHub Pages 배포 안내

최신 배포 검수 기록: verification/platform-audit-2026-10-25/REPORT.md. 저장소: https://github.com/gmlduqzhd123-lab/Worms

실행 주소: https://gmlduqzhd123-lab.github.io/Worms/

기본 브랜치 main을 업로드하고 GitHub Actions 방식으로 Pages를 활성화했습니다. 9단계 배포 검수 기록은 verification/live-stage9/에 보존했습니다. 10단계 배포와 공개 검수는 verification/live-stage10/에 기록합니다.

## ZIP으로 올리기

1. `release/wormfront-stage27-pages.zip`을 풉니다.
2. 압축을 푼 `index.html`, `.nojekyll`, `src/`, `styles/`, `assets/`, `icons/`, `offline/`과 루트의 앱 설치·QR·공유 파일을 GitHub 저장소 루트에 올립니다. ZIP 파일 자체를 올리는 방식이 아닙니다.
3. 저장소 Settings → Pages에서 Source를 **Deploy from a branch**로 선택합니다. 파일을 올린 브랜치와 **/(root)**를 선택하고 저장합니다.
4. 배포 완료 후 Pages에 표시된 주소를 엽니다. 홈 → 시작 → 발사 → 다음 턴, 가이드, 설정 복원과 모바일 조작을 확인합니다.

ZIP에는 게임 실행 파일 61개만 들어 있습니다. 원본·이전 버전·검사 코드·검수 자료는 들어 있지 않습니다. 폴더 이름을 유지합니다.

## 소스 저장소에서 수동 배포하기

1. `index.html`, `.nojekyll`, `src/`, `styles/`, `assets/`, `dist/wormfront-stage27-offline.html`, `.github/workflows/pages.yml`을 저장소의 기본 브랜치에 넣습니다.
   앱 설치·QR·공유 미리보기용 `manifest.webmanifest`, `sw.js`, `ys-install.js`, `ys-qr.js`, `qr.svg`, `og-image-angle-bots.png`, `icons/`도 함께 넣습니다.
2. Settings → Pages → Source를 **GitHub Actions**로 선택합니다.
3. Actions에서 **Publish Angle King to GitHub Pages** → **Run workflow**를 기본 브랜치에서 실행합니다.
4. 작업이 완료되면 표시된 배포 URL에서 위의 게임 흐름을 확인합니다.

워크플로는 main 브랜치에 푸시(PR 병합 포함)하면 자동으로 실행되고, Actions에서 수동으로도 실행할 수 있습니다. 기본 브랜치에서만 배포합니다. `_site/`에 실행 파일만 복사하여 업로드하고 `github-pages` 환경에 배포합니다. 저장소의 원본·보관본은 웹사이트에 업로드하지 않습니다. 서버·API 키 설정은 필요하지 않습니다.

설정 방법과 배포 액션은 [GitHub 공식 워크플로 안내](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) 및 [게시 소스 설정 안내](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)를 확인했습니다. GitHub Actions 실행은 실제 저장소에서 성공을 확인했습니다.

## 로컬·오프라인

- 분리본: `node scripts/serve.cjs`로 실행하면 배경음악까지 로딩됩니다. `index.html` 직접 열기는 게임과 합성 효과음이 동작하지만, 브라우저의 file URL 정책에 따라 MP3 로딩이 제한될 수 있습니다. 완전한 오프라인 실행은 아래 단일 파일을 사용합니다.
- 단일 파일: `dist/wormfront-stage27-offline.html`을 브라우저에서 엽니다. ZIP 안에서는 `offline/wormfront.html`입니다.
- 개발 미리보기: `node scripts/serve.cjs` 실행 후 http://127.0.0.1:4187/ 을 엽니다.

저장은 해당 브라우저 localStorage를 사용합니다. HTTP 주소와 `file://` 파일은 저장 공간이 다를 수 있으며 기기 간 동기화하지 않습니다.

## 변경 후 다시 준비하기

```powershell
node scripts/build-offline.cjs
node scripts/build-release.cjs
Compress-Archive -Path release/site/* -DestinationPath release/wormfront-stage27-pages.zip -Force
```

`release/manifest.json`에는 실행 파일의 크기와 SHA-256이 있습니다. 소스 수정 후 오프라인 파일·배포 묶음을 모두 다시 생성해야 합니다. 버전을 올릴 때 워크플로의 단일 HTML 파일 경로도 맞춥니다.
