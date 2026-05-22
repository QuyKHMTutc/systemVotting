package com.xxxx.systemvotting.common.utils;

public class AnonymousIdentityUtil {
    
    private static final String[] ANONYMOUS_NOUNS = {
        "Cáo 🦊", "Sói 🐺", "Gấu Trúc 🐼", "Thỏ 🐰", "Hải Cẩu 🦭", "Cá Heo 🐬", "Mèo 🐱", "Cún 🐶", "Sư Tử 🦁", "Hổ 🐯",
        "Báo 🐆", "Rái Cá 🦦", "Chim Cánh Cụt 🐧", "Sóc 🐿️", "Hươu Cao Cổ 🦒", "Ngựa Vằn 🦓", "Đà Điểu 🦩", "Cá Mập 🦈", "Bạch Tuộc 🐙", "Tê Giác 🦏",
        "Hà Mã 🦛", "Lạc Đà 🐪", "Llama 🦙", "Khủng Long 🦖", "Koala 🐨", "Chuột Túi 🦘", "Lửng Mật 🦡", "Nhím 🦔", "Rùa 🐢", "Khỉ 🐵",
        "Cá Voi 🐳", "Cú Tuyết 🦉", "Thiên Nga 🦢", "Ốc Sên 🐌", "Tắc Kè 🦎", "Gà Tây 🦃", "Cừu 🐑", "Dê 🐐", "Bò Sữa 🐄", "Trâu 🐃",
        "Heo Rừng 🐗", "Hamster 🐹", "Gấu 🐻", "Khỉ Đột 🦍", "Voi 🐘", "Bồ Nông 🦤", "Cú Mèo 🦉", "Hươu 🦌", "Chuột Lang 🐹", "Chim Ưng 🦅"
    };

    private static final String[] ANONYMOUS_ADJECTIVES = {
        "Vui Vẻ", "Lười Biếng", "Nhanh Nhẹn", "Ngơ Ngác", "Bí Ẩn", "Dũng Cảm", "Nhút Nhát", "Lém Lỉnh", "Thích Thú", "Bực Bội",
        "Ngủ Gật", "Ngốc Nghếch", "Xinh Xắn", "Béo Mập", "Lầm Lì", "Lạc Quan", "Tò Mò", "Hoạt Bát", "Dễ Thương", "Can Đảm",
        "Thông Minh", "Ngu Ngơ", "Xảo Quyệt", "Hóm Hỉnh", "Thân Thiện", "Lạnh Lùng", "Kiêu Ngạo", "Dịu Dàng", "Ngổ Ngáo", "Khờ Khạo",
        "Đáng Yêu", "Bướng Bỉnh", "Trầm Tính", "Ồn Ào", "Rụt Rè", "Điềm Đạm", "Hiếu Động", "Say Sưa", "Tinh Nghịch", "Cáu Kỉnh",
        "Buồn Bã", "Lơ Đãng", "Hay Quên", "Vội Vã", "Thảnh Thơi", "Chăm Chỉ", "Mơ Mộng", "Hào Phóng", "Lãng Mạn", "Khó Tính"
    };

    public static final int MAX_COMBINATIONS = ANONYMOUS_NOUNS.length * ANONYMOUS_ADJECTIVES.length;
    
    public static String getCreatorAnonymousName(Long pollId) {
        int seed = (int) (pollId % MAX_COMBINATIONS);
        int shiftedIndex = seed + 997;
        int nounIndex = shiftedIndex % ANONYMOUS_NOUNS.length;
        int adjIndex = (shiftedIndex / ANONYMOUS_NOUNS.length) % ANONYMOUS_ADJECTIVES.length;
        
        String noun = ANONYMOUS_NOUNS[nounIndex];
        String adj = ANONYMOUS_ADJECTIVES[adjIndex];
        
        String animalName = noun.substring(0, noun.length() - 2).trim();
        String emoji = noun.substring(noun.length() - 2).trim();
        
        return animalName + " " + adj + " " + emoji;
    }
}
