package com.xxxx.systemvotting.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path uploadDir = Paths.get("uploads");
        String uploadPath = uploadDir.toFile().getAbsolutePath();
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + uploadPath + "/");

        Path avatarDir = Paths.get("avatars");
        String avatarPath = avatarDir.toFile().getAbsolutePath();
        registry.addResourceHandler("/avatars/**")
                .addResourceLocations("file:" + avatarPath + "/");
        registry.addResourceHandler("/uploads/avatars/**")
                .addResourceLocations("file:" + avatarPath + "/");
    }
}
