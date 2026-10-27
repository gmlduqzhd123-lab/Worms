// 📲 조준! 각도왕 오프라인 지원: 한 번 접속하면 인터넷이 끊겨도 게임이 열려요.
// 게임 파일은 새 버전을 먼저 받아 오고(네트워크 우선), 실패할 때만 저장해 둔 사본을 써요.
// 같은 주소(gmlduqzhd123-lab.github.io)의 다른 앱들과 저장소를 함께 쓰므로, 이 앱의 이전 캐시만 지운다.
const CACHE = 'worms-v27';
const CACHE_PREFIX = 'worms-v';
const CORE = [
    './assets/audio/bouncy-tactical-groove.mp3', './', './index.html', './manifest.webmanifest', './ys-install.js', './ys-qr.js', './qr.svg',
    './icons/icon-192.png?v=25', './icons/icon-512.png?v=25', './icons/icon-maskable-512.png?v=25', './icons/apple-touch-icon.png?v=25', './icons/favicon-32.png?v=25', './styles/game.css',
    './src/state.js', './src/audio.js', './src/terrain.js', './src/turns.js', './src/ui.js', './src/combat.js',
    './src/weapons.js', './src/physics.js', './src/ai.js', './src/render.js', './src/loop.js', './src/input.js',
    './src/graphics.js', './src/persistence.js', './src/boot.js'
];

const ART = [
  "./assets/images/bot-captain.png",
  "./assets/images/bot-comet.png",
  "./assets/images/bot-maker.png",
  "./assets/images/bot-nova.png",
  "./assets/images/bot-orbit.png",
  "./assets/images/bot-polar.png",
  "./assets/images/bot-prism.png",
  "./assets/images/bot-relay.png",
  "./assets/images/bot-scout.png",
  "./assets/images/bot-spark.png",
  "./assets/images/coast.png",
  "./assets/images/theme-canyon.png",
  "./assets/images/theme-castle.png",
  "./assets/images/theme-fort.png",
  "./assets/images/theme-meadow.png",
  "./assets/images/theme-moon.png",
  "./assets/images/theme-ruins.png",
  "./assets/images/theme-scrap.png",
  "./assets/images/theme-snow.png",
  "./assets/images/theme-sunset.png",
  "./assets/images/tool-bazooka.png",
  "./assets/images/tool-dynamite.png",
  "./assets/images/tool-grenade.png",
  "./assets/images/tool-jetpack.png",
  "./assets/images/tool-mine.png",
  "./assets/images/tool-punch.png",
  "./assets/images/tool-rope.png",
  "./assets/images/tool-sacred.png",
  "./assets/images/tool-sheep.png",
  "./assets/images/tool-teleport.png"
];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll([...CORE,...ART])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
    e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith(CACHE_PREFIX) && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
    const req = e.request;
    if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
    e.respondWith(fetch(req).then(async res => {
        if (res && res.ok) { try { const cache=await caches.open(CACHE); await cache.put(req,res.clone()); } catch {} }
        return res;
    }).catch(async () => {const cache=await caches.open(CACHE);return await cache.match(req,{ignoreVary:true}) || (req.mode === 'navigate' ? await cache.match('./index.html',{ignoreVary:true}) : undefined) || Response.error()}));
});
