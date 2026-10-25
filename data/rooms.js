// Dữ liệu hạng phòng — nguồn: file "CHLOE Homestay.pdf" (giá VND/đêm, chưa gồm ngày lễ & Tết).
// price = Chủ nhật–Thứ 5, priceWeekend = Thứ 6–Thứ 7.
// photos: số thứ tự ảnh trong public/img/rooms/<thư-mục>/NN.webp (tạo bằng scripts/optimize.js)
const ph = (folder, nums) => nums.map((n) => {
  const k = String(n).padStart(2, '0');
  return { full: `/img/rooms/${folder}/${k}.webp`, thumb: `/img/rooms/${folder}/${k}-t.webp` };
});

const TV = {
  vi: 'Smart TV tích hợp YouTube & Netflix (đã có sẵn tài khoản của homestay)',
  en: 'Smart TV with YouTube & Netflix (homestay account provided)',
};

const rooms = [
  {
    slug: 'lavender', price: 599000, priceWeekend: 649000, area: 30, balcony: true, window: true,
    name: { vi: 'Lavender', en: 'Lavender' },
    tag: { vi: '30m² · Ban công rộng · Xanh lam', en: '30 m² · Large balcony · Sky blue' },
    summary: {
      vi: 'Phòng có ban công rộng đón nhiều ánh sáng, bức tường vòm xanh lam dịu mắt.',
      en: 'A room with a large, light-filled balcony and a calming blue arch wall.',
    },
    description: {
      vi: 'Lavender rộng 30m² với ban công rộng và nhiều ánh sáng tự nhiên. Bức tường vòm xanh lam sau đầu giường cùng rèm xanh nhạt tạo nên không gian nhẹ nhàng, thư thái — hợp cho những ngày chỉ muốn nằm yên và nghỉ ngơi.',
      en: 'Lavender is a 30 m² room with a large balcony and plenty of natural light. A blue arch wall behind the bed and pale blue curtains create a calm, airy space made for slow, restful days.',
    },
    features: {
      vi: ['Diện tích 30m²', 'Ban công rộng, đón nhiều ánh sáng', 'Tường vòm xanh lam, rèm xanh nhạt', TV.vi, 'Bàn làm việc nhỏ', 'Phòng tắm riêng ốp gạch xanh'],
      en: ['30 m² room', 'Large balcony, bathed in light', 'Blue arch wall, pale blue curtains', TV.en, 'Small work desk', 'Private bathroom with blue tiles'],
    },
    photos: ph('lavender', [2, 14, 8, 6, 13, 9, 17, 25]),
  },
  {
    slug: 'atiso', price: 599000, priceWeekend: 649000, area: 30, balcony: true, window: true,
    name: { vi: 'Atiso', en: 'Artichoke' },
    tag: { vi: '30m² · Ban công rộng · Vàng nắng', en: '30 m² · Large balcony · Sunny yellow' },
    summary: {
      vi: 'Sắc vàng ấm áp, bức tường tối treo tranh nhỏ và ban công rộng đón nhiều ánh sáng.',
      en: 'Warm yellow tones, a dark wall of small framed prints and a large, light-filled balcony.',
    },
    description: {
      vi: 'Atiso mang màu vàng của nắng và hoa atiso: đầu giường vàng mù tạt nổi bật trên bức tường tối treo tranh nhỏ. Phòng rộng 30m², có ban công rộng và nhiều ánh sáng — nơi hợp để uống một tách cà phê buổi sáng.',
      en: 'Atiso takes its colour from sunshine and artichoke flowers: a mustard headboard set against a dark wall of small framed prints. The 30 m² room has a large, bright balcony — a lovely spot for morning coffee.',
    },
    features: {
      vi: ['Diện tích 30m²', 'Ban công rộng, đón nhiều ánh sáng', 'Đầu giường vàng mù tạt, tường tối treo tranh', TV.vi, 'Bàn làm việc nhỏ', 'Phòng tắm riêng ốp gạch vàng'],
      en: ['30 m² room', 'Large balcony, bathed in light', 'Mustard headboard, dark gallery wall', TV.en, 'Small work desk', 'Private bathroom with yellow tiles'],
    },
    photos: ph('atiso', [7, 3, 4, 10, 12, 1, 16, 24]),
  },
  {
    slug: 'cam-tu-cau', price: 399000, priceWeekend: 449000, area: 20, balcony: false, window: false,
    name: { vi: 'Cẩm Tú Cầu', en: 'Hydrangea' },
    tag: { vi: '20m² · Phòng tiêu chuẩn · Xanh cobalt', en: '20 m² · Standard room · Cobalt blue' },
    summary: {
      vi: 'Phòng tiêu chuẩn, tường xanh cobalt với dải thành phố nhỏ và những tán lá treo — kín đáo, ấm cúng.',
      en: 'A standard room with a cobalt wall, a tiny skyline and hanging leaves — private and cosy.',
    },
    description: {
      vi: 'Cẩm Tú Cầu là phòng tiêu chuẩn rộng 20m², không có cửa sổ và ban công nên rất yên tĩnh, dễ ngủ sâu. Bức tường xanh cobalt, sàn gỗ và cửa vòm gỗ tạo cảm giác ấm áp như trong một căn nhà nhỏ.',
      en: 'Hydrangea is a 20 m² standard room with no window or balcony — quiet and easy to sleep in. A cobalt wall, wooden floors and an arched timber door make it feel like a little home.',
    },
    features: {
      vi: ['Diện tích 20m², không có cửa sổ / ban công', 'Tường xanh cobalt, sàn gỗ, cửa vòm gỗ', TV.vi, 'Bàn làm việc nhỏ', 'Phòng tắm riêng ốp gạch xanh'],
      en: ['20 m², no window or balcony', 'Cobalt wall, wooden floor, arched timber door', TV.en, 'Small work desk', 'Private bathroom with blue tiles'],
    },
    photos: ph('cam-tu-cau', [2, 7, 3, 8, 11, 12]),
  },
  {
    slug: 'tam-giac-mach', price: 399000, priceWeekend: 449000, area: 20, balcony: false, window: false,
    name: { vi: 'Tam Giác Mạch', en: 'Buckwheat' },
    tag: { vi: '20m² · Phòng tiêu chuẩn · Hồng san hô', en: '20 m² · Standard room · Coral pink' },
    summary: {
      vi: 'Phòng tiêu chuẩn, tường hồng san hô với đầu giường hình bông hoa khô, ấm áp và lãng mạn.',
      en: 'A standard room with a coral wall and a dried-flower headboard — warm and quietly romantic.',
    },
    description: {
      vi: 'Tam Giác Mạch lấy cảm hứng từ những cánh đồng hoa mùa thu vùng cao. Bức tường hồng san hô cùng đầu giường hình bông hoa khô, sàn gỗ và ánh đèn ngủ vàng nhẹ tạo nên căn phòng 20m² ấm áp, lãng mạn.',
      en: 'Buckwheat is inspired by autumn flower fields in the highlands. A coral wall, a dried-flower headboard, wooden floors and soft bedside lamps make this 20 m² room warm and romantic.',
    },
    features: {
      vi: ['Diện tích 20m², không có cửa sổ / ban công', 'Tường hồng san hô, sàn gỗ, cửa vòm gỗ', TV.vi, 'Bàn làm việc nhỏ', 'Phòng tắm riêng'],
      en: ['20 m², no window or balcony', 'Coral wall, wooden floor, arched timber door', TV.en, 'Small work desk', 'Private bathroom'],
    },
    photos: ph('tam-giac-mach', [2, 1, 6, 4, 5, 8, 11]),
  },
  {
    slug: 'mai-anh-dao', price: 399000, priceWeekend: 449000, area: 17, balcony: false, window: true,
    name: { vi: 'Mai Anh Đào', en: 'Cherry Blossom' },
    tag: { vi: '17m² · Phòng tiêu chuẩn · Có cửa sổ', en: '17 m² · Standard room · With window' },
    summary: {
      vi: 'Phòng tiêu chuẩn có cửa sổ, tường hồng đất, kệ cây xanh và tấm macramé treo tường.',
      en: 'A standard room with a window, a terracotta-pink wall, a shelf of plants and a macramé hanging.',
    },
    description: {
      vi: 'Mai Anh Đào gợi nhớ những mùa hoa đào trên phố núi. Căn phòng 17m² có cửa sổ đón sáng, kệ cây xanh và tấm macramé thủ công — nhỏ gọn, xinh xắn và rất Đà Lạt.',
      en: 'Cherry Blossom recalls spring blossoms in the highlands. This 17 m² room has a window, a shelf of plants and a handmade macramé hanging — compact, pretty and unmistakably Da Lat.',
    },
    features: {
      vi: ['Diện tích 17m², có cửa sổ', 'Tường hồng đất, kệ cây xanh, macramé', TV.vi, 'Bàn làm việc nhỏ', 'Phòng tắm riêng ốp gạch hồng'],
      en: ['17 m² with window', 'Terracotta-pink wall, plant shelf, macramé', TV.en, 'Small work desk', 'Private bathroom with pink tiles'],
    },
    photos: ph('mai-anh-dao', [1, 3, 2, 8, 7]),
  },
  {
    slug: 'mimosa', price: 399000, priceWeekend: 449000, area: 17, balcony: false, window: true,
    name: { vi: 'Mimosa', en: 'Mimosa' },
    tag: { vi: '17m² · Phòng tiêu chuẩn · Có cửa sổ', en: '17 m² · Standard room · With window' },
    summary: {
      vi: 'Phòng tiêu chuẩn có cửa sổ, tông xám sương tinh tế và bức tranh cánh đồng trên tường.',
      en: 'A standard room with a window, a refined misty-grey palette and a field painting on the wall.',
    },
    description: {
      vi: 'Mimosa chọn tông xám sương trầm lắng, điểm bằng bức tranh cánh đồng và chiếc đèn thả dáng tròn. Phòng 17m² có cửa sổ đón sáng — dành cho những ai thích sự tối giản, yên tĩnh.',
      en: 'Mimosa goes for a quiet misty grey, lifted by a field painting and a round pendant lamp. The 17 m² room has a window for natural light — for guests who love calm minimalism.',
    },
    features: {
      vi: ['Diện tích 17m², có cửa sổ', 'Tường xám sương, tranh cánh đồng, đèn thả', TV.vi, 'Bàn làm việc nhỏ', 'Phòng tắm riêng'],
      en: ['17 m² with window', 'Misty-grey wall, field painting, pendant lamp', TV.en, 'Small work desk', 'Private bathroom'],
    },
    photos: ph('mimosa', [1, 6, 4, 10, 5, 11]),
  },
  {
    slug: 'huong-duong', price: 899000, priceWeekend: 949000, area: 50, balcony: true, window: true, guests: '4–6',
    name: { vi: 'Hướng Dương', en: 'Sunflower' },
    tag: { vi: '50m² · Phòng áp mái · 4–6 người', en: '50 m² · Attic room · 4–6 guests' },
    summary: {
      vi: 'Phòng áp mái rộng 50m² có ban công, phù hợp cho nhóm 4–6 người.',
      en: 'A 50 m² attic room with a balcony, suited to groups of 4–6.',
    },
    description: {
      vi: 'Hướng Dương là phòng áp mái rộng 50m² dưới mái nghiêng, sàn gỗ ấm, tường màu cam và xanh lá, có ban công. Không gian đủ rộng cho nhóm bạn hoặc gia đình 4–6 người ở cùng nhau.',
      en: 'Sunflower is a 50 m² attic room under a sloped roof, with warm wooden floors, orange and sage walls and a balcony. Roomy enough for a group of friends or a family of 4–6.',
    },
    features: {
      vi: ['Diện tích 50m², phòng áp mái', 'Có ban công', 'Phù hợp nhóm 4–6 người', 'Sàn gỗ, kệ gỗ để đồ, rèm cửa lớn', 'Phòng tắm ốp gạch vàng'],
      en: ['50 m² attic room', 'Balcony', 'Suited to groups of 4–6', 'Wooden floor, open timber shelves, large curtains', 'Bathroom with yellow tiles'],
    },
    photos: ph('gac-mai', [15, 6, 14, 2, 5, 4, 19, 17]),
  },
];

module.exports = rooms;
