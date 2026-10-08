package com.shiftops.common.outbox;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.task.TaskExecutor;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.ThreadPoolExecutor;

/**
 * Bounded Spring-managed task executor for asynchronous post-commit Outbox triggering.
 * Prevents HTTP request threads from performing synchronous notification/WebSocket work.
 */
@Configuration
public class OutboxAsyncConfig {

    @Bean(name = "outboxTaskExecutor")
    @org.springframework.context.annotation.Profile("!test")
    public TaskExecutor outboxTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(4);
        executor.setQueueCapacity(50);
        executor.setThreadNamePrefix("outbox-async-");
        // Saturated queue safely drops trigger because scheduled poller is the durable reliability guarantee
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.DiscardPolicy());
        executor.initialize();
        return executor;
    }

    @Bean(name = "outboxTaskExecutor")
    @org.springframework.context.annotation.Profile("test")
    public TaskExecutor testOutboxTaskExecutor() {
        return new org.springframework.core.task.SyncTaskExecutor();
    }
}
