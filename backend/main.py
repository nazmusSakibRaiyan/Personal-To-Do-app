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
    allow_origins=["http://localhost:3000"],
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
