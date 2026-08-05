package com.legalease.userservice.service.impl;

import com.legalease.userservice.dto.AuthResponseDto;
import com.legalease.userservice.dto.ChangePasswordDto;
import com.legalease.userservice.dto.LoginDto;
import com.legalease.userservice.dto.RegisterDto;
import com.legalease.userservice.dto.UpdateProfileDto;
import com.legalease.userservice.dto.UserDto;
import com.legalease.userservice.entity.User;
import com.legalease.userservice.repository.UserRepository;
import com.legalease.userservice.security.JwtTokenProvider;
import com.legalease.userservice.service.UserService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public UserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    public UserDto registerUser(RegisterDto registerDto) {
        if (registerDto.getRole() == null || registerDto.getName() == null || registerDto.getName().isBlank()
                || registerDto.getEmail() == null || registerDto.getEmail().isBlank()
                || registerDto.getPassword() == null || registerDto.getPassword().isBlank()) {
            throw new RuntimeException("Name, email, password and role are required");
        }

        if (userRepository.findByEmail(registerDto.getEmail()).isPresent()) {
            throw new RuntimeException("User already exists");
        }

        User user = new User();
        user.setName(registerDto.getName().trim());
        user.setEmail(registerDto.getEmail().trim());
        user.setPassword(passwordEncoder.encode(registerDto.getPassword()));
        user.setRole(registerDto.getRole());
        user.setActive(true);
        user.setDeleted(false);

        User savedUser = userRepository.save(user);

        return toDto(savedUser);
    }

    @Override
    public AuthResponseDto login(LoginDto loginDto) {
        User user = userRepository.findByEmail(loginDto.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (user.isDeleted() || !user.isActive()) {
            throw new RuntimeException("Account is deactivated. Contact your administrator.");
        }

        if (!passwordEncoder.matches(loginDto.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        String token = jwtTokenProvider.generateToken(user);

        return new AuthResponseDto(token, user.getId(), user.getRole());
    }

    @Override
    public UserDto getUserById(UUID userId) {
        User user = findActiveUser(userId);
        return toDto(user);
    }

    @Override
    public List<UserDto> getAllUsers() {
        return userRepository.findByIsDeletedFalse().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public UserDto updateProfile(UUID userId, UpdateProfileDto updateProfileDto) {
        User user = findActiveUser(userId);

        if (updateProfileDto.getName() != null && !updateProfileDto.getName().isBlank()) {
            user.setName(updateProfileDto.getName().trim());
        }
        if (updateProfileDto.getEmail() != null && !updateProfileDto.getEmail().isBlank()) {
            String newEmail = updateProfileDto.getEmail().trim();
            if (!newEmail.equalsIgnoreCase(user.getEmail())) {
                userRepository.findByEmail(newEmail)
                        .filter(existing -> !existing.getId().equals(userId))
                        .ifPresent(existing -> {
                            throw new RuntimeException("Email already exists");
                        });
                user.setEmail(newEmail);
            }
        }

        return toDto(userRepository.save(user));
    }

    @Override
    public void changePassword(UUID userId, ChangePasswordDto changePasswordDto) {
        User user = findActiveUser(userId);

        if (changePasswordDto.getNewPassword() == null || changePasswordDto.getNewPassword().length() < 6) {
            throw new RuntimeException("New password must be at least 6 characters");
        }
        if (!passwordEncoder.matches(changePasswordDto.getCurrentPassword(), user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(changePasswordDto.getNewPassword()));
        userRepository.save(user);
    }

    @Override
    public UserDto updateUserStatus(UUID userId, boolean active) {
        User user = findActiveUser(userId);
        user.setActive(active);
        return toDto(userRepository.save(user));
    }

    @Override
    public void deleteUser(UUID userId) {
        User user = findActiveUser(userId);
        user.setDeleted(true);
        user.setActive(false);
        userRepository.save(user);
    }

    private User findActiveUser(UUID userId) {
        return userRepository.findById(userId)
                .filter(user -> !user.isDeleted())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private UserDto toDto(User user) {
        return new UserDto(user.getId(), user.getName(), user.getEmail(), user.getRole(), user.isActive());
    }
}
