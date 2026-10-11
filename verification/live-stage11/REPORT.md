# 11단계 공개 검수

2026-10-11. https://gmlduqzhd123-lab.github.io/Worms/

배포 커밋 49f18fa8ad26fc8222e497b288564cab343b3701. [배포 실행 38115534151](https://github.com/gmlduqzhd123-lab/Worms/actions/runs/38115534151) success.

Edge 155 / Playwright 검사 26개 통과. 공개 실행 파일 59개 HTTP 200 및 배포 커밋과 SHA256 일치, .nojekyll 추적 확인. JS·누락 리소스 오류 0개.

실제 수류탄 발사 후 발사체가 사라져도 자동 카메라가 마지막 충돌을 계속 바라보는 것을 확인했습니다. 별도의 통제된 피해 입력으로 머리 위 숫자·막대의 점진적 감소와 사망 시 0까지 표시되는 것을 확인했습니다. 실제 체력은 즉시 감소하고 표시 체력만 내려가는 구조를 검수했습니다. hp-above-head.png, hp-countdown.png, hp-effect.png는 공개 주소의 피해 연출 검수 화면입니다.

기존 10개 테마, 설정 복원, 가이드, 카메라, 산탄총 두 발·턴 교대, CPU 복귀, 모바일 터치, QR·설치 도우미·서비스 워커, 단일 HTML 실행도 통과했습니다. 모바일은 브라우저 에뮬레이션이며 실기기 검사는 포함하지 않습니다. 개별 결과·해시는 results.json에 있습니다.
