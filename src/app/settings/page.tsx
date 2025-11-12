'use client'

import { useState } from 'react'
import Layout from '@/components/Layout'
import { Cog6ToothIcon, UserIcon, BellIcon, CircleStackIcon } from '@heroicons/react/24/outline'

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('general')

  const handleButtonClick = (action: string) => {
    console.log(`${action} clicked - feature coming soon!`)
    alert(`${action} feature is coming soon!`)
  }
  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Cog6ToothIcon className="h-6 w-6 mr-2 text-buscor-orange" />
                System Settings
              </h1>
              <p className="text-gray-600 mt-1">
                Configure system preferences and administrative options
              </p>
            </div>
          </div>
        </div>

        {/* Settings Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <UserIcon className="h-6 w-6 text-buscor-orange mr-2" />
              <h3 className="text-lg font-medium text-gray-900">User Management</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Manage admin users and access permissions
            </p>
            <button 
              onClick={() => handleButtonClick('User Management')}
              className="btn-secondary text-sm"
            >
              Manage Users
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <BellIcon className="h-6 w-6 text-buscor-orange mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Configure email alerts and system notifications
            </p>
            <button 
              onClick={() => handleButtonClick('Notifications')}
              className="btn-secondary text-sm"
            >
              Configure Alerts
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <CircleStackIcon className="h-6 w-6 text-buscor-orange mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Data Management</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Database backup, export, and maintenance options
            </p>
            <button 
              onClick={() => handleButtonClick('Data Management')}
              className="btn-secondary text-sm"
            >
              Data Options
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <Cog6ToothIcon className="h-6 w-6 text-buscor-orange mr-2" />
              <h3 className="text-lg font-medium text-gray-900">System Config</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              General system settings and preferences
            </p>
            <button 
              onClick={() => handleButtonClick('System Settings')}
              className="btn-secondary text-sm"
            >
              System Settings
            </button>
          </div>
        </div>

        {/* Coming Soon Notice */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <Cog6ToothIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Advanced Settings Coming Soon</h3>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Advanced configuration options including user roles, automated workflows, 
            and system integrations are under development and will be available soon!
          </p>
        </div>
      </div>
    </Layout>
  )
}