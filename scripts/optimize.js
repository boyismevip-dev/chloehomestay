// Tối ưu ảnh phòng: JPG gốc -> WebP (1600px + thumbnail 640px)
// Chạy: node scripts/optimize.js "<thư mục chứa ảnh gốc>"
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SRC = process.argv[2] || path.join(__dirname, '..', '..', '_src');
const OUT = path.join(__dirname, '..', 'public', 'img', 'rooms');
const ROOMS = {
  'Lavender': 'lavender', 'Atiso': 'atiso', 'Mai Anh Đào': 'mai-anh-dao',
  'Tam Giác Mạch': 'tam-giac-mach', 'Cẩm Tú Cầu': 'cam-tu-cau',
  'Gác mái': 'gac-mai', 'Mimosa': 'mimosa',
};

(async () => {
  for (const [folder, slug] of Object.entries(ROOMS)) {
    const dir = path.join(SRC, folder, folder);
    const files = fs.readdirSync(dir)
      .filter((f) => /\.jpe?g$/i.test(f) && !/\(\d+\)\.jpe?g$/i.test(f))
      .sort();
    const out = path.join(OUT, slug);
    fs.mkdirSync(out, { recursive: true });
    let i = 0;
    for (const f of files) {
      i += 1;
      const n = String(i).padStart(2, '0');
      const img = sharp(path.join(dir, f)).rotate();
      await img.clone().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 76 }).toFile(path.join(out, `${n}.webp`));
      await img.clone().resize({ width: 640, withoutEnlargement: true }).webp({ quality: 70 }).toFile(path.join(out, `${n}-t.webp`));
    }
    console.log(slug, i);
  }
})();
