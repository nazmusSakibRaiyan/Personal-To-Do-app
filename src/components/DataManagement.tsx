import React, { useState } from 'react'
import {
  Download,
  Upload,
  HardDrive,
  History,
  RotateCcw,
  RotateCw,
  Trash2,
  FileJson,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  Loader,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useTodoStore } from '../store/useTodoStore'
import {
  exportToJSON,
  exportToCSV,
  importFromJSON,
  importFromCSV,
  createBackup,
  getBackups,
  restoreBackup,
  deleteBackup,
  exportHistory,
  clearHistory,
} from '../services/dataManagement'

interface Backup {
  id: string
  timestamp: string
  taskCount: number
  size: number
}

export const DataManagement: React.FC = () => {
  const { tasks, categories, undo, redo, canUndo, canRedo } = useTodoStore()
  const [activeTab, setActiveTab] = useState<'import-export' | 'backup' | 'history' | 'undo-redo'>('import-export')
  const [backups, setBackups] = useState<Backup[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const csvFileInputRef = React.useRef<HTMLInputElement>(null)

  const loadBackups = () => {
    const backupList = getBackups() as Backup[]
    setBackups(backupList)
  }

  React.useEffect(() => {
    if (activeTab === 'backup') {
      loadBackups()
    }
  }, [activeTab])

  // Import/Export
  const handleExportJSON = () => {
    try {
      exportToJSON(tasks, categories)
      toast.success('Tasks exported to JSON')
    } catch (error) {
      toast.error('Failed to export JSON')
    }
  }

  const handleExportCSV = () => {
    try {
      exportToCSV(tasks)
      toast.success('Tasks exported to CSV')
    } catch (error) {
      toast.error('Failed to export CSV')
    }
  }

  const handleImportJSON = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    try {
      const data = await importFromJSON(file)
      if (data) {
        // Add imported tasks to the store
        const { setTasks, setCategories } = useTodoStore.getState()
        setTasks([...tasks, ...data.tasks])
        if (data.categories && data.categories.length > 0) {
          setCategories([...categories, ...data.categories])
        }
        toast.success(`Imported ${data.tasks.length} tasks`)
      }
    } catch (error) {
      toast.error('Failed to import JSON file')
    } finally {
      setIsLoading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    try {
      const importedTasks = await importFromCSV(file)
      if (importedTasks) {
        // Add imported tasks to the store
        const { setTasks } = useTodoStore.getState()
        setTasks([...tasks, ...importedTasks])
        toast.success(`Imported ${importedTasks.length} tasks from CSV`)
      }
    } catch (error) {
      toast.error('Failed to import CSV file')
    } finally {
      setIsLoading(false)
      if (csvFileInputRef.current) {
        csvFileInputRef.current.value = ''
      }
    }
  }

  // Backup Management
  const handleCreateBackup = () => {
    try {
      createBackup(tasks, categories)
      loadBackups()
      toast.success('Backup created successfully')
    } catch (error) {
      toast.error('Failed to create backup')
    }
  }

  const handleRestoreBackup = (backupId: string) => {
    try {
      const data = restoreBackup(backupId, (backupData) => {
        // Update the store with the restored data
        useTodoStore.setState({
          tasks: backupData.tasks,
          categories: backupData.categories,
        })
      })
      if (data) {
        toast.success('Backup restored successfully! Reloading...')
        // Reload the page to ensure all data is properly loaded from localStorage
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      }
    } catch (error) {
      toast.error('Failed to restore backup')
    }
  }

  const handleDeleteBackup = (backupId: string) => {
    try {
      deleteBackup(backupId)
      loadBackups()
      toast.success('Backup deleted')
    } catch (error) {
      toast.error('Failed to delete backup')
    }
  }

  // History Management
  const handleExportHistory = () => {
    try {
      exportHistory()
      toast.success('History exported')
    } catch (error) {
      toast.error('Failed to export history')
    }
  }

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all history? This cannot be undone.')) {
      try {
        clearHistory()
        toast.success('History cleared')
      } catch (error) {
        toast.error('Failed to clear history')
      }
    }
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('import-export')}
          className={`flex-1 py-4 px-6 text-center font-medium border-b-2 transition-colors ${
            activeTab === 'import-export'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Download className="w-5 h-5 inline mr-2" />
          Import/Export
        </button>
        <button
          onClick={() => setActiveTab('backup')}
          className={`flex-1 py-4 px-6 text-center font-medium border-b-2 transition-colors ${
            activeTab === 'backup'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <HardDrive className="w-5 h-5 inline mr-2" />
          Backups
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-4 px-6 text-center font-medium border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <History className="w-5 h-5 inline mr-2" />
          History
        </button>
        <button
          onClick={() => setActiveTab('undo-redo')}
          className={`flex-1 py-4 px-6 text-center font-medium border-b-2 transition-colors ${
            activeTab === 'undo-redo'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <RotateCcw className="w-5 h-5 inline mr-2" />
          Undo/Redo
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Import/Export Tab */}
        {activeTab === 'import-export' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Export Section */}
              <div className="border rounded-lg p-6 bg-gray-50">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Download className="w-5 h-5 mr-2 text-blue-600" />
                  Export Data
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Download your tasks and categories in your preferred format
                </p>
                <div className="space-y-3">
                  <button
                    onClick={handleExportJSON}
                    className="w-full flex items-center justify-center py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    <FileJson className="w-4 h-4 mr-2" />
                    Export as JSON
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="w-full flex items-center justify-center py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Export as CSV
                  </button>
                </div>
              </div>

              {/* Import Section */}
              <div className="border rounded-lg p-6 bg-gray-50">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Upload className="w-5 h-5 mr-2 text-green-600" />
                  Import Data
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Load tasks and categories from a file
                </p>
                <div className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleImportJSON}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <FileJson className="w-4 h-4 mr-2" />
                    )}
                    Import JSON
                  </button>

                  <input
                    ref={csvFileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleImportCSV}
                    className="hidden"
                  />
                  <button
                    onClick={() => csvFileInputRef.current?.click()}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                    )}
                    Import CSV
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Backup Tab */}
        {activeTab === 'backup' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Manage Backups</h3>
                <p className="text-gray-600 text-sm">Keep up to 10 backups of your tasks</p>
              </div>
              <button
                onClick={handleCreateBackup}
                className="flex items-center py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <HardDrive className="w-4 h-4 mr-2" />
                Create Backup
              </button>
            </div>

            {backups.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No backups yet. Create one to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {backups.map((backup) => (
                  <div
                    key={backup.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition"
                  >
                    <div>
                      <p className="font-medium">{backup.timestamp}</p>
                      <p className="text-sm text-gray-600">
                        {backup.taskCount} tasks • {typeof backup.size === 'string' ? backup.size : `${backup.size} KB`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRestoreBackup(backup.id)}
                        className="flex items-center py-1 px-3 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Restore
                      </button>
                      <button
                        onClick={() => handleDeleteBackup(backup.id)}
                        className="flex items-center py-1 px-3 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Task History</h3>
                <p className="text-gray-600 text-sm">View and export task change history</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleExportHistory}
                  className="flex items-center py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export History
                </button>
                <button
                  onClick={handleClearHistory}
                  className="flex items-center py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear History
                </button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
              <AlertCircle className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                History tracks all changes to your tasks (create, update, delete, complete). 
                Maximum 100 entries are kept. Export history regularly to maintain a permanent record.
              </p>
            </div>
          </div>
        )}

        {/* Undo/Redo Tab */}
        {activeTab === 'undo-redo' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="border rounded-lg p-6 bg-gray-50">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <RotateCcw className="w-5 h-5 mr-2 text-blue-600" />
                  Undo
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Revert to the previous state of your tasks
                </p>
                <button
                  onClick={undo}
                  disabled={!canUndo()}
                  className="w-full flex items-center justify-center py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Undo Last Action
                </button>
                {!canUndo() && (
                  <p className="text-sm text-gray-600 mt-3 text-center">
                    No actions to undo
                  </p>
                )}
              </div>

              <div className="border rounded-lg p-6 bg-gray-50">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <RotateCw className="w-5 h-5 mr-2 text-green-600" />
                  Redo
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Repeat an action that was undone
                </p>
                <button
                  onClick={redo}
                  disabled={!canRedo()}
                  className="w-full flex items-center justify-center py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RotateCw className="w-4 h-4 mr-2" />
                  Redo Last Action
                </button>
                {!canRedo() && (
                  <p className="text-sm text-gray-600 mt-3 text-center">
                    No actions to redo
                  </p>
                )}
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-start">
              <AlertCircle className="w-5 h-5 text-purple-600 mr-3 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-purple-800">
                Undo/Redo keeps track of up to 50 recent actions. Use Ctrl+Z (or Cmd+Z on Mac) 
                for quick undo, and Ctrl+Shift+Z for redo.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
