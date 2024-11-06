from flask import Blueprint, jsonify, request, make_response
from helpers.api_helpers import APIHelpers
from helpers.api_exception import ApiException
from cron.scheduler import trigger_job

bp = Blueprint('helper', __name__, url_prefix='/api')

@bp.route('/trigger-job/<job_id>', methods=['POST'])
def trigger_job_route(job_id):
    try:
        helper = APIHelpers(request)
        trigger_job(job_id)

        response = make_response(jsonify({
            'success': True,
            'errorMessage': '',
            'data': {"message": f"Job {job_id} triggered"}
        }))
    
        return response
    except ApiException as e:
        raise e
