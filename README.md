# Bullafric Fintech API

A **minimal viable Fintech backend API** built with **NestJS**, **TypeScript**, and **PostgreSQL**. Handles user authentication, wallet operations, and transaction management.

---

## Features

- User registration and login (JWT authentication)
- Get authenticated user profile
- Get wallet balance
- Fund wallet
- Transfer funds between users
- Withdraw funds
- View transaction history
- Swagger documentation for all endpoints
- JWT-protected routes
- Unit and E2E tests included

---

## Tech Stack

- **Backend:** Node.js, NestJS, TypeScript  
- **Database:** PostgreSQL (via Prisma ORM)  
- **Authentication:** JWT  
- **Testing:** Jest (unit & integration)  
- **API Docs:** Swagger  

---

## Getting Started

### Prerequisites

- Node.js v20+  
- PostgreSQL  
- npm  

### Installation

```bash
# Clone repository
git clone <repo-url>
cd fintech-api

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Build the project
npm run build
```

## Running Tests

This project includes both **unit tests** and **end-to-end (E2E) tests** using **Jest**.

### Run all tests

```bash
npm run test
```

### Run only E2E tests
```bash
npm run test:e2e
```

### API Documentation

- Once the application is running, access Swagger documentation at:

http://localhost:3001/api/docs