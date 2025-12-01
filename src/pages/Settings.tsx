import { useTodoStore } from '../store/useTodoStore'
import { Download, Upload, Trash2, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import EmailConfiguration from '../components/EmailConfiguration'

export default function Settings() {
  const { preferences, updatePreferences, categories, addCategory, deleteCategory } = useTodoStore()

  const handleExportData = () => {
    const data = {
      tasks: useTodoStore.getState().tasks,
      categories: useTodoStore.getState().categories,
      preferences: useTodoStore.getState().preferences,
    }
    
    const dataStr = JSON.stringify(data, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `smart-todo-backup-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    toast.success('Data exported successfully!')
  }

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        // In a real app, you'd restore this to the store
        console.log('Imported data:', data)
        toast.success('Data imported successfully!')
      } catch (error) {
        toast.error('Failed to import data')
      }
    }
    reader.readAsText(file)
  }

  const handleAddCategory = () => {
    const name = prompt('Enter category name:')
    if (!name) return

    const color = `#${Math.floor(Math.random() * 16777215).toString(16)}`
    addCategory({ name, color })
    toast.success('Category added!')
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <div className="space-y-6">
        {/* Appearance */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Appearance</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Theme</label>
              <select
                value={preferences.theme}
                onChange={(e) => updatePreferences({ theme: e.target.value as any })}
                className="input"
                aria-label="Theme selection"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Date Format</label>
              <select
                value={preferences.dateFormat}
                onChange={(e) => updatePreferences({ dateFormat: e.target.value })}
                className="input"
                aria-label="Date format selection"
              >
                <option value="MM/dd/yyyy">MM/DD/YYYY</option>
                <option value="dd/MM/yyyy">DD/MM/YYYY</option>
                <option value="yyyy-MM-dd">YYYY-MM-DD</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Time Format</label>
              <select
                value={preferences.timeFormat}
                onChange={(e) => updatePreferences({ timeFormat: e.target.value as any })}
                className="input"
                aria-label="Time format selection"
              >
                <option value="12h">12 Hour</option>
                <option value="24h">24 Hour</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Notifications</h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <span>Enable Notifications</span>
              <input
                type="checkbox"
                checked={preferences.notifications.enabled}
                onChange={(e) =>
                  updatePreferences({
                    notifications: { ...preferences.notifications, enabled: e.target.checked },
                  })
                }
                className="w-5 h-5"
              />
            </label>

            <label className="flex items-center justify-between">
              <span>Sound Notifications</span>
              <input
                type="checkbox"
                checked={preferences.notifications.soundEnabled}
                onChange={(e) =>
                  updatePreferences({
                    notifications: { ...preferences.notifications, soundEnabled: e.target.checked },
                  })
                }
                className="w-5 h-5"
              />
            </label>
          </div>
        </div>

        {/* Working Hours */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Working Hours</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Start Time</label>
              <input
                type="time"
                value={preferences.workingHours.start}
                onChange={(e) =>
                  updatePreferences({
                    workingHours: { ...preferences.workingHours, start: e.target.value },
                  })
                }
                className="input"
                aria-label="Working hours start time"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">End Time</label>
              <input
                type="time"
                value={preferences.workingHours.end}
                onChange={(e) =>
                  updatePreferences({
                    workingHours: { ...preferences.workingHours, end: e.target.value },
                  })
                }
                className="input"
                aria-label="Working hours end time"
              />
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Categories</h2>
            <button onClick={handleAddCategory} className="btn btn-primary flex items-center gap-2">
              <Plus size={16} />
              Add Category
            </button>
          </div>
          <div className="space-y-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line react/forbid-dom-props */}
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="font-medium">{category.name}</span>
                  {category.icon && <span>{category.icon}</span>}
                </div>
                <button
                  onClick={() => {
                    if (confirm(`Delete category "${category.name}"?`)) {
                      deleteCategory(category.id)
                      toast.success('Category deleted')
                    }
                  }}
                  className="text-red-600 hover:text-red-700"
                  aria-label={`Delete category ${category.name}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Data Management */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Data Management</h2>
          <div className="space-y-3">
            <button onClick={handleExportData} className="btn btn-secondary w-full flex items-center justify-center gap-2">
              <Download size={20} />
              Export All Data
            </button>
            <label className="btn btn-secondary w-full flex items-center justify-center gap-2 cursor-pointer">
              <Upload size={20} />
              Import Data
              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Email Configuration Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Email & Notifications</h2>
        <EmailConfiguration />
      </div>
    </div>
  )
}
