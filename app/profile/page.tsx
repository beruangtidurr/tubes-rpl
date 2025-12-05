"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function ProfilePage() {
  const router = useRouter()
  
  // State for user data
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [name, setName] = useState("")
  const [tempName, setTempName] = useState("")
  const [useremail, setEmail] = useState("")
  const [role, setRole] = useState("")
  const [error, setError] = useState("")

  // Fetch user data on component mount
  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true)
      setError("")
      
      const response = await fetch('/api/profile', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setName(data.data.name)
        setTempName(data.data.name)
        setEmail(data.data.email)
        setRole(data.data.role)
      } else {
        setError(data.error || "Failed to load profile")
        // If unauthorized, redirect to login
        if (response.status === 401) {
          router.push('/login')
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
      setError("Failed to load profile. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = () => {
    setTempName(name)
    setIsEditing(true)
  }

  const handleCancel = () => {
    setTempName(name)
    setIsEditing(false)
  }

  const handleSave = async () => {
    try {
      const response = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tempName })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setName(tempName)
        setIsEditing(false)
        alert("Profile updated successfully!")
      } else {
        alert(data.error || "Failed to update profile")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      alert("Failed to update profile")
    }
  }

  const getHomeRoute = () => {
    switch (role) {
      case 'ADMIN':
        return '/admin'
      case 'LECTURER':
        return '/lecturer'
      case 'STUDENT':
      default:
        return '/'
    }
  }

  const handleLogout = async () => {
    try {
      // Call logout API endpoint
      await fetch('/api/auth/logout', {
        method: 'POST'
      })
      
      // Clear any client-side storage if you're using it
      // localStorage.removeItem('token')
      // sessionStorage.clear()
      
      // Redirect to login page
      router.push('/login')
    } catch (error) {
      console.error("Error logging out:", error)
      // Still redirect even if API call fails
      router.push('/login')
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !name) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md">
          <div className="text-red-600 text-center">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-bold mb-2">Error Loading Profile</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchUserProfile}
              className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Include your Navbar component here */}
      
      <div className="max-w-2xl mx-auto p-6 mt-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Profile</h1>
            <Link href={getHomeRoute()} className="text-blue-600 hover:text-blue-700 text-sm">
              ← Back to Home
            </Link>
          </div>

          {/* Profile Picture */}
          <div className="flex justify-center mb-6">
            <div className="h-24 w-24 rounded-full bg-gray-400 flex items-center justify-center text-white text-3xl font-bold">
              {name.charAt(0).toUpperCase()}
            </div>
          </div>

          {/* Profile Information */}
          <div className="space-y-4">
            {/* User ID */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                User Email
              </label>
              <input
                type="text"
                value={useremail}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Role
              </label>
              <input
                type="text"
                value={role}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
              />
            </div>

            {/* Name - Editable */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="w-full px-4 py-2 border border-blue-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              ) : (
                <input
                  type="text"
                  value={name}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-800"
                />
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  Save Changes
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors font-medium"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleEdit}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  Edit Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors font-medium"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
