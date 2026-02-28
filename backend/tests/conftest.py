import os
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, delete

from app.core.config import settings
from app.core.db import engine, init_db
from app.main import app
from app.models import Item, User
from tests.utils.user import authentication_token_from_email
from tests.utils.utils import get_superuser_token_headers


@pytest.fixture(scope="session", autouse=True)
def db() -> Generator[Session | None, None, None]:
    # Useful for API-only runs where DB bootstrap is unrelated and unavailable.
    if os.getenv("SKIP_DB_TEST_SETUP", "").lower() in {"1", "true", "yes"}:
        yield None
        return

    with Session(engine) as session:
        init_db(session)
        yield session
        statement = delete(Item)
        session.execute(statement)
        statement = delete(User)
        session.execute(statement)
        session.commit()


@pytest.fixture(scope="module")
def client() -> Generator[TestClient, None, None]:
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="module")
def superuser_token_headers(client: TestClient) -> dict[str, str]:
    return get_superuser_token_headers(client)


@pytest.fixture(scope="module")
def normal_user_token_headers(
    client: TestClient, db: Session | None
) -> dict[str, str]:
    if db is None:
        pytest.skip("DB setup disabled via SKIP_DB_TEST_SETUP")
    return authentication_token_from_email(
        client=client, email=settings.EMAIL_TEST_USER, db=db
    )
