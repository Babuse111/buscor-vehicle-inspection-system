'use client'

import { useState } from 'react'
import Layout from '@/components/Layout'
import { ChartBarIcon, DocumentArrowDownIcon, CalendarIcon } from '@heroicons/react/24/outline'

export default function ReportsPage() {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateMainReport = () => {
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      alert('Report Generated!\n\nComprehensive fleet report including:\n• Vehicle utilization statistics\n• Inspection compliance rates\n• Maintenance schedules\n• Performance metrics\n\nDownload functionality coming soon!')
    }, 2000)
  }

  const handleFleetOverview = () => {
    alert('Fleet Overview Report:\n\n• Total vehicles: 45\n• Active vehicles: 38\n• Vehicles in maintenance: 5\n• Out of service: 2\n• Average utilization: 87%\n• Monthly mileage: 125,430 km\n\nDetailed PDF generation coming soon!')
  }

  const handleInspectionSummary = () => {
    alert('Inspection Summary Report:\n\n• Total inspections this month: 156\n• Compliance rate: 94%\n• Average inspection score: 92%\n• Critical defects found: 8\n• Resolved issues: 89%\n• Overdue inspections: 3\n\nDetailed analytics coming soon!')
  }

  const handleSafetyAnalytics = () => {
    alert('Safety Analytics Report:\n\n• Safety incidents: 2 (down 50%)\n• Risk assessment score: 8.5/10\n• Top defect categories:\n  - Tire wear (35%)\n  - Brake issues (25%)\n  - Light malfunctions (20%)\n• Preventive actions taken: 12\n\nComprehensive safety dashboard coming soon!')
  }
  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <ChartBarIcon className="h-6 w-6 mr-2 text-buscor-orange" />
                Reports & Analytics
              </h1>
              <p className="text-gray-600 mt-1">
                Generate comprehensive fleet and inspection reports
              </p>
            </div>
            <button 
              onClick={handleGenerateMainReport}
              disabled={isGenerating}
              className="btn-primary flex items-center"
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>

        {/* Report Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Fleet Overview</h3>
              <ChartBarIcon className="h-8 w-8 text-buscor-orange" />
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Comprehensive fleet status, utilization, and performance metrics
            </p>
            <button 
              onClick={handleFleetOverview}
              className="btn-secondary text-sm"
            >
              Generate Report
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Inspection Summary</h3>
              <CalendarIcon className="h-8 w-8 text-buscor-orange" />
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Detailed inspection activities, scores, and compliance tracking
            </p>
            <button 
              onClick={handleInspectionSummary}
              className="btn-secondary text-sm"
            >
              Generate Report
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Safety Analytics</h3>
              <DocumentArrowDownIcon className="h-8 w-8 text-buscor-orange" />
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Safety incidents, defect trends, and risk assessment reports
            </p>
            <button 
              onClick={handleSafetyAnalytics}
              className="btn-secondary text-sm"
            >
              Generate Report
            </button>
          </div>
        </div>

        {/* Coming Soon Notice */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <ChartBarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Advanced Analytics Coming Soon</h3>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We're working on comprehensive reporting features including custom dashboards, 
            automated report scheduling, and advanced analytics. These features will be available soon!
          </p>
        </div>
      </div>
    </Layout>
  )
}