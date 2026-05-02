"""Task management routes."""
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, g
from bson import ObjectId
from marshmallow import ValidationError
from models.task import create_task_document, task_response, CreateTaskSchema, UpdateTaskSchema
from models.user import user_response
from middleware.auth_middleware import token_required

tasks_bp = Blueprint("tasks", __name__, url_prefix="/api/tasks")
create_schema = CreateTaskSchema()
update_schema = UpdateTaskSchema()


def _get_assignee(mongo, user_id):
    if not user_id:
        return None
    user = mongo.db.users.find_one({"_id": ObjectId(user_id)}, {"password": 0})
    return user_response(user) if user else None


@tasks_bp.route("/project/<project_id>", methods=["POST"])
@token_required
def create_task(project_id):
    from app import mongo
    try:
        project = mongo.db.projects.find_one({"_id": ObjectId(project_id)})
    except Exception:
        return jsonify({"success": False, "message": "Invalid project ID"}), 400
    if not project:
        return jsonify({"success": False, "message": "Project not found"}), 404
    user_oid = ObjectId(g.user_id)
    if user_oid not in project.get("members", []):
        return jsonify({"success": False, "message": "Not a member"}), 403
    try:
        data = create_schema.load(request.get_json())
    except ValidationError as err:
        return jsonify({"success": False, "message": "Validation failed", "errors": err.messages}), 400
    # Verify assignee is project member
    try:
        assignee_oid = ObjectId(data["assigned_to"])
    except Exception:
        return jsonify({"success": False, "message": "Invalid assignee ID"}), 400
    if assignee_oid not in project.get("members", []):
        return jsonify({"success": False, "message": "Assignee must be a project member"}), 400
    task_doc = create_task_document(
        title=data["title"], description=data["description"],
        project_id=ObjectId(project_id), assigned_to=assignee_oid,
        created_by=user_oid, deadline=data.get("deadline"),
        priority=data.get("priority", "medium")
    )
    result = mongo.db.tasks.insert_one(task_doc)
    task_doc["_id"] = result.inserted_id
    assignee_data = _get_assignee(mongo, data["assigned_to"])
    return jsonify({"success": True, "message": "Task created", "task": task_response(task_doc, assignee_data)}), 201


@tasks_bp.route("/project/<project_id>", methods=["GET"])
@token_required
def get_project_tasks(project_id):
    from app import mongo
    try:
        project = mongo.db.projects.find_one({"_id": ObjectId(project_id)})
    except Exception:
        return jsonify({"success": False, "message": "Invalid project ID"}), 400
    if not project:
        return jsonify({"success": False, "message": "Project not found"}), 404
    user_oid = ObjectId(g.user_id)
    if user_oid not in project.get("members", []):
        return jsonify({"success": False, "message": "Not a member"}), 403
    # Build query with optional filters
    query = {"project_id": ObjectId(project_id)}
    status = request.args.get("status")
    if status:
        query["status"] = status
    priority = request.args.get("priority")
    if priority:
        query["priority"] = priority
    assigned_to = request.args.get("assigned_to")
    if assigned_to:
        try:
            query["assigned_to"] = ObjectId(assigned_to)
        except Exception:
            pass
    search = request.args.get("search")
    if search:
        query["title"] = {"$regex": search, "$options": "i"}
    tasks = mongo.db.tasks.find(query).sort("created_at", -1)
    result = []
    for t in tasks:
        assignee_data = _get_assignee(mongo, str(t["assigned_to"])) if t.get("assigned_to") else None
        result.append(task_response(t, assignee_data))
    return jsonify({"success": True, "tasks": result}), 200


@tasks_bp.route("/<task_id>", methods=["PUT"])
@token_required
def update_task(task_id):
    from app import mongo
    try:
        task = mongo.db.tasks.find_one({"_id": ObjectId(task_id)})
    except Exception:
        return jsonify({"success": False, "message": "Invalid task ID"}), 400
    if not task:
        return jsonify({"success": False, "message": "Task not found"}), 404
    project = mongo.db.projects.find_one({"_id": task["project_id"]})
    user_oid = ObjectId(g.user_id)
    if user_oid not in project.get("members", []):
        return jsonify({"success": False, "message": "Not a member"}), 403
    # Members can only update status; owner can update everything
    is_owner = project["owner_id"] == user_oid
    is_assignee = task.get("assigned_to") == user_oid
    try:
        data = update_schema.load(request.get_json())
    except ValidationError as err:
        return jsonify({"success": False, "message": "Validation failed", "errors": err.messages}), 400
    if not is_owner and not is_assignee:
        return jsonify({"success": False, "message": "Only owner or assignee can update"}), 403
    if not is_owner:
        # Non-owners can only update status
        allowed = {"status"}
        if set(data.keys()) - allowed:
            return jsonify({"success": False, "message": "Members can only update task status"}), 403
    update_fields = {}
    for key, val in data.items():
        if key == "assigned_to":
            try:
                update_fields["assigned_to"] = ObjectId(val)
            except Exception:
                return jsonify({"success": False, "message": "Invalid assignee"}), 400
        else:
            update_fields[key] = val
    update_fields["updated_at"] = datetime.now(timezone.utc)
    mongo.db.tasks.update_one({"_id": ObjectId(task_id)}, {"$set": update_fields})
    updated = mongo.db.tasks.find_one({"_id": ObjectId(task_id)})
    assignee_data = _get_assignee(mongo, str(updated["assigned_to"])) if updated.get("assigned_to") else None
    return jsonify({"success": True, "message": "Task updated", "task": task_response(updated, assignee_data)}), 200


