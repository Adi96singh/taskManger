"""JWT authentication middleware."""
from functools import wraps
from flask import request, jsonify, g
import jwt
from bson import ObjectId
from config import Config


def token_required(f):
    """Decorator to protect routes with JWT authentication."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

        # Extract token from Authorization header
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]

        if not token:
            return jsonify({
                "success": False,
                "message": "Authentication token is missing"
            }), 401

        try:
            payload = jwt.decode(
                token,
                Config.JWT_SECRET_KEY,
                algorithms=["HS256"]
            )
            # Import here to avoid circular imports
            from app import mongo
            user = mongo.db.users.find_one({"_id": ObjectId(payload["user_id"])})
            if not user:
                return jsonify({
                    "success": False,
                    "message": "User not found"
                }), 401

            # Attach user to request context
            g.current_user = user
            g.user_id = str(user["_id"])

        except jwt.ExpiredSignatureError:
            return jsonify({
                "success": False,
                "message": "Token has expired"
            }), 401
        except jwt.InvalidTokenError:
            return jsonify({
                "success": False,
                "message": "Invalid token"
            }), 401
        except Exception:
            return jsonify({
                "success": False,
                "message": "Authentication failed"
            }), 401

        return f(*args, **kwargs)
    return decorated


def admin_required(f):
    """Decorator to restrict routes to admin users only."""
    @wraps(f)
    @token_required
    def decorated(*args, **kwargs):
        if g.current_user.get("role") != "admin":
            return jsonify({
                "success": False,
                "message": "Admin access required"
            }), 403
        return f(*args, **kwargs)
    return decorated


def project_member_required(f):
    """Decorator to ensure user is a member of the requested project."""
    @wraps(f)
    @token_required
    def decorated(*args, **kwargs):
        project_id = kwargs.get("project_id") or request.json.get("project_id")
        if not project_id:
            return jsonify({
                "success": False,
                "message": "Project ID is required"
            }), 400

        from app import mongo
        try:
            project = mongo.db.projects.find_one({"_id": ObjectId(project_id)})
        except Exception:
            return jsonify({
                "success": False,
                "message": "Invalid project ID"
            }), 400

        if not project:
            return jsonify({
                "success": False,
                "message": "Project not found"
            }), 404

        user_oid = ObjectId(g.user_id)
        if user_oid not in project.get("members", []):
            return jsonify({
                "success": False,
                "message": "You are not a member of this project"
            }), 403

        g.current_project = project
        return f(*args, **kwargs)
    return decorated
