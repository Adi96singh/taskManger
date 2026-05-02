"""User model and schema definitions."""
from datetime import datetime, timezone
from marshmallow import Schema, fields, validate


def create_user_document(username, email, hashed_password):
    """Create a new user document for MongoDB insertion."""
    return {
        "username": username,
        "email": email.lower().strip(),
        "password": hashed_password,
        "role": "member",  # default role
        "avatar_color": _generate_avatar_color(username),
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }


def _generate_avatar_color(username):
    """Generate a consistent HSL color from username."""
    hue = sum(ord(c) for c in username) % 360
    return f"hsl({hue}, 70%, 60%)"


def user_response(user):
    """Serialize user document for API response (exclude password)."""
    return {
        "id": str(user["_id"]),
        "username": user["username"],
        "email": user["email"],
        "role": user.get("role", "member"),
        "avatar_color": user.get("avatar_color", "hsl(200, 70%, 60%)"),
        "created_at": user["created_at"].isoformat() if user.get("created_at") else None,
    }


class SignupSchema(Schema):
    username = fields.Str(
        required=True,
        validate=validate.Length(min=3, max=30)
    )
    email = fields.Email(required=True)
    password = fields.Str(
        required=True,
        validate=validate.Length(min=6, max=128)
    )


class LoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True)
