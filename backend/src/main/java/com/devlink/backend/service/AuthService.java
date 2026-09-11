package com.devlink.backend.service;

import com.devlink.backend.dto.AuthResponse;
import com.devlink.backend.dto.LoginRequest;
import com.devlink.backend.dto.RegisterRequest;
import com.devlink.backend.dto.UserDto;

public interface AuthService {
    
    UserDto registerUser(RegisterRequest request);
    
    AuthResponse authenticateUser(LoginRequest request);
    
    UserDto getCurrentUser();
}
