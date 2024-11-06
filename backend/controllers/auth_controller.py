from flask import Blueprint, jsonify, request, make_response
from flask_jwt_extended import create_access_token, set_access_cookies, unset_jwt_cookies
from werkzeug.security import check_password_hash
from models.users import Users
from helpers.database import db
from helpers.api_helpers import APIHelpers
from werkzeug.security import generate_password_hash
from helpers.api_exception import ApiException
from datetime import timedelta

bp = Blueprint('auth', __name__, url_prefix='/api')

@bp.route('/login', methods=['POST'])
def post_login():
    try:
        helper = APIHelpers(request)

        helper.validate_required_parameters(['email', 'password'])

        email = helper.get_parameters('email')
        password = helper.get_parameters('password')

        user = Users.query.filter_by(email=email).first()

        if user is None or not check_password_hash(user.passwordHash, password):
            raise ApiException("Invalid email or password")

        # Create a new token with the user id embedded in it
        access_token = create_access_token(identity=email)

        user_info = {
            "id": user.id,
            "firstName": user.firstName,
            "lastName": user.lastName,
            "email": user.email,
        }

        access_token = create_access_token(identity=user_info, expires_delta=timedelta(days=1))
        response = make_response(jsonify({
            'success': True,
            'errorMessage': '',
            'data': user_info
        }))
        # response.set_cookie('access_token_cookie', access_token, httponly=True)
        
        set_access_cookies(response, access_token)
        return response
    except ApiException as e:
        raise e
    
@bp.route('/logout', methods=['POST'])
def post_logout():
    try:
        helper = APIHelpers(request)

        response = make_response(jsonify({
            'success': True,
            'errorMessage': '',
        }))
        
        unset_jwt_cookies(response)
        return response
    except ApiException as e:
        raise e

@bp.route('/signup', methods=['POST'])
def post_signup():
    try:
        helper = APIHelpers(request)

        helper.validate_required_parameters(['firstName', 'lastName', 'email', 'password'])

        first_name = helper.get_parameters('firstName')
        last_name = helper.get_parameters('lastName')
        email = helper.get_parameters('email')
        password = helper.get_parameters('password')

        # Check if a user with this email already exists
        existing_user = Users.query.filter_by(email=email).first()
        if existing_user is not None:
            raise ApiException("A user with this email already exists")


        # Hash the password
        password_hash = generate_password_hash(password)

        # Create a new user
        new_user = Users(firstName=first_name, lastName=last_name, email=email, passwordHash=password_hash)
        db.session.add(new_user)
        db.session.commit()

        return helper.success_response()
    except ApiException as e:
        raise e
