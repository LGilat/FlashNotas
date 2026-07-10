# AGENTS.md

## Project

FlashNotas is a full-stack note management application.

Frontend:

* React
* Vite
* React Router
* Context API

Backend:

* Express
* Prisma
* SQLite

## Features

* Authentication
* User profiles
* Notes
* Categories
* Roles and permissions
* Admin dashboard
* Session management
* Audit logs
* Email change requests

## Development Rules

* Keep architecture simple.
* Reuse existing code whenever possible.
* Do not introduce Redux.
* Do not introduce Zustand.
* Keep Context API as the global state solution.
* Avoid unnecessary dependencies.
* Avoid large refactors unless explicitly requested.

## Backend Rules

* Use Prisma for database access.
* Respect existing Prisma models.
* Preserve authentication and authorization flows.
* Preserve audit logging functionality.

## Frontend Rules

* Follow existing component structure.
* Keep CSS organization unchanged.
* Prefer small reusable components.

## Before Making Changes

1. Read related files.
2. Explain proposed changes.
3. Implement minimal solution.
4. Avoid breaking existing functionality.

