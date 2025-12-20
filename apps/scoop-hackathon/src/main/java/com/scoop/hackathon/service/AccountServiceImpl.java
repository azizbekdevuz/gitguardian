package com.scoop.hackathon.service;

import com.scoop.hackathon.dto.AccountDto;
import com.scoop.hackathon.dto.CreateAccountRequest;
import com.scoop.hackathon.dto.UpdateAccountRequest;
import com.scoop.hackathon.entity.Account;
import com.scoop.hackathon.entity.User;
import com.scoop.hackathon.exception.ResourceNotFoundException;
import com.scoop.hackathon.repository.AccountRepository;
import com.scoop.hackathon.repository.UserRepository;
import com.scoop.hackathon.util.CuidGenerator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class AccountServiceImpl implements AccountService {
    
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    
    public AccountServiceImpl(AccountRepository accountRepository, UserRepository userRepository) {
        this.accountRepository = accountRepository;
        this.userRepository = userRepository;
    }
    
    @Override
    public AccountDto createAccount(CreateAccountRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getUserId()));
        
        Account account = new Account();
        account.setId(CuidGenerator.generate());
        account.setType(request.getType());
        account.setProvider(request.getProvider());
        account.setProviderAccountId(request.getProviderAccountId());
        account.setUser(user);
        account.setRefreshToken(request.getRefreshToken());
        account.setAccessToken(request.getAccessToken());
        account.setExpiresAt(request.getExpiresAt());
        account.setTokenType(request.getTokenType());
        account.setScope(request.getScope());
        account.setIdToken(request.getIdToken());
        account.setSessionState(request.getSessionState());
        
        Account savedAccount = accountRepository.save(account);
        return convertToDto(savedAccount);
    }
    
    @Override
    @Transactional(readOnly = true)
    public AccountDto getAccountById(String id) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Account", "id", id));
        return convertToDto(account);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<AccountDto> getAllAccounts() {
        return accountRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<AccountDto> getAccountsByUserId(String userId) {
        return accountRepository.findByUserId(userId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public AccountDto getAccountByProviderAndProviderAccountId(String provider, String providerAccountId) {
        Account account = accountRepository.findByProviderAndProviderAccountId(provider, providerAccountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account", "provider and providerAccountId", 
                        provider + "/" + providerAccountId));
        return convertToDto(account);
    }
    
    @Override
    public AccountDto updateAccount(String id, UpdateAccountRequest request) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Account", "id", id));
        
        if (request.getType() != null) account.setType(request.getType());
        if (request.getProvider() != null) account.setProvider(request.getProvider());
        if (request.getProviderAccountId() != null) account.setProviderAccountId(request.getProviderAccountId());
        if (request.getRefreshToken() != null) account.setRefreshToken(request.getRefreshToken());
        if (request.getAccessToken() != null) account.setAccessToken(request.getAccessToken());
        if (request.getExpiresAt() != null) account.setExpiresAt(request.getExpiresAt());
        if (request.getTokenType() != null) account.setTokenType(request.getTokenType());
        if (request.getScope() != null) account.setScope(request.getScope());
        if (request.getIdToken() != null) account.setIdToken(request.getIdToken());
        if (request.getSessionState() != null) account.setSessionState(request.getSessionState());
        if (request.getUserId() != null) {
            User user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getUserId()));
            account.setUser(user);
        }
        
        Account updatedAccount = accountRepository.save(account);
        return convertToDto(updatedAccount);
    }
    
    @Override
    public void deleteAccount(String id) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Account", "id", id));
        accountRepository.delete(account);
    }
    
    private AccountDto convertToDto(Account account) {
        AccountDto dto = new AccountDto();
        dto.setId(account.getId());
        dto.setType(account.getType());
        dto.setProvider(account.getProvider());
        dto.setProviderAccountId(account.getProviderAccountId());
        dto.setRefreshToken(account.getRefreshToken());
        dto.setAccessToken(account.getAccessToken());
        dto.setExpiresAt(account.getExpiresAt());
        dto.setTokenType(account.getTokenType());
        dto.setScope(account.getScope());
        dto.setIdToken(account.getIdToken());
        dto.setSessionState(account.getSessionState());
        dto.setUserId(account.getUser() != null ? account.getUser().getId() : null);
        return dto;
    }
}

