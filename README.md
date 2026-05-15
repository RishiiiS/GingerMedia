# Vehicle Image Processing API Foundation

This is the production-ready project foundation for an asynchronous vehicle image processing system.

## Tech Stack
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose)
- **Cache / Queue Backend:** Redis
- **Queue System:** BullMQ (to be integrated)
- **File Uploads:** Multer
- **Logging:** Pino
- **Containerization:** Docker & Docker Compose
- **Code Quality:** ESLint & Prettier

## Folder Structure
- `src/` - Application source code
  - `config/` - Centralized configurations (DB, Env, Logger, Redis, Multer)
  - `controllers/` - Route logic (Empty placeholder)
  - `middlewares/` - Express middlewares (Empty placeholder)
  - `models/` - Mongoose schemas (Empty placeholder)
  - `queue/` - BullMQ queue definitions (Empty placeholder)
  - `routes/` - API route definitions (Empty placeholder)
  - `services/` - Business logic including analysis, queue processing, and upload (Empty placeholders)
  - `utils/` - Shared utilities (Empty placeholder)
  - `validators/` - Joi/Zod validation schemas (Empty placeholder)
  - `workers/` - BullMQ workers for background tasks (Empty placeholder)
- `logs/` - Application log files
- `tests/` - Test suite
- `uploads/` - Temporarily uploaded image files

## Setup Instructions

1. Clone the repository.
2. Ensure you have Node.js and Docker installed.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Configure environment variables. Duplicate `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

## How to Run Locally

### Using Docker Compose (Recommended)
This starts the backend application, MongoDB, and Redis in isolated containers.
```bash
docker-compose up --build
```

### Manual Setup
1. Ensure MongoDB and Redis are running locally.
2. Start the development server:
   ```bash
   npm run dev
   ```
