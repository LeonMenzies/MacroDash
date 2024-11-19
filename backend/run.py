import os
import logging
import traceback

from flask import Flask, jsonify
from dotenv import load_dotenv
from flask_jwt_extended import JWTManager
from models.users import Users
from models.chat_message import ChatMessage
from helpers.api_exception import ApiException
from helpers.database import db
from flask_cors import CORS
from cron.scheduler import create_scheduler
from controllers import register_controllers
from flask_socketio import SocketIO, send

load_dotenv() 
app = Flask(__name__)
CORS(app, supports_credentials=True)

# Configure logging
logging.basicConfig(filename='app.log', level=logging.ERROR, format='%(asctime)s %(levelname)s %(name)s %(threadName)s : %(message)s')

app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('SQLALCHEMY_DATABASE_URI')
app.config['JWT_TOKEN_LOCATION'] = ['cookies']
app.config['JWT_COOKIE_CSRF_PROTECT'] = False
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_COOKIE_MAX_AGE'] = 604800  # Set the cookie timeout to 1 week (7 days)

jwt = JWTManager(app)

# Initialize the SQLAlchemy db instance
db.init_app(app)

with app.app_context():
    scheduler = create_scheduler(app, db)
    db.create_all()

# Register the controllers
register_controllers(app)

# Initialize sockets
socketio = SocketIO(app, cors_allowed_origins=os.getenv('CORS_ORIGIN_WHITELIST'))

@socketio.on('message')
def handle_message(msg):
    print(f"Message received: {msg}")
    
    # Look up the user from the Users table using the user_id
    user = db.session.get(Users, msg['user_id'])
    
    if not user:
        print(f"User with id {msg['user_id']} not found")
        return
    
    # Create a new ChatMessage object
    new_message = ChatMessage(
        user_id=user.id,
        username=f"{user.firstName} {user.lastName}",
        message=msg['message']
    )
    
    # Add the new message to the database
    db.session.add(new_message)
    db.session.commit()
    
    # Broadcast the message
    send(new_message.to_dict(), broadcast=True)

@app.errorhandler(ApiException)
def handle_api_exception(error):
    logging.error(f"ApiException: {error.message}")
    response = jsonify({
        'success': False,
        'errorMessage': str(error.message),
    })
    return response

@app.errorhandler(Exception)
def handle_general_exception(error):
    logging.error(f"Exception: {str(error)}")
    print("Exception occurred:", error)
    traceback.print_exc()  # Print the full stack trace
    response = jsonify({
        'success': False,
        'errorMessage': 'An unexpected error occurred. Please try again later.',
    })
    return response

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=4001, debug=True)