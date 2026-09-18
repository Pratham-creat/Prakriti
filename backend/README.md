# Prakriti Backend (FastAPI + SQLAlchemy)

## Run

### Windows PowerShell

```powershell
cd backend
python -m venv .venv
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

### macOS/Linux

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

Default seeded users:
- admin / admin123
- operator / operator123

Set `DATABASE_URL` to use PostgreSQL, for example:

```bash
export DATABASE_URL="<postgresql_connection_string>"
```
