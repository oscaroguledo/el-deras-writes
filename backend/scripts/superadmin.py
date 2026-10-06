"""Create or update the owner account:  ADMIN_EMAIL=… ADMIN_PASSWORD=… python -m scripts.superadmin"""
import asyncio
import sys

from core.db import SessionLocal, initialize_db
from services.accounts.superadmin import ensure_superadmin


async def main() -> int:
    await initialize_db()
    async with SessionLocal() as db:
        try:
            user = await ensure_superadmin(db)
        except ValueError as exc:
            print(exc, file=sys.stderr)
            return 1
    if user is None:
        print("ADMIN_EMAIL and ADMIN_PASSWORD must be set", file=sys.stderr)
        return 1
    print(f"Admin ready: {user.email}")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
