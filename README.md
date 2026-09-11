# DEVLINK

DEVLINK is a social freelance marketplace for web developers. It allows clients to post freelance jobs which appear in a social media-like feed. Freelancers can view, search, sort jobs, chat with clients in real-time, send proposals, negotiate, accept work, and leave reviews.

## Tech Stack

**Frontend:**
- React JS
- Vite
- JavaScript
- Tailwind CSS
- pnpm

**Backend:**
- Java
- Spring Boot (Spring Web, Spring Data JPA, Validation)
- Maven
- PostgreSQL

## Project Structure

```
DEVLINK/
├── frontend/             # React + Vite application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Application pages/views
│   │   ├── services/     # API integration services
│   │   ├── assets/       # Static assets (images, fonts, etc.)
│   │   ├── utils/        # Helper functions
│   │   └── hooks/        # Custom React hooks
│   └── ...
└── backend/              # Spring Boot application
    ├── src/main/java/com/devlink/backend/
    │   ├── controller/   # REST API endpoints
    │   ├── service/      # Business logic
    │   ├── repository/   # Database access layer
    │   ├── entity/       # JPA entities
    │   ├── dto/          # Data Transfer Objects
    │   ├── config/       # Application configuration
    │   └── exception/    # Custom exceptions and handlers
    └── ...
```

## How to Run

### Requirements
- Node.js & pnpm
- Java 17+ & Maven
- PostgreSQL

### Frontend
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Run the development server:
   ```bash
   pnpm run dev
   ```

### Backend
1. Create a PostgreSQL database named `devlink_db` (or as configured).
2. Ensure you have a `.env` file based on `.env.example` in your environment, or configure `application.properties` accordingly.
3. Navigate to the backend directory:
   ```bash
   cd backend
   ```
4. Run the application:
   ```bash
   mvn spring-boot:run
   ```
   Or build and run the jar:
   ```bash
   mvn clean install
   java -jar target/backend-0.0.1-SNAPSHOT.jar
   ```
