from helpers.database import db
from sqlalchemy import JSON

class Dashboard(db.Model):
    __tablename__ = 'dashboards'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    config = db.Column(JSON, nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

    user = db.relationship('Users', backref=db.backref('dashboards', lazy=True))
    
    
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'config': self.config,
        }