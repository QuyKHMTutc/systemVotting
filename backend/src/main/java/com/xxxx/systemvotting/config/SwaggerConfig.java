package com.xxxx.systemvotting.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springdoc.core.models.GroupedOpenApi;

@Configuration
public class SwaggerConfig {

    @Bean
    public GroupedOpenApi publicApi() {
        return GroupedOpenApi.builder()
                .group("v1-public")
                .pathsToMatch("/api/v1/auth/**")
                .build();
    }

    @Bean
    public GroupedOpenApi pollApi() {
        return GroupedOpenApi.builder()
                .group("v1-poll")
                .pathsToMatch("/api/v1/polls/**", "/api/v1/votes/**", "/api/v1/comments/**")
                .build();
    }

    @Bean
    public GroupedOpenApi userApi() {
        return GroupedOpenApi.builder()
                .group("v1-user")
                .pathsToMatch("/api/v1/users/**")
                .build();
    }

    private SecurityScheme createBearerScheme() {
        // @formatter:off
        return new SecurityScheme()
                .type(SecurityScheme.Type.HTTP)
                .bearerFormat("JWT")
                .scheme("bearer");
        // @formatter:on
    }

    private Server createServer(String url, String description) {
        Server server = new Server();
        server.setUrl(url);
        server.setDescription(description);
        return server;
    }

    private Contact createContact() {
        // @formatter:off
        return new Contact()
                .email("quykhmtutc@gmail.com")
                .name("tranquy")
                .url("https://github.com/QuyKHMTutc");
        // @formatter:on
    }

    private License createLicense() {
        return new License().name("MIT License")
                .url("https://choosealicense.com/licenses/mit/");
    }

    private Info createApiInfo() {
        // @formatter:off
        return new Info()
                .title("Hệ thống bỏ phiếu trực tuyến API")
                .version("1.0")
                .contact(createContact())
                .description("### Giới thiệu\n" +
                        "Hệ thống cung cấp các RESTful APIs cho việc quản lý và tham gia bỏ phiếu trực tuyến.\n\n" +
                        "### Các tính năng chính:\n" +
                        "* **Xác thực & Phân quyền:** Sử dụng JWT và OAuth2 (Google).\n" +
                        "* **Bình chọn thời gian thực:** Cập nhật kết quả qua WebSocket (STOMP).\n" +
                        "* **Bảo mật:** Giới hạn lưu lượng (Rate limiting) bằng Bucket4j.\n" +
                        "* **Thông báo:** Tích hợp gửi email xác nhận và OTP.")
                .termsOfService("https://guyguy.vn/terms")
                .license(createLicense());
        // @formatter:on
    }

    @Bean
    OpenAPI myOpenAPI() {
        // @formatter:off
        return new OpenAPI()
                .info(createApiInfo())
                .servers(List.of(
                        createServer("http://localhost:8080",
                                "Server URL in Development environment"),
                        createServer("https://uat.example.com",
                                "Server URL in Testing environment"),
                        createServer("https://system-votting.vercel.app",
                                "Server URL in Production environment")))
                .components(new Components()
                        .addSecuritySchemes("Bearer Authentication", createBearerScheme()));
        // @formatter:on
    }
}

