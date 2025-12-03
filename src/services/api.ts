import axios from 'axios'
import { Task, TaskStats, AIInsight } from '../types'

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

export const taskAPI = {
  // AI-powered natural language task creation
  parseNaturalLanguage: async (input: string) => {
    const response = await api.post('/tasks/parse', { input })
    return response.data
  },

  // Get AI suggestions for scheduling
  getScheduleSuggestions: async (taskId: string) => {
    const response = await api.get(`/tasks/${taskId}/schedule-suggestions`)
    return response.data
  },

  // Get AI insights
  getInsights: async (): Promise<AIInsight[]> => {
    const response = await api.get('/insights')
    return response.data
  },

  // AI task breakdown
  getTaskBreakdown: async (taskTitle: string, description?: string) => {
    const response = await api.post('/tasks/breakdown', { title: taskTitle, description })
    return response.data
  },

  // Get smart deadline recommendations
  getDeadlineRecommendations: async (taskData: Partial<Task>) => {
    const response = await api.post('/tasks/deadline-suggestions', taskData)
    return response.data
  },

  // Get workload analysis
  getWorkloadAnalysis: async () => {
    const response = await api.get('/analytics/workload')
    return response.data
  },

  // Get productivity patterns
  getProductivityPatterns: async () => {
    const response = await api.get('/analytics/patterns')
    return response.data
  },

  // Task CRUD
  getTasks: async (filters?: any) => {
    const response = await api.get('/tasks', { params: filters })
    return response.data
  },

  createTask: async (task: Partial<Task>) => {
    const response = await api.post('/tasks', task)
    return response.data
  },

  updateTask: async (id: string, updates: Partial<Task>) => {
    const response = await api.put(`/tasks/${id}`, updates)
    return response.data
  },

  deleteTask: async (id: string) => {
    await api.delete(`/tasks/${id}`)
  },

  // Analytics
  getStats: async (): Promise<TaskStats> => {
    const response = await api.get('/tasks/stats')
    return response.data
  },

  // Export
  exportTasks: async (format: 'json' | 'csv') => {
    const response = await api.get('/tasks/export', {
      params: { format },
      responseType: 'blob',
    })
    return response.data
  },

  // Import
  importTasks: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post('/tasks/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // Calendar features
  exportCalendar: async (format: 'ical' | 'json' = 'ical'): Promise<string> => {
    const response = await api.get('/calendar/export', {
      params: { format },
    })
    return response.data
  },

  getMonthView: async (year: number, month: number) => {
    const response = await api.get('/calendar/month', {
      params: { year, month },
    })
    return response.data
  },

  getWeekView: async (startDate: string) => {
    const response = await api.get('/calendar/week', {
      params: { start_date: startDate },
    })
    return response.data
  },

  getTimeBlocks: async (date: string) => {
    const response = await api.get(`/calendar/time-blocks/${date}`)
    return response.data
  },

  createTimeBlocks: async (blocks: any[]) => {
    const response = await api.post('/calendar/time-blocks', { blocks })
    return response.data
  },

  rescheduleTask: async (taskId: string, newDate: string) => {
    const response = await api.post('/tasks/reschedule', { task_id: taskId, new_date: newDate })
    return response.data
  },

  // Google Calendar integration
  authenticateGoogle: async (token: string) => {
    const response = await api.post('/google-calendar/auth', { token })
    return response.data
  },

  syncGoogleCalendar: async () => {
    const response = await api.post('/google-calendar/sync')
    return response.data
  },

  getGoogleCalendarEvents: async (startDate: string, endDate: string) => {
    const response = await api.get('/google-calendar/events', {
      params: { start_date: startDate, end_date: endDate },
    })
    return response.data
  },
}

// Email API
export const emailAPI = {
  // Configure email service
  configureEmail: async (email: string, password: string, smtpServer?: string, smtpPort?: number) => {
    const response = await api.post('/email/configure', {
      email,
      password,
      smtp_server: smtpServer || 'smtp.gmail.com',
      smtp_port: smtpPort || 587,
    })
    return response.data
  },

  // Send custom email
  sendEmail: async (toEmail: string, subject: string, body: string) => {
    const response = await api.post('/email/send', {
      to_email: toEmail,
      subject,
      body,
    })
    return response.data
  },

  // Send task reminder
  sendTaskReminder: async (toEmail: string, taskTitle: string, dueDate: string, priority: string) => {
    const response = await api.post('/email/task-reminder', {
      to_email: toEmail,
      task_title: taskTitle,
      due_date: dueDate,
      priority,
    })
    return response.data
  },

  // Send task completion notification
  sendTaskCompleted: async (toEmail: string, taskTitle: string) => {
    const response = await api.post('/email/task-completed', {
      to_email: toEmail,
      task_title: taskTitle,
    })
    return response.data
  },

  // Send daily summary
  sendDailySummary: async (toEmail: string, tasksCount: number, completedCount: number) => {
    const response = await api.post('/email/daily-summary', {
      to_email: toEmail,
      tasks_count: tasksCount,
      completed_count: completedCount,
    })
    return response.data
  },

  // Check email configuration status
  getEmailStatus: async () => {
    const response = await api.get('/email/status')
    return response.data
  },
}

// Reminders API
export const remindersAPI = {
  // Schedule a single reminder
  scheduleReminder: async (
    taskId: string,
    taskTitle: string,
    dueDate: string,
    notificationType: 'browser' | 'email' | 'sound' | 'all' = 'browser',
    minutesBefore: number = 15,
  ) => {
    const response = await api.post('/reminders/schedule', {
      taskId,
      taskTitle,
      dueDate,
      notificationType,
      minutesBefore,
    })
    return response.data
  },

  // Schedule smart reminders based on priority
  scheduleSmartReminders: async (
    taskId: string,
    taskTitle: string,
    dueDate: string,
    priority: 'urgent' | 'high' | 'medium' | 'low' = 'medium',
    notificationType: 'browser' | 'email' | 'sound' | 'all' = 'browser',
  ) => {
    const response = await api.post('/reminders/schedule-smart', {
      taskId,
      taskTitle,
      dueDate,
      priority,
      notificationType,
    })
    return response.data
  },

  // Get reminders for a specific task
  getTaskReminders: async (taskId: string) => {
    const response = await api.get(`/reminders/task/${taskId}`)
    return response.data
  },

  // Get all reminders
  getAllReminders: async (status?: 'pending' | 'sent') => {
    const response = await api.get('/reminders', { params: { status } })
    return response.data
  },

  // Delete a specific reminder
  deleteReminder: async (reminderId: string) => {
    const response = await api.delete(`/reminders/${reminderId}`)
    return response.data
  },

  // Delete all reminders for a task
  deleteTaskReminders: async (taskId: string) => {
    const response = await api.delete(`/reminders/task/${taskId}`)
    return response.data
  },

  // Mark reminder as sent
  markReminderSent: async (reminderId: string) => {
    const response = await api.post(`/reminders/${reminderId}/mark-sent`)
    return response.data
  },

  // Send email reminder
  sendReminderEmail: async (taskId: string, taskTitle: string, dueDate: string, email: string) => {
    const response = await api.post('/reminders/send-email', {
      task_id: taskId,
      task_title: taskTitle,
      due_date: dueDate,
      email,
    })
    return response.data
  },
}

export default api
