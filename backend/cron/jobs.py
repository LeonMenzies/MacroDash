from flask import current_app
from integrations.fred_integration import FredIntegration

def fred_release_calander_job():
    with current_app.app_context():
        fred = FredIntegration()
        fred.update_release_calendar()