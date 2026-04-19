# Frontend Integration (Fully Wired)

This frontend is connected to the Django backend using JWT auth and live API calls.

## Run

1. Start backend (`http://127.0.0.1:8000`).
2. Start frontend static server from this folder:
   - `python -m http.server 5500`
3. Open `http://localhost:5500`.

## Flow

- Entry redirects to `pages/auth.html` if not logged in.
- Login/Register stores JWT tokens in `localStorage`.
- Access token is automatically attached as `Authorization: Bearer <token>`.
- On 401, frontend attempts refresh using `/api/auth/refresh/`.

## Pages

- `pages/auth.html`: Login/Register + API base URL setting
- `pages/dashboard-overview.html`: Live counts + recent patients
- `pages/patient-management.html`: Full patient CRUD
- `pages/doctor-staff-directory.html`: Full doctor CRUD
- `pages/patient-doctor-mapping.html`: Create/list/delete mappings + get doctors by patient

## Shared Modules

- `assets/js/config.js`
- `assets/js/api.js`
- `assets/js/common.js`
- `assets/js/layout.js`
- `assets/css/base.css`
- `assets/css/app.css`

## Deployment Notes (Vercel + Backend Host)

- Update `assets/js/config.js`:
  - Set `DEPLOYED_API_BASE_URL` to your backend URL, for example:
    - `https://your-backend-service.onrender.com/api`
    - `https://your-backend-service.railway.app/api`
- Keep backend CORS configured to allow your Vercel domain.
- JWT header format already matches backend: `Authorization: Bearer <access_token>`.
