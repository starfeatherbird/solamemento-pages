/* 스도쿠 — 웹(PWA) 오프라인용 서비스 워커. 안드로이드 앱에서는 등록하지 않는다(src/main.tsx).
   scripts/build-web.mjs가 __VERSION__·__ASSETS__를 채워 배포본에 넣는다.
   - 설치 때 앱 전체(약 300KB)를 미리 저장 → 처음 한 번 열면 그다음부턴 인터넷 없이도 열린다.
   - 이름에 해시가 붙은 assets/* 는 내용이 바뀌면 이름도 바뀌므로 저장본 우선.
   - 그 밖(index.html·manifest·아이콘)은 네트워크 우선 — 새 배포가 다음 실행에 바로 반영되게. */
const CACHE = 'sudoku-1.0.1-7lu84l';
const PRECACHE = [
  "./",
  "./assets/index-aerGkMNj.js",
  "./assets/index-s5hgjyzz.css",
  "./assets/web-CEgujyit.js",
  "./assets/web-CT3R90s1.js",
  "./assets/web-Cq2j1Bmr.js",
  "./icons/apple-touch-icon.png",
  "./icons/icon-192.png",
  "./icons/icon-512-maskable.png",
  "./icons/icon-512.png",
  "./index.html",
  "./manifest-en.webmanifest",
  "./manifest-ko.webmanifest"
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('sudoku-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  if (url.pathname.includes('/assets/')) {
    e.respondWith(caches.open(CACHE).then(async (c) => {
      const hit = await c.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) c.put(req, res.clone());
      return res;
    }));
    return;
  }

  e.respondWith(caches.open(CACHE).then(async (c) => {
    try {
      const res = await fetch(req);
      if (res.ok) c.put(req, res.clone());
      return res;
    } catch (err) {
      const hit = (await c.match(req, { ignoreSearch: true })) || (req.mode === 'navigate' && (await c.match('./index.html')));
      if (hit) return hit;
      throw err;
    }
  }));
});
