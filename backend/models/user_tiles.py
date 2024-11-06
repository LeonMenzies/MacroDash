from helpers.database import db
from sqlalchemy import JSON 

class UserTiles(db.Model):
    __tablename__ = 'user_tiles'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    tile_id = db.Column(db.Integer, db.ForeignKey('tiles.id'), nullable=False)
    config = db.Column(JSON, nullable=True)
    date_added = db.Column(db.DateTime, default=db.func.current_timestamp())

    user = db.relationship('Users', backref=db.backref('user_tiles', lazy=True))
    tile = db.relationship('Tiles', backref=db.backref('user_tiles', lazy=True))