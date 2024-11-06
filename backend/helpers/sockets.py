import traceback
from flask import request
from flask_socketio import SocketIO, emit, disconnect
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from helpers.database import db
from models.chat_message import ChatMessage
from models.users import Users

socketio = None

def init_sockets(app):
    global socketio
    socketio = SocketIO(app, cors_allowed_origins="*", allowEIO3=True)

    @socketio.on('connect')
    def handle_connect():
        print('Client connected')
        try:
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            request.environ['user_id'] = user_id
            print(f"User ID: {user_id}")
        except Exception as e:
            print(f"JWT Decode Error: {e}") 
            disconnect()

    @socketio.on('message')
    def handle_message(data):
        print('Message received')
        user_id = request.environ.get('user_id')
        if not user_id:
            print('No user ID found in request')
            return
        message = data['message']
        user = db.session.get(Users, user_id)
        if not user:
            print('User not found')
            return
        new_message = ChatMessage(user_id=user_id, username=user.firstName, message=message)
        db.session.add(new_message)
        db.session.commit()
        emit('message', new_message.to_dict(), broadcast=True)
        
    @socketio.on_error_default  # handles all namespaces without an explicit error handler
    def default_error_handler(e):
        print(f'An error occurred: {e}')
        traceback.print_exc()

    return socketio