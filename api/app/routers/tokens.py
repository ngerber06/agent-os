"""Token usage and spend endpoints."""
from fastapi import APIRouter, Depends, status
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.token_record import TokenRecord
from app.schemas.token import TokenAggregate, TokenRecordIn, TokenRecordOut
from app.utils.pagination import Page, PageParams

router = APIRouter()


@router.get("", response_model=Page[TokenRecordOut])
async def list_tokens(params: PageParams = Depends(), db: AsyncSession = Depends(get_db)):
    total = await db.scalar(select(func.count()).select_from(TokenRecord))
    result = await db.execute(
        select(TokenRecord)
        .order_by(desc(TokenRecord.timestamp), desc(TokenRecord.id))
        .offset(params.skip)
        .limit(params.limit)
    )
    return Page(
        items=result.scalars().all(),
        total=total or 0,
        skip=params.skip,
        limit=params.limit,
    )


@router.post("", response_model=TokenRecordOut, status_code=status.HTTP_201_CREATED)
async def create_token_record(payload: TokenRecordIn, db: AsyncSession = Depends(get_db)):
    record = TokenRecord(**payload.model_dump())
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record


@router.get("/aggregate", response_model=TokenAggregate)
async def aggregate_tokens(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(
            func.coalesce(func.sum(TokenRecord.input_tokens), 0),
            func.coalesce(func.sum(TokenRecord.output_tokens), 0),
            func.coalesce(func.sum(TokenRecord.cost), 0.0),
        )
    )
    total_input, total_output, total_cost = result.one()
    return TokenAggregate(
        total_input=total_input,
        total_output=total_output,
        total_tokens=total_input + total_output,
        total_cost=total_cost,
    )
