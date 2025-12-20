package com.scoop.hackathon.service;

import com.scoop.hackathon.dto.CreateUserRequest;
import com.scoop.hackathon.dto.UpdateUserRequest;
import com.scoop.hackathon.dto.UserDto;

import java.util.List;

public interface UserService {
    UserDto createUser(CreateUserRequest request);
    UserDto getUserById(String id);
    UserDto getUserByEmail(String email);
    List<UserDto> getAllUsers();
    UserDto updateUser(String id, UpdateUserRequest request);
    void deleteUser(String id);
    boolean existsByEmail(String email);
}

