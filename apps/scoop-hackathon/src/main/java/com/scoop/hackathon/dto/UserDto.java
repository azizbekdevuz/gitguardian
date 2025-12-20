package com.scoop.hackathon.dto;

import java.time.LocalDateTime;

public class UserDto {
    private String id;
    private String name;
    private String email;
    private LocalDateTime emailVerified;
    private String image;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    public UserDto() {
    }
    
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public LocalDateTime getEmailVerified() {
        return emailVerified;
    }
    
    public void setEmailVerified(LocalDateTime emailVerified) {
        this.emailVerified = emailVerified;
    }
    
    public String getImage() {
        return image;
    }
    
    public void setImage(String image) {
        this.image = image;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}

