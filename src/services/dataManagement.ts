import { Task, Category } from '../types'
import toast from 'react-hot-toast'

export interface ExportData {
  tasks: Task[]
  categories: Category[]
  exportDate: string
  version: string
}

export interface BackupMetadata {
  id: string
  timestamp: string
  taskCount: number
  size: number
}

export interface HistoryEntry {
  id: string
  timestamp: string
  action: 'create' | 'update' | 'delete' | 'complete'
  taskId: string
  taskTitle: string
  changes?: Record<string, any>
  previousState?: Partial<Task>
}

// Export to JSON
export function exportToJSON(tasks: Task[], categories: Category[]): void {
  const exportData: ExportData = {
    tasks,
    categories,
    exportDate: new Date().toISOString(),
    version: '1.0',
  }

  const dataStr = JSON.stringify(exportData, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = `todo-backup-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  toast.success('Data exported to JSON successfully!')
}

// Export to CSV
export function exportToCSV(tasks: Task[]): void {
  const headers = ['ID', 'Title', 'Description', 'Status', 'Priority', 'Due Date', 'Tags', 'Category', 'Completed']
  const rows = tasks.map((task) => [
    task.id,
    `"${task.title.replace(/"/g, '""')}"`,
    `"${(task.description || '').replace(/"/g, '""')}"`,
    task.status,
    task.priority,
    task.dueDate || '',
    `"${task.tags.join(', ')}"`,
    task.category || '',
    task.status === 'completed' ? 'Yes' : 'No',
  ])

  const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n')
  const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(csvBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = `todo-export-${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  toast.success('Data exported to CSV successfully!')
}

// Import from JSON
export async function importFromJSON(file: File): Promise<ExportData | null> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string
        const data = JSON.parse(content) as ExportData
        
        if (!data.tasks || !Array.isArray(data.tasks)) {
          throw new Error('Invalid JSON format: missing tasks array')
        }

        toast.success('Data imported successfully!')
        resolve(data)
      } catch (error) {
        toast.error(`Failed to import: ${error instanceof Error ? error.message : 'Invalid file'}`)
        resolve(null)
      }
    }
    reader.readAsText(file)
  })
}

export async function importFromCSV(file: File): Promise<Task[] | null> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string
        const lines = content.split('\n').filter((line) => line.trim())
        
        if (lines.length < 2) {
          throw new Error('CSV file is empty or invalid')
        }

        const tasks: Task[] = []

        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i])
          
          if (values.length < 3) continue

          const task: Task = {
            id: values[0] || `task-${Date.now()}-${i}`,
            title: values[1] || 'Untitled',
            description: values[2] || '',
            status: (values[3] as 'pending' | 'in-progress' | 'completed') || 'pending',
            priority: (values[4] as 'low' | 'medium' | 'high' | 'urgent') || 'medium',
            dueDate: values[5] || '',
            tags: values[6] ? values[6].split(',').map((t) => t.trim()) : [],
            category: values[7] || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            subtasks: [],
          }

          tasks.push(task)
        }

        toast.success(`Imported ${tasks.length} tasks from CSV!`)
        resolve(tasks)
      } catch (error) {
        toast.error(`Failed to import CSV: ${error instanceof Error ? error.message : 'Unknown error'}`)
        resolve(null)
      }
    }
    reader.readAsText(file)
  })
}

// Helper function to parse CSV line (handles quoted fields)
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result
}

// Backup to localStorage
export function createBackup(tasks: Task[], categories: Category[]): void {
  try {
    const backups = JSON.parse(localStorage.getItem('task_backups') || '[]') as BackupMetadata[]
    
    const backup: ExportData = {
      tasks,
      categories,
      exportDate: new Date().toISOString(),
      version: '1.0',
    }

    const backupStr = JSON.stringify(backup)
    const backupId = `backup-${Date.now()}`
    
    localStorage.setItem(backupId, backupStr)
    
    const metadata: BackupMetadata = {
      id: backupId,
      timestamp: new Date().toISOString(),
      taskCount: tasks.length,
      size: backupStr.length,
    }

    backups.push(metadata)
    // Keep only last 10 backups
    if (backups.length > 10) {
      const oldestBackup = backups.shift()
      if (oldestBackup) {
        localStorage.removeItem(oldestBackup.id)
      }
    }

    localStorage.setItem('task_backups', JSON.stringify(backups))
    toast.success('Backup created successfully!')
  } catch (error) {
    toast.error('Failed to create backup')
  }
}

// Restore from backup
export function getBackups(): BackupMetadata[] {
  try {
    return JSON.parse(localStorage.getItem('task_backups') || '[]')
  } catch {
    return []
  }
}

export function restoreBackup(backupId: string, onRestore?: (data: ExportData) => void): ExportData | null {
  try {
    const backupStr = localStorage.getItem(backupId)
    if (!backupStr) {
      toast.error('Backup not found')
      return null
    }

    const backup = JSON.parse(backupStr) as ExportData
    
    // Call callback if provided to update the store
    if (onRestore) {
      onRestore(backup)
    }
    
    toast.success('Backup restored successfully!')
    return backup
  } catch (error) {
    toast.error('Failed to restore backup')
    return null
  }
}

// Delete backup
export function deleteBackup(backupId: string): void {
  try {
    localStorage.removeItem(backupId)
    const backups = JSON.parse(localStorage.getItem('task_backups') || '[]') as BackupMetadata[]
    const filtered = backups.filter((b) => b.id !== backupId)
    localStorage.setItem('task_backups', JSON.stringify(filtered))
    toast.success('Backup deleted')
  } catch (error) {
    toast.error('Failed to delete backup')
  }
}

// Save to history
export function addToHistory(
  taskId: string,
  taskTitle: string,
  action: 'create' | 'update' | 'delete' | 'complete',
  changes?: Record<string, any>,
  previousState?: Partial<Task>
): void {
  try {
    const history = JSON.parse(localStorage.getItem('task_history') || '[]') as HistoryEntry[]
    
    const entry: HistoryEntry = {
      id: `history-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action,
      taskId,
      taskTitle,
      changes,
      previousState,
    }

    history.push(entry)
    // Keep only last 100 history entries
    if (history.length > 100) {
      history.shift()
    }

    localStorage.setItem('task_history', JSON.stringify(history))
  } catch (error) {
    console.error('Failed to save history:', error)
  }
}

// Get task history
export function getTaskHistory(taskId?: string): HistoryEntry[] {
  try {
    const history = JSON.parse(localStorage.getItem('task_history') || '[]') as HistoryEntry[]
    if (taskId) {
      return history.filter((entry) => entry.taskId === taskId)
    }
    return history
  } catch {
    return []
  }
}

// Export history to JSON
export function exportHistory(): void {
  try {
    const history = JSON.parse(localStorage.getItem('task_history') || '[]') as HistoryEntry[]
    const dataStr = JSON.stringify(history, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `task-history-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success('History exported successfully!')
  } catch (error) {
    toast.error('Failed to export history')
  }
}

// Clear history
export function clearHistory(): void {
  try {
    localStorage.removeItem('task_history')
    toast.success('History cleared')
  } catch (error) {
    toast.error('Failed to clear history')
  }
}
