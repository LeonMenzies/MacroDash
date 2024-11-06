from helpers.database import db

class Users(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    firstName = db.Column(db.String(100), nullable=False)
    lastName = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), nullable=False, unique=True)
    passwordHash = db.Column(db.String(255), nullable=False)

    def __repr__(self):
        return '<User %r>' % self.email