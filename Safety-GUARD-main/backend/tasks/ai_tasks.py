from backend.celery_app import celery
from backend.ai_engine.ai_scheduler import run_risk_analysis


@celery.task(name='backend.tasks.evaluate_active_sessions')
def evaluate_active_sessions():
    """Evaluate active emergency sessions and broadcast risk telemetry."""
    try:
        run_risk_analysis()
        return {'status': 'ok'}
    except Exception as e:
        return {'status': 'failed', 'error': str(e)}
