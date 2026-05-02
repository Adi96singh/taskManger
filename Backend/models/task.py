"""Task model and schema definitions."""
from datetime import datetime, timezone
from marshmallow import Schema, fields, validate


VALID_STATUSES = ["todo", "in_progress", "done"]
VALID_PRIORITIES = ["low", "medium", "high"]


def create_task_document(title, description, project_id, assigned_to,
                         created_by, deadline=None, priority="medium"):
    """Create a new task document for MongoDB insertion."""
    return {
        "title": title,
        "description": description,
        "project_id": project_id,
        "assigned_to": assigned_to,
        "created_by": created_by,
        "status": "todo",
        "priority": priority,
        "deadline": deadline,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }


def task_response(task, assignee_data=None):
    """Serialize task document for API response."""
    deadline = task.get("deadline")
    if deadline and isinstance(deadline, datetime):
        deadline_str = deadline.isoformat()
        is_overdue = (
            deadline < datetime.now(timezone.utc) and
            task.get("status") != "done"
        )
    else:
        deadline_str = None
        is_overdue = False

    return {
        "id": str(task["_id"]),
        "title": task["title"],
        "description": task.get("description", ""),
        "project_id": str(task["project_id"]),
        "assigned_to": str(task["assigned_to"]) if task.get("assigned_to") else None,
        "assignee": assignee_data,
        "created_by": str(task["created_by"]),
        "status": task.get("status", "todo"),
        "priority": task.get("priority", "medium"),
        "deadline": deadline_str,
        "is_overdue": is_overdue,
        "created_at": task["created_at"].isoformat() if task.get("created_at") else None,
        "updated_at": task["updated_at"].isoformat() if task.get("updated_at") else None,
    }


class CreateTaskSchema(Schema):
    title = fields.Str(
        required=True,
        validate=validate.Length(min=1, max=200)
    )
    description = fields.Str(
        validate=validate.Length(max=1000),
        load_default=""
    )
    assigned_to = fields.Str(required=True)
    deadline = fields.DateTime(load_default=None)
    priority = fields.Str(
        validate=validate.OneOf(VALID_PRIORITIES),
        load_default="medium"
    )


class UpdateTaskSchema(Schema):
    title = fields.Str(validate=validate.Length(min=1, max=200))
    description = fields.Str(validate=validate.Length(max=1000))
    assigned_to = fields.Str()
    status = fields.Str(validate=validate.OneOf(VALID_STATUSES))
    deadline = fields.DateTime()
    priority = fields.Str(validate=validate.OneOf(VALID_PRIORITIES))
