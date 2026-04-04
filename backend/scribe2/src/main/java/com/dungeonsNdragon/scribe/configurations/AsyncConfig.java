package com.dungeonsNdragon.scribe.configurations;


import java.util.concurrent.Executor;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.web.client.RestTemplate;

@Configuration
class AsyncConfig {
    /**
     * Bounded thread pool for @Async tasks.
     * Prevents OOM when many matches end simultaneously.
     * If queue is full: task is dropped (XP writes are non-critical, retryable).
     */
    @Bean(name = "taskExecutor")
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(3);
        executor.setMaxPoolSize(10);
        executor.setQueueCapacity(50);
        executor.setThreadNamePrefix("scribe-async-");
        executor.setRejectedExecutionHandler(
                (r, exec) -> System.err.println("Scribe async queue full — dropping task"));
        executor.initialize();
        return executor;
    }

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
