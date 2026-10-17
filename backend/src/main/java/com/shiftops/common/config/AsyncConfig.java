package com.shiftops.common.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.core.task.SyncTaskExecutor;
import org.springframework.core.task.TaskExecutor;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

/**
 * Global asynchronous task execution configuration.
 *
 * In production (!test):
 * - Backed by a bounded ThreadPoolTaskExecutor with CallerRunsPolicy.
 * - Handles Spring Modulith @ApplicationModuleListener event dispatching asynchronously.
 *
 * In tests (test):
 * - Backed by SyncTaskExecutor to execute event listeners deterministically on the calling thread,
 *   guaranteeing immediate completion before assertions and database cleanup tearDown.
 */
@Configuration
@EnableAsync
public class AsyncConfig implements AsyncConfigurer {

    private final TaskExecutor taskExecutor;

    public AsyncConfig(@Lazy @Qualifier("taskExecutor") TaskExecutor taskExecutor) {
        this.taskExecutor = taskExecutor;
    }

    @Bean(name = { "taskExecutor", "applicationTaskExecutor" })
    @Primary
    @Profile("!test")
    public static TaskExecutor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);
        executor.setMaxPoolSize(10);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("async-exec-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.initialize();
        return executor;
    }

    @Bean(name = { "taskExecutor", "applicationTaskExecutor" })
    @Primary
    @Profile("test")
    public static TaskExecutor testTaskExecutor() {
        return new SyncTaskExecutor();
    }

    @Override
    public Executor getAsyncExecutor() {
        return this.taskExecutor;
    }
}
