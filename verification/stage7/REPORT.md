# 7단계 전체 기능 통합 검수·배포 준비

검수일: 2026-10-11 (한국 시간)

Microsoft Edge 155.0.4283.45에서 총 **146개 검사 통과**, JavaScript 오류 **0개**입니다. 배포 ZIP을 실제로 풀어 실행한 결과 리소스 누락과 외부 네트워크 요청도 0개입니다. 데스크톱·모바일·로컬·오프라인 검수와 GitHub Pages 배포 파일 준비를 완료했습니다. 실제 GitHub Pages 배포는 수행하지 않았습니다.

## 범위와 결과

| 검사 | 수 | 확인 내용 |
|---|---:|---|
| 전투·조작 회귀 | 97 | 19종 무기, 전투 정산·턴 종료, 충돌 배열, 고정 간격 물리, CPU/실제 탄도 일치, 로프·제트팩·백플립, 카메라, 멀티 터치, CPU 턴 후 조작 복귀 |
| 저장·가이드 | 16 | 설정·오디오 복원, 6단계 안내·정지 상태 복원, 완료 결과·최근30개 제한, 삭제·JSON 다운로드, 손상·차단된 저장, 입력 검증 |
| CPU·밸런스 | 20 | 실제 이동, 절벽·지뢰·벽·다른 웜 회피, 체력 상자 선호, 아군 피해 가중, 탄약·사격 제한, 턴 전환, 수치 적용 |
| 압축 해제한 배포본 | 13 | 19개 파일 해시, Pages 하위 경로, 설정 복원, 모바일 터치 스크롤·가이드·3가지 화면 크기·화면 회전, 분리/단일 HTML 오프라인 실행, 리소스·네트워크 오류 |

이번 단계에서 게임 규칙은 변경하지 않았습니다. 7단계 버전 표시, 배포 생성 도구, ZIP, 매니페스트, Pages 워크플로 및 배포 안내를 추가했습니다. 원본과 6단계의 모든 JS·CSS가 현재 실행 코드와 일치합니다. 분리된 소스 전체와 단일 HTML의 JavaScript 구문 검사도 통과했습니다.

## 실제 브라우저·화면 검수

데스크톱 1280×720 및 1440×900, 모바일 320×568·390×844·844×390에서 게임 화면을 확인했습니다. 모바일 이동·발사 동시 입력, 터치 취소, 드래그·핀치, 제트팩과 턴 넘김을 검사했습니다. 배포본의 작은 화면 설정 스크롤, 가이드 완료, 전투 중 가로·세로 전환과 카메라 버튼도 확인했습니다. 배포본 스크린샷을 직접 열어 화면 배치를 확인했습니다.

| 실행 방식 | 확인 |
|---|---|
| 로컬 HTTP | 시작·전투·CPU·카메라·가이드·저장 |
| `/wormfront/` 저장소 경로 모사 | 상대 경로 리소스 로딩, 시작·가이드·설정 복원 |
| `file://` 분리본 | 네트워크 차단 상태에서 시작, 산탄총 2발과 다음 턴 |
| `file://` 단일 HTML | 네트워크 차단 상태에서 가이드·시작·정지, 외부 JS/CSS 없음 |
| 압축 해제한 ZIP | 모든 파일 SHA-256 일치, 위 실행 방식 검수 |

146개 검사는 실제 Edge 엔진에서 수행했습니다. 전술·물리·승패 일부 상황은 재현 가능한 검사 상태를 사용했고 모바일은 터치 에뮬레이션입니다. 실물 휴대전화·iOS Safari·장시간 전체 대전·오디오 청취 품질은 검증하지 않았습니다. CPU는 안전한 보행과 일부 무기 사격을 판단하며 전체 맵 길 찾기·로프·제트팩 전술은 지원하지 않습니다. 밸런스 수치는 초기 조정이며 실사용 승률 검증은 별도입니다.

## 배포 준비물

- `release/wormfront-stage7-pages.zip`: 실행 파일 19개. ZIP 루트의 index.html, .nojekyll, src/, styles/, offline/를 그대로 사용합니다.
- `release/site/`: ZIP과 동일한 배포 폴더.
- `release/manifest.json`: 파일별 크기·SHA-256.
- `.github/workflows/pages.yml`: 기본 브랜치에서 수동 실행하는 Pages 배포 워크플로.
- `DEPLOYMENT.md`: ZIP 방식과 소스 워크플로 방식, 로컬 실행·재생성 절차.
- `dist/wormfront-stage7-offline.html`: 최신 단일 실행 파일.

워크플로는 [GitHub 공식 안내](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)의 configure-pages@v5, upload-pages-artifact@v4, deploy-pages@v4 방식으로 작성했습니다. 파일과 권한·수동 실행·기본 브랜치 제한을 확인했으며 실제 GitHub Actions 실행은 하지 않았습니다. 로컬에 YAML 파서가 없어 파서 검사는 수행하지 않았습니다.

원격 저장소가 설정되지 않았고 저장소 생성·커밋·푸시·게시 소스 설정·실제 Pages 배포를 수행하지 않았습니다. 배포 후 온라인 주소에서 실제 실행 확인이 남아 있습니다. ZIP은 보관 원본·이전 버전·검수 자료를 포함하지 않습니다.

## 보존과 증거

바탕화면 원본과 original 사본, 1~5단계 보관 파일의 해시가 이전 기록과 일치합니다. 6단계 전체 index·src·styles·dist·README 및 검사 스크립트는 versions/stage6/에 보존했고 6단계 index와 단일 HTML 해시도 이전 기록과 일치합니다. hashes.json에 확인 결과가 있습니다.

results.json, features.json, tactics.json, release.json에 각 검사 결과가 있습니다. release-desktop-home.png, release-desktop-battle.png, release-mobile-320x568.png, release-mobile-390x844.png, release-mobile-844x390.png, release-mobile-guide.png, release-file-split.png, release-file-single.png에 배포본 화면을 저장했습니다. exported-results.json은 브라우저에서 다운로드한 결과 파일입니다.

검사 접근 코드는 임시 검사 HTTP 응답에만 포함되며 실행 파일에 포함되지 않습니다. 현재 ZIP의 해시를 hashes.json에 기록했습니다.
