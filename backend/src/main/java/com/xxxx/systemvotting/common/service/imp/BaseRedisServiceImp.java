package com.xxxx.systemvotting.common.service.imp;

import com.xxxx.systemvotting.common.service.BaseRedisService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class BaseRedisServiceImp<K, F, V> implements BaseRedisService<K, F, V> {

    private final RedisTemplate<K, V> redisTemplate;
    private final HashOperations<K, F, V> hashOperations;

    @Override
    public void set(K key, V value) {
        redisTemplate.opsForValue().set(key, value);
    }

    @Override
    public void setWithExpiration(K key, V value, long timeout, TimeUnit unit) {
        redisTemplate.opsForValue().set(key, value, timeout, unit);
    }

    @Override
    public void setTimeToLive(K key, long timeout, TimeUnit unit) {
        redisTemplate.expire(key, timeout, unit);
    }

    @Override
    public void hashSet(K key, F field, V value) {
        hashOperations.put(key, field, value);
    }

    @Override
    public boolean hashExists(K key, F field) {
        return hashOperations.hasKey(key, field);
    }

    @Override
    public V get(K key) {
        return redisTemplate.opsForValue().get(key);
    }

    @Override
    public Map<F, V> getField(K key) {
        return hashOperations.entries(key);
    }

    @Override
    public V hashGet(K key, F field) {
        return hashOperations.get(key, field);
    }

    @Override
    public List<V> hashGetByFieldPrefix(K key, String fieldPrefix) {
        List<V> objects = new ArrayList<>();
        org.springframework.data.redis.core.ScanOptions options = org.springframework.data.redis.core.ScanOptions.scanOptions().match(fieldPrefix + "*").count(100).build();

        try (org.springframework.data.redis.core.Cursor<Map.Entry<F, V>> cursor = hashOperations.scan(key, options)) {
            while (cursor.hasNext()) {
                Map.Entry<F, V> entry = cursor.next();
                objects.add(entry.getValue());
            }
        } catch (Exception e) {
            log.error("Failed to execute hashGetByFieldPrefix on Redis for prefix: {}", fieldPrefix, e);
        }
        return objects;
    }

    @Override
    public Set<F> getFieldPrefixes(K key) {
        return hashOperations.keys(key);
    }

    @Override
    public void delete(K key) {
        redisTemplate.delete(key);
    }

    @Override
    public void delete(K key, F field) {
        hashOperations.delete(key, field);
    }

    @Override
    public void delete(K key, List<F> fields) {
        if (fields != null && !fields.isEmpty()) {
            hashOperations.delete(key, fields.toArray());
        }
    }

    @Override
    public Long increment(K key) {
        return redisTemplate.opsForValue().increment(key);
    }

    @Override
    public Long decrement(K key) {
        return redisTemplate.opsForValue().decrement(key);
    }
}