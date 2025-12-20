package com.scoop.hackathon.service;

import com.scoop.hackathon.dto.AccountDto;
import com.scoop.hackathon.dto.CreateAccountRequest;
import com.scoop.hackathon.dto.UpdateAccountRequest;

import java.util.List;

public interface AccountService {
    AccountDto createAccount(CreateAccountRequest request);
    AccountDto getAccountById(String id);
    List<AccountDto> getAllAccounts();
    List<AccountDto> getAccountsByUserId(String userId);
    AccountDto getAccountByProviderAndProviderAccountId(String provider, String providerAccountId);
    AccountDto updateAccount(String id, UpdateAccountRequest request);
    void deleteAccount(String id);
}

