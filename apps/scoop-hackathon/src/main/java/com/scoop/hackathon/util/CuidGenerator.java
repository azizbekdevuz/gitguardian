package com.scoop.hackathon.util;

import java.util.UUID;

public class CuidGenerator {
    public static String generate() {
        // Simple CUID-like generator using UUID
        // For production, consider using a proper CUID library
        return "c" + UUID.randomUUID().toString().replace("-", "").substring(0, 24);
    }
}

