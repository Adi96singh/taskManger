"""Authentication routes: signup, login, profile."""
from datetime import datetime, timezone, timedelta
from flask import Blueprint, request, jsonify, g
import jwt
from marshmallow import ValidationError

from config import Config
from models.user import (
    create_user_document, user_response,
    SignupSchema, LoginSchema
)
from middleware.auth_middleware import token_required

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

signup_schema = SignupSchema()
login_schema = LoginSchema()


@auth_bp.route("/signup", methods=["POST"])
def signup():
    """Register a new user."""
    from app import mongo, bcrypt

    # Validate input
    try:
        data = signup_schema.load(request.get_json())
    except ValidationError as err:
        return jsonify({
            "success": False,
            "message": "Validation failed",
            "errors": err.messages
        }), 400

    # Check if email already exists
    if mongo.db.users.find_one({"email": data["email"].lower().strip()}):
        return jsonify({
            "success": False,
            "message": "Email already registered"
        }), 409

    # Check if username already exists
    if mongo.db.users.find_one({"username": data["username"]}):
        return jsonify({
            "success": False,
            "message": "Username already taken"
        }), 409

    # Hash password and create user
    hashed_pw = bcrypt.generate_password_hash(data["password"]).decode("utf-8")
    user_doc = create_user_document(data["username"], data["email"], hashed_pw)

    # First user becomes admin
    if mongo.db.users.count_documents({}) == 0:
        user_doc["role"] = "admin"

    result = mongo.db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id

    # Generate JWT
    token = _generate_token(str(result.inserted_id))

    return jsonify({
        "success": True,
        "message": "Account created successfully",
        "token": token,
        "user": user_response(user_doc)
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    """Authenticate user and return JWT."""
    from app import mongo, bcrypt

    try:
        data = login_schema.load(request.get_json())
    except ValidationError as err:
        return jsonify({
            "success": False,
            "message": "Validation failed",
            "errors": err.messages
        }), 400

    user = mongo.db.users.find_one({"email": data["email"].lower().strip()})
    if not user or not bcrypt.check_password_hash(user["password"], data["password"]):
        return jsonify({
            "success": False,
            "message": "Invalid email or password"
        }), 401

    token = _generate_token(str(user["_id"]))

    return jsonify({
        "success": True,
        "message": "Login successful",
        "token": token,
        "user": user_response(user)
    }), 200


@auth_bp.route("/me", methods=["GET"])
@token_required
def get_profile():
    """Get current user profile."""
    return jsonify({
        "success": True,
        "user": user_response(g.current_user)
    }), 200


@auth_bp.route("/users", methods=["GET"])
@token_required
def get_all_users():
    """Get all users (for adding members to projects)."""
    from app import mongo
    users = mongo.db.users.find({}, {"password": 0})
    return jsonify({
        "success": True,
        "users": [user_response(u) for u in users]
    }), 200


def _generate_token(user_id):
    """Generate a JWT token for the given user ID."""
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=Config.JWT_EXPIRATION_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, Config.JWT_SECRET_KEY, algorithm="HS256")
