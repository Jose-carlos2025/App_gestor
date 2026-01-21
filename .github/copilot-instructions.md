# Copilot Instructions for Sistema Gestão Tarefas

## Project Overview
This is a **task management system** with a **Node.js/Express backend** and **vanilla JavaScript frontend**. Architecture follows MVC pattern with clear separation between backend API (`/backend`) and frontend views (`/frontend`).

## Architecture & Data Flow

### Backend Structure
- **Models** (`/backend/models/`): `User.js`, `Task.js` - Define SQLite schema
- **Controllers** (`/backend/controllers/`): Handle business logic
  - `authController.js`: User registration/login with bcryptjs password hashing
  - `taskController.js`: CRUD operations for tasks
  - `dashboardController.js`: Dashboard data aggregation
- **Routes** (`/backend/routes/`): API endpoint definitions
  - `authRoutes.js`: `/auth/*` endpoints (login, register, logout)
  - `taskRoutes.js`: `/api/tasks/*` CRUD endpoints
  - `dashboardRoutes.js`: `/api/dashboard/*` summary endpoints
- **Middleware** (`/backend/middleware/`): `auth.js` - Session-based authentication check

### Database
- **Technology**: SQLite3 via `sqlite3` npm package
- **Connection**: Configured in `backend/config/database.js`
- **Pattern**: SQLite files typically stored in project root or `.data/` directory

### Frontend Structure
- **Pages**: `index.html` (home), `login.html`, `dashboard.html`, `tasks.html`, `task-detail.html`
- **Styling**: Centralized in `/frontend/css/` (`style.css` for globals, specific stylesheets per page)
- **JavaScript**: Modular approach in `/frontend/js/`
  - `app.js`: Global app initialization and utilities
  - `auth.js`: Authentication flow (login/logout)
  - `dashboard.js`: Dashboard page logic
  - `tasks.js`: Task list and CRUD operations

## Key Dependencies & Integrations

| Package | Purpose | Notes |
|---------|---------|-------|
| `express` ^5.2.1 | Web framework | Handles routing and middleware |
| `sqlite3` ^5.1.7 | Database | ORM-less direct SQL queries |
| `bcryptjs` ^3.0.3 | Password hashing | Used in authController |
| `express-session` ^1.18.2 | Session management | Store user sessions post-login |
| `cors` ^2.8.5 | CORS headers | Enable frontend-backend communication |
| `dotenv` ^17.2.3 | Environment variables | Load config from `.env` file |
| `nodemon` (dev) | Auto-reload | Development workflow |

## Development Workflow

### Setup
```bash
cd backend
npm install
# Create .env with DB_PATH, SESSION_SECRET
npm start      # Start server (default: localhost:3000 or port from env)
npm run dev    # Run with nodemon for development
```

### Testing Strategy
- Currently no test framework configured
- When adding tests: use `npm test` script (currently errors)

## Important Patterns & Conventions

### Authentication & Authorization
- **Session-based**: Uses `express-session` middleware
- **Password handling**: Always use bcryptjs for hashing/comparing
- **Auth check**: Protected routes use `middleware/auth.js` before reaching controllers
- **Session storage**: Configure in `server.js` with session secret from `.env`

### API Response Format
- Assume consistent JSON responses from controllers
- Frontend checks `response.ok` or specific status codes for error handling
- Common pattern: `{ success: true, data: [...], message: "..." }` or error responses

### Frontend-Backend Communication
- Frontend makes fetch requests to `/api/tasks/*` and `/auth/*` endpoints
- Include credentials when calling API: `fetch(url, { credentials: 'include' })`
- CORS enabled via middleware in `server.js`

### Database Queries
- Direct SQL queries in controllers (no ORM)
- Always sanitize inputs to prevent SQL injection
- Use parameterized queries: `db.run("SELECT * FROM users WHERE id = ?", [id], ...)`

## File Modification Guidelines

### When Adding Features
1. **New API endpoint**: Create route in `/backend/routes/*.js`, implement in `/backend/controllers/*.js`
2. **Database schema change**: Update `/backend/models/*.js`, then migration/reset logic
3. **Frontend page**: Create HTML in `/frontend/`, corresponding JS in `/frontend/js/`, CSS in `/frontend/css/`
4. **New dependencies**: Add to `backend/package.json`, install, document in this file

### Code Style
- Backend: CommonJS modules (`require`/`module.exports`)
- Frontend: Vanilla ES6+ (no transpilation, modern browser compatibility assumed)
- Error handling: Wrap async operations, return meaningful error messages
- Comments: Include "why" not just "what" for non-obvious logic

## Debugging Tips
- Backend errors: Check console output, verify `.env` variables set (DB_PATH, SESSION_SECRET)
- Frontend issues: Use DevTools, check network tab for API responses
- Database issues: Verify SQLite file exists at path specified in `.env`
- Session issues: Ensure `credentials: 'include'` in frontend fetch calls
