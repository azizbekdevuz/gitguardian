# Scoop Hackathon

Spring Boot application for Scoop Hackathon with full CRUD operations.

## Technology Stack

- **Java**: 21
- **Spring Boot**: 3.2.0
- **Database**: MySQL (default), PostgreSQL (optional)
- **ORM**: JPA/Hibernate
- **Database Migrations**: Flyway
- **Build Tool**: Maven

## Project Structure

```
src/
├── main/
│   ├── java/
│   │   └── com/scoop/hackathon/
│   │       ├── config/          # Configuration classes
│   │       ├── controller/      # REST controllers
│   │       ├── dto/             # Data Transfer Objects
│   │       ├── entity/          # JPA entities
│   │       ├── exception/       # Exception handling
│   │       ├── payload/         # API response wrappers
│   │       ├── repository/      # JPA repositories
│   │       ├── security/        # Security configuration
│   │       ├── service/         # Business logic
│   │       └── util/            # Utility classes
│   └── resources/
│       ├── application.properties
│       └── db/migration/        # Flyway migrations
└── test/
    └── java/                    # Test classes
```

## Getting Started

### Prerequisites

- Java 21 or higher
- Maven 3.6 or higher

### Configuration

1. **Environment Variables Setup**

   The application uses `.env` files for sensitive configuration. 

   - Copy the example file:
     ```bash
     cp .env.example .env
     ```
   
   - Edit `.env` and configure your settings:
     - Database credentials (if using PostgreSQL or MySQL)
     - API keys (if needed)
     - JWT secret key
     - Other sensitive information

   **Important**: The `.env` file is gitignored and will not be committed to the repository. Always use `.env.example` as a template.

2. **Database Configuration**

   The `.env` file supports three database types:
   - **H2** (default, in-memory, for development)
   - **PostgreSQL** (for production)
   - **MySQL** (for production)

   To switch databases, update the `DB_TYPE`, `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD` in your `.env` file.

### Running the Application

1. Clone the repository:
```bash
git clone <repository-url>
cd scoop-hackathon
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Build the project:
```bash
mvn clean install
```

4. Run the application:
```bash
mvn spring-boot:run
```

The application will start on `http://localhost:8080` (or the port specified in `.env`)

## API Endpoints

### Users
- `POST /api/users` - Create user
- `GET /api/users/{id}` - Get user by ID
- `GET /api/users` - Get all users
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user

### Git Sessions
- `POST /api/git-sessions` - Create GitSession
- `GET /api/git-sessions/{id}` - Get GitSession by ID
- `GET /api/git-sessions` - Get all GitSessions
- `PUT /api/git-sessions/{id}` - Update GitSession
- `DELETE /api/git-sessions/{id}` - Delete GitSession

Similar endpoints are available for:
- Accounts (`/api/accounts`)
- Sessions (`/api/sessions`)
- Snapshots (`/api/snapshots`)
- Traces (`/api/traces`)
- Plans (`/api/plans`)
- Events (`/api/events`)
- Verification Tokens (`/api/verification-tokens`)

## Database

### MySQL Configuration

The application uses MySQL by default. Make sure MySQL is installed and running.

**Prerequisites:**
- MySQL 5.7.8+ or MySQL 8.0+ (for JSON support)
- Create a database or let the application create it automatically

**Configuration:**
- Update your `.env` file with your MySQL credentials:
  ```
  DB_URL=jdbc:mysql://localhost:3306/scoop_hackathon?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
  DB_USERNAME=root
  DB_PASSWORD=your_mysql_password
  ```

The application will automatically create the database if it doesn't exist (when `createDatabaseIfNotExist=true` is in the URL).

### Database Migrations

Flyway migrations are located in `src/main/resources/db/migration/`

**If you encounter "failed migration" errors:**

1. **Quick fix** - Run the SQL script:
   ```bash
   mysql -u root -p gitguard_agent < fix_flyway.sql
   ```

2. **Or manually** - Connect to MySQL and run:
   ```sql
   USE gitguard_agent;
   DELETE FROM flyway_schema_history WHERE success = 0;
   ```

3. **Or drop and recreate** the database for a fresh start:
   ```sql
   DROP DATABASE IF EXISTS gitguard_agent;
   CREATE DATABASE gitguard_agent;
   ```

See `CLEAN_FLYWAY.md` for more detailed instructions.

## Environment Variables

All sensitive configuration is stored in `.env` file. The following variables are available:

### Application
- `APP_NAME` - Application name
- `SERVER_PORT` - Server port (default: 8080)

### Database
- `DB_TYPE` - Database type (mysql, postgresql)
- `DB_URL` - Database connection URL (default: MySQL)
- `DB_DRIVER` - JDBC driver class name (default: `com.mysql.cj.jdbc.Driver`)
- `DB_USERNAME` - Database username (default: `root`)
- `DB_PASSWORD` - Database password

### Security
- `JWT_SECRET` - JWT secret key (change in production!)
- `JWT_EXPIRATION` - JWT expiration time in milliseconds

### Logging
- `LOG_LEVEL_ROOT` - Root log level
- `LOG_LEVEL_WEB` - Web log level
- `LOG_LEVEL_HIBERNATE` - Hibernate log level
- `LOG_LEVEL_APP` - Application log level

See `.env.example` for all available configuration options.

## Branch Strategy

This repository uses `main` as the default branch.

## License

[Add your license here]

