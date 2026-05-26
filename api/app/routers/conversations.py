"""Conversation and message CRUD."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.conversation import Conversation, ConvMessage
from app.schemas.conversation import ConversationCreate, ConversationOut, ConvMessageOut

router = APIRouter()


@router.get("", response_model=list[ConversationOut])
async def list_conversations(agent_id: Optional[int] = None, db: AsyncSession = Depends(get_db)):
    q = select(Conversation).order_by(desc(Conversation.updated_at))
    if agent_id is not None:
        q = q.where(Conversation.agent_id == agent_id)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("", response_model=ConversationOut, status_code=status.HTTP_201_CREATED)
async def create_conversation(payload: ConversationCreate, db: AsyncSession = Depends(get_db)):
    conv = Conversation(**payload.model_dump())
    db.add(conv)
    await db.commit()
    await db.refresh(conv)
    return conv


@router.get("/{conv_id}", response_model=ConversationOut)
async def get_conversation(conv_id: int, db: AsyncSession = Depends(get_db)):
    conv = await db.get(Conversation, conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv


@router.delete("/{conv_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(conv_id: int, db: AsyncSession = Depends(get_db)):
    conv = await db.get(Conversation, conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    await db.delete(conv)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{conv_id}/messages", response_model=list[ConvMessageOut])
async def get_messages(conv_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ConvMessage)
        .where(ConvMessage.conversation_id == conv_id)
        .order_by(ConvMessage.created_at)
    )
    return result.scalars().all()
