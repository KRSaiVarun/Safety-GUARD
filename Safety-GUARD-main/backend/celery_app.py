import os
from celery import Celery

CELERY_BROKER = os.getenv('CELERY_BROKER_URL', 'redis://redis:6379/0')
CELERY_BACKEND = os.getenv('CELERY_RESULT_BACKEND', CELERY_BROKER)

celery = Celery('backend', broker=CELERY_BROKER, backend=CELERY_BACKEND)
celery.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
)

celery.conf.beat_schedule = {
    'ai-risk-analysis': {
        'task': 'backend.tasks.ai_tasks.evaluate_active_sessions',
        'schedule': 30.0,
    },
}
