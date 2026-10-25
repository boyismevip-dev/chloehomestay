const path = require('path');
const express = require('express');
const compression = require('compression');
const helmet = require('helmet');

const site = require('./data/site');
const rooms = require('./data/rooms');
const dict = require('./data/i18n');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'"],
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
        'img-src': ["'self'", 'data:'],
        'frame-src': ['https://www.google.com', 'https://maps.google.com'],
        'upgrade-insecure-requests': null,
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);
app.use(compression());

// Tài nguyên tĩnh: cache dài cho ảnh/font, ngắn cho css/js (không dùng hash tên file)
app.use(
  express.static(path.join(__dirname, 'public'), {
    maxAge: '30d',
    setHeaders(res, file) {
      if (/\.(css|js)$/.test(file)) res.setHeader('Cache-Control', 'public, max-age=3600');
    },
  })
);

// Bảng đường dẫn theo ngôn ngữ
const paths = {
  vi: { home: '/', rooms: '/phong', room: (s) => `/phong/${s}`, services: '/dich-vu', contact: '/lien-he' },
  en: { home: '/en', rooms: '/en/rooms', room: (s) => `/en/rooms/${s}`, services: '/en/services', contact: '/en/contact' },
};

const BUILD = Date.now().toString(36);
const money = (n) => new Intl.NumberFormat('vi-VN').format(n);

function ctx(lang) {
  return (req, res, next) => {
    const other = lang === 'vi' ? 'en' : 'vi';
    res.locals.lang = lang;
    res.locals.v = BUILD;
    res.locals.site = site;
    res.locals.rooms = rooms;
    res.locals.money = money;
    res.locals.t = (k) => dict[lang][k] ?? dict.vi[k] ?? k;
    res.locals.L = (o) => (o && typeof o === 'object' ? o[lang] ?? o.vi : o);
    res.locals.p = paths[lang];
    res.locals.otherLang = other;
    res.locals.otherPaths = paths[other];
    res.locals.address = lang === 'vi' ? site.address : site.addressEn;
    res.locals.currentPath = req.path;
    res.locals.canonicalPath = req.originalUrl.split('?')[0];
    next();
  };
}

const render = (page, key, extra) => (req, res) =>
  res.render(`pages/${page}`, {
    pageKey: key,
    metaTitle: res.locals.t(`meta.${key}.title`),
    metaDesc: res.locals.t(`meta.${key}.desc`),
    altPath: null,
    ...(typeof extra === 'function' ? extra(req, res) : extra),
  });

function mount(lang) {
  const P = paths[lang];
  const router = express.Router();
  router.use(ctx(lang));
  const alt = (name) => (lang === 'vi' ? paths.en[name] : paths.vi[name]);

  router.get(P.home.replace(/^\/en$/, '') || '/', render('home', 'home', { altPath: alt('home') }));
  router.get(P.rooms.replace(/^\/en/, ''), render('rooms', 'rooms', { altPath: alt('rooms') }));
  router.get(P.services.replace(/^\/en/, ''), render('services', 'services', { altPath: alt('services') }));
  router.get(P.contact.replace(/^\/en/, ''), render('contact', 'contact', { altPath: alt('contact') }));

  router.get(P.room(':slug').replace(/^\/en/, ''), (req, res, next) => {
    const room = rooms.find((r) => r.slug === req.params.slug);
    if (!room) return next();
    const L = res.locals.L;
    res.render('pages/room', {
      pageKey: 'room',
      room,
      metaTitle: `${L(room.name)} — Chloe Homestay ${lang === "vi" ? "Đà Lạt" : "Da Lat"}`,
      metaDesc: L(room.summary),
      ogImage: room.photos[0] ? room.photos[0].full : null,
      altPath: alt('room') ? (lang === 'vi' ? paths.en.room(room.slug) : paths.vi.room(room.slug)) : null,
    });
  });
  return router;
}

app.use('/en', mount('en'));
app.use('/', mount('vi'));

app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(`User-agent: *\nAllow: /\nSitemap: ${site.baseUrl}/sitemap.xml\n`);
});

app.get('/sitemap.xml', (req, res) => {
  const urls = [];
  for (const lang of ['vi', 'en']) {
    const P = paths[lang];
    urls.push(P.home, P.rooms, P.services, P.contact, ...rooms.map((r) => P.room(r.slug)));
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${site.baseUrl}${u}</loc></url>`)
    .join('\n')}\n</urlset>`;
  res.type('application/xml').send(xml);
});

app.get('/healthz', (req, res) => res.send('ok'));

// 404 theo ngôn ngữ của đường dẫn
app.use((req, res) => {
  const lang = req.path.startsWith('/en') ? 'en' : 'vi';
  ctx(lang)(req, res, () => {});
  res.status(404).render('pages/404', {
    pageKey: '404',
    metaTitle: res.locals.t('notfound.title'),
    metaDesc: res.locals.t('notfound.text'),
    altPath: null,
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).type('text/plain').send('Server error');
});

app.listen(PORT, () => console.log(`Chloe Homestay chạy tại http://localhost:${PORT}`));
