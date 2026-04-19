package com.xxxx.systemvotting.config;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.jsontype.BasicPolymorphicTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.apache.commons.pool2.impl.GenericObjectPoolConfig;
import org.springframework.boot.autoconfigure.data.redis.RedisProperties;
import org.springframework.util.StringUtils;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.annotation.CachingConfigurer;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.cache.interceptor.SimpleCacheErrorHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisPassword;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.connection.lettuce.LettucePoolingClientConfiguration;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.cache.RedisCacheWriter;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import lombok.extern.slf4j.Slf4j;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Configuration
@EnableCaching
public class RedisConfiguration implements CachingConfigurer {

    /**
     * ObjectMapper for Redis cache serialization.
     *
     * Key design decisions:
     * 1. JavaTimeModule — handles LocalDateTime fields in DTOs (PollResponseDTO, UserResponseDTO etc.)
     * 2. DefaultTyping with PROPERTY style — stores class name as "@class" field inside the JSON object,
     *    NOT as a wrapping array ["ClassName", {...}].
     *    This avoids MismatchedInputException when reading back List<Map> from plain serialized arrays.
     * 3. PolymorphicTypeValidator — restricts type resolution to our own packages for security.
     */
    private ObjectMapper buildCacheObjectMapper() {
        ObjectMapper mapper = new ObjectMapper();

        // Handle LocalDateTime, LocalDate, ZonedDateTime etc.
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

        // Use PROPERTY-style type inclusion: embeds @class as a field within the object.
        // This is safer than AS_WRAPPER_ARRAY (which causes MismatchedInputException on plain arrays).
        // Example stored JSON: {"@class":"com.xxxx...UserResponseDTO","id":1,"username":"admin",...}
        mapper.activateDefaultTypingAsProperty(
                BasicPolymorphicTypeValidator.builder()
                        .allowIfSubType("com.xxxx.systemvotting")
                        .allowIfSubType("java.util")
                        .allowIfSubType("java.lang")
                        .allowIfSubType("java.time")
                        .build(),
                ObjectMapper.DefaultTyping.NON_FINAL,
                "@class"
        );

        return mapper;
    }

    /**
     * Lettuce Connection Pool — CRITICAL for high concurrency.
     * Without pooling, all 2000 concurrent requests share 1 connection → bottleneck.
     */
    @Bean
    public LettuceConnectionFactory redisConnectionFactory(RedisProperties redisProperties) {
        GenericObjectPoolConfig<Object> poolConfig = new GenericObjectPoolConfig<>();
        RedisProperties.Pool poolProps = redisProperties.getLettuce().getPool();
        int maxActive = 50;
        int maxIdle = 20;
        int minIdle = 10;
        long maxWaitMs = 2000;
        if (poolProps != null) {
            if (poolProps.getMaxActive() > 0) {
                maxActive = poolProps.getMaxActive();
            }
            if (poolProps.getMaxIdle() > 0) {
                maxIdle = poolProps.getMaxIdle();
            }
            if (poolProps.getMinIdle() > 0) {
                minIdle = poolProps.getMinIdle();
            }
            if (poolProps.getMaxWait() != null) {
                maxWaitMs = poolProps.getMaxWait().toMillis();
            }
        }

        poolConfig.setMaxTotal(maxActive);
        poolConfig.setMaxIdle(maxIdle);
        poolConfig.setMinIdle(minIdle);
        poolConfig.setMaxWait(Duration.ofMillis(maxWaitMs));
        poolConfig.setTestOnBorrow(false);
        poolConfig.setTestWhileIdle(true);
        poolConfig.setTimeBetweenEvictionRuns(Duration.ofSeconds(30));

        Duration commandTimeout = redisProperties.getTimeout() != null
                ? redisProperties.getTimeout()
                : Duration.ofSeconds(5);

        LettucePoolingClientConfiguration clientConfig = LettucePoolingClientConfiguration.builder()
                .poolConfig(poolConfig)
                .commandTimeout(commandTimeout)
                .build();

        RedisStandaloneConfiguration serverConfig = new RedisStandaloneConfiguration();
        serverConfig.setHostName(redisProperties.getHost());
        serverConfig.setPort(redisProperties.getPort());
        if (StringUtils.hasText(redisProperties.getUsername())) {
            serverConfig.setUsername(redisProperties.getUsername());
        }
        if (StringUtils.hasText(redisProperties.getPassword())) {
            serverConfig.setPassword(RedisPassword.of(redisProperties.getPassword()));
        }
        return new LettuceConnectionFactory(serverConfig, clientConfig);
    }

