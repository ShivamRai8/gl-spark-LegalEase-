package com.legalease.userservice.controller;

import com.legalease.userservice.dto.AuthResponseDto;
import com.legalease.userservice.dto.ChangePasswordDto;
import com.legalease.userservice.dto.LoginDto;
import com.legalease.userservice.dto.RegisterDto;
import com.legalease.userservice.dto.UpdateProfileDto;
import com.legalease.userservice.dto.UpdateUserStatusDto;
import com.legalease.userservice.dto.UserDto;
import com.legalease.userservice.entity.User;
import com.legalease.userservice.repository.UserRepository;
import com.legalease.userservice.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;

    public UserController(UserService userService, UserRepository userRepository) {
        this.userService = userService;
        this.userRepository = userRepository;
    }

    @PostMapping("/auth/register")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> registerUser(@RequestBody RegisterDto registerDto) {
        return new ResponseEntity<>(userService.registerUser(registerDto), HttpStatus.CREATED);
    }

    @PostMapping("/auth/login")
    public ResponseEntity<AuthResponseDto> login(@RequestBody LoginDto loginDto) {
        return ResponseEntity.ok(userService.login(loginDto));
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<UserDto> getUserById(@PathVariable("id") UUID userId) {
        return ResponseEntity.ok(userService.getUserById(userId));
    }

    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable("id") UUID userId, Authentication authentication) {
        ensureNotSelf(userId, authentication);
        userService.deleteUser(userId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/users/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> updateUserStatus(@PathVariable("id") UUID userId,
                                                    @RequestBody UpdateUserStatusDto updateUserStatusDto,
                                                    Authentication authentication) {
        if (!updateUserStatusDto.isActive()) {
            ensureNotSelf(userId, authentication);
        }
        return ResponseEntity.ok(userService.updateUserStatus(userId, updateUserStatusDto.isActive()));
    }

    @PatchMapping("/users/{id}/profile")
    public ResponseEntity<?> updateProfile(@PathVariable("id") UUID userId,
                                           @RequestBody UpdateProfileDto updateProfileDto,
                                           Authentication authentication) {
        if (!isSelf(userId, authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You can only update your own profile");
        }
        return ResponseEntity.ok(userService.updateProfile(userId, updateProfileDto));
    }

    @PutMapping("/users/{id}/password")
    public ResponseEntity<?> changePassword(@PathVariable("id") UUID userId,
                                            @RequestBody ChangePasswordDto changePasswordDto,
                                            Authentication authentication) {
        if (!isSelf(userId, authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You can only change your own password");
        }
        userService.changePassword(userId, changePasswordDto);
        return ResponseEntity.noContent().build();
    }

    private boolean isSelf(UUID userId, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }
        return userRepository.findByEmailAndIsDeletedFalse(authentication.getName())
                .map(actor -> actor.getId().equals(userId))
                .orElse(false);
    }

    private void ensureNotSelf(UUID userId, Authentication authentication) {
        if (isSelf(userId, authentication)) {
            throw new RuntimeException("You cannot delete or deactivate your own account");
        }
    }
}
