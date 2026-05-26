from typing import TypeVar, Generic, List
from pydantic import BaseModel
from fastapi import Query

T = TypeVar("T")


class PageParams:
    def __init__(
        self,
        skip: int = Query(0, ge=0),
        limit: int = Query(50, ge=1, le=200),
    ):
        self.skip = skip
        self.limit = limit


class Page(BaseModel, Generic[T]):
    items: List[T]
    total: int
    skip: int
    limit: int
