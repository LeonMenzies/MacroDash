from .auth_controller import bp as auth_bp
from .helper_controller import bp as helper_bp
from .tiles_controller import bp as tiles_bp
from .dashboard_controller import bp as dashboard_bp
from .fred_release_calendar_controller import bp as fred_release_calendar_bp
from .chat_controller import bp as chat_controller_bp

def register_controllers(app):
    app.register_blueprint(auth_bp)
    app.register_blueprint(helper_bp)
    app.register_blueprint(tiles_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(fred_release_calendar_bp)
    app.register_blueprint(chat_controller_bp)