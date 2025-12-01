import { useState } from 'react'
import { Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function EmailConfiguration() {
  const [isConfiguring, setIsConfiguring] = useState(false)
  const [isConfigured, setIsConfigured] = useState(false)
  const [configEmail, setConfigEmail] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    smtp_server: 'smtp.gmail.com',
    smtp_port: 587,
  })

  const checkEmailStatus = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/email/status')
      const result = await response.json()
      setIsConfigured(result.configured)
      if (result.configured) {
        setConfigEmail(result.email)
      }
    } catch (error) {
      console.error('Error checking email status:', error)
      setIsConfigured(false)
    }
  }

  // Check status on mount
  useState(() => {
    checkEmailStatus()
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'smtp_port' ? parseInt(value) : value,
    }))
  }

  const handleConfigureEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email || !formData.password) {
      toast.error('Please fill in email and password')
      return
    }

    setIsConfiguring(true)
    try {
      const response = await fetch('http://localhost:8000/api/email/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to configure email')
      }

      await response.json()
      toast.success('Email configured successfully!')
      setConfigEmail(formData.email)
      setIsConfigured(true)
      setFormData({ email: '', password: '', smtp_server: 'smtp.gmail.com', smtp_port: 587 })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to configure email')
    } finally {
      setIsConfiguring(false)
    }
  }

  return (
    <div className="card p-6 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Mail className="text-primary-600" size={24} />
        <h2 className="text-xl font-bold">Email Configuration</h2>
      </div>

      {isConfigured ? (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
            <CheckCircle size={20} />
            <div>
              <p className="font-semibold">Email Configured</p>
              <p className="text-sm">{configEmail}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex gap-2 text-blue-700 dark:text-blue-300">
            <AlertCircle size={20} className="flex-shrink-0 mt-1" />
            <div>
              <p className="font-semibold text-sm">Gmail Setup Required</p>
              <p className="text-xs mt-1">
                For Gmail: Enable 2-FA and create an{' '}
                <a
                  href="https://myaccount.google.com/apppasswords"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-blue-600 dark:text-blue-400"
                >
                  App Password
                </a>
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleConfigureEmail} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            Email Address
          </label>
          <div className="relative">
            <Mail size={18} className="absolute left-3 top-3 text-gray-400" />
            <input
              id="email"
              type="email"
              name="email"
              placeholder="your.email@gmail.com"
              value={formData.email}
              onChange={handleInputChange}
              className="input pl-10 w-full"
              disabled={isConfiguring}
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-2">
            App Password / SMTP Password
          </label>
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-3 text-gray-400" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="16-character app password"
              value={formData.password}
              onChange={handleInputChange}
              className="input pl-10 pr-10 w-full"
              disabled={isConfiguring}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              disabled={isConfiguring}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="smtp_server" className="block text-sm font-medium mb-2">
              SMTP Server
            </label>
            <input
              id="smtp_server"
              type="text"
              name="smtp_server"
              value={formData.smtp_server}
              onChange={handleInputChange}
              className="input text-sm w-full"
              disabled={isConfiguring}
            />
          </div>

          <div>
            <label htmlFor="smtp_port" className="block text-sm font-medium mb-2">
              SMTP Port
            </label>
            <input
              id="smtp_port"
              type="number"
              name="smtp_port"
              value={formData.smtp_port}
              onChange={handleInputChange}
              className="input text-sm w-full"
              disabled={isConfiguring}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isConfiguring}
          className="btn btn-primary w-full"
        >
          {isConfiguring ? 'Configuring...' : isConfigured ? 'Reconfigure' : 'Configure Email'}
        </button>
      </form>

      {isConfigured && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
          <p className="font-semibold mb-2">Available Email Features:</p>
          <ul className="space-y-1 text-gray-700 dark:text-gray-300">
            <li>✓ Task reminders</li>
            <li>✓ Task completion notifications</li>
            <li>✓ Daily productivity summaries</li>
            <li>✓ Custom email messages</li>
          </ul>
        </div>
      )}
    </div>
  )
}