    /**
     * RedisTemplate for manual Redis operations (vote counts, rate limiting, pipeline etc.)
     * Uses StringRedisSerializer for keys/hash-keys — compatible with StringRedisTemplate.
     * Values use GenericJackson2JsonRedisSerializer with proper ObjectMapper.
     *
     * NOTE: Do NOT declare a "stringRedisTemplate" @Bean here —
     * Spring Boot auto-configures it, and overriding causes BeanDefinitionOverrideException.
     */
    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        StringRedisSerializer stringSerializer = new StringRedisSerializer();
        template.setKeySerializer(stringSerializer);
        template.setHashKeySerializer(stringSerializer);

        GenericJackson2JsonRedisSerializer jsonSerializer =
                new GenericJackson2JsonRedisSerializer(buildCacheObjectMapper());
        template.setValueSerializer(jsonSerializer);
        template.setHashValueSerializer(jsonSerializer);

        template.afterPropertiesSet();
        return template;
    }

    /**
     * RedisCacheManager — routes @Cacheable/@CacheEvict to Redis.
     *
     * Uses GenericJackson2JsonRedisSerializer with a custom ObjectMapper that:
     * - Has JavaTimeModule (fixes LocalDateTime crash)
     * - Uses PROPERTY-style DefaultTyping (fixes ClassCastException on deserialization)
     * - Uses @class field name (not wrapper array) to avoid MismatchedInputException
     *
     * {@link RedisCacheWriter#nonLockingRedisCacheWriter} avoids Redis SET NX lock contention
     * when many threads populate the same cache key under load.
     */
    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        GenericJackson2JsonRedisSerializer valueSerializer =
                new GenericJackson2JsonRedisSerializer(buildCacheObjectMapper());

        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(5))
                .disableCachingNullValues()
                .serializeKeysWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(valueSerializer));

        Map<String, RedisCacheConfiguration> cacheConfigs = new HashMap<>();
        // DB snapshot only for poll detail; live vote counts merged after cache (see PollDetailsCacheLoader)
        cacheConfigs.put("pollDetails",      defaultConfig.entryTtl(Duration.ofMinutes(15)));
        cacheConfigs.put("comments",         defaultConfig.entryTtl(Duration.ofMinutes(3)));
        cacheConfigs.put("userProfile",      defaultConfig.entryTtl(Duration.ofMinutes(15)));
        cacheConfigs.put("users",            defaultConfig.entryTtl(Duration.ofMinutes(15)));
        cacheConfigs.put("notifUnreadCount", defaultConfig.entryTtl(Duration.ofMinutes(2)));

        RedisCacheWriter cacheWriter = RedisCacheWriter.nonLockingRedisCacheWriter(connectionFactory);

        return RedisCacheManager.builder(connectionFactory)
                .cacheWriter(cacheWriter)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(cacheConfigs)
                .build();
    }

    /**
     * Graceful cache error handling — treat stale/incompatible cache entries as cache misses.
     *
     * Without this, a SerializationException (e.g., from stale data after a deployment)
     * propagates up as a 500 error. With this handler, the exception is logged as WARN
     * and the method falls through to the real data source (DB).
     */
    @Override
    public CacheErrorHandler errorHandler() {
        return new SimpleCacheErrorHandler() {
            @Override
            public void handleCacheGetError(RuntimeException e, org.springframework.cache.Cache cache, Object key) {
                log.warn("Cache GET error on cache='{}' key='{}': {} — falling back to data source.",
                        cache.getName(), key, e.getMessage());
                // Do NOT rethrow — treat as cache miss so the method executes normally
            }

            @Override
            public void handleCachePutError(RuntimeException e, org.springframework.cache.Cache cache, Object key, Object value) {
                log.warn("Cache PUT error on cache='{}' key='{}': {} — cache not updated.",
                        cache.getName(), key, e.getMessage());
            }

            @Override
            public void handleCacheEvictError(RuntimeException e, org.springframework.cache.Cache cache, Object key) {
                log.warn("Cache EVICT error on cache='{}' key='{}': {}",
                        cache.getName(), key, e.getMessage());
            }

            @Override
            public void handleCacheClearError(RuntimeException e, org.springframework.cache.Cache cache) {
                log.warn("Cache CLEAR error on cache='{}': {}", cache.getName(), e.getMessage());
            }
        };
    }
}
