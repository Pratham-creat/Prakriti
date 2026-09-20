from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import NullPool
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./prakriti.db")

# Render/PostgreSQL URLs may omit the SQLAlchemy driver. Use psycopg 3 explicitly.
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine_kwargs = {"connect_args": connect_args}
if not DATABASE_URL.startswith("sqlite"):
    engine_kwargs["pool_pre_ping"] = True

engine = create_engine(DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
