'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import DashboardStats from '@/components/DashboardStats'
import VehicleStatus from '@/components/VehicleStatus'
// import RecentInspections from '@/components/RecentInspections'
import DefectOverview from '@/components/DefectOverview'

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check authentication status
    const checkAuth = () => {
      const token = localStorage.getItem('admin_token')
      if (!token) {
        router.push('/login')
        return
      }
      setIsAuthenticated(true)
      setIsLoading(false)
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-buscor-orange mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Buscor Fleet Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Monitor your vehicle inspection and fleet management
              </p>
            </div>
            <div className="text-sm text-gray-500">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        </div>

        {/* Dashboard Stats */}
        <DashboardStats />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Inspections - Takes 2 columns on large screens */}
          <div className="lg:col-span-2">
            {/* <RecentInspections /> */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Inspections</h3>
                <p className="text-sm text-gray-600">Latest vehicle inspection activity</p>
              </div>
              <div className="p-6">
                <div className="text-center py-12">
                  <div className="mx-auto h-12 w-12 text-gray-400 mb-4">⏱️</div>
                  <h3 className="text-sm font-medium text-gray-900">No Inspections Yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Inspections from the mobile app will appear here in real-time.
                  </p>
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      💡 Submit an inspection from the mobile app to test the connection!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Content */}
          <div className="space-y-6">
            <DefectOverview />
            <VehicleStatus />
          </div>
        </div>
      </div>
    </Layout>
  )
}