# fred_integration.py
import os
import requests
from dotenv import load_dotenv
from datetime import datetime, timedelta
from helpers.database import db
from models.fred_release_calendar import FredReleaseCalendar

load_dotenv()

class FredIntegration:
    def __init__(self):
        self.api_key = os.getenv('FRED_API_KEY')
        self.base_url = os.getenv('FRED_API_BASE_URL')

    def fetch_release_calendar(self, start_date: str, end_date: str):
        url = f"{self.base_url}/releases/dates"
        params = {
            'api_key': self.api_key,
            'file_type': 'json',
            'include_release_dates_with_no_data': 'true',
            'realtime_start': start_date,
            'realtime_end': end_date
        }
        response = requests.get(url, params=params)
        if response.status_code == 200:
            return response.json()
        else:
            response.raise_for_status()

    def store_release_calendar(self, data):
        for item in data['release_dates']:
            release_date = datetime.strptime(item['date'], '%Y-%m-%d')
            release = FredReleaseCalendar(
                release_id=item['release_id'],
                release_name=item['release_name'],
                release_date=release_date
            )
            db.session.add(release)
        db.session.commit()

    def get_latest_release_date(self):
        latest_release = db.session.query(FredReleaseCalendar).order_by(FredReleaseCalendar.release_date.desc()).first()
        if latest_release:
            return latest_release.release_date
        else:
            return None

    def update_release_calendar(self):
        latest_release_date = self.get_latest_release_date()
        if latest_release_date:
            start_date = (latest_release_date + timedelta(days=1)).strftime('%Y-%m-%d')
        else:
            # If no data exists, start from a default date
            start_date = '1999-01-01'
        
        end_date = '9999-12-31'
        data = self.fetch_release_calendar(start_date, end_date)
        self.store_release_calendar(data)