import logging
from uuid import uuid4

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.config import settings
from app.core.logging import request_id_context

logger = logging.getLogger(__name__)


class RequestIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = request.headers.get(settings.request_id_header) or str(uuid4())
        token = request_id_context.set(request_id)
        request.state.request_id = request_id

        try:
            response = await call_next(request)
            logger.info(
                "request completed method=%s path=%s status_code=%s",
                request.method,
                request.url.path,
                response.status_code,
            )
        finally:
            request_id_context.reset(token)

        response.headers[settings.request_id_header] = request_id
        return response
