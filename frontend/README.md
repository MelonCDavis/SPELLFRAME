# SPELLFRAME

SPELLFRAME is a full-stack web application for building, managing, and sharing Magic: The Gathering Commander (EDH) decks. It provides a modern deck-building experience with deep card inspection, import/export support, public deck discovery, and user profiles.

The application is designed with a strong emphasis on data integrity, rules correctness, and a clean user experience for both casual and competitive Commander players.

---

## Features

* Commander deck builder with full rules enforcement
* Support for Partner, Friends Forever, Doctor’s Companion, and Background commanders
* Import decklists from external sources (e.g. Moxfield / Archidekt format)
* Export decks in plaintext format
* Sideboard support
* Public and private deck visibility
* Public deck browsing and search
* Card inspection with rulings, printings, and pricing
* User authentication and profiles
* Collection and deck management
* Stateless JWT authentication
* Rate-limited and secured API

---

## Tech Stack

### Frontend

* React
* Vite
* Tailwind CSS v4

### Backend

* Node.js
* Express
* MongoDB
* Mongoose

### External Services

* Scryfall API (card data, rulings, printings)

---

## Project Structure

```
backend/
  server.js
  config/
  controllers/
  models/
  routes/
  utils/
  .env.example

frontend/
  src/
    components/
    pages/
    hooks/
    services/
    utils/
```

---

## Getting Started

### Where to watch and how to use Spellframe

* a Video walk through of the project: https://www.loom.com/share/928bd18788f346718cd44c8de78f1702
* a link to the app live:  https://spellframe-rho.vercel.app/
* or if you would like to launch on your own. Feel free to follow below.

### Prerequisites

* Node.js (v18 or newer recommended)
* MongoDB (local or hosted)
* npm

---

### Backend Setup

1. Navigate to the backend directory:

   ```
   cd backend
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Create an environment file:

   ```
   cp .env.example .env
   ```

4. Fill in the required values in `.env`:

   * `MONGODB_URI`
   * `JWT_SECRET`

5. Start the backend server:

   ```
   npm run dev
   ```

The API will be available at:

```
https://spellframe.onrender.com
```

---

### Frontend Setup

1. Navigate to the frontend directory:

   ```
   cd frontend
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Start the development server:

   ```
   npm run dev
   ```

The frontend will be available at:

```
https://spellframe-rho.vercel.app
```

---

## Authentication & Token Expiration

SPELLFRAME uses stateless authentication via JSON Web Tokens (JWT).

* Tokens are issued on login and contain a fixed expiration.
* Tokens automatically expire after the configured duration.
* Once expired, the API returns `401 Unauthorized`.
* Users must log in again to obtain a new token.

The application does not use refresh tokens.
This is an intentional design choice to reduce complexity and limit the lifetime of credentials.

Authenticated requests must include the token in the request header:

```
Authorization: Bearer <token>
```

---

## Security

The backend includes several production-grade security measures:

* Helmet for secure HTTP headers
* Scoped rate limiting for authentication, write actions, and public search routes
* Strict input validation for all search and write operations
* JWT-based authentication with expiration enforcement
* No client-side trust of derived or computed values

Secrets are never committed to the repository. All sensitive values are managed via environment variables.

---

## Rate Limiting

Rate limiting is applied to protect the API from abuse and accidental overload:

* Authentication routes are strictly limited to prevent brute-force attacks
* Write operations are moderately limited to prevent spam or automation
* Public search routes have higher limits to preserve a smooth user experience

When a limit is exceeded, the API responds with HTTP 429.

---

## Card Data

All card data is sourced from the Scryfall API.

* Card snapshots are stored at the time of deck creation or modification
* Printings and rulings are fetched dynamically when needed
* The application does not modify or redistribute Scryfall data beyond permitted usage

---

## Development Notes

* The backend owns all persistence logic
* Frontend state assumes backend validation is authoritative
* Most components are intentionally tightly scoped and should not be refactored casually
* Rules enforcement is handled centrally to avoid UI drift

---

## License

This project is provided as-is.
Magic: The Gathering and all related trademarks are the property of Wizards of the Coast.

---

## Acknowledgements

* Scryfall for providing comprehensive and reliable Magic: The Gathering card data
* The Commander community for continued inspiration and feedback
