from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime, timedelta
import re
from dateutil import parser
from dotenv import load_dotenv
import os
from email_service import EmailConfig, initialize_email_service, get_email_service

# Load environment variables
load_dotenv()

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


# Calendar and Export Endpoints
@app.post("/api/calendar/export")
def export_calendar(format: str = "ical"):
    """Export tasks as iCalendar format"""
    from icalendar import Calendar, Event
    from datetime import datetime as dt
    
    # Create calendar
    cal = Calendar()
    cal.add('prodid', '-//Smart To-Do App//EN')
    cal.add('version', '2.0')
    cal.add('calscale', 'GREGORIAN')
    cal.add('x-wr-calname', 'Tasks')
    cal.add('x-wr-caldesc', 'Tasks exported from Smart To-Do App')
    cal.add('x-wr-timezone', 'UTC')
    
    # In production, fetch tasks from database
    sample_tasks = [
        {
            "title": "Complete project proposal",
            "description": "Finish the Q1 project proposal",
            "dueDate": (dt.now() + timedelta(days=3)).isoformat(),
            "priority": "high",
            "status": "pending"
        },
        {
            "title": "Study for exam",
            "description": "Prepare for mathematics exam",
            "dueDate": (dt.now() + timedelta(days=7)).isoformat(),
            "priority": "urgent",
            "status": "pending"
        }
    ]
    
    for task in sample_tasks:
        if task["dueDate"]:
            event = Event()
            event.add('summary', task["title"])
            event.add('description', task.get("description", ""))
            event.add('dtstart', dt.fromisoformat(task["dueDate"]))
            event.add('dtend', dt.fromisoformat(task["dueDate"]) + timedelta(hours=1))
            event.add('priority', {'urgent': 1, 'high': 3, 'medium': 5, 'low': 9}.get(task.get("priority", "medium"), 5))
            event.add('categories', [task.get("priority", "medium")])
            
            cal.add_component(event)
    
    return cal.to_ical().decode('utf-8')


@app.get("/api/calendar/month")
def get_month_view(year: int, month: int):
    """Get tasks for a specific month"""
    from calendar import monthcalendar
    from datetime import datetime as dt
    
    # In production, fetch from database
    month_cal = monthcalendar(year, month)
    
    return {
        "year": year,
        "month": month,
        "weeks": month_cal,
        "tasks_by_day": {}  # Would be populated from database
    }


@app.get("/api/calendar/week")
def get_week_view(start_date: str):
    """Get tasks for a specific week"""
    from datetime import datetime as dt
    
    start = dt.fromisoformat(start_date)
    week_days = []
    
    for i in range(7):
        day = start + timedelta(days=i)
        week_days.append({
            "date": day.isoformat(),
            "day": day.strftime("%A"),
            "tasks": []  # Would be populated from database
        })
    
    return {
        "week_start": start.isoformat(),
        "days": week_days
    }


@app.post("/api/calendar/time-blocks")
def create_time_blocks(data: dict):
    """Create time blocks for task scheduling"""
    blocks = data.get("blocks", [])
    
    return {
        "blocks": blocks,
        "suggestions": [
            {
                "start": "09:00",
                "duration": 2,
                "task": "Deep work session",
                "priority": "high"
            },
            {
                "start": "11:30",
                "duration": 0.5,
                "task": "Break",
                "priority": "low"
            },
            {
                "start": "12:00",
                "duration": 1,
                "task": "Lunch",
                "priority": "low"
            },
            {
                "start": "13:00",
                "duration": 2.5,
                "task": "Focused work",
                "priority": "high"
            }
        ]
    }


@app.get("/api/calendar/time-blocks/{date}")
def get_time_blocks(date: str):
    """Get time blocks for a specific date"""
    return {
        "date": date,
        "blocks": [
            {
                "start": "09:00",
                "duration": 2,
                "title": "Team Meeting",
                "type": "work",
                "priority": "high"
            },
            {
                "start": "11:00",
                "duration": 1,
                "title": "Break",
                "type": "break",
                "priority": "low"
            }
        ]
    }


