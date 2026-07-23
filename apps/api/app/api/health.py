from fastapi import APIRouter

from app.core.config import settings
from app.services.cache import check_redis
from app.services.database import check_database

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict[str, object]:
    database_ok, database_message = check_database()
    redis_ok, redis_message = check_redis()
    dependencies_ok = database_ok and redis_ok

    return {
        "status": "ok" if dependencies_ok else "degraded",
        "service": settings.app_name,
        "version": settings.app_version,
        "mode": settings.environment,
        "checks": {
            "app": {"status": "ok"},
            "database": {
                "status": "ok" if database_ok else "error",
                "detail": database_message,
            },
            "redis": {
                "status": "ok" if redis_ok else "error",
                "detail": redis_message,
            },
        },
    }
