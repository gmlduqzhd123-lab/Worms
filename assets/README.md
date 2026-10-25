# 현재 각도봇 리소스

캐릭터 10종(bot-*.png)과 도구 10종(tool-*.png)은 이번 프로젝트의 새 콘셉트로 imagegen에서 생성했습니다. 기존 게임 이미지는 입력하지 않았습니다. 생성 원본 아틀라스, 프롬프트, 셀 경계와 내보내기 기록은 verification/independent-angle-king-2026-10-25/artwork/에 보존했습니다. scripts/build-identity-art.cjs가 알파 경계로 셀을 분리하고 크기를 내보내며 src/graphics.js와 assets/manifest.json의 경계를 맞춥니다.

교체 전 worm-*.png 및 item-*.png 20개는 versions/pre-independent-angle-king-2026-10-25-6e772c8/assets/images/에 바이트 그대로 보존했습니다. 현재 실행 리소스에는 넣지 않습니다. 배경 10종은 이전 생성본을 유지하며 이전 출처·프롬프트 기록을 함께 보존합니다. 개별 파일 SHA-256과 권리 확인 범위는 rights-manifest.json, 전체 안내는 ASSET_RIGHTS.md에 있습니다.
