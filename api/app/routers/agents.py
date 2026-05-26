"""Agent CRUD and lifecycle endpoints."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.agent import Agent
from app.schemas.agent import AgentCreate, AgentOut, AgentUpdate

router = APIRouter()


async def _get_agent_or_404(agent_id: int, db: AsyncSession) -> Agent:
    agent = await db.get(Agent, agent_id)
    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")
    return agent


@router.get("", response_model=list[AgentOut])
async def list_agents(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Agent).order_by(Agent.id))
    return result.scalars().all()


@router.post("", response_model=AgentOut, status_code=status.HTTP_201_CREATED)
async def create_agent(payload: AgentCreate, db: AsyncSession = Depends(get_db)):
    agent = Agent(**payload.model_dump())
    db.add(agent)
    await db.commit()
    await db.refresh(agent)
    return agent


@router.get("/{agent_id}", response_model=AgentOut)
async def get_agent(agent_id: int, db: AsyncSession = Depends(get_db)):
    return await _get_agent_or_404(agent_id, db)


@router.patch("/{agent_id}", response_model=AgentOut)
async def update_agent(agent_id: int, payload: AgentUpdate, db: AsyncSession = Depends(get_db)):
    agent = await _get_agent_or_404(agent_id, db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(agent, field, value)
    if payload.status == "active":
        agent.last_active_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(agent)
    return agent


@router.delete("/{agent_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_agent(agent_id: int, db: AsyncSession = Depends(get_db)):
    agent = await _get_agent_or_404(agent_id, db)
    await db.delete(agent)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{agent_id}/start", response_model=AgentOut)
async def start_agent(agent_id: int, db: AsyncSession = Depends(get_db)):
    agent = await _get_agent_or_404(agent_id, db)
    agent.status = "active"
    agent.last_active_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(agent)
    return agent


@router.post("/{agent_id}/stop", response_model=AgentOut)
async def stop_agent(agent_id: int, db: AsyncSession = Depends(get_db)):
    agent = await _get_agent_or_404(agent_id, db)
    agent.status = "idle"
    await db.commit()
    await db.refresh(agent)
    return agent


@router.post("/{agent_id}/restart", response_model=AgentOut)
async def restart_agent(agent_id: int, db: AsyncSession = Depends(get_db)):
    agent = await _get_agent_or_404(agent_id, db)
    agent.status = "active"
    agent.last_active_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(agent)
    return agent
