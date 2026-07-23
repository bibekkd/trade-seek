from celery import Celery

from app.core.config import settings


celery_app = Celery(
    "algo_trading_api",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.tasks.backtests"],
)
celery_app.conf.update(
    task_track_started=True,
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    result_expires=86400,
    task_always_eager=settings.celery_task_always_eager,
    task_eager_propagates=settings.celery_task_eager_propagates,
)
