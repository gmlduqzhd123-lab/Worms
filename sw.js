// 📲 웜즈 아마겟돈 오프라인 지원: 한 번 접속하면 인터넷이 끊겨도 게임이 열려요.
// 게임 파일은 새 버전을 먼저 받아 오고(네트워크 우선), 실패할 때만 저장해 둔 사본을 써요.
// 같은 주소(gmlduqzhd123-lab.github.io)의 다른 앱들과 저장소를 함께 쓰므로, 이 앱의 이전 캐시만 지운다.
const CACHE = 'worms-v21';
const CACHE_PREFIX = 'worms-v';
const CORE = [
    './assets/audio/bouncy-tactical-groove.mp3', './', './index.html', './manifest.webmanifest', './ys-install.js', './ys-qr.js', './qr.svg',
    './icons/icon-192.png', './icons/icon-512.png', './styles/game.css',
    './src/state.js', './src/audio.js', './src/terrain.js', './src/turns.js', './src/ui.js', './src/combat.js',
    './src/weapons.js', './src/physics.js', './src/ai.js', './src/render.js', './src/loop.js', './src/input.js',
    './src/graphics.js', './src/persistence.js', './src/boot.js'
];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
    e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith(CACHE_PREFIX) && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
    const req = e.request;
    if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
    e.respondWith(fetch(req).then(res => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
    }).catch(() => caches.match(req).then(hit => hit || (req.mode === 'navigate' ? caches.match('./index.html') : undefined))));
});
