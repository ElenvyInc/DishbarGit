import os

os.environ.setdefault("JWT_SECRET_KEY", "test-only-jwt-secret")
os.environ.setdefault("JWT_ALGORITHM", "HS256")
os.environ.setdefault("JWT_EXPIRE_MINUTES", "60")
os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault("STRIPE_WEBHOOK_SECRET", "whsec_test_only")
os.environ.setdefault("MGX_IGNORE_INIT_DB", "1")
os.environ.setdefault("MGX_IGNORE_INIT_ADMIN", "1")
os.environ.setdefault("FRONTEND_URL", "https://dishbar.ca")
os.environ.setdefault("ALLOWED_REDIRECT_ORIGINS", "https://dishbar.ca,https://www.dishbar.ca")
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite://")

import importlib
import pkgutil

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

import models
from core.database import Base, get_db
from main import app

for _finder, module_name, _is_pkg in pkgutil.iter_modules(models.__path__):
    importlib.import_module(f"models.{module_name}")

# A file database stays visible across sessions and pytest-asyncio event loops.
# In-memory SQLite was opening a fresh empty database for later connections.
TEST_DATABASE_PATH = "/tmp/dishbar_pytest.sqlite"
engine = create_async_engine(
    f"sqlite+aiosqlite:///{TEST_DATABASE_PATH}",
    poolclass=StaticPool,
    connect_args={"check_same_thread": False},
)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


@pytest.fixture
async def db_ready():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def client(db_ready):
    async def override_get_db():
        async with SessionLocal() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as http:
        yield http
    app.dependency_overrides.clear()


@pytest.fixture
def session_factory(db_ready):
    return SessionLocal
