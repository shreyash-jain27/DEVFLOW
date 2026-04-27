# 🤖 AI-Enhanced Task Management Backend

An intelligent, production-ready RESTful API built with Node.js and Express. This backend powers a robust task management system, supercharged with Large Language Model (LLM) capabilities via Gemini's API. It features secure JWT authentication, real-time Socket.io updates, strict rate limiting, and a clean MVC architecture.

---

## ✨ Key Features

- **Robust Authentication:** Secure user registration and login using JWT (JSON Web Tokens) and bcrypt password hashing.
- **Relational Data Modeling:** Complex MongoDB schemas managing Users, Projects, and Tasks with Virtual populations.
- **AI Integration Layer:** Seamlessly interacts with Gemini to generate subtasks, analyze meeting notes, suggest task priorities, and review code.
- **Real-Time Updates:** WebSockets via Socket.io notify connected clients instantly when tasks are created or updated.
- **Production-Ready Security:** Implements `express-rate-limit` to prevent brute-force attacks and control costly AI API usage.
- **Comprehensive Error Handling:** Global middleware intercepts unhandled exceptions, Mongoose validation errors, and bad IDs to return clean, standardized JSON errors.

---

## 🛠️ Tech Stack & Decisions

| Technology | Purpose & Why It Was Chosen |
| :--- | :--- |
| **Node.js & Express** | Core runtime and web framework. Chosen for its lightweight, asynchronous, event-driven architecture, perfect for high-I/O applications. |
| **MongoDB & Mongoose** | NoSQL Database and ODM. Chosen for its flexible document structure, allowing nested AI responses and easy virtual population without heavy SQL JOINs. |
| **Socket.io** | Real-time communication. Enables bi-directional, persistent connections for instant collaborative updates. |
| **JWT & bcryptjs** | Security. JWT provides stateless, scalable authentication. bcrypt ensures passwords remain unreadable even in a data breach. |
| **Anthropic Claude API** | The AI engine. Chosen for its superior reasoning and ability to reliably output strict JSON structures via prompt engineering. |

---

## 🏗️ Architecture

This project strictly adheres to the **MVC (Model-View-Controller)** pattern, combined with a decoupled utility layer for external services:

*   **Models (`/models`)**: Define the Mongoose schemas, data validation, and database relationships.
*   **Controllers (`/controllers`)**: Contain the core business logic. They handle incoming HTTP requests, interact with Models, and send HTTP responses.
*   **Routes (`/routes`)**: Act as traffic directors, routing URLs to the appropriate Controller methods and applying necessary middlewares (like authentication).
*   **The AI Utility Layer (`/utils/aiHelper.js`)**: **A crucial architectural decision.** The AI logic is completely isolated from the core Express app. The controllers simply say *"Here is some text, give me subtasks."* This ensures that if the AI provider changes (e.g., migrating to OpenAI), the core controllers and database logic remain completely untouched.

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js (v16+)
- MongoDB (Running locally or via MongoDB Atlas)
- An Anthropic API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd ai-task-manager-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory and add the following:
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/ai_task_manager
   JWT_SECRET=your_super_secret_jwt_key_here
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   ```

4. **Run the server**
   ```bash
   node src/server.js
   # Or using nodemon for development:
   # npm run dev
   ```

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| POST | `/api/auth/register` | Register a new user | ❌ |
| POST | `/api/auth/login` | Authenticate user & get token | ❌ |

### Projects
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| POST | `/api/projects` | Create a new project | ✅ |
| GET | `/api/projects` | Get all projects | ✅ |
| GET | `/api/projects/:id` | Get project by ID (populates tasks) | ✅ |

### Tasks
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| POST | `/api/tasks` | Create a task | ✅ |
| GET | `/api/tasks` | Get all tasks (supports query filtering) | ✅ |
| PUT | `/api/tasks/:id` | Update a task | ✅ |
| DELETE | `/api/tasks/:id` | Delete a task | ✅ |

### AI Features (Strictly Rate Limited)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| POST | `/api/ai/tasks/:taskId/generate-subtasks`| Generates and saves subtasks | ✅ |
| POST | `/api/ai/tasks/:taskId/suggest-priority`| Suggests and saves priority | ✅ |
| POST | `/api/ai/meeting-notes/parse` | Parses text into actionable tasks | ✅ |
| POST | `/api/ai/code/analyze` | Code review and scoring | ✅ |

---

## 💻 Example API Calls

### 1. Authenticate (Login)
**Request:** `POST /api/auth/login`
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "_id": "64a1b2c3d...",
  "name": "Jane Doe",
  "email": "user@example.com",
  "token": "eyJhbGciOiJIUzI1..."
}
```

### 2. Generate AI Subtasks
**Request:** `POST /api/ai/tasks/64a1b2c3d.../generate-subtasks`
*(Requires `Authorization: Bearer <token>`)*

**Response:** `201 Created`
```json
[
  {
    "title": "Design Database Schema",
    "description": "Outline the User, Task, and Project collections.",
    "aiGenerated": true,
    "project": "64a1b2c3e...",
    "_id": "64a1b2c3f..."
  },
  {
    "title": "Setup Express Server",
    "description": "Initialize app, configure cors and dotenv.",
    "aiGenerated": true,
    "project": "64a1b2c3e...",
    "_id": "64a1b2c3g..."
  }
]
```

---

## 🧠 How the AI Features Work

The application communicates with the Anthropic API using sophisticated **Prompt Engineering** to guarantee structured JSON outputs.

```text
[ Client (Frontend) ]
       │
       ▼ (1) POST /api/ai/tasks/:id/generate-subtasks
       │
[ AI Controller ] ── (2) Fetches Parent Task from DB ──▶ [ MongoDB ]
       │
       ▼ (3) Calls aiHelper.generateSubtasks(description)
       │
[ AI Helper Utility ]
       │
       ▼ (4) Wraps description in strict System Prompt asking for JSON
       │
[ Anthropic API (Claude) ]
       │
       ▼ (5) Returns raw text (e.g. ```json [{...}] ```)
       │
[ AI Helper Utility ] ── (6) Regex extracts & parses JSON ──▶ (Returns Array)
       │
[ AI Controller ] ── (7) Maps array to Task Model & Saves ──▶ [ MongoDB ]
       │
       ▼ (8) Emit 'ai:subtasks-ready'
       │
[ Socket.io Server ] ── (9) Instantly updates Client UI
```
