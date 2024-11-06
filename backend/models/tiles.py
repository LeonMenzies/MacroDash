from helpers.database import db
from sqlalchemy import JSON 

class Tiles(db.Model):
    __tablename__ = 'tiles'

    id = db.Column(db.Integer, primary_key=True)
    tile_id = db.Column(db.String(255), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.String(255), nullable=True)
    tile_type = db.Column(db.String(50), nullable=False)
    config = db.Column(JSON, nullable=True) 
    state = db.Column(db.String(50), nullable=False, default='active')
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

    def to_dict(self):
        return {
            'id': self.id,
            'tile_id': self.tile_id,
            'title': self.title,
            'description': self.description,
            'tile_type': self.tile_type,
            'config': self.config,
            'state': self.state,
            'created_at': self.created_at,
        }