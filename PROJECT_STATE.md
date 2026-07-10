# PROJECT_STATE.md

## Current Status

Working Features:

* User registration
* User login
* Protected routes
* User profiles (with avatar upload, stats, and bulk export)
* Categories CRUD
* Notes CRUD
* Admin routes (CRUD for users, notes, categories)
* Role requests (User side and Admin side)
* Session management (List sessions, logout others)
* Audit logs (Viewable by admin, export to CSV)
* Email change requests (Token-based confirmation)
* Dashboard with statistics (Personal dashboard with activity pulse)
* Search notes (Frontend & Backend, highlighting)
* Recent activity history
* Favorite and Pinned notes with visual cues
* Export notes (Markdown & TXT)
* Responsive Navigation (Hamburger menu for mobile)
* Automatic "General" category creation for all new users (Onboarding fix)

## Technical Debt

* Hardcoded API base URL (`http://localhost:3000`) in frontend components.
* Use of inline styles in major components (`Profile.jsx`, `AdminDashboard.jsx`) instead of CSS modules or external stylesheets.
* Frontend-only pagination logic in `Notas.jsx` without UI controls.
* Hardcoded category colors in `Notas.jsx`.
* Missing error boundaries in React.
* No centralized error handling in Backend.
* Lack of automated tests (unit, integration, or E2E).
* Sensitive information in `admin.credentials.txt` (should be handled via environment variables or a proper seed).

## Next Improvements

* Search notes
* Pagination
* Better responsive design
* Better UI/UX
* Testing
* Deployment

