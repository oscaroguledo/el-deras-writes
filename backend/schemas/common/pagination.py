from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    count: int
    next: str | None
    previous: str | None
    results: list[T]
