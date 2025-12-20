package com.scoop.hackathon.service;

import com.scoop.hackathon.dto.AuthResponse;
import com.scoop.hackathon.dto.AuthenticationHistoryDto;
import com.scoop.hackathon.dto.LoginRequest;
import com.scoop.hackathon.dto.RegisterRequest;
import com.scoop.hackathon.entity.AuthenticationHistory;
import com.scoop.hackathon.entity.User;
import com.scoop.hackathon.exception.BadCredentialsException;
import com.scoop.hackathon.exception.ResourceNotFoundException;
import com.scoop.hackathon.repository.AuthenticationHistoryRepository;
import com.scoop.hackathon.repository.UserRepository;
import com.scoop.hackathon.security.JwtUtil;
import com.scoop.hackathon.util.CuidGenerator;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class AuthenticationService {
    
    private final UserRepository userRepository;
    private final AuthenticationHistoryRepository authHistoryRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    
    @PersistenceContext
    private EntityManager entityManager;
    
    public AuthenticationService(
            UserRepository userRepository,
            AuthenticationHistoryRepository authHistoryRepository,
            PasswordEncoder passwordEncoder,
            JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.authHistoryRepository = authHistoryRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }
    
    public AuthResponse register(RegisterRequest request, HttpServletRequest httpRequest) {
        if (userRepository.existsByEmail(request.getEmail())) {
            recordAuthHistory(null, "REGISTER", getClientIp(httpRequest), getUserAgent(httpRequest), false, "Email already exists");
            throw new IllegalArgumentException("User with email " + request.getEmail() + " already exists");
        }
        
        User user = new User();
        user.setId(CuidGenerator.generate());
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        
        User savedUser = userRepository.save(user);
        entityManager.flush(); // Explicitly flush to ensure user is persisted
        
        String token = jwtUtil.generateToken(savedUser.getId(), savedUser.getEmail());
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(24);
        
        AuthenticationHistory history = recordAuthHistory(savedUser, "REGISTER", getClientIp(httpRequest), getUserAgent(httpRequest), true, null);
        entityManager.flush(); // Explicitly flush to ensure history is persisted
        
        AuthResponse response = new AuthResponse();
        response.setToken(token);
        response.setUserId(savedUser.getId());
        response.setEmail(savedUser.getEmail());
        response.setName(savedUser.getName());
        response.setExpiresAt(expiresAt);
        
        return response;
    }
    
    public AuthResponse signupClient(RegisterRequest request, HttpServletRequest httpRequest) {
        if (userRepository.existsByEmail(request.getEmail())) {
            recordAuthHistory(null, "CLIENT_SIGNUP", getClientIp(httpRequest), getUserAgent(httpRequest), false, "Email already exists");
            throw new IllegalArgumentException("Client with email " + request.getEmail() + " already exists");
        }
        
        User user = new User();
        user.setId(CuidGenerator.generate());
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        
        User savedUser = userRepository.save(user);
        entityManager.flush(); // Explicitly flush to ensure user is persisted
        
        String token = jwtUtil.generateToken(savedUser.getId(), savedUser.getEmail());
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(24);
        
        AuthenticationHistory history = recordAuthHistory(savedUser, "CLIENT_SIGNUP", getClientIp(httpRequest), getUserAgent(httpRequest), true, null);
        entityManager.flush(); // Explicitly flush to ensure history is persisted
        
        AuthResponse response = new AuthResponse();
        response.setToken(token);
        response.setUserId(savedUser.getId());
        response.setEmail(savedUser.getEmail());
        response.setName(savedUser.getName());
        response.setExpiresAt(expiresAt);
        
        return response;
    }
    
    public AuthResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseGet(() -> {
                    recordAuthHistory(null, "LOGIN", getClientIp(httpRequest), getUserAgent(httpRequest), false, "User not found");
                    return null;
                });
        
        if (user == null || user.getPassword() == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            // For security, use the same error message for both user not found and invalid password
            // to prevent user enumeration attacks
            if (user != null) {
                recordAuthHistory(user, "LOGIN", getClientIp(httpRequest), getUserAgent(httpRequest), false, "Invalid password");
            }
            throw new BadCredentialsException("Invalid email or password");
        }
        
        String token = jwtUtil.generateToken(user.getId(), user.getEmail());
        String tokenId = jwtUtil.extractTokenId(token);
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(24);
        
        AuthenticationHistory history = recordAuthHistory(user, "LOGIN", getClientIp(httpRequest), getUserAgent(httpRequest), true, null);
        history.setTokenId(tokenId);
        authHistoryRepository.save(history);
        
        AuthResponse response = new AuthResponse();
        response.setToken(token);
        response.setUserId(user.getId());
        response.setEmail(user.getEmail());
        response.setName(user.getName());
        response.setExpiresAt(expiresAt);
        
        return response;
    }
    
    public void validateToken(String token, HttpServletRequest httpRequest) {
        try {
            if (!jwtUtil.validateToken(token)) {
                String tokenId = jwtUtil.extractTokenId(token);
                String userId = jwtUtil.extractUserId(token);
                User user = userRepository.findById(userId).orElse(null);
                recordAuthHistory(user, "TOKEN_VALIDATED", getClientIp(httpRequest), getUserAgent(httpRequest), false, "Token is invalid or expired");
                throw new IllegalArgumentException("Invalid or expired token");
            }
            
            String userId = jwtUtil.extractUserId(token);
            String tokenId = jwtUtil.extractTokenId(token);
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
            
            recordAuthHistory(user, "TOKEN_VALIDATED", getClientIp(httpRequest), getUserAgent(httpRequest), true, null);
        } catch (Exception e) {
            throw new IllegalArgumentException("Token validation failed: " + e.getMessage());
        }
    }
    
    @Transactional(readOnly = true)
    public List<AuthenticationHistoryDto> getAuthHistory(String userId) {
        return authHistoryRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<AuthenticationHistoryDto> getAuthHistoryByAction(String userId, String action) {
        return authHistoryRepository.findByUserIdAndActionOrderByCreatedAtDesc(userId, action)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    private AuthenticationHistory recordAuthHistory(User user, String action, String ipAddress, String userAgent, Boolean success, String failureReason) {
        AuthenticationHistory history = new AuthenticationHistory();
        history.setId(CuidGenerator.generate());
        history.setUser(user);
        history.setAction(action);
        history.setIpAddress(ipAddress);
        history.setUserAgent(userAgent);
        history.setSuccess(success);
        history.setFailureReason(failureReason);
        return authHistoryRepository.save(history);
    }
    
    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }
    
    private String getUserAgent(HttpServletRequest request) {
        String userAgent = request.getHeader("User-Agent");
        if (userAgent != null && userAgent.length() > 500) {
            return userAgent.substring(0, 500);
        }
        return userAgent;
    }
    
    private AuthenticationHistoryDto convertToDto(AuthenticationHistory history) {
        AuthenticationHistoryDto dto = new AuthenticationHistoryDto();
        dto.setId(history.getId());
        dto.setUserId(history.getUser() != null ? history.getUser().getId() : null);
        dto.setAction(history.getAction());
        dto.setIpAddress(history.getIpAddress());
        dto.setUserAgent(history.getUserAgent());
        dto.setTokenId(history.getTokenId());
        dto.setSuccess(history.getSuccess());
        dto.setFailureReason(history.getFailureReason());
        dto.setCreatedAt(history.getCreatedAt());
        return dto;
    }
}

