#  Waygood Backend Assignment

A scalable backend system for a study-abroad platform built using the MERN stack.  
This project enables students to discover universities, get personalized program recommendations, and manage their application lifecycle.

---

##  Features

###  Authentication & Security
- User registration & login
- JWT-based authentication
- Password hashing using bcrypt
- Protected routes

###  University & Program Discovery
- Filter by country, field, intake, degree level
- Search functionality
- Pagination & sorting
- Clean API response structure

###  Recommendation Engine
- Personalized recommendations based on:
  - Preferred countries
  - Budget
  - Field of interest
  - Intake
  - IELTS score
- Match scoring system with reasoning

###  Application Workflow
- Apply to programs
- Prevent duplicate applications
- Status transitions:
  - draft → submitted → under-review → offer → visa → enrolled/rejected
- Timeline tracking

###  Performance & Optimization
- In-memory caching for frequently used APIs
- Optimized MongoDB queries
- Pagination for scalability

### Security Enhancements
- Rate limiting middleware
- Centralized error handling
- Input validation

---

## Tech Stack

- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT Authentication
- bcrypt
- Nodemon

---

## 📁 Folder Structure
