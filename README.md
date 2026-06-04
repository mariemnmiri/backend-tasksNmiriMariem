# backend-tasksNmiriMariem
repository for the backend task
The backend for MyNutriCoach is built with Node.js and Express.js, serving as the central engine for handling user data, appointment scheduling, and notification management. It uses a JSON-based file system as a lightweight database.

-) Core Architecture
The backend follows a simple and efficient structure:

/models: Contains the data schemas and JSON storage files.

server.js: The main Express server file, handling routing, API endpoints, and business logic.

appointments.json: Persistent storage for all appointment bookings.

notifications.json: Persistent storage for real-time user updates.

users.json: Stores user profiles and authentication data.

-) Key Features
RESTful API: Provides endpoints for user authentication, profile management, and appointment CRUD operations.

Lightweight Data Persistence: Uses JSON files for fast and easy data storage, ideal for small-to-medium scale applications.

Middleware Integration: Handles CORS, JSON parsing, and custom error handling.

-) Tech Stack
Environment: Node.js

Framework: Express.js

Database: JSON (File System storage)
