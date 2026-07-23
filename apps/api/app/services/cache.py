from redis import Redis

from app.core.config import settings


def check_redis() -> tuple[bool, str]:
    try:
        client = Redis.from_url(
            settings.redis_url,
            socket_connect_timeout=settings.dependency_check_timeout_seconds,
            socket_timeout=settings.dependency_check_timeout_seconds,
        )
        client.ping()
        return True, "ok"
    except Exception as exc:
        return False, exc.__class__.__name__

