# Chat App Server

This is the backend server for a real-time chat application. It provides RESTful APIs and WebSocket support for user authentication, messaging, and group chat features. The server is built with Node.js, Express, Sequelize (PostgreSQL), and Firebase Admin SDK for authentication.

## Features

- **User Authentication**: Supports Google OAuth and token-based authentication using Firebase.
- **Real-Time Messaging**: Uses Socket.IO for instant messaging between users and groups.
- **Group and Personal Chats**: Create, join, and manage group chats or one-on-one conversations.
- **Self-Chats**: Users can chat with themselves for notes, reminders, or drafts.
- **Group Admin Controls**: Group admins can add new members or remove people from the group.

## Project Structure

```
chat-app-server/
  config/           # Configuration files (DB, Firebase)
  controllers/      # Route controllers for API endpoints
  middleware/       # Express middleware (e.g., auth)
  models/           # Sequelize models (User, Chat, Message, etc.)
  routes/           # Express route definitions
  services/         # Business logic and data access
  utils/            # Helper utilities
  index.js          # Main server entry point
```

## Getting Started

### Prerequisites

- Node.js (v14+ recommended)
- PostgreSQL database

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd chat-app-server
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Set up environment variables:**

   - Copy the example below into a `.env` file in the project root and fill in your credentials:

     ```env
     # Firebase Service Account
     FIREBASE_TYPE=service_account
     FIREBASE_PROJECT_ID=your_project_id
     FIREBASE_PRIVATE_KEY_ID=your_private_key_id
     FIREBASE_PRIVATE_KEY=your_private_key
     FIREBASE_CLIENT_EMAIL=your_client_email
     FIREBASE_CLIENT_ID=your_client_id
     FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
     FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
     FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
     FIREBASE_CLIENT_X509_CERT_URL=your_client_x509_cert_url
     FIREBASE_UNIVERSE_DOMAIN=googleapis.com

     # Database Credentials
     DB_HOST=your_db_host
     DB_PORT=your_db_port
     DB_NAME=your_db_name
     DB_USERNAME=your_db_username
     DB_PASSWORD=your_db_password

     # Client URL
     CLIENT_URL=your_client_url
     ```

4. **Start the server:**
   - For development (with auto-reload):
     ```bash
     npm run dev
     ```
   - For production:
     ```bash
     npm start
     ```

## What Does This App Do?

The chat-app-server provides the backend for a chat application, enabling users to:

- Register and authenticate securely (with Google OAuth support) via Firebase
- Send and receive real-time messages (one-on-one, in groups, or self-chats for personal notes)
- Manage chat rooms and user profiles
- Create self-chats for personal reminders or drafts
- Group admins can add new members or remove people from the group, managing group membership dynamically
- Enjoy a scalable, secure, and modern chat experience

The server exposes RESTful API endpoints for user, chat, and message management, and uses WebSockets (Socket.IO) for real-time communication.

## License

This project is licensed under the ISC License.
