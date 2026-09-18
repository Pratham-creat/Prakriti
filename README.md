# Prakriti

Prototype v0.1 for **Prakriti — Nursery Management System**.

## Stack
- Frontend: React + Vite + Tailwind CSS
- Backend: FastAPI + SQLAlchemy
- Database: SQLAlchemy-compatible (use PostgreSQL via `DATABASE_URL`, sqlite default for local quick start)

## Project Structure
- `/backend` FastAPI API and tests
- `/frontend` React UI with office-style navigation/dashboard/forms

## Run Backend
```bash
cd /home/runner/work/Prakriti/Prakriti/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Run Frontend
```bash
cd /home/runner/work/Prakriti/Prakriti/frontend
npm install
npm run dev
```

## Seeded Demo Credentials
- Admin: `admin` / `admin123`
- Operator: `operator` / `operator123`
