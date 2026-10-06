import math

from fastapi import Query, Request

from core.exceptions import APIException


class PageParams:
    def __init__(
        self,
        request: Request,
        page: int = Query(1, ge=1),
        page_size: int = Query(10, ge=1, le=100),
    ):
        self.request = request
        self.page = page
        self.limit = page_size


def build_page(params: PageParams, total: int, results: list) -> dict:
    """DRF-style PageNumberPagination envelope: {count, next, previous, results}."""
    pages = max(1, math.ceil(total / params.limit))
    if params.page > pages:
        raise APIException(404, "Invalid page.")
    url = params.request.url
    return {
        "count": total,
        "next": str(url.include_query_params(page=params.page + 1)) if params.page < pages else None,
        "previous": str(url.include_query_params(page=params.page - 1)) if params.page > 1 else None,
        "results": results,
    }
