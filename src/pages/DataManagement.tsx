import { DataManagement } from '../components/DataManagement'

export default function DataManagementPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Data Management</h1>
        <p className="text-gray-600 mt-2">
          Manage your tasks with import/export, backups, history, and undo/redo functionality
        </p>
      </div>
      <DataManagement />
    </div>
  )
}
