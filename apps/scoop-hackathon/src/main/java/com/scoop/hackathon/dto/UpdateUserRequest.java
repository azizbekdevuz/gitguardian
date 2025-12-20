package com.scoop.hackathon.dto;

import jakarta.validation.constraints.Email;

public class UpdateUserRequest {
    private String name;
    
    @Email(message = "Email should be valid")
    private String email;
    private String image;
    
    public UpdateUserRequest() {
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
    
    public String getImage() {
        return image;
    }
    
    public void setImage(String image) {
        this.image = image;
    }
}

