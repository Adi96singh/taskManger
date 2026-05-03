"""PulseBoard - Team Task Manager API"""
import os
from flask import Flask, jsonify, render_template, send_from_directory
from flask_pymongo import PyMongo
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from config import Config

# Initialize extensions
mongo = PyMongo()
bcrypt = Bcrypt()


def create_app():
    app = Flask(
        __name__,
        static_folder='static',
        template_folder='templates'
    )
    app.config["MONGO_URI"] = Config.MONGO_URI

    # Initialize extensions
    mongo.init_app(app)
    bcrypt.init_app(app)
    # Enable CORS for all routes and origins
    CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

    # Create indexes
    with app.app_context():
        try:
            mongo.db.users.create_index("email", unique=True)
            mongo.db.users.create_index("username", unique=True)
            mongo.db.tasks.create_index("project_id")
            mongo.db.tasks.create_index("assigned_to")
            mongo.db.projects.create_index("members")
        except Exception:
            pass  # Indexes may already exist

    # Register blueprints
    from routes.auth import auth_bp
    from routes.projects import projects_bp
    from routes.tasks import tasks_bp
    app.register_blueprint(auth_bp)
    app.register_blueprint(projects_bp)
    app.register_blueprint(tasks_bp)

    # Health check
    @app.route("/api/health")
    def health():
        return jsonify({"status": "ok", "app": "PulseBoard API"}), 200

    # Serve React frontend
    @app.route('/')
    def home():
        return render_template('index.html')

    @app.route('/<path:path>')
    def catch_all(path):
        # Serve static files if they exist
        static_file = os.path.join(app.static_folder, path)
        if os.path.isfile(static_file):
            return send_from_directory(app.static_folder, path)
        # Otherwise serve index.html for React client-side routing
        return render_template('index.html')

    # Global error handlers
    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"success": False, "message": "Internal server error"}), 500

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=Config.PORT, debug=Config.DEBUG)
