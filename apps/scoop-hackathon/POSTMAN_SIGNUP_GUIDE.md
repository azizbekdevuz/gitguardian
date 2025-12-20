# Postman Guide: Client Signup to MySQL Database

This guide shows you how to sign up a client using Postman to create a user in your MySQL database.

## Prerequisites

1. **Application is running** - Make sure your Spring Boot application is running
2. **MySQL database is running** - Ensure MySQL is running and accessible
3. **Postman installed** - Download from [postman.com](https://www.postman.com/downloads/)

---

## Step-by-Step Instructions

### 1. Start Your Application

First, make sure your Spring Boot application is running:
```bash
# From the project root directory
mvn spring-boot:run
```

The application should start on port **8080** by default (check your `application.properties`).

---

### 2. Open Postman

1. Open Postman application
2. Create a new request or use an existing one

---

### 3. Configure the Request

#### Request Method and URL
- **Method**: `POST`
- **URL**: `http://localhost:8080/api/auth/signup/client`

#### Headers
Click on the **Headers** tab and add:
- **Key**: `Content-Type`
- **Value**: `application/json`

#### Body
1. Click on the **Body** tab
2. Select **raw**
3. Select **JSON** from the dropdown (next to "raw")
4. Enter the following JSON:

```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "SecurePass123"
}
```

**Field Requirements:**
- `name`: Required, 2-100 characters
- `email`: Required, must be a valid email format
- `password`: Required, minimum 8 characters

---

### 4. Send the Request

Click the **Send** button. You should receive one of these responses:

#### ✅ Success Response (201 Created)
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": "clx1234567890abcdef",
  "email": "john.doe@example.com",
  "name": "John Doe",
  "expiresAt": "2024-01-02T12:00:00"
}
```

#### ❌ Error Responses

**400 Bad Request - Email Already Exists:**
```json
{
  "timestamp": "2024-01-01T12:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Client with email john.doe@example.com already exists",
  "path": "/api/auth/signup/client"
}
```

**400 Bad Request - Validation Error:**
```json
{
  "timestamp": "2024-01-01T12:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "errors": [
    {
      "field": "password",
      "message": "Password must be at least 8 characters long"
    }
  ],
  "path": "/api/auth/signup/client"
}
```

---

## Example Postman Collection

Here's a complete example you can import into Postman:

### Request Details
```
POST http://localhost:8080/api/auth/signup/client
Content-Type: application/json

{
  "name": "Jane Smith",
  "email": "jane.smith@example.com",
  "password": "MySecurePassword123"
}
```

---

## Alternative: Using cURL

If you prefer using command line, here's the equivalent cURL command:

```bash
curl -X POST http://localhost:8080/api/auth/signup/client \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john.doe@example.com",
    "password": "SecurePass123"
  }'
```

---

## Verify in MySQL Database

After successful signup, you can verify the user was created in MySQL:

```sql
-- Connect to MySQL
mysql -u root -p gitguard_agent

-- Check the user table
SELECT * FROM user WHERE email = 'john.doe@example.com';

-- Check authentication history
SELECT * FROM authentication_history 
WHERE user_id = (SELECT id FROM user WHERE email = 'john.doe@example.com')
ORDER BY created_at DESC;
```

---

## Other Available Endpoints

### Register (Alternative to signup/client)
```
POST http://localhost:8080/api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "SecurePass123"
}
```

### Login
```
POST http://localhost:8080/api/auth/login
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "SecurePass123"
}
```

### Validate Token
```
POST http://localhost:8080/api/auth/validate
Authorization: Bearer <your-jwt-token>
```

---

## Troubleshooting

### 403 Forbidden Error
- **Problem**: Getting `403 Forbidden` when trying to sign up
- **Solution**: The `/api/auth/signup/client` endpoint must be added to the `permitAll()` list in `SecurityConfig.java`. This has been fixed in the codebase. If you still see this error:
  1. Restart your Spring Boot application
  2. Make sure the SecurityConfig includes `/api/auth/signup/client` in the permitAll list

### Connection Refused
- **Problem**: `Connection refused` error
- **Solution**: Make sure your Spring Boot application is running on port 8080

### 401 Unauthorized
- **Problem**: Getting 401 errors on protected endpoints
- **Solution**: Make sure you include the JWT token in the Authorization header:
  ```
  Authorization: Bearer <your-token>
  ```

### Email Already Exists
- **Problem**: Getting "email already exists" error
- **Solution**: Use a different email address or delete the existing user from the database

### Database Connection Error
- **Problem**: Application can't connect to MySQL
- **Solution**: 
  1. Check MySQL is running: `mysql -u root -p`
  2. Verify database exists: `SHOW DATABASES;`
  3. Check `application.properties` for correct database credentials

---

## Using the JWT Token

After successful signup, you'll receive a JWT token. Use this token for authenticated requests:

1. Copy the `token` value from the response
2. In Postman, go to the **Authorization** tab
3. Select **Bearer Token** from the Type dropdown
4. Paste your token in the Token field

Or manually add it to headers:
- **Key**: `Authorization`
- **Value**: `Bearer <your-token>`

---

## Testing with Postman Collection

You can create a Postman Collection with these requests:

1. **Client Signup** - POST `/api/auth/signup/client`
2. **Login** - POST `/api/auth/login`
3. **Validate Token** - POST `/api/auth/validate`
4. **Get Auth History** - GET `/api/auth/history`

Save these as a collection for easy testing!

