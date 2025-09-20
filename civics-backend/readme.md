# Civics App Backend

This is a Node.js + Express backend service for the "Civics" application. It handles report submissions and sends email notifications for new reports and status updates. It can optionally integrate with Google Firestore for data persistence.

## Features

-   **Report Submission**: `POST /api/reports`
-   **Status Updates**: `POST /api/reports/:id/status`
-   **Email Notifications**: Uses Nodemailer with Gmail for notifying admins and reporters.
-   **Optional Firestore Persistence**: Writes/updates reports if configured.
-   **Secure & Robust**: Includes `helmet`, rate limiting, CORS, and graceful shutdown.
-   **Developer Friendly**: Request logging with `morgan`.

---

## 🚀 Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or newer)
-   npm (comes with Node.js)
-   A Gmail account with an [App Password](https://support.google.com/accounts/answer/185833) enabled.

### 1. Local Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd civics-backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Create your environment file:**
    Copy the example file to a new `.env` file.
    ```bash
    cp .env.example .env
    ```

4.  **Configure environment variables in `.env`:**
    -   `PORT`: The port the server will run on (e.g., `5000`).
    -   `GMAIL_EMAIL`: Your full Gmail address.
    -   `GMAIL_PASSWORD`: The 16-character **App Password** you generated from your Google account.
    -   `ADMIN_EMAIL`: The email address that will receive notifications for new reports.
    -   `CORS_ORIGIN`: Your frontend's URL (e.g., `http://localhost:5173` for local React dev).
    -   `FIREBASE_SERVICE_ACCOUNT`: (Optional) The full JSON content of your Firebase service account key as a single-line string.

5.  **Start the server:**
    ```bash
    npm start
    ```
    The server should log that it's listening and that the mailer is verified.

---

## 🧪 Local Testing (API Endpoints)

You can use `curl` or Postman to test the endpoints.

### 1. Create a New Report

```bash
curl -X POST http://localhost:5000/api/reports \
  -H "Content-Type: application/json" \
  -d '{"title":"Pothole on Main St","description":"A large pothole is causing traffic issues near the library.","reporterEmail":"citizen.jane@example.com"}'