/* 만일의 노트 — 웹(PWA) 오프라인용 서비스 워커.
   안드로이드 앱(Capacitor)에서는 등록하지 않는다(index.html 의 isNative 가드).
   - 앱 셸(index.html·manifest·폰트 CSS)은 설치 때 미리 저장하고, 이후엔 네트워크 우선으로 받아
     새 버전이 배포되면 다음 실행 때 반영되게 한다. 오프라인이면 저장본을 쓴다.
   - 폰트 파일(총 9MB, 글자 범위별 54개)은 처음 쓸 때 저장하고 그 뒤로는 저장본 우선.
   버전을 올릴 때 VERSION 을 함께 올리면 오래된 저장본이 정리된다. */
const VERSION = '1.4.0';
const SHELL = 'manilnote-shell-' + VERSION;
const FONTS = 'manilnote-fonts-v1';
const PRECACHE = ['./', './index.html', './manifest.webmanifest',
  './fonts/pretendard.css', './fonts/gowun-batang/400.css', './fonts/gowun-batang/700.css'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(k => k !== SHELL && k !== FONTS).map(k => caches.delete(k))
  )).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; /* AI API 등 외부 요청은 건드리지 않는다 */
  if (url.pathname.includes('/fonts/')) {
    e.respondWith(caches.open(FONTS).then(async c => {
      const hit = await c.match(req); if (hit) return hit;
      const res = await fetch(req); if (res.ok) c.put(req, res.clone()); return res;
    }));
    return;
  }
  e.respondWith(caches.open(SHELL).then(async c => {
    try {
      const res = await fetch(req);
      if (res.ok) c.put(req, res.clone());
      return res;
    } catch (err) {
      const hit = await c.match(req) || (req.mode === 'navigate' && await c.match('./index.html'));
      if (hit) return hit;
      throw err;
    }
  }));
});
