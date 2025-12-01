import { taskAPI } from './api'

// Google OAuth Configuration
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID'

// Initialize Google Sign-In
export const initializeGoogleAuth = async () => {
  try {
    // Load Google API library
    await loadGoogleAPI()

    // Create a client
    const client = (window as any).google.accounts.oauth2.initCodeClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/calendar',
      ux_mode: 'popup',
      callback: handleAuthCallback,
    })

    // Trigger the flow
    client.requestCode()

    return { success: false, message: 'Check browser for Google auth dialog' }
  } catch (error) {
    console.error('Google auth initialization failed:', error)
    return { success: false, error }
  }
}

// Load Google API script
const loadGoogleAPI = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if ((window as any).google) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google API'))
    document.head.appendChild(script)
  })
}

// Handle OAuth callback
const handleAuthCallback = async (response: any) => {
  try {
    const code = response.code

    // Exchange code for token (in production, do this on the backend)
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: process.env.REACT_APP_GOOGLE_CLIENT_SECRET || '',
        redirect_uri: window.location.origin,
        grant_type: 'authorization_code',
      }),
    })

    const token = await tokenResponse.json()

    // Send token to backend
    const result = await taskAPI.authenticateGoogle(token.access_token)

    if (result.success) {
      // Store token securely
      sessionStorage.setItem('google_auth_token', token.access_token)
      
      return {
        success: true,
        email: result.email,
        token: token.access_token,
      }
    }

    return { success: false, error: result.error }
  } catch (error) {
    console.error('Auth callback failed:', error)
    return { success: false, error }
  }
}

// Revoke Google authentication
export const revokeGoogleAuth = async () => {
  try {
    const token = sessionStorage.getItem('google_auth_token')
    if (token) {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, {
        method: 'POST',
      })
      sessionStorage.removeItem('google_auth_token')
      return { success: true }
    }
  } catch (error) {
    console.error('Failed to revoke auth:', error)
    return { success: false, error }
  }
}

// Get stored auth token
export const getGoogleAuthToken = (): string | null => {
  return sessionStorage.getItem('google_auth_token')
}

// Check if authenticated
export const isGoogleAuthenticated = (): boolean => {
  return !!getGoogleAuthToken()
}