@tasks_bp.route("/<task_id>", methods=["DELETE"])
@token_required
def delete_task(task_id):
    from app import mongo
    try:
        task = mongo.db.tasks.find_one({"_id": ObjectId(task_id)})
    except Exception:
        return jsonify({"success": False, "message": "Invalid task ID"}), 400
    if not task:
        return jsonify({"success": False, "message": "Task not found"}), 404
    project = mongo.db.projects.find_one({"_id": task["project_id"]})
    if project["owner_id"] != ObjectId(g.user_id):
        return jsonify({"success": False, "message": "Only project owner can delete tasks"}), 403
    mongo.db.tasks.delete_one({"_id": ObjectId(task_id)})
    return jsonify({"success": True, "message": "Task deleted"}), 200


@tasks_bp.route("/my", methods=["GET"])
@token_required
def get_my_tasks():
    """Get all tasks assigned to the current user across all projects."""
    from app import mongo
    user_oid = ObjectId(g.user_id)
    query = {"assigned_to": user_oid}
    status = request.args.get("status")
    if status:
        query["status"] = status
    tasks = mongo.db.tasks.find(query).sort("created_at", -1)
    result = []
    for t in tasks:
        assignee_data = _get_assignee(mongo, str(t["assigned_to"]))
        resp = task_response(t, assignee_data)
        project = mongo.db.projects.find_one({"_id": t["project_id"]})
        resp["project_name"] = project["name"] if project else "Unknown"
        result.append(resp)
    return jsonify({"success": True, "tasks": result}), 200


@tasks_bp.route("/dashboard", methods=["GET"])
@token_required
def get_dashboard():
    """Dashboard stats for the current user."""
    from app import mongo
    user_oid = ObjectId(g.user_id)
    # Get all projects user is member of
    projects = list(mongo.db.projects.find({"members": user_oid}))
    project_ids = [p["_id"] for p in projects]
    all_tasks = list(mongo.db.tasks.find({"project_id": {"$in": project_ids}}))
    my_tasks = [t for t in all_tasks if t.get("assigned_to") == user_oid]
    now = datetime.now(timezone.utc)
    total = len(all_tasks)
    completed = sum(1 for t in all_tasks if t["status"] == "done")
    in_progress = sum(1 for t in all_tasks if t["status"] == "in_progress")
    todo = sum(1 for t in all_tasks if t["status"] == "todo")
    overdue = sum(1 for t in all_tasks if t.get("deadline") and t["deadline"] < now and t["status"] != "done")
    my_total = len(my_tasks)
    my_completed = sum(1 for t in my_tasks if t["status"] == "done")
    my_overdue = sum(1 for t in my_tasks if t.get("deadline") and t["deadline"] < now and t["status"] != "done")
    # Recent tasks
    recent = sorted(all_tasks, key=lambda x: x.get("updated_at", x["created_at"]), reverse=True)[:5]
    recent_data = []
    for t in recent:
        assignee_data = _get_assignee(mongo, str(t["assigned_to"])) if t.get("assigned_to") else None
        resp = task_response(t, assignee_data)
        project = mongo.db.projects.find_one({"_id": t["project_id"]})
        resp["project_name"] = project["name"] if project else "Unknown"
        recent_data.append(resp)
    return jsonify({
        "success": True,
        "dashboard": {
            "total_projects": len(projects),
            "total_tasks": total, "completed": completed,
            "in_progress": in_progress, "todo": todo, "overdue": overdue,
            "my_tasks": my_total, "my_completed": my_completed, "my_overdue": my_overdue,
            "completion_rate": round(completed / total * 100) if total > 0 else 0,
            "recent_tasks": recent_data
        }
    }), 200