@app.post("/api/google-calendar/auth")
def authenticate_google_calendar(data: dict):
    """Handle Google Calendar OAuth authentication"""
    token = data.get("token")
    
    # In production, validate token with Google API
    return {
        "success": True,
        "message": "Successfully authenticated with Google Calendar",
        "email": "user@example.com",
        "auth_token": token
    }


@app.post("/api/google-calendar/sync")
def sync_google_calendar(data: dict = {}):
    """Sync tasks with Google Calendar"""
    # In production, use Google Calendar API to:
    # 1. Fetch events from Google Calendar
    # 2. Create calendar events for new tasks
    # 3. Update events for modified tasks
    # 4. Delete events for removed tasks
    
    return {
        "success": True,
        "synced_count": 12,
        "created_count": 3,
        "updated_count": 5,
        "deleted_count": 1,
        "last_sync": datetime.now().isoformat()
    }


@app.get("/api/google-calendar/events")
def get_google_calendar_events(start_date: str, end_date: str):
    """Get events from Google Calendar"""
    return {
        "events": [
            {
                "id": "event_1",
                "title": "Team Standup",
                "start": start_date,
                "duration": 30,
                "type": "meeting"
            },
            {
                "id": "event_2",
                "title": "Lunch Break",
                "start": start_date,
                "duration": 60,
                "type": "break"
            }
        ]
    }


@app.post("/api/tasks/reschedule")
def reschedule_task(task_id: str, new_date: str):
    """Reschedule a task to a new date (used for drag-drop)"""
    # In production, update database
    return {
        "success": True,
        "task_id": task_id,
        "new_date": new_date,
        "message": f"Task rescheduled to {new_date}"
    }


# Email Configuration Models
class EmailConfigRequest(BaseModel):
    email: EmailStr
    password: str
    smtp_server: str = "smtp.gmail.com"
    smtp_port: int = 587

class EmailRequest(BaseModel):
    to_email: EmailStr
    subject: str
    body: str

class TaskReminderRequest(BaseModel):
    to_email: EmailStr
    task_title: str
    due_date: str
    priority: str

class DailySummaryRequest(BaseModel):
    to_email: EmailStr
    tasks_count: int
    completed_count: int


# Email Endpoints
@app.post("/api/email/configure")
def configure_email(config: EmailConfigRequest):
    """Configure email service with SMTP credentials"""
    try:
        email_config = EmailConfig(
            email=config.email,
            password=config.password,
            smtp_server=config.smtp_server,
            smtp_port=config.smtp_port
        )
        
        success = initialize_email_service(email_config)
        
        if success:
            return {
                "success": True,
                "message": "Email service configured successfully",
                "email": config.email
            }
        else:
            raise HTTPException(status_code=400, detail="Failed to configure email service")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/email/send")
def send_custom_email(request: EmailRequest):
    """Send a custom email"""
    email_svc = get_email_service()
    
    if not email_svc:
        raise HTTPException(status_code=400, detail="Email service not configured. Please configure email first.")
    
    success = email_svc.send_email(
        to_email=request.to_email,
        subject=request.subject,
        body=request.body,
        is_html=True
    )
    
    if success:
        return {
            "success": True,
            "message": "Email sent successfully",
            "recipient": request.to_email
        }
    else:
        raise HTTPException(status_code=500, detail="Failed to send email")


@app.post("/api/email/task-reminder")
def send_task_reminder(request: TaskReminderRequest):
    """Send task reminder email"""
    email_svc = get_email_service()
    
    if not email_svc:
        raise HTTPException(status_code=400, detail="Email service not configured. Please configure email first.")
    
    success = email_svc.send_task_reminder(
        to_email=request.to_email,
        task_title=request.task_title,
        due_date=request.due_date,
        priority=request.priority
    )
    
    if success:
        return {
            "success": True,
            "message": f"Task reminder sent to {request.to_email}",
            "task": request.task_title
        }
    else:
        raise HTTPException(status_code=500, detail="Failed to send task reminder")


