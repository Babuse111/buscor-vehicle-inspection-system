'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Simple demo authentication - replace with real auth
      if (email === 'admin@buscor.com' && password === 'admin123') {
        localStorage.setItem('admin_token', 'demo_token')
        router.push('/')
      } else {
        setError('Invalid credentials. Use admin@buscor.com / admin123')
      }
    } catch (err) {
      setError('Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-buscor-orange to-buscor-teal">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-2xl">
        <div className="text-center">
          {/* Buscor Logo */}
          <div className="mx-auto h-20 w-20 mb-4 flex items-center justify-center">
            <Image
              src="/buscor-logo.png"
              alt="Buscor Logo"
              width={80}
              height={80}
              className="object-contain"
            />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Buscor Admin
          </h2>
          <p className="mt-2 text-gray-600">
            Vehicle Inspection Management
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-buscor-orange focus:border-buscor-orange"
                placeholder="admin@buscor.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-buscor-orange focus:border-buscor-orange"
                placeholder="Enter password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-buscor-orange hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-buscor-orange disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="text-center text-sm text-gray-500 mt-4">
            <p>Demo Credentials:</p>
            <p className="font-mono">admin@buscor.com / admin123</p>
          </div>
        </form>
      </div>
    </div>
  )
}