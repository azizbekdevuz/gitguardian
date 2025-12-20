package com.scoop.hackathon.controller;

import com.scoop.hackathon.dto.AccountDto;
import com.scoop.hackathon.dto.CreateAccountRequest;
import com.scoop.hackathon.dto.UpdateAccountRequest;
import com.scoop.hackathon.payload.ApiResponse;
import com.scoop.hackathon.service.AccountService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {
    
    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }
    
    @PostMapping
    public ResponseEntity<AccountDto> createAccount(@Valid @RequestBody CreateAccountRequest request) {
        AccountDto account = accountService.createAccount(request);
        return new ResponseEntity<>(account, HttpStatus.CREATED);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<AccountDto> getAccountById(@PathVariable String id) {
        AccountDto account = accountService.getAccountById(id);
        return ResponseEntity.ok(account);
    }
    
    @GetMapping
    public ResponseEntity<List<AccountDto>> getAllAccounts() {
        List<AccountDto> accounts = accountService.getAllAccounts();
        return ResponseEntity.ok(accounts);
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<AccountDto>> getAccountsByUserId(@PathVariable String userId) {
        List<AccountDto> accounts = accountService.getAccountsByUserId(userId);
        return ResponseEntity.ok(accounts);
    }
    
    @GetMapping("/provider/{provider}/account/{providerAccountId}")
    public ResponseEntity<AccountDto> getAccountByProviderAndProviderAccountId(
            @PathVariable String provider,
            @PathVariable String providerAccountId) {
        AccountDto account = accountService.getAccountByProviderAndProviderAccountId(provider, providerAccountId);
        return ResponseEntity.ok(account);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<AccountDto> updateAccount(
            @PathVariable String id,
            @Valid @RequestBody UpdateAccountRequest request) {
        AccountDto account = accountService.updateAccount(id, request);
        return ResponseEntity.ok(account);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteAccount(@PathVariable String id) {
        accountService.deleteAccount(id);
        ApiResponse response = new ApiResponse(true, "Account deleted successfully");
        return ResponseEntity.ok(response);
    }
}

