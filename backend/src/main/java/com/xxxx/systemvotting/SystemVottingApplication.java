package com.xxxx.systemvotting;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SystemVottingApplication {

    public static void main(String[] args) {
        SpringApplication.run(SystemVottingApplication.class, args);
    }

}
