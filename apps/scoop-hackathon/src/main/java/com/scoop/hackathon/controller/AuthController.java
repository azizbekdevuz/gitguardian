package com.scoop.hackathon.controller;

import com.scoop.hackathon.dto.AuthResponse;
import com.scoop.hackathon.dto.AuthenticationHistoryDto;
import com.scoop.hackathon.dto.LoginRequest;
import com.scoop.hackathon.dto.RegisterRequest;
import com.scoop.hackathon.payload.ApiResponse;
import com.scoop.hackathon.security.JwtUtil;
import com.scoop.hackathon.service.AuthenticationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Authentication and authorization endpoints for user registration, login, and JWT token management")
public class AuthController {
    
    private final AuthenticationService authenticationService;
    private final JwtUtil jwtUtil;
    
    public AuthController(AuthenticationService authenticationService, JwtUtil jwtUtil) {
        this.authenticationService = authenticationService;
        this.jwtUtil = jwtUtil;
    }
    
    @Operation(
            summary = "Register a new user",
            description = "Creates a new user account with the provided information. Returns a JWT token upon successful registration."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "User successfully registered",
                    content = @Content(schema = @Schema(implementation = AuthResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input or email already exists"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest) {
        AuthResponse response = authenticationService.register(request, httpRequest);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
    
    @Operation(
            summary = "User login",
            description = "Authenticates a user with email and password. Returns a JWT token upon successful authentication."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Login successful",
                    content = @Content(schema = @Schema(implementation = AuthResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Invalid credentials"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "User not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {
        AuthResponse response = authenticationService.login(request, httpRequest);
        return ResponseEntity.ok(response);
    }
    
    @Operation(
            summary = "Sign up a new client",
            description = "Creates a new client account with the provided information. Returns a JWT token upon successful signup."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Client successfully signed up",
                    content = @Content(schema = @Schema(implementation = AuthResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input or email already exists"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PostMapping("/signup/client")
    public ResponseEntity<AuthResponse> signupClient(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest) {
        AuthResponse response = authenticationService.signupClient(request, httpRequest);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
    
    @Operation(
            summary = "Validate JWT token",
            description = "Validates a JWT token and records the validation attempt in authentication history."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Token is valid",
                    content = @Content(schema = @Schema(implementation = com.scoop.hackathon.payload.ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid or expired token"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized - Invalid authorization header")
    })
    @PostMapping("/validate")
    public ResponseEntity<ApiResponse> validateToken(
            @Parameter(description = "Bearer token in Authorization header", required = true)
            @RequestHeader("Authorization") String authHeader,
            HttpServletRequest httpRequest) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("Invalid authorization header");
        }
        
        String token = authHeader.substring(7);
        authenticationService.validateToken(token, httpRequest);
        
        ApiResponse response = new ApiResponse(true, "Token is valid");
        return ResponseEntity.ok(response);
    }
    
    @Operation(
            summary = "Get current user's authentication history",
            description = "Retrieves the authentication history for the currently authenticated user. Requires JWT token."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Authentication history retrieved successfully",
                    content = @Content(schema = @Schema(implementation = AuthenticationHistoryDto.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized - Invalid or missing token")
    })
    @SecurityRequirement(name = "bearerAuth")
    @GetMapping("/history")
    public ResponseEntity<List<AuthenticationHistoryDto>> getAuthHistory(
            @Parameter(description = "Bearer token in Authorization header", required = true)
            @RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("Invalid authorization header");
        }
        
        String token = authHeader.substring(7);
        String userId = jwtUtil.extractUserId(token);
        
        List<AuthenticationHistoryDto> history = authenticationService.getAuthHistory(userId);
        return ResponseEntity.ok(history);
    }
    
    @Operation(
            summary = "Get authentication history by user ID",
            description = "Retrieves the authentication history for a specific user by user ID. Requires JWT token."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Authentication history retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized - Invalid or missing token"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "User not found")
    })
    @SecurityRequirement(name = "bearerAuth")
    @GetMapping("/history/{userId}")
    public ResponseEntity<List<AuthenticationHistoryDto>> getAuthHistoryByUserId(
            @Parameter(description = "User ID", required = true)
            @PathVariable String userId) {
        List<AuthenticationHistoryDto> history = authenticationService.getAuthHistory(userId);
        return ResponseEntity.ok(history);
    }
    
    @Operation(
            summary = "Get authentication history by user ID and action",
            description = "Retrieves filtered authentication history for a specific user by action type (e.g., LOGIN, LOGOUT). Requires JWT token."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Filtered authentication history retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized - Invalid or missing token"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "User not found")
    })
    @SecurityRequirement(name = "bearerAuth")
    @GetMapping("/history/{userId}/action/{action}")
    public ResponseEntity<List<AuthenticationHistoryDto>> getAuthHistoryByAction(
            @Parameter(description = "User ID", required = true)
            @PathVariable String userId,
            @Parameter(description = "Action type (e.g., LOGIN, LOGOUT, TOKEN_VALIDATED)", required = true)
            @PathVariable String action) {
        List<AuthenticationHistoryDto> history = authenticationService.getAuthHistoryByAction(userId, action);
        return ResponseEntity.ok(history);
    }
}

