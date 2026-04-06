package com.restaurant.userservice.controller;

import com.restaurant.userservice.dto.UserCreateRequest;
import com.restaurant.userservice.dto.UserDto;
import com.restaurant.userservice.dto.UserUpdateRequest;
import com.restaurant.userservice.entity.Role;
import com.restaurant.userservice.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.springframework.lang.NonNull;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/users")
    public ResponseEntity<List<UserDto>> getUsers(HttpServletRequest request) {
        Integer roleId = (Integer) request.getAttribute("roleId");
        if (roleId == null || roleId != 1) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<UserDto> getUserById(@PathVariable @NonNull Integer id, HttpServletRequest request) {
        Integer roleId = (Integer) request.getAttribute("roleId");
        if (roleId == null || roleId != 1) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PostMapping("/users")
    public ResponseEntity<UserDto> createUser(@Valid @RequestBody UserCreateRequest createRequest, HttpServletRequest request) {
        Integer roleId = (Integer) request.getAttribute("roleId");
        if (roleId == null || roleId != 1) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.createUser(createRequest));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<UserDto> updateUser(@PathVariable @NonNull Integer id, @Valid @RequestBody UserUpdateRequest updateRequest, HttpServletRequest request) {
        Integer currentUserId = (Integer) request.getAttribute("userId");
        Integer roleId = (Integer) request.getAttribute("roleId");
        return ResponseEntity.ok(userService.updateUser(id, updateRequest, currentUserId, roleId));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable @NonNull Integer id, HttpServletRequest request) {
        Integer roleId = (Integer) request.getAttribute("roleId");
        if (roleId == null || roleId != 1) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        userService.deleteUser(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/roles")
    public ResponseEntity<List<Role>> getRoles() {
        return ResponseEntity.ok(userService.getAllRoles());
    }
}
