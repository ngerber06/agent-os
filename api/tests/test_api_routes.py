"""REST API route coverage for all endpoints."""

import pytest


@pytest.mark.asyncio
async def test_agent_crud_and_lifecycle(client):
    create_resp = await client.post(
        "/api/agents",
        json={
            "name": "Codex",
            "initials": "CX",
            "model": "gpt-5",
            "agent_type": "codex",
        },
    )
    assert create_resp.status_code == 201
    agent = create_resp.json()
    assert agent["status"] == "idle"

    start_resp = await client.post(f"/api/agents/{agent['id']}/start")
    assert start_resp.status_code == 200
    assert start_resp.json()["status"] == "active"

    list_resp = await client.get("/api/agents")
    assert list_resp.status_code == 200
    assert any(item["id"] == agent["id"] for item in list_resp.json())

    stop_resp = await client.post(f"/api/agents/{agent['id']}/stop")
    assert stop_resp.status_code == 200
    assert stop_resp.json()["status"] == "idle"


@pytest.mark.asyncio
async def test_project_crud(client):
    create_resp = await client.post(
        "/api/projects",
        json={"name": "Agent OS", "description": "backend work"},
    )
    assert create_resp.status_code == 201
    project = create_resp.json()

    patch_resp = await client.patch(
        f"/api/projects/{project['id']}",
        json={"status": "paused"},
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["status"] == "paused"

    get_resp = await client.get(f"/api/projects/{project['id']}")
    assert get_resp.status_code == 200
    assert get_resp.json()["name"] == "Agent OS"


@pytest.mark.asyncio
async def test_activity_list_is_paginated(client):
    ingest_resp = await client.post(
        "/api/activity/ingest",
        json={"event_type": "test", "description": "listed event"},
    )
    assert ingest_resp.status_code == 201

    list_resp = await client.get("/api/activity?limit=10")
    assert list_resp.status_code == 200
    body = list_resp.json()
    assert body["total"] >= 1
    assert body["limit"] == 10
    assert any(item["description"] == "listed event" for item in body["items"])


@pytest.mark.asyncio
async def test_tokens_create_list_and_aggregate(client):
    create_resp = await client.post(
        "/api/tokens",
        json={"input_tokens": 10, "output_tokens": 20, "model": "gpt-5", "cost": 0.12},
    )
    assert create_resp.status_code == 201

    list_resp = await client.get("/api/tokens")
    assert list_resp.status_code == 200
    assert list_resp.json()["total"] >= 1

    aggregate_resp = await client.get("/api/tokens/aggregate")
    assert aggregate_resp.status_code == 200
    aggregate = aggregate_resp.json()
    assert aggregate["total_input"] >= 10
    assert aggregate["total_output"] >= 20
    assert aggregate["total_tokens"] == aggregate["total_input"] + aggregate["total_output"]


@pytest.mark.asyncio
async def test_metrics_system_and_summary(client):
    ingest_resp = await client.post(
        "/api/metrics/ingest",
        json={
            "cpu_pct": 12.5,
            "ram_used_gb": 1.0,
            "ram_total_gb": 4.0,
            "disk_used_gb": 8.0,
            "disk_total_gb": 64.0,
            "uptime_seconds": 123,
            "connections": 2,
            "region": "test",
        },
    )
    assert ingest_resp.status_code == 201

    system_resp = await client.get("/api/metrics/system")
    assert system_resp.status_code == 200
    assert system_resp.json()["total"] >= 1

    summary_resp = await client.get("/api/metrics/summary")
    assert summary_resp.status_code == 200
    summary = summary_resp.json()
    assert summary["latest_system"]["region"] == "test"
    assert "tokens" in summary


@pytest.mark.asyncio
async def test_auth_register_login_me_and_refresh(client):
    email = "route-test@example.com"
    register_resp = await client.post(
        "/auth/register",
        json={"email": email, "name": "Route Test", "password": "secret"},
    )
    assert register_resp.status_code == 201

    login_resp = await client.post("/auth/login", json={"email": email, "password": "secret"})
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]

    me_resp = await client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == email

    refresh_resp = await client.post("/auth/refresh", headers={"Authorization": f"Bearer {token}"})
    assert refresh_resp.status_code == 200
    assert refresh_resp.json()["access_token"]


@pytest.mark.asyncio
async def test_metrics_tokens_timeseries(client):
    await client.post(
        "/api/tokens",
        json={"input_tokens": 5, "output_tokens": 10, "model": "claude-sonnet-4-6", "cost": 0.05},
    )
    resp = await client.get("/api/metrics/tokens")
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] >= 1
    assert isinstance(body["items"], list)


@pytest.mark.asyncio
async def test_metrics_spend_breakdown(client):
    resp = await client.get("/api/metrics/spend?days=30")
    assert resp.status_code == 200
    body = resp.json()
    assert "agents" in body
    assert "total_cost" in body
    assert body["days"] == 30


@pytest.mark.asyncio
async def test_spend_summary(client):
    resp = await client.get("/api/spend")
    assert resp.status_code == 200
    body = resp.json()
    assert "today" in body
    assert "mtd" in body
    assert "period" in body


@pytest.mark.asyncio
async def test_agent_start_broadcasts_status_change(client):
    create_resp = await client.post(
        "/api/agents",
        json={"name": "BroadcastTest", "initials": "BT", "model": "test", "agent_type": "hermes"},
    )
    assert create_resp.status_code == 201
    agent_id = create_resp.json()["id"]

    start_resp = await client.post(f"/api/agents/{agent_id}/start")
    assert start_resp.status_code == 200

    stop_resp = await client.post(f"/api/agents/{agent_id}/stop")
    assert stop_resp.status_code == 200
    assert stop_resp.json()["status"] == "idle"
