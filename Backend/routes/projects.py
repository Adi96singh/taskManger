"""Project management routes."""
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, g
from bson import ObjectId
from marshmallow import ValidationError
from models.project import create_project_document, project_response, CreateProjectSchema, AddMemberSchema
from models.user import user_response
from middleware.auth_middleware import token_required

projects_bp = Blueprint("projects", __name__, url_prefix="/api/projects")
create_schema = CreateProjectSchema()
add_member_schema = AddMemberSchema()


def _get_members_data(mongo, member_ids):
    members = []
    for mid in member_ids:
        user = mongo.db.users.find_one({"_id": mid}, {"password": 0})
        if user:
            members.append(user_response(user))
    return members


@projects_bp.route("", methods=["POST"])
@token_required
def create_project():
    from app import mongo
    try:
        data = create_schema.load(request.get_json())
    except ValidationError as err:
        return jsonify({"success": False, "message": "Validation failed", "errors": err.messages}), 400
    user_oid = ObjectId(g.user_id)
    project_doc = create_project_document(data["name"], data["description"], user_oid)
    result = mongo.db.projects.insert_one(project_doc)
    project_doc["_id"] = result.inserted_id
    members_data = _get_members_data(mongo, project_doc.get("members", []))
    return jsonify({"success": True, "message": "Project created", "project": project_response(project_doc, members_data)}), 201


@projects_bp.route("", methods=["GET"])
@token_required
def get_projects():
    from app import mongo
    user_oid = ObjectId(g.user_id)
    projects = mongo.db.projects.find({"members": user_oid})
    result = []
    for project in projects:
        pid = project["_id"]
        total = mongo.db.tasks.count_documents({"project_id": pid})
        done = mongo.db.tasks.count_documents({"project_id": pid, "status": "done"})
        members_data = _get_members_data(mongo, project.get("members", []))
        resp = project_response(project, members_data)
        resp["task_stats"] = {"total": total, "completed": done, "progress": round(done / total * 100) if total > 0 else 0}
        result.append(resp)
    return jsonify({"success": True, "projects": result}), 200


@projects_bp.route("/<project_id>", methods=["GET"])
@token_required
def get_project(project_id):
    from app import mongo
    try:
        project = mongo.db.projects.find_one({"_id": ObjectId(project_id)})
    except Exception:
        return jsonify({"success": False, "message": "Invalid project ID"}), 400
    if not project:
        return jsonify({"success": False, "message": "Project not found"}), 404
    user_oid = ObjectId(g.user_id)
    if user_oid not in project.get("members", []):
        return jsonify({"success": False, "message": "Access denied"}), 403
    members_data = _get_members_data(mongo, project.get("members", []))
    return jsonify({"success": True, "project": project_response(project, members_data)}), 200


@projects_bp.route("/<project_id>/members", methods=["POST"])
@token_required
def add_member(project_id):
    from app import mongo
    try:
        data = add_member_schema.load(request.get_json())
    except ValidationError as err:
        return jsonify({"success": False, "message": "Validation failed", "errors": err.messages}), 400
    try:
        project = mongo.db.projects.find_one({"_id": ObjectId(project_id)})
    except Exception:
        return jsonify({"success": False, "message": "Invalid project ID"}), 400
    if not project:
        return jsonify({"success": False, "message": "Project not found"}), 404
    if project["owner_id"] != ObjectId(g.user_id):
        return jsonify({"success": False, "message": "Only owner can add members"}), 403
    user = mongo.db.users.find_one({"email": data["email"].lower().strip()})
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404
    if user["_id"] in project.get("members", []):
        return jsonify({"success": False, "message": "Already a member"}), 409
    mongo.db.projects.update_one({"_id": ObjectId(project_id)}, {"$push": {"members": user["_id"]}, "$set": {"updated_at": datetime.now(timezone.utc)}})
    project = mongo.db.projects.find_one({"_id": ObjectId(project_id)})
    members_data = _get_members_data(mongo, project.get("members", []))
    return jsonify({"success": True, "message": f"{user['username']} added", "project": project_response(project, members_data)}), 200


@projects_bp.route("/<project_id>/members/<member_id>", methods=["DELETE"])
@token_required
def remove_member(project_id, member_id):
    from app import mongo
    try:
        project = mongo.db.projects.find_one({"_id": ObjectId(project_id)})
    except Exception:
        return jsonify({"success": False, "message": "Invalid project ID"}), 400
    if not project:
        return jsonify({"success": False, "message": "Project not found"}), 404
    if project["owner_id"] != ObjectId(g.user_id):
        return jsonify({"success": False, "message": "Only owner can remove members"}), 403
    member_oid = ObjectId(member_id)
    if member_oid == project["owner_id"]:
        return jsonify({"success": False, "message": "Cannot remove owner"}), 400
    mongo.db.projects.update_one({"_id": ObjectId(project_id)}, {"$pull": {"members": member_oid}, "$set": {"updated_at": datetime.now(timezone.utc)}})
    project = mongo.db.projects.find_one({"_id": ObjectId(project_id)})
    members_data = _get_members_data(mongo, project.get("members", []))
    return jsonify({"success": True, "message": "Member removed", "project": project_response(project, members_data)}), 200


@projects_bp.route("/<project_id>", methods=["DELETE"])
@token_required
def delete_project(project_id):
    from app import mongo
    try:
        project = mongo.db.projects.find_one({"_id": ObjectId(project_id)})
    except Exception:
        return jsonify({"success": False, "message": "Invalid project ID"}), 400
    if not project:
        return jsonify({"success": False, "message": "Project not found"}), 404
    if project["owner_id"] != ObjectId(g.user_id):
        return jsonify({"success": False, "message": "Only owner can delete"}), 403
    mongo.db.tasks.delete_many({"project_id": ObjectId(project_id)})
    mongo.db.projects.delete_one({"_id": ObjectId(project_id)})
    return jsonify({"success": True, "message": "Project deleted"}), 200
