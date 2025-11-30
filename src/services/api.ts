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
}

export default api
