from flask import Blueprint, jsonify, make_response, request
from flask_jwt_extended import jwt_required
from helpers.api_exception import ApiException
from models.chat_message import ChatMessage
from helpers.database import db
from helpers.api_helpers import APIHelpers

bp = Blueprint('chat', __name__, url_prefix='/api/chat')

@bp.route('/messages', methods=['GET'])
@jwt_required()
def get_messages():
    try:
        helper = APIHelpers(request)
        messages = ChatMessage.query.order_by(ChatMessage.timestamp.desc()).all()

        response = make_response(jsonify({
            'success': True,
            'errorMessage': '',
            'data': [message.to_dict() for message in messages]
        }))
        return response
    except ApiException as e:
        raise e