export const ANONYMOUS_NOUNS = [
  "Cáo 🦊", "Sói 🐺", "Gấu Trúc 🐼", "Thỏ 🐰", "Hải Cẩu 🦭", "Cá Heo 🐬", "Mèo 🐱", "Cún 🐶", "Sư Tử 🦁", "Hổ 🐯",
  "Báo 🐆", "Rái Cá 🦦", "Chim Cánh Cụt 🐧", "Sóc 🐿️", "Hươu Cao Cổ 🦒", "Ngựa Vằn 🦓", "Đà Điểu 🦩", "Cá Mập 🦈", "Bạch Tuộc 🐙", "Tê Giác 🦏",
  "Hà Mã 🦛", "Lạc Đà 🐪", "Llama 🦙", "Khủng Long 🦖", "Koala 🐨", "Chuột Túi 🦘", "Lửng Mật 🦡", "Nhím 🦔", "Rùa 🐢", "Khỉ 🐵",
  "Cá Voi 🐳", "Cú Tuyết 🦉", "Thiên Nga 🦢", "Ốc Sên 🐌", "Tắc Kè 🦎", "Gà Tây 🦃", "Cừu 🐑", "Dê 🐐", "Bò Sữa 🐄", "Trâu 🐃",
  "Heo Rừng 🐗", "Hamster 🐹", "Gấu 🐻", "Khỉ Đột 🦍", "Voi 🐘", "Bồ Nông 🦤", "Cú Mèo 🦉", "Hươu 🦌", "Chuột Lang 🐹", "Chim Ưng 🦅"
];

export const ANONYMOUS_ADJECTIVES = [
  "Vui Vẻ", "Lười Biếng", "Nhanh Nhẹn", "Ngơ Ngác", "Bí Ẩn", "Dũng Cảm", "Nhút Nhát", "Lém Lỉnh", "Thích Thú", "Bực Bội",
  "Ngủ Gật", "Ngốc Nghếch", "Xinh Xắn", "Béo Mập", "Lầm Lì", "Lạc Quan", "Tò Mò", "Hoạt Bát", "Dễ Thương", "Can Đảm",
  "Thông Minh", "Ngu Ngơ", "Xảo Quyệt", "Hóm Hỉnh", "Thân Thiện", "Lạnh Lùng", "Kiêu Ngạo", "Dịu Dàng", "Ngổ Ngáo", "Khờ Khạo",
  "Đáng Yêu", "Bướng Bỉnh", "Trầm Tính", "Ồn Ào", "Rụt Rè", "Điềm Đạm", "Hiếu Động", "Say Sưa", "Tinh Nghịch", "Cáu Kỉnh",
  "Buồn Bã", "Lơ Đãng", "Hay Quên", "Vội Vã", "Thảnh Thơi", "Chăm Chỉ", "Mơ Mộng", "Hào Phóng", "Lãng Mạn", "Khó Tính"
];

export function getAnonymousCreatorName(pollId: number): string {
  // Use pollId to generate a stable, pseudo-random name for the creator
  // Offset by a large prime so it doesn't collide with early commenters
  const combinations = ANONYMOUS_NOUNS.length * ANONYMOUS_ADJECTIVES.length; // 2500
  const seed = pollId % combinations;
  
  // Use a fixed offset for the creator
  const index = (seed + 997) % combinations;
  
  const adjIndex = Math.floor(index / ANONYMOUS_NOUNS.length);
  const nounIndex = index % ANONYMOUS_NOUNS.length;
  
  const adj = ANONYMOUS_ADJECTIVES[adjIndex];
  const noun = ANONYMOUS_NOUNS[nounIndex];
  
  const animal = noun.split(' ')[0];
  const emoji = noun.split(' ')[1] || '';
  
  return `${animal} ${adj} ${emoji}`.trim();
}

export function getAvatarSeedFromName(name: string): string {
  // Extract just the emoji part or use the whole name if not found
  const emojiMatch = name.match(/[\p{Emoji_Presentation}\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}]/u);
  return emojiMatch ? emojiMatch[0] : name;
}
