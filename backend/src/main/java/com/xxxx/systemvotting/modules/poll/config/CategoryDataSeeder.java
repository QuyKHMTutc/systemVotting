package com.xxxx.systemvotting.modules.poll.config;

import com.xxxx.systemvotting.modules.poll.entity.Category;
import com.xxxx.systemvotting.modules.poll.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Seeds the fixed category list on startup if the table is empty.
 * Categories are predefined — no user can create or delete them.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CategoryDataSeeder implements ApplicationRunner {

    private final CategoryRepository categoryRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (categoryRepository.count() > 0) {
            log.info("Categories already seeded — skipping.");
            return;
        }

        List<Category> defaults = List.of(
                Category.builder().name("Trending").slug("trending").icon("🔥").sortOrder(0).build(),
                Category.builder().name("Công nghệ").slug("cong-nghe").icon("💻").sortOrder(1).build(),
                Category.builder().name("Gaming").slug("gaming").icon("🎮").sortOrder(2).build(),
                Category.builder().name("Giải trí").slug("giai-tri").icon("🎬").sortOrder(3).build(),
                Category.builder().name("Thể thao").slug("the-thao").icon("⚽").sortOrder(4).build(),
                Category.builder().name("Âm nhạc").slug("am-nhac").icon("🎵").sortOrder(5).build(),
                Category.builder().name("Học tập").slug("hoc-tap").icon("📚").sortOrder(6).build(),
                Category.builder().name("Kinh doanh").slug("kinh-doanh").icon("💼").sortOrder(7).build(),
                Category.builder().name("Đời sống").slug("doi-song").icon("💖").sortOrder(8).build(),
                Category.builder().name("Ẩm thực").slug("am-thuc").icon("🍜").sortOrder(9).build(),
                Category.builder().name("Du lịch").slug("du-lich").icon("✈️").sortOrder(10).build(),
                Category.builder().name("Thời trang").slug("thoi-trang").icon("👗").sortOrder(11).build(),
                Category.builder().name("Sức khỏe").slug("suc-khoe").icon("🏃").sortOrder(12).build(),
                Category.builder().name("Khoa học").slug("khoa-hoc").icon("🔬").sortOrder(13).build(),
                Category.builder().name("Nghệ thuật").slug("nghe-thuat").icon("🎨").sortOrder(14).build(),
                Category.builder().name("Xã hội").slug("xa-hoi").icon("🌍").sortOrder(15).build(),
                Category.builder().name("Chính trị").slug("chinh-tri").icon("🏛️").sortOrder(16).build(),
                Category.builder().name("Môi trường").slug("moi-truong").icon("🌿").sortOrder(17).build(),
                Category.builder().name("Tài chính").slug("tai-chinh").icon("💰").sortOrder(18).build(),
                Category.builder().name("Thú cưng").slug("thu-cuong").icon("🐾").sortOrder(19).build(),
                Category.builder().name("Anime & Manga").slug("anime-manga").icon("⛩️").sortOrder(20).build(),
                Category.builder().name("Phim ảnh").slug("phim-anh").icon("🎥").sortOrder(21).build(),
                Category.builder().name("Thể hình").slug("the-hinh").icon("💪").sortOrder(22).build(),
                Category.builder().name("Khác").slug("khac").icon("•••").sortOrder(99).build()
        );

        categoryRepository.saveAll(defaults);
        log.info("Seeded {} default categories.", defaults.size());
    }
}
