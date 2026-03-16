package com.xxxx.systemvotting.common.service;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;

public interface BaseRedisService<K, F, V> {
    void set(K key, V value);

    void setWithExpiration(K key, V value, long timeout, TimeUnit unit);

    void setTimeToLive(K key, long timeout, TimeUnit unit);

    void hashSet(K key, F field, V value);

    boolean hashExists(K key, F field);

    V get(K key);

    Map<F, V> getField(K key);

    V hashGet(K key, F field);

    List<V> hashGetByFieldPrefix(K key, String fieldPrefix);

    Set<F> getFieldPrefixes(K key);

    void delete(K key);

    void delete(K key, F field);

    void delete(K key, List<F> fields);

    Long increment(K key);

    Long decrement(K key);
}
