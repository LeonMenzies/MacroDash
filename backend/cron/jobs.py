from datetime import datetime
from integrations.fred_integration import FredIntegration

def test_job():
    print(f"Test job executed at {datetime.now()}")

def fred_release_calander_job():
    fred = FredIntegration()
    fred.update_release_calendar()

