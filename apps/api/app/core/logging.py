import logging
from contextvars import ContextVar

from app.core.config import settings

request_id_context: ContextVar[str] = ContextVar("request_id", default="-")
_log_record_factory_configured = False


class RequestIdFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = request_id_context.get()
        return True


def configure_logging() -> None:
    global _log_record_factory_configured

    if not _log_record_factory_configured:
        previous_factory = logging.getLogRecordFactory()

        def record_factory(*args, **kwargs) -> logging.LogRecord:
            record = previous_factory(*args, **kwargs)
            record.request_id = request_id_context.get()
            return record

        logging.setLogRecordFactory(record_factory)
        _log_record_factory_configured = True

    logging.basicConfig(
        level=settings.log_level,
        format=(
            "%(asctime)s %(levelname)s "
            "request_id=%(request_id)s %(name)s - %(message)s"
        ),
    )

    request_id_filter = RequestIdFilter()
    for handler in logging.getLogger().handlers:
        handler.addFilter(request_id_filter)
