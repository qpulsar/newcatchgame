# Physics Game Platform Architecture

## Overview
A modern, web-based educational platform designed for students to learn physics through interactive games and to create their own game levels.

## Core Components

### 1. Frontend (Web Application)
- **Framework**: React (with Vite) for UI and state management.
- **Game Engine**: Phaser 3 for the physics-based game core and level editor.
- **State Management**: Zustand or Redux Toolkit for global UI state (auth, game lists, user progress).
- **Styling**: Vanilla CSS or Tailwind CSS (as requested).
- **Communication**: REST API for general data, WebSockets for future multiplayer features.

### 2. Backend (API Service)
- **Framework**: FastAPI (Python).
- **Database**: PostgreSQL (Production) / SQLite (Local development).
- **ORM**: SQLAlchemy with Alembic for migrations.
- **Authentication**: JWT based auth.
- **Real-time**: Socket.io or FastAPI WebSockets for multiplayer duels.

### 3. Data Model
- **User**: Students, Teachers, Admins.
- **Game**: Metadata about a game (title, description, owner).
- **Level**: Configuration for a specific game level (gravity, items, targets, duration).
- **Attempt**: Records of students playing games (score, accuracy, time).
- **Badge**: Gamification elements.

## Multiplayer Architecture
- **Server-side State**: For duels, the server will manage the game state and broadcast updates to participants.
- **Matchmaking**: Simple queue-based matchmaking for duels.
- **Latency Compensation**: Basic client-side prediction for smooth movement.

## Educational Features
- **Editor**: A visual tool for students to drag and drop elements, set physics properties, and define win/loss conditions.
- **Teacher Dashboard**: Tools for teachers to review student-created games, track class progress, and provide feedback.
- **Approval Workflow**: Student games must be reviewed and approved by a teacher before being published to the public gallery.

## Deployment
- **Containerization**: Docker for both development and production.
- **CI/CD**: GitHub Actions for automated testing and deployment.
