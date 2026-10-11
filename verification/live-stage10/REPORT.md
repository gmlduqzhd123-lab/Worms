# 10단계 공개 배포 검수

2026-10-11. 공개 주소 https://gmlduqzhd123-lab.github.io/Worms/

배포 커밋 32ac627548d5faf65828657445dba193c49092cb. GitHub Actions [38112691003](https://github.com/gmlduqzhd123-lab/Worms/actions/runs/38112691003) success.

Microsoft Edge 155 / Playwright에서 24개 검사 통과. 실행 파일 59개 HTTP 200 및 배포 커밋과 SHA256 일치, .nojekyll 추적 확인. JavaScript 오류·누락 리소스 0개.

공개 사이트의 10개 테마 선택·미리보기·전투·설정 복원, 가이드 일시정지, 카메라, 수류탄 기폭 카운트다운과 공격 해결 표시 및 턴 교대, 산탄총 두 발, CPU 턴 복귀를 확인했습니다. 모바일 터치 시작·일시정지·가이드, QR 이미지와 설치 도우미·활성 서비스 워커, 단일 HTML 시작과 외부 JS/CSS 부재를 확인했습니다. 개별 결과·해시는 results.json에 있습니다.

실제 스마트폰 앱 설치와 QR 촬영은 검수하지 않았습니다. 모바일은 브라우저 에뮬레이션입니다. 전투 화면 reference-grenade.png는 실제 공개 주소에서 캡처했습니다.
