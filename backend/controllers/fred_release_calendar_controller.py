# backend/controllers/fred_release_calendar_controller.py
from flask import Blueprint, jsonify, request, make_response
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.fred_release_calendar import FredReleaseCalendar
from helpers.database import db
from helpers.api_exception import ApiException
from helpers.api_helpers import APIHelpers
from datetime import datetime

bp = Blueprint('fred-release-calendar', __name__, url_prefix='/api/fred-release-calendar')

@bp.route('/', methods=['GET'])
@jwt_required()
def list_dashboards():
    try:
        helper = APIHelpers(request)
        
        start_date = helper.get_parameters('startDate')
        end_date = helper.get_parameters('endDate')

        query = FredReleaseCalendar.query

        if start_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d')
            query = query.filter(FredReleaseCalendar.release_date >= start_date)
        
        if end_date:
            end_date = datetime.strptime(end_date, '%Y-%m-%d')
            query = query.filter(FredReleaseCalendar.release_date <= end_date)

        fred_release_calendars = query.all()

        response = make_response(jsonify({
            'success': True,
            'errorMessage': '',
            'data': [fred_release_calendar.to_dict() for fred_release_calendar in fred_release_calendars]
        }))
        return response
    except ApiException as e:
        raise e