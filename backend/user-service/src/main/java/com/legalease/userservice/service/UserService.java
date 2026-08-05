package com.legalease.userservice.service;

import com.legalease.userservice.dto.AuthResponseDto;
import com.legalease.userservice.dto.ChangePasswordDto;
import com.legalease.userservice.dto.LoginDto;
import com.legalease.userservice.dto.RegisterDto;
import com.legalease.userservice.dto.UpdateProfileDto;
import com.legalease.userservice.dto.UserDto;

import java.util.List;
import java.util.UUID;

public interface UserService {
    UserDto registerUser(RegisterDto registerDto);
    AuthResponseDto login(LoginDto loginDto);
    UserDto getUserById(UUID userId);
    List<UserDto> getAllUsers();
    UserDto updateProfile(UUID userId, UpdateProfileDto updateProfileDto);
    void changePassword(UUID userId, ChangePasswordDto changePasswordDto);
    UserDto updateUserStatus(UUID userId, boolean active);
    void deleteUser(UUID userId);
}