@app.post("/api/email/task-completed")
def send_task_completed(to_email: EmailStr, task_title: str):
    """Send task completion notification"""
    email_svc = get_email_service()
    
    if not email_svc:
        raise HTTPException(status_code=400, detail="Email service not configured. Please configure email first.")
    
    success = email_svc.send_task_completed(
        to_email=to_email,
        task_title=task_title
    )
    
    if success:
        return {
            "success": True,
            "message": f"Task completion notification sent to {to_email}",
            "task": task_title
        }
    else:
        raise HTTPException(status_code=500, detail="Failed to send completion notification")


@app.post("/api/email/daily-summary")
def send_daily_summary(request: DailySummaryRequest):
    """Send daily summary email"""
    email_svc = get_email_service()
    
    if not email_svc:
        raise HTTPException(status_code=400, detail="Email service not configured. Please configure email first.")
    
    success = email_svc.send_daily_summary(
        to_email=request.to_email,
        tasks_count=request.tasks_count,
        completed_count=request.completed_count
    )
    
    if success:
        return {
            "success": True,
            "message": f"Daily summary sent to {request.to_email}",
            "tasks_count": request.tasks_count,
            "completed_count": request.completed_count
        }
    else:
        raise HTTPException(status_code=500, detail="Failed to send daily summary")


@app.get("/api/email/status")
def get_email_status():
    """Check if email service is configured"""
    email_svc = get_email_service()
    
    if email_svc:
        return {
            "configured": True,
            "email": email_svc.email,
            "smtp_server": email_svc.smtp_server,
            "smtp_port": email_svc.smtp_port
        }
    else:
        return {
            "configured": False,
            "message": "Email service not configured. Use /api/email/configure to set it up."
        }


# ==================== REMINDER ENDPOINTS ====================

# In-memory storage for reminders (in production, use database)
scheduled_reminders = {}

class ReminderRequest(BaseModel):
    taskId: str
    taskTitle: str
    dueDate: str
    priority: str = "medium"
    notificationType: str = "browser"  # browser, email, sound, all
    minutesBefore: int = 15  # remind X minutes before

class ReminderModel(BaseModel):
    id: str
    taskId: str
    taskTitle: str
    reminderTime: str
    notificationType: str
    sent: bool = False
    sentAt: Optional[str] = None
    createdAt: str

def calculate_smart_reminder_minutes(priority: str) -> List[int]:
    """Calculate reminder times based on task priority"""
    reminder_rules = {
        "urgent": [5, 15, 60],  # 5 min, 15 min, 1 hour before
        "high": [15, 60, 240],  # 15 min, 1 hour, 4 hours before
        "medium": [30, 120, 1440],  # 30 min, 2 hours, 1 day before
        "low": [60, 1440],  # 1 hour, 1 day before
    }
    return reminder_rules.get(priority, reminder_rules["medium"])

