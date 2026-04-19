# Healthcare Backend System (Django + DRF)

A production-quality backend for a healthcare dashboard with JWT authentication, patient management, doctor directory, and patient-doctor assignment mapping.

## Project Overview

This project provides:
- Secure JWT-based authentication (`register`, `login`, `refresh`, `me`)
- User-owned patient records with strict ownership checks
- Global doctor management
- Patient-doctor mapping with duplicate prevention
- Standardized API envelope responses for success and errors
- Neon PostgreSQL support with SSL

## Tech Stack

- Python 3.11+
- Django 4.2
- Django REST Framework
- PostgreSQL (Neon)
- `djangorestframework-simplejwt`
- `django-cors-headers`
- `psycopg2-binary`
- `python-dotenv`
- `whitenoise`

## Project Structure

```text
healthcare-backend/
+-- manage.py
+-- requirements.txt
+-- .env.example
+-- config/
¦   +-- __init__.py
¦   +-- settings.py
¦   +-- urls.py
¦   +-- wsgi.py
+-- api/
    +-- __init__.py
    +-- models.py
    +-- serializers.py
    +-- views.py
    +-- urls.py
    +-- permissions.py
```

## Setup Instructions

1. Clone or move into backend folder:
   ```bash
   cd healthcare-backend
   ```
2. Create virtual environment:
   ```bash
   python -m venv .venv
   ```
3. Activate virtual environment:
   - Windows:
     ```bash
     .venv\Scripts\activate
     ```
   - Mac/Linux:
     ```bash
     source .venv/bin/activate
     ```
4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Create environment file:
   ```bash
   cp .env.example .env
   ```
6. Fill `.env` values (`DATABASE_URL`, `SECRET_KEY`, etc.)
7. Run migrations:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```
8. Start development server:
   ```bash
   python manage.py runserver
   ```

## Neon PostgreSQL Setup

1. Go to [https://neon.tech](https://neon.tech) and create an account.
2. Create a new Neon project.
3. Open your Neon project dashboard.
4. Copy the PostgreSQL connection string.
5. Paste it into `.env` as `DATABASE_URL`.
6. Ensure SSL is enabled (already enforced in settings via `ssl_require=True`).

Example `.env`:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require
SECRET_KEY=your_django_secret_key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

## Response Envelope Format

### Success
```json
{
  "success": true,
  "data": {},
  "message": "..."
}
```

### Error
```json
{
  "success": false,
  "error": "...",
  "details": {}
}
```

## JWT Usage

1. Authenticate using `POST /api/auth/login/` (or register).
2. Copy `tokens.access` from response.
3. Pass it in the `Authorization` header for protected endpoints:

```http
Authorization: Bearer <access_token>
```

4. Refresh when expired using `POST /api/auth/refresh/` with refresh token.

## API Endpoints

Base URL: `http://127.0.0.1:8000`

### Auth

1. **POST** `/api/auth/register/` (Auth: No)
   - Body:
   ```json
   {
     "name": "Soham",
     "email": "soham@example.com",
     "password": "StrongPass123"
   }
   ```
   - Response:
   ```json
   {
     "success": true,
     "data": {
       "user": {"id": 1, "name": "Soham", "email": "soham@example.com"},
       "tokens": {"access": "...", "refresh": "..."}
     },
     "message": "User registered successfully."
   }
   ```

2. **POST** `/api/auth/login/` (Auth: No)
   - Body:
   ```json
   {
     "email": "soham@example.com",
     "password": "StrongPass123"
   }
   ```

3. **POST** `/api/auth/refresh/` (Auth: No)
   - Body:
   ```json
   {
     "refresh": "<refresh_token>"
   }
   ```

4. **GET** `/api/auth/me/` (Auth: Yes)

### Patients (Auth Required)

1. **POST** `/api/patients/`
   - Body:
   ```json
   {
     "name": "Rahul",
     "age": 32,
     "gender": "male",
     "contact_number": "+91-9999999999",
     "address": "Delhi",
     "medical_history": "Diabetes"
   }
   ```

2. **GET** `/api/patients/`

3. **GET** `/api/patients/<id>/`

4. **PUT** `/api/patients/<id>/`

5. **DELETE** `/api/patients/<id>/`

### Doctors (Auth Required)

1. **POST** `/api/doctors/`
   - Body:
   ```json
   {
     "name": "Anita Sharma",
     "specialization": "Cardiology",
     "experience_years": 8,
     "contact_number": "+91-8888888888",
     "email": "dr.anita@example.com",
     "available": true
   }
   ```

2. **GET** `/api/doctors/`

3. **GET** `/api/doctors/<id>/`

4. **PUT** `/api/doctors/<id>/`

5. **DELETE** `/api/doctors/<id>/`

### Patient-Doctor Mappings (Auth Required)

1. **POST** `/api/mappings/`
   - Body:
   ```json
   {
     "patient_id": 1,
     "doctor_id": 1,
     "notes": "Weekly review"
   }
   ```

2. **GET** `/api/mappings/`
   - Returns mappings with nested `patient` and `doctor`.

3. **GET** `/api/mappings/<patient_id>/`
   - Returns doctors assigned to a specific patient.

4. **DELETE** `/api/mappings/<id>/`
   - Deletes mapping by mapping id.

> Note: `GET /api/mappings/<id>/` interprets `id` as `patient_id`; `DELETE /api/mappings/<id>/` interprets `id` as `mapping_id`.

## Postman Sample Test Flow

1. `POST /api/auth/register/`
2. `POST /api/auth/login/`
3. Copy `access` token and set Authorization header:
   `Bearer <access_token>`
4. `POST /api/patients/`
5. `POST /api/doctors/`
6. `POST /api/mappings/` with created `patient_id` and `doctor_id`
7. `GET /api/mappings/`

## Security and Quality Notes

- No hardcoded secrets
- Environment-driven settings
- JWT auth for protected routes
- Ownership checks for patient data and related mappings
- Structured error handling with meaningful messages
- Logging enabled (no print statements)
