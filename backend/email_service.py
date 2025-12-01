import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
import json

class EmailConfig(BaseModel):
    email: EmailStr
    password: str
    smtp_server: str = "smtp.gmail.com"
    smtp_port: int = 587
    
class EmailTemplate:
    @staticmethod
    def task_reminder(task_title: str, due_date: str, priority: str) -> tuple[str, str]:
        """Generate email subject and body for task reminder"""
        subject = f"Task Reminder: {task_title}"
        body = f"""
        <html>
            <body style="font-family: Arial, sans-serif;">
                <h2>Task Reminder</h2>
                <p>You have a task coming up:</p>
                <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px;">
                    <h3>{task_title}</h3>
                    <p><strong>Due Date:</strong> {due_date}</p>
                    <p><strong>Priority:</strong> <span style="color: {'#ff0000' if priority == 'urgent' else '#ff9900' if priority == 'high' else '#0099ff'};">{priority.upper()}</span></p>
                </div>
                <p style="margin-top: 20px; color: #666;">
                    Don't forget to complete this task!
                </p>
            </body>
        </html>
        """
        return subject, body
    
    @staticmethod
    def task_completed(task_title: str) -> tuple[str, str]:
        """Generate email for task completion"""
        subject = f"Task Completed: {task_title}"
        body = f"""
        <html>
            <body style="font-family: Arial, sans-serif;">
                <h2>Congratulations!</h2>
                <p>You have successfully completed a task:</p>
                <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; border-left: 4px solid #4caf50;">
                    <h3 style="color: #4caf50;">{task_title}</h3>
                    <p>Completed on: {datetime.now().strftime('%B %d, %Y at %I:%M %p')}</p>
                </div>
                <p style="margin-top: 20px; color: #666;">
                    Great job! Keep up the productivity!
                </p>
            </body>
        </html>
        """
        return subject, body
    
    @staticmethod
    def daily_summary(tasks_count: int, completed_count: int) -> tuple[str, str]:
        """Generate daily summary email"""
        subject = f"Daily Summary - {datetime.now().strftime('%B %d, %Y')}"
        body = f"""
        <html>
            <body style="font-family: Arial, sans-serif;">
                <h2>Your Daily Summary</h2>
                <p>Here's your productivity report for today:</p>
                <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px;">
                    <p><strong>Total Tasks:</strong> {tasks_count}</p>
                    <p><strong>Completed:</strong> {completed_count}</p>
                    <p><strong>Progress:</strong> {int((completed_count/tasks_count)*100) if tasks_count > 0 else 0}%</p>
                </div>
                <p style="margin-top: 20px; color: #666;">
                    Keep pushing to achieve your goals!
                </p>
            </body>
        </html>
        """
        return subject, body

class EmailService:
    def __init__(self, email_config: EmailConfig):
        """Initialize email service with SMTP configuration"""
        self.config = email_config
        self.email = email_config.email
        self.password = email_config.password
        self.smtp_server = email_config.smtp_server
        self.smtp_port = email_config.smtp_port
    
    def send_email(self, to_email: str, subject: str, body: str, is_html: bool = True) -> bool:
        """Send email with given parameters"""
        try:
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = self.email
            message["To"] = to_email
            
            # Add body
            if is_html:
                part = MIMEText(body, "html")
            else:
                part = MIMEText(body, "plain")
            message.attach(part)
            
            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.email, self.password)
                server.sendmail(self.email, to_email, message.as_string())
            
            return True
        except Exception as e:
            print(f"Error sending email: {str(e)}")
            return False
    
    def send_task_reminder(self, to_email: str, task_title: str, due_date: str, priority: str) -> bool:
        """Send task reminder email"""
        subject, body = EmailTemplate.task_reminder(task_title, due_date, priority)
        return self.send_email(to_email, subject, body, is_html=True)
    
    def send_task_completed(self, to_email: str, task_title: str) -> bool:
        """Send task completion email"""
        subject, body = EmailTemplate.task_completed(task_title)
        return self.send_email(to_email, subject, body, is_html=True)
    
    def send_daily_summary(self, to_email: str, tasks_count: int, completed_count: int) -> bool:
        """Send daily summary email"""
        subject, body = EmailTemplate.daily_summary(tasks_count, completed_count)
        return self.send_email(to_email, subject, body, is_html=True)

# Global email service instance
email_service: Optional[EmailService] = None

def initialize_email_service(config: EmailConfig) -> bool:
    """Initialize the global email service"""
    global email_service
    try:
        email_service = EmailService(config)
        return True
    except Exception as e:
        print(f"Error initializing email service: {str(e)}")
        return False

def get_email_service() -> Optional[EmailService]:
    """Get the global email service instance"""
    return email_service