@app.post("/api/reminders/schedule")
def schedule_reminder(request: ReminderRequest):
    """Schedule a reminder for a task"""
    try:
        due_date = datetime.fromisoformat(request.dueDate)
        reminder_time = due_date - timedelta(minutes=request.minutesBefore)
        
        reminder_id = f"{request.taskId}-{request.minutesBefore}"
        
        reminder = ReminderModel(
            id=reminder_id,
            taskId=request.taskId,
            taskTitle=request.taskTitle,
            reminderTime=reminder_time.isoformat(),
            notificationType=request.notificationType,
            createdAt=datetime.now().isoformat()
        )
        
        # Store reminder
        scheduled_reminders[reminder_id] = reminder.dict()
        
        return {
            "success": True,
            "message": f"Reminder scheduled for {request.taskTitle}",
            "reminder": reminder.dict(),
            "reminderTime": reminder_time.isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to schedule reminder: {str(e)}")


@app.post("/api/reminders/schedule-smart")
def schedule_smart_reminders(request: ReminderRequest):
    """Schedule multiple smart reminders based on task priority"""
    try:
        reminder_minutes = calculate_smart_reminder_minutes(request.priority)
        scheduled = []
        
        for minutes in reminder_minutes:
            due_date = datetime.fromisoformat(request.dueDate)
            reminder_time = due_date - timedelta(minutes=minutes)
            
            reminder_id = f"{request.taskId}-{minutes}"
            
            reminder = ReminderModel(
                id=reminder_id,
                taskId=request.taskId,
                taskTitle=request.taskTitle,
                reminderTime=reminder_time.isoformat(),
                notificationType=request.notificationType,
                createdAt=datetime.now().isoformat()
            )
            
            scheduled_reminders[reminder_id] = reminder.dict()
            scheduled.append(reminder.dict())
        
        return {
            "success": True,
            "message": f"Smart reminders scheduled for {request.taskTitle} ({request.priority} priority)",
            "reminders": scheduled,
            "count": len(scheduled)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to schedule smart reminders: {str(e)}")


@app.get("/api/reminders/task/{task_id}")
def get_task_reminders(task_id: str):
    """Get all reminders for a specific task"""
    task_reminders = [
        r for r in scheduled_reminders.values()
        if r['taskId'] == task_id
    ]
    
    # Sort by reminder time
    task_reminders.sort(key=lambda x: x['reminderTime'])
    
    return {
        "taskId": task_id,
        "reminders": task_reminders,
        "count": len(task_reminders)
    }


@app.get("/api/reminders")
def get_all_reminders(status: Optional[str] = None):
    """Get all reminders, optionally filtered by status"""
    all_reminders = list(scheduled_reminders.values())
    
    if status:
        if status == "pending":
            all_reminders = [r for r in all_reminders if not r.get('sent')]
        elif status == "sent":
            all_reminders = [r for r in all_reminders if r.get('sent')]
    
    # Sort by reminder time
    all_reminders.sort(key=lambda x: x['reminderTime'])
    
    return {
        "reminders": all_reminders,
        "total": len(all_reminders),
        "pending": len([r for r in all_reminders if not r.get('sent')]),
        "sent": len([r for r in all_reminders if r.get('sent')])
    }


@app.delete("/api/reminders/{reminder_id}")
def delete_reminder(reminder_id: str):
    """Delete a specific reminder"""
    if reminder_id in scheduled_reminders:
        del scheduled_reminders[reminder_id]
        return {
            "success": True,
            "message": f"Reminder {reminder_id} deleted successfully"
        }
    else:
        raise HTTPException(status_code=404, detail="Reminder not found")


@app.delete("/api/reminders/task/{task_id}")
def delete_task_reminders(task_id: str):
    """Delete all reminders for a specific task"""
    reminders_to_delete = [
        r_id for r_id, r in scheduled_reminders.items()
        if r['taskId'] == task_id
    ]
    
    for r_id in reminders_to_delete:
        del scheduled_reminders[r_id]
    
    return {
        "success": True,
        "message": f"Deleted {len(reminders_to_delete)} reminders for task {task_id}",
        "deleted_count": len(reminders_to_delete)
    }


@app.post("/api/reminders/{reminder_id}/mark-sent")
def mark_reminder_sent(reminder_id: str):
    """Mark a reminder as sent"""
    if reminder_id in scheduled_reminders:
        scheduled_reminders[reminder_id]['sent'] = True
        scheduled_reminders[reminder_id]['sentAt'] = datetime.now().isoformat()
        return {
            "success": True,
            "message": f"Reminder {reminder_id} marked as sent",
            "reminder": scheduled_reminders[reminder_id]
        }
    else:
        raise HTTPException(status_code=404, detail="Reminder not found")


@app.post("/api/reminders/send-email")
def send_reminder_email(task_id: str, task_title: str, due_date: str, email: EmailStr):
    """Send email reminder for a task"""
    email_svc = get_email_service()
    
    if not email_svc:
        raise HTTPException(status_code=400, detail="Email service not configured")
    
    try:
        success = email_svc.send_task_reminder(
            to_email=email,
            task_title=task_title,
            due_date=due_date,
            priority="high"
        )
        
        if success:
            # Mark all reminders for this task as sent if email reminder
            for r_id, r in scheduled_reminders.items():
                if r['taskId'] == task_id and r['notificationType'] in ['email', 'all']:
                    r['sent'] = True
                    r['sentAt'] = datetime.now().isoformat()
            
            return {
                "success": True,
                "message": f"Reminder email sent to {email}",
                "task": task_title
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to send email")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))



    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
