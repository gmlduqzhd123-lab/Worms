# 8단계 이미지 적용 검수

2026-10-11. 제공 ZIP 30장을 분석하고 투명 캐릭터 10장, 투명 아이템 10장을 PNG 원본 바이트 그대로 적용했습니다. 화면 예시 10장은 참고 자료로 보존했습니다. 해안 예시 화풍을 참고한 UI 없는 배경 1장은 imagegen으로 제작했습니다. 도구 모드와 전체 프롬프트: assets/BACKGROUND_PROMPT.txt.

## 적용

- 팀별 캐릭터 선택·설정 저장, 부대원별 외형 변형, 이동·점프·피격 시 원본 이미지 변환.
- 제공 아이템 10종을 무기 목록에 적용. 수류탄·다이너마이트 투사체, 지뢰, 양 폭탄 및 일부 손에 든 무기에 연결. 로켓 발사 시 총 본체를 날리지 않도록 구분.
- 해안 배경, 흙·잔디 지형, 금속 느낌 패널, 선택 강조와 홈 캐릭터 장식.
- 기존 9종 무기 아이콘 유지. 이미지 21장 모두 실패해도 벡터·절차적 표시로 실행.

## 검증

Microsoft Edge와 Playwright에서 총 155개 통과: 회귀 97(results.json), 설정·가이드 16(features.json), CPU·밸런스 20(tactics.json), 실제 ZIP 압축 해제 배포본 13(release.json), 이미지 적용 9(artwork.json). JavaScript 오류 0개. 배포본 40개 파일 해시 일치, 외부 서비스 요청 0개.

원본 HTML·ZIP과 보관한 7단계 index 일치 확인: preservation.json. 제공 PNG 20개 원본과 적용본 해시 일치: artwork.json. 원본 ZIP/전체 PNG는 original/artwork/, 이전 전체 실행본은 versions/stage7/에 보존합니다.

스크린샷: art-home.png, art-battle.png, art-overview.png, art-mobile.png, art-mobile-landscape.png, art-fallback.png. 이름·체력 표시와 무기 목록 및 세로/가로 화면을 시각 검수했습니다.

## 범위와 제한

모바일 검수는 브라우저 에뮬레이션이며 실제 단말 검수는 포함하지 않습니다. 제공 캐릭터는 단일 이미지로 별도 이동·피격 프레임은 없습니다. 배경 테마 10개 전체를 구현한 상태는 아닙니다. 원본 PNG 21장 합계 약 22.3 MB, 단일 HTML 약 34 MB이므로 첫 로딩/오프라인 파일 크기가 큽니다. 이미지를 최적화하려면 원본과 구분된 파생본을 별도로 만들 수 있습니다.

GitHub Pages 공개 검수는 verification/live-stage8/에 별도 기록합니다.
