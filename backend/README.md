# Prakriti Backend (FastAPI + SQLAlchemy)

## Run

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Default seeded users:
- admin / admin123
- operator / operator123

Set `DATABASE_URL` to use PostgreSQL, for example:

```bash
export DATABASE_URL="<postgresql_connection_string>"
```
