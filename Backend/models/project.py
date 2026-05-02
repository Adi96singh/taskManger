"""Project model and schema definitions."""
from datetime import datetime, timezone
from marshmallow import Schema, fields, validate


def create_project_document(name, description, owner_id):
    """Create a new project document for MongoDB insertion."""
    return {
        "name": name,
        "description": description,
        "owner_id": owner_id,
        "members": [owner_id],  # owner is auto-added as member
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }


def project_response(project, members_data=None):
    """Serialize project document for API response."""
    return {
        "id": str(project["_id"]),
        "name": project["name"],
        "description": project.get("description", ""),
        "owner_id": str(project["owner_id"]),
        "members": [str(m) for m in project.get("members", [])],
        "members_data": members_data or [],
        "created_at": project["created_at"].isoformat() if project.get("created_at") else None,
        "updated_at": project["updated_at"].isoformat() if project.get("updated_at") else None,
    }


class CreateProjectSchema(Schema):
    name = fields.Str(
        required=True,
        validate=validate.Length(min=1, max=100)
    )
    description = fields.Str(
        validate=validate.Length(max=500),
        load_default=""
    )


class AddMemberSchema(Schema):
    email = fields.Email(required=True)
