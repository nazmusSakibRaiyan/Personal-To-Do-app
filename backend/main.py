from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import re
from dateutil import parser

app = FastAPI(title="Smart To-Do API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class Task(BaseModel):
    id: Optional[str] = None
    title: str
    description: Optional[str] = None
    status: str = "pending"
    priority: str = "medium"
    dueDate: Optional[str] = None
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None
    completedAt: Optional[str] = None
    tags: List[str] = []
    category: Optional[str] = None
    subtasks: List[dict] = []
    recurring: Optional[dict] = None
    estimatedTime: Optional[int] = None
    actualTime: Optional[int] = None
    reminderTime: Optional[str] = None
    color: Optional[str] = None
    aiSuggested: bool = False
    dependencies: List[str] = []


class NaturalLanguageInput(BaseModel):
    input: str


class AIInsight(BaseModel):
    type: str
    message: str
    relatedTaskId: Optional[str] = None


# Simple AI-powered natural language parser
def parse_natural_language(text: str) -> dict:
    """
    Parse natural language input to extract task details.
    This is a simplified version - in production, you'd use a more sophisticated NLP model.
    """
    lower_text = text.lower()
    
    # Detect priority
    priority = "medium"
    if any(word in lower_text for word in ["urgent", "asap", "critical"]):
        priority = "urgent"
    elif any(word in lower_text for word in ["high priority", "important"]):
        priority = "high"
    elif any(word in lower_text for word in ["low priority", "minor"]):
        priority = "low"
    
    # Detect tags
    tags = []
    if any(word in lower_text for word in ["study", "exam", "homework", "assignment"]):
        tags.append("study")
    if any(word in lower_text for word in ["work", "meeting", "project", "presentation"]):
        tags.append("work")
    if any(word in lower_text for word in ["personal", "home", "family"]):
        tags.append("personal")
    if any(word in lower_text for word in ["health", "exercise", "gym", "workout"]):
        tags.append("health")
    
    # Detect due date
    due_date = None
    today = datetime.now()
    
    if "today" in lower_text:
        due_date = today.isoformat()
    elif "tomorrow" in lower_text:
        due_date = (today + timedelta(days=1)).isoformat()
    elif "next week" in lower_text:
        due_date = (today + timedelta(days=7)).isoformat()
    elif "next month" in lower_text:
        due_date = (today + timedelta(days=30)).isoformat()
    else:
        # Try to extract date patterns
        date_patterns = [
            r'\d{1,2}/\d{1,2}/\d{2,4}',  # MM/DD/YYYY
            r'\d{4}-\d{2}-\d{2}',         # YYYY-MM-DD
            r'(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* \d{1,2}',  # Month DD
        ]
        for pattern in date_patterns:
            match = re.search(pattern, lower_text, re.IGNORECASE)
            if match:
                try:
                    due_date = parser.parse(match.group()).isoformat()
                    break
                except:
                    pass
    
    # Detect estimated time
    estimated_time = None
    time_match = re.search(r'(\d+)\s*(hour|hr|minute|min)s?', lower_text)
    if time_match:
        value = int(time_match.group(1))
        unit = time_match.group(2)
        if unit in ['hour', 'hr']:
            estimated_time = value * 60
        else:
            estimated_time = value
    
    # Clean up title (remove detected keywords)
    title = text
    remove_words = ['urgent', 'asap', 'high priority', 'low priority', 'today', 'tomorrow', 
                   'next week', 'next month', 'important', 'critical']
    for word in remove_words:
        title = re.sub(r'\b' + word + r'\b', '', title, flags=re.IGNORECASE)
    title = ' '.join(title.split()).strip()
    
    return {
        "title": title or text,
        "priority": priority,
        "tags": tags,
        "dueDate": due_date,
        "estimatedTime": estimated_time,
        "status": "pending",
        "aiSuggested": True
    }


# AI-powered scheduling suggestions
def get_schedule_suggestions(task: Task) -> List[dict]:
    """
    Generate smart scheduling suggestions based on task properties.
    In production, this would use ML models trained on user behavior.
    """
    suggestions = []
    now = datetime.now()
    
    # Suggest time based on priority
    if task.priority == "urgent":
        suggestions.append({
            "time": now.isoformat(),
            "reason": "High priority task - schedule immediately",
            "score": 100
        })
    elif task.priority == "high":
        suggestions.append({
            "time": (now + timedelta(hours=2)).isoformat(),
            "reason": "High priority - schedule within 2 hours",
            "score": 90
        })
    else:
        suggestions.append({
            "time": (now + timedelta(days=1)).isoformat(),
            "reason": "Normal priority - schedule for tomorrow",
            "score": 70
        })
    
    # Suggest based on task tags
    if "study" in task.tags:
        # Suggest morning time for study tasks
        morning = now.replace(hour=9, minute=0, second=0, microsecond=0)
        if morning < now:
            morning += timedelta(days=1)
        suggestions.append({
            "time": morning.isoformat(),
            "reason": "Study tasks are best done in the morning when mind is fresh",
            "score": 85
        })
    
    if "work" in task.tags:
        # Suggest working hours
        work_time = now.replace(hour=10, minute=0, second=0, microsecond=0)
        if work_time < now:
            work_time += timedelta(days=1)
        suggestions.append({
            "time": work_time.isoformat(),
            "reason": "Work tasks fit best during standard working hours",
            "score": 80
        })
    
    # Sort by score
    suggestions.sort(key=lambda x: x["score"], reverse=True)
    return suggestions[:3]


# Generate AI insights
def generate_insights(tasks: List[Task]) -> List[AIInsight]:
    """
    Generate productivity insights based on task data.
    In production, this would use more sophisticated analytics.
    """
    insights = []
    
    # Check for overdue tasks
    overdue = [t for t in tasks if t.dueDate and datetime.fromisoformat(t.dueDate) < datetime.now() and t.status != "completed"]
    if overdue:
        insights.append(AIInsight(
            type="warning",
            message=f"You have {len(overdue)} overdue task(s). Consider rescheduling or prioritizing them."
        ))
    
    # Check for tasks without due dates
    no_dates = [t for t in tasks if not t.dueDate and t.status != "completed"]
    if len(no_dates) > 5:
        insights.append(AIInsight(
            type="suggestion",
            message=f"{len(no_dates)} tasks don't have due dates. Adding deadlines can improve completion rates."
        ))
    
    # Check for task completion rate
    completed = len([t for t in tasks if t.status == "completed"])
    if tasks and completed / len(tasks) > 0.8:
        insights.append(AIInsight(
            type="tip",
            message=f"Great job! You've completed {int(completed / len(tasks) * 100)}% of your tasks. Keep up the momentum!"
        ))
    
    return insights


# API Endpoints
@app.get("/")
def read_root():
    return {"message": "Smart To-Do API is running"}


@app.post("/api/tasks/parse")
def parse_task(input_data: NaturalLanguageInput):
    """Parse natural language input and return structured task data"""
    try:
        parsed = parse_natural_language(input_data.input)
        return parsed
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/tasks/{task_id}/schedule-suggestions")
def get_task_schedule_suggestions(task_id: str):
    """Get AI-powered scheduling suggestions for a task"""
    # In production, fetch the task from database
    # For now, return generic suggestions
    sample_task = Task(
        id=task_id,
        title="Sample Task",
        priority="high",
        tags=["work"]
    )
    suggestions = get_schedule_suggestions(sample_task)
    return {"suggestions": suggestions}


@app.get("/api/insights")
def get_insights():
    """Get AI-generated productivity insights"""
    # In production, fetch tasks from database
    sample_tasks = []
    insights = generate_insights(sample_tasks)
    return [insight.dict() for insight in insights]


@app.get("/api/tasks/stats")
def get_task_stats():
    """Get task statistics"""
    # In production, calculate from database
    return {
        "total": 0,
        "completed": 0,
        "pending": 0,
        "inProgress": 0,
        "overdue": 0,
        "completionRate": 0,
        "averageCompletionTime": 0,
        "productivityScore": 0
    }


@app.get("/api/tasks")
def get_tasks():
    """Get all tasks"""
    # In production, fetch from database
    return []


@app.post("/api/tasks")
def create_task(task: Task):
    """Create a new task"""
    # In production, save to database
    task.id = "task_" + datetime.now().strftime("%Y%m%d%H%M%S")
    task.createdAt = datetime.now().isoformat()
    task.updatedAt = datetime.now().isoformat()
    return task


@app.put("/api/tasks/{task_id}")
def update_task(task_id: str, task: Task):
    """Update an existing task"""
    # In production, update in database
    task.updatedAt = datetime.now().isoformat()
    return task


@app.delete("/api/tasks/{task_id}")
def delete_task(task_id: str):
    """Delete a task"""
    # In production, delete from database
    return {"message": "Task deleted successfully"}


@app.post("/api/tasks/breakdown")
def get_task_breakdown(data: dict):
    """AI-powered task breakdown into subtasks"""
    title = data.get("title", "")
    description = data.get("description", "")
    
    # AI logic to break down complex tasks into subtasks
    subtasks = []
    
    # Simple keyword-based breakdown (in production, use more sophisticated AI)
    keywords_map = {
        "project": ["Research and planning", "Design phase", "Implementation", "Testing", "Documentation"],
        "study": ["Read materials", "Take notes", "Create summary", "Practice problems", "Review"],
        "presentation": ["Research topic", "Create outline", "Design slides", "Practice delivery", "Prepare Q&A"],
        "report": ["Gather data", "Outline structure", "Write draft", "Review and edit", "Final formatting"],
        "exam": ["Review syllabus", "Study notes", "Practice questions", "Create cheat sheet", "Mock test"],
    }
    
    lower_title = title.lower()
    lower_desc = (description or "").lower()
    combined = f"{lower_title} {lower_desc}"
    
    for keyword, tasks in keywords_map.items():
        if keyword in combined:
            subtasks = [{"title": task, "completed": False} for task in tasks]
            break
    
    if not subtasks:
        # Default breakdown for any task
        if "write" in combined or "create" in combined:
            subtasks = [
                {"title": "Research and gather information", "completed": False},
                {"title": "Create outline or plan", "completed": False},
                {"title": "Complete first draft", "completed": False},
                {"title": "Review and revise", "completed": False},
            ]
        else:
            subtasks = [
                {"title": "Plan the approach", "completed": False},
                {"title": "Execute main tasks", "completed": False},
                {"title": "Review and finalize", "completed": False},
            ]
    
    return {
        "subtasks": subtasks,
        "estimatedTime": len(subtasks) * 30,  # 30 mins per subtask
        "suggestion": f"This task can be broken down into {len(subtasks)} manageable steps."
    }


@app.post("/api/tasks/deadline-suggestions")
def get_deadline_suggestions(task_data: dict):
    """Get smart deadline recommendations based on task complexity"""
    title = task_data.get("title", "")
    priority = task_data.get("priority", "medium")
    estimated_time = task_data.get("estimatedTime", 60)
    tags = task_data.get("tags", [])
    
    now = datetime.now()
    suggestions = []
    
    # Calculate based on priority
    if priority == "urgent":
        suggestions.append({
            "date": now.isoformat(),
            "label": "Today",
            "reason": "Urgent priority - immediate attention required",
            "confidence": 95
        })
        suggestions.append({
            "date": (now + timedelta(hours=4)).isoformat(),
            "label": "In 4 hours",
            "reason": "Quick turnaround for urgent tasks",
            "confidence": 90
        })
    elif priority == "high":
        suggestions.append({
            "date": (now + timedelta(days=1)).isoformat(),
            "label": "Tomorrow",
            "reason": "High priority - schedule within 24 hours",
            "confidence": 90
        })
        suggestions.append({
            "date": (now + timedelta(days=2)).isoformat(),
            "label": "In 2 days",
            "reason": "Allows time for preparation",
            "confidence": 85
        })
    elif priority == "medium":
        suggestions.append({
            "date": (now + timedelta(days=3)).isoformat(),
            "label": "In 3 days",
            "reason": "Balanced timeframe for medium priority",
            "confidence": 85
        })
        suggestions.append({
            "date": (now + timedelta(days=7)).isoformat(),
            "label": "Next week",
            "reason": "Comfortable timeline for planning",
            "confidence": 80
        })
    else:  # low
        suggestions.append({
            "date": (now + timedelta(days=7)).isoformat(),
            "label": "Next week",
            "reason": "Low priority - can be scheduled flexibly",
            "confidence": 75
        })
        suggestions.append({
            "date": (now + timedelta(days=14)).isoformat(),
            "label": "In 2 weeks",
            "reason": "Extended timeline for low priority tasks",
            "confidence": 70
        })
    
    # Adjust based on estimated time
    if estimated_time > 240:  # More than 4 hours
        for suggestion in suggestions:
            suggestion["reason"] += " (Complex task requires extra time)"
            # Push deadlines further
            original_date = datetime.fromisoformat(suggestion["date"])
            suggestion["date"] = (original_date + timedelta(days=2)).isoformat()
    
    return {"suggestions": suggestions}


@app.get("/api/analytics/workload")
def get_workload_analysis():
    """Analyze workload distribution and provide balancing suggestions"""
    # In production, fetch from database
    now = datetime.now()
    
    # Simulated workload data
    workload = {
        "current_week": {
            "total_tasks": 12,
            "total_hours": 28,
            "distribution": [
                {"day": "Monday", "tasks": 3, "hours": 6, "load": "high"},
                {"day": "Tuesday", "tasks": 2, "hours": 4, "load": "medium"},
                {"day": "Wednesday", "tasks": 4, "hours": 8, "load": "high"},
                {"day": "Thursday", "tasks": 1, "hours": 3, "load": "low"},
                {"day": "Friday", "tasks": 2, "hours": 7, "load": "medium"},
            ]
        },
        "suggestions": [
            {
                "type": "rebalance",
                "message": "Monday and Wednesday are overloaded. Consider moving 1-2 tasks to Thursday.",
                "action": "redistribute",
                "priority": "high"
            },
            {
                "type": "break",
                "message": "You have 6+ hours of work on Monday. Schedule breaks every 90 minutes.",
                "action": "schedule_breaks",
                "priority": "medium"
            },
            {
                "type": "focus",
                "message": "Group similar tasks together on Tuesday to improve focus and efficiency.",
                "action": "batch_tasks",
                "priority": "low"
            }
        ],
        "peak_productivity_hours": {
            "morning": {"start": "09:00", "end": "11:00", "score": 92},
            "afternoon": {"start": "14:00", "end": "16:00", "score": 85}
        }
    }
    
    return workload


@app.get("/api/analytics/patterns")
def get_productivity_patterns():
    """Analyze productivity patterns and provide insights"""
    # In production, analyze historical data from database
    
    patterns = {
        "completion_trends": {
            "last_week": 78,
            "this_week": 85,
            "trend": "improving",
            "change_percent": 9
        },
        "best_days": [
            {"day": "Tuesday", "completion_rate": 92, "tasks_completed": 8},
            {"day": "Thursday", "completion_rate": 88, "tasks_completed": 7},
            {"day": "Monday", "completion_rate": 75, "tasks_completed": 6}
        ],
        "worst_days": [
            {"day": "Friday", "completion_rate": 62, "tasks_completed": 5},
            {"day": "Wednesday", "completion_rate": 65, "tasks_completed": 4}
        ],
        "category_performance": [
            {"category": "Work", "completion_rate": 88, "avg_time": 45},
            {"category": "Study", "completion_rate": 82, "avg_time": 60},
            {"category": "Personal", "completion_rate": 75, "avg_time": 30}
        ],
        "insights": [
            {
                "type": "success",
                "icon": "📈",
                "message": "Your productivity has improved by 9% this week! Keep it up!",
                "actionable": False
            },
            {
                "type": "tip",
                "icon": "💡",
                "message": "You're most productive on Tuesdays. Schedule important tasks on this day.",
                "actionable": True,
                "action": "Reschedule high-priority tasks to Tuesday"
            },
            {
                "type": "warning",
                "icon": "⚠️",
                "message": "Friday completion rates are low. Consider lighter schedules for Fridays.",
                "actionable": True,
                "action": "Move complex tasks away from Friday"
            },
            {
                "type": "habit",
                "icon": "🎯",
                "message": "You complete 88% of work tasks on time. Study tasks need more attention.",
                "actionable": True,
                "action": "Allocate more time for study tasks"
            }
        ],
        "time_patterns": {
            "average_task_duration": 42,
            "most_productive_hour": "10:00 AM",
            "least_productive_hour": "3:00 PM",
            "recommended_break_time": "15 minutes every 90 minutes"
        }
    }
    
    return patterns


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
