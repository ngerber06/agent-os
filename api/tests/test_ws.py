"""WebSocket integration tests."""
import asyncio
import json

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from httpx_ws import aconnect_ws
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.main import app
from app.database import Base, get_db
from app.services.activity_stream import activity_stream
from app.services.metric_collector import metric_collector

TEST_DB_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture(scope="module")
async def engine():
    _engine = create_async_engine(TEST_DB_URL, echo=False)
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield _engine
    await _engine.dispose()


@pytest_asyncio.fixture
async def test_client(engine):
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async def override_get_db():
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_health(test_client: AsyncClient):
    resp = await test_client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_ingest_activity_stores_and_responds(test_client: AsyncClient):
    payload = {
        "agent_id": None,
        "event_type": "test",
        "description": "hello from test",
        "tokens_used": 5,
    }
    resp = await test_client.post("/api/activity/ingest", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["event_type"] == "test"
    assert data["description"] == "hello from test"
    assert data["id"] is not None


@pytest.mark.asyncio
async def test_ingest_metric_stores_and_responds(test_client: AsyncClient):
    payload = {
        "cpu_pct": 42.5,
        "ram_used_gb": 2.1,
        "ram_total_gb": 8.0,
        "disk_used_gb": 30.0,
        "disk_total_gb": 100.0,
        "uptime_seconds": 3600,
        "connections": 12,
        "region": "test",
    }
    resp = await test_client.post("/api/metrics/ingest", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["cpu_pct"] == 42.5
    assert data["region"] == "test"
    assert data["id"] is not None


@pytest.mark.asyncio
async def test_ingest_activity_broadcasts_to_subscribers():
    """Ingest should push to activity_stream subscribers."""
    received = []
    q = activity_stream._subscribe_global()
    try:
        await activity_stream.broadcast({"event_type": "test_broadcast", "description": "ping"})
        payload = await asyncio.wait_for(q.get(), timeout=1.0)
        received.append(json.loads(payload))
    finally:
        activity_stream._unsubscribe_global(q)

    assert len(received) == 1
    assert received[0]["event_type"] == "test_broadcast"


@pytest.mark.asyncio
async def test_ingest_metric_broadcasts_to_subscribers():
    """Ingest should push to metric_collector subscribers."""
    received = []
    snapshot = {"cpu_pct": 10.0, "ram_used_gb": 1.0, "ram_total_gb": 8.0,
                "disk_used_gb": 5.0, "disk_total_gb": 50.0,
                "uptime_seconds": 100, "connections": 3, "region": "test"}
    q = metric_collector._subscribe()
    try:
        await metric_collector.ingest(snapshot)
        payload = await asyncio.wait_for(q.get(), timeout=1.0)
        received.append(json.loads(payload))
    finally:
        metric_collector._unsubscribe(q)

    assert len(received) == 1
    assert received[0]["cpu_pct"] == 10.0


@pytest.mark.asyncio
async def test_metric_collector_stores_latest():
    """metric_collector.latest() returns the last ingested snapshot."""
    snapshot = {"cpu_pct": 77.0, "ram_used_gb": 4.0, "ram_total_gb": 16.0,
                "disk_used_gb": 20.0, "disk_total_gb": 200.0,
                "uptime_seconds": 999, "connections": 1, "region": "latest-test"}
    await metric_collector.ingest(snapshot)
    latest = json.loads(metric_collector.latest())
    assert latest["cpu_pct"] == 77.0
    assert latest["region"] == "latest-test"
