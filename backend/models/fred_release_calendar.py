from helpers.database import db

class FredReleaseCalendar(db.Model):
    __tablename__ = 'release_calendar'

    id = db.Column(db.Integer, primary_key=True)
    release_id = db.Column(db.Integer, nullable=False)
    release_name = db.Column(db.String(255), nullable=False)
    release_date = db.Column(db.Date, nullable=False)
    
    
    def to_dict(self):
        return {
            'id': self.id,
            'release_id': self.release_id,
            'release_name': self.release_name,
            'release_date': self.release_date,
        }