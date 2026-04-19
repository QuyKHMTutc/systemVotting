package com.xxxx.systemvotting.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

/**
 * Async configuration for fire-and-forget tasks.
 *
 * Used to offload notification creation from the hot vote path.
 * Without this, every first-time vote forces a synchronous DB write (notification) +
 * WebSocket push INSIDE the main thread, blocking HikariCP connections under high load.
 */
@Configuration
@EnableAsync
public class AsyncConfig {

    /**
     * Dedicated thread pool for async notification dispatch.
     * Isolated from Tomcat threads so a slow WebSocket push cannot starve vote requests.
     */
    @Bean(name = "notificationExecutor")
    public Executor notificationExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);
        executor.setMaxPoolSize(20);
        // Queue 2000 pending notifications before any are dropped
        executor.setQueueCapacity(2000);
        executor.setThreadNamePrefix("notif-async-");
        // CRITICAL: DiscardOldestPolicy drops the oldest queued notification (not the newest vote)
        // instead of throwing RejectedExecutionException which crashes the vote hot path.
        // Notifications are non-critical — losing one under extreme load is acceptable.
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.DiscardOldestPolicy());
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(10);
        executor.initialize();
        return executor;
    }
}
