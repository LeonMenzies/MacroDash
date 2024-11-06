# backend/controllers/dashboard_controller.py
from flask import Blueprint, jsonify, request, make_response
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.dashboard import Dashboard
from helpers.database import db
from helpers.api_exception import ApiException
from helpers.api_helpers import APIHelpers

bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')

@bp.route('/new', methods=['POST'])
@jwt_required()
def save_dashboard():
    try:
        helper = APIHelpers(request)
        user_id = helper.get_user_id()
                
        name = helper.get_parameters('name')
        config = helper.get_parameters('config')
        
        dashboard = Dashboard(user_id=user_id, name=name, config=config)
        db.session.add(dashboard)
        db.session.commit()

        response = make_response(jsonify({
            'success': True,
            'errorMessage': '',
            'data': {
                'dashboard_id': dashboard.id
            }
        }))

        return response
    except ApiException as e:
        raise e
    
@bp.route('/update', methods=['POST'])
@jwt_required()
def update_dashboard():
    try:
        helper = APIHelpers(request)
        user_id = helper.get_user_id()
        
        id = helper.get_parameters('id')
        config = helper.get_parameters('config')
        
        dashboard = Dashboard.query.filter_by(id=id, user_id=user_id).first()
        if not dashboard:
            raise ApiException('Dashboard not found')
        
        dashboard.config = config
        db.session.commit()

        response = make_response(jsonify({
            'success': True,
            'errorMessage': '',
            'data': {
                'dashboard_id': dashboard.id
            }
        }))

        return response
    except ApiException as e:
        raise e
    
@bp.route('/list', methods=['GET'])
@jwt_required()
def list_dashboards():
    try:
        helper = APIHelpers(request)
        user_id = helper.get_user_id()
            
        dashboards = Dashboard.query.filter_by(user_id=user_id).all()

        response = make_response(jsonify({
            'success': True,
            'errorMessage': '',
            'data': [dashboard.to_dict() for dashboard in dashboards]
        }))
        return response
    except ApiException as e:
        raise e

