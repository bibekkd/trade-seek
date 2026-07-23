import psycopg

from app.core.config import settings


def check_database() -> tuple[bool, str]:
    try:
        with psycopg.connect(
            settings.database_url,
            connect_timeout=settings.dependency_check_timeout_seconds,
        ) as connection:
            with connection.cursor() as cursor:
                cursor.execute("select 1")
                cursor.fetchone()
        return True, "ok"
    except Exception as exc:
        return False, exc.__class__.__name__

