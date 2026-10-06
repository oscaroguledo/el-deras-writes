from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse

from core.logging import get_logger

logger = get_logger(__name__)


class APIException(HTTPException):
    """HTTP error with a human-readable message; rendered as {"detail": message}."""

    def __init__(self, status_code: int, message: str = "An unexpected API error occurred"):
        self.message = message
        super().__init__(status_code=status_code, detail=message)


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(Exception)
    async def unhandled(request: Request, exc: Exception):
        logger.exception("Unhandled error on %s %s", request.method, request.url.path)
        return JSONResponse({"detail": "Internal server error"}, status_code=500)
