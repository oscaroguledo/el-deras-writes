from __future__ import annotations

import uuid

from sqlalchemy import func, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import utcnow
from core.utils.text import search_terms
from models.system import ContactInfo, Feedback, Visit, VisitorCount
from schemas.system.system import ContactUpdate, FeedbackCreate

TOTAL_VISITORS_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


class ContactService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get(self) -> ContactInfo:
        contact = await self.db.scalar(select(ContactInfo).limit(1))
        if contact is None:
            contact = ContactInfo(
                phone="+1234567890", email="info@example.com",
                social_media_links={
                    "whatsapp": "https://wa.me/1234567890",
                    "tiktok": "https://tiktok.com/@example",
                    "instagram": "https://instagram.com/example",
                    "facebook": "https://facebook.com/example",
                },
            )
            self.db.add(contact)
            await self.db.commit()
        return contact

    async def update(self, data: ContactUpdate) -> ContactInfo:
        contact = await self.get()
        for key, value in data.model_dump(exclude_none=True).items():
            setattr(contact, key, value)
        await self.db.commit()
        return contact


class VisitorService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _bump(self, model, where, **create) -> None:
        """Atomically increment `count` on the matching row, creating it if missing."""
        bump = update(model).where(where).values(count=model.count + 1)
        if (await self.db.execute(bump)).rowcount:
            return
        try:
            async with self.db.begin_nested():
                self.db.add(model(**create))
        except IntegrityError:  # lost a creation race; the row exists now
            await self.db.execute(bump)

    async def record(self) -> VisitorCount:
        today = utcnow().date()
        await self._bump(Visit, Visit.date == today, date=today, count=1)
        await self._bump(
            VisitorCount, VisitorCount.id == TOTAL_VISITORS_ID, id=TOTAL_VISITORS_ID, count=1
        )
        await self.db.commit()
        return await self.db.get(VisitorCount, TOTAL_VISITORS_ID, populate_existing=True)


class FeedbackService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: FeedbackCreate) -> Feedback:
        feedback = Feedback(**data.model_dump())
        self.db.add(feedback)
        await self.db.commit()
        return feedback

    async def get(self, feedback_id: uuid.UUID) -> Feedback | None:
        return await self.db.get(Feedback, feedback_id)

    async def list(self, page: int, limit: int, search: str | None = None):
        conds = [
            (Feedback.name.ilike(f"%{t}%") | Feedback.email.ilike(f"%{t}%")
             | Feedback.message.ilike(f"%{t}%"))
            for t in search_terms(search)
        ]
        total = await self.db.scalar(select(func.count(Feedback.id)).where(*conds)) or 0
        stmt = (
            select(Feedback).where(*conds).order_by(Feedback.created_at.desc())
            .limit(limit).offset((page - 1) * limit)
        )
        return list((await self.db.scalars(stmt)).all()), total

    async def delete(self, feedback: Feedback) -> None:
        await self.db.delete(feedback)
        await self.db.commit()
