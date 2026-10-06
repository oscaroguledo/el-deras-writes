from sqlalchemy import delete, select

from core.db import SessionLocal
from models.content.category import Category
from services.content.category import CategoryService


async def test_default_sections_seeded_with_subsections():
    async with SessionLocal() as db:
        tree = await CategoryService(db).tree()
    shape = {c.name: [k[0].name for k in kids] for c, _, kids in tree}
    assert shape == {
        "Books": ["Christian Non-Fiction Books", "Children's Bible Stories"],
        "Every Word Series": ["Teaching Series", "Questions Young People Ask!"],
        "Health and Healing": ["Health Education", "Health and Fitness Equipment"],
    }


async def test_ensure_defaults_is_idempotent_and_adopts_existing():
    async with SessionLocal() as db:
        await db.execute(delete(Category))  # start without the fixture's defaults
        db.add(Category(name="health education", slug="old-slug"))  # pre-existing, top-level
        await db.commit()
        service = CategoryService(db)
        await service.ensure_defaults()
        await service.ensure_defaults()
        rows = (await db.scalars(select(Category))).all()
    assert len(rows) == 9
    adopted = next(c for c in rows if c.name == "health education")
    assert adopted.parent_id is not None
