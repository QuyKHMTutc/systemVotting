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

@Configuration
public class SwaggerConfig {

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
                .title("Hệ thông bỏ phiếu trực tuyến")
                .version("1.0")
                .contact(createContact())
                .description("Designed and implemented RESTful APIs using Spring Boot\n" +
                        "• Implemented JWT-based authentication and role-based authorization using\n" +
                        "Spring Security and OAuth2\n" +
                        "• Built real-time voting updates using WebSocket (STOMP) allowing clients to\n" +
                        "receive live poll results without page refresh\n" +
                        "• Implemented API rate limiting using Bucket4j to prevent abuse of voting\n" +
                        "endpoints\n" +
                        "• Designed secure voting workflows and poll lifecycle management\n" +
                        "• Integrated email notification system using Spring Boot Mail")
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
                        createServer("https://system-votting.vercel.app/",
                                "Server URL in Production environment")))
                .addSecurityItem(
                        new SecurityRequirement().addList("Bearer Authentication"))
                .components(new Components()
                        .addSecuritySchemes("Bearer Authentication", createBearerScheme()));
        // @formatter:on
    }
}

