from flask import Blueprint, jsonify, request, make_response
from flask_jwt_extended import jwt_required, get_jwt_identity
from helpers.api_helpers import APIHelpers
from models.tiles import Tiles
from models.user_tiles import UserTiles
from helpers.database import db
from helpers.api_exception import ApiException

bp = Blueprint('tiles', __name__, url_prefix='/api/tiles')

@bp.route('/list', methods=['GET'])
@jwt_required(optional=True)
def get_all_tiles():
    try:
        helper = APIHelpers(request)
        user_id = helper.get_user_id()

        # Get query parameters for filtering and sorting
        sort_by = helper.get_parameters('sort_by', 'title')
        sort_order = helper.get_parameters('sort_order', 'asc')
        owned_filter = helper.get_parameters('owned')

        # Query all tiles
        query = Tiles.query

        # If user is authenticated, get the list of tile IDs they own
        owned_tile_ids = []
        if user_id:
            user_tiles = UserTiles.query.filter_by(user_id=user_id).all()
            owned_tile_ids = [user_tile.tile_id for user_tile in user_tiles]

        # Apply owned filter
        if owned_filter == 'true':
            query = query.filter(Tiles.id.in_(owned_tile_ids))
        elif owned_filter == 'false':
            query = query.filter(~Tiles.id.in_(owned_tile_ids))

        # Apply sorting
        if sort_order == 'desc':
            query = query.order_by(db.desc(getattr(Tiles, sort_by)))
        else:
            query = query.order_by(getattr(Tiles, sort_by))

        tiles = query.all()

        # Prepare the response data
        data = []
        for tile in tiles:
            tile_dict = tile.to_dict()
            tile_dict['owned'] = tile.id in owned_tile_ids
            data.append(tile_dict)

        response = make_response(jsonify({
            'success': True,
            'errorMessage': '',
            'data': data
        }))

        return response
    except ApiException as e:
        raise e

@bp.route('/user/list', methods=['GET'])
@jwt_required()
def get_user_tiles():
    try:
        helper = APIHelpers(request)
        user_id = helper.get_user_id()
        
        # Query UserTiles to get the list of tile IDs for the user
        user_tiles = UserTiles.query.filter_by(user_id=user_id).all()
        tile_ids = [user_tile.tile_id for user_tile in user_tiles]
        
        # Query Tiles to get the details of the tiles
        tiles = Tiles.query.filter(Tiles.id.in_(tile_ids)).all()
        
        response = make_response(jsonify({
            'success': True,
            'errorMessage': '',
            'data': [tile.to_dict() for tile in tiles]
        }))

        return response
    except ApiException as e:
        raise e


@bp.route('/add', methods=['POST'])
@jwt_required()
def create_tile():
    try:
        helper = APIHelpers(request)
        helper.validate_required_parameters(['title', 'tile_type'])
        
        tile = Tiles(
            tile_id=helper.get_parameters('tile_id'),
            title=helper.get_parameters('title'),
            description=helper.get_parameters('description'),
            tile_type=helper.get_parameters('tile_type'),
            config=helper.get_parameters('config'),
            state=helper.get_parameters('state'),
        )

        db.session.add(tile)
        db.session.commit()
        
        response = make_response(jsonify({
            'success': True,
            'errorMessage': '',
        }))

        return response
    except ApiException as e:
        raise e

@bp.route('/user/add', methods=['POST'])
@jwt_required()
def add_tile_to_user():
    try:
        helper = APIHelpers(request)
        user_id = helper.get_user_id()

        helper.validate_required_parameters(['tile_id'])

        tile_id = helper.get_parameters('tile_id')
        tile = Tiles.query.get_or_404(tile_id)

        user_tile = UserTiles(user_id=user_id, tile_id=tile.id)
        db.session.add(user_tile)
        db.session.commit()

        response = make_response(jsonify({
            'success': True,
            'errorMessage': '',
        }))

        return response
    except ApiException as e:
        raise e

@bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_tile(id):
    try:
        user_id = get_jwt_identity()
        user_tile = UserTiles.query.filter_by(user_id=user_id, tile_id=id).first_or_404()
        tile = Tiles.query.get_or_404(id)

        db.session.delete(user_tile)
        db.session.delete(tile)
        db.session.commit()
        response = make_response(jsonify({
            'success': True,
            'errorMessage': '',
        }))

        return response
    except ApiException as e:
        raise e