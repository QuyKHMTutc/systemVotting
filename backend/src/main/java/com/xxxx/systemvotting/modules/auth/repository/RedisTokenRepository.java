package com.xxxx.systemvotting.modules.auth.repository;

import com.javabuilder.userservice.entity.RedisToken;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RedisTokenRepository extends CrudRepository<RedisToken, String> {
}
