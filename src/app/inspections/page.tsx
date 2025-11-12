'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { ClipboardDocumentListIcon, FunnelIcon, EyeIcon } from '@heroicons/react/24/outline'

interface Inspection {
  id: string
  vehicleNumber: string
  driverName: string
  status: 'completed' | 'in_progress' | 'pending' | 'overdue'
  timestamp: string
  defectCount: number
  score: number
  location: string
  duration: number
}

export default function InspectionsPage() {
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'completed' | 'in_progress' | 'pending' | 'overdue'>('all')

  useEffect(() => {
    const fetchInspections = async () => {
      setLoading(true)
      
      setTimeout(() => {
        const mockInspections: Inspection[] = [
          {
            id: '1', vehicleNumber: 'BC001', driverName: 'John Smith',
            status: 'completed', timestamp: '2024-11-10T08:30:00Z',
            defectCount: 0, score: 100, location: 'Depot A', duration: 15
          },
          {
            id: '2', vehicleNumber: 'BC003', driverName: 'Sarah Johnson',
            status: 'completed', timestamp: '2024-11-10T07:45:00Z',
            defectCount: 1, score: 95, location: 'Route 15', duration: 18
          },
          {
            id: '3', vehicleNumber: 'BC002', driverName: 'Mike Wilson',
            status: 'in_progress', timestamp: '2024-11-10T09:15:00Z',
            defectCount: 0, score: 0, location: 'Depot B', duration: 0
          },
          {
            id: '4', vehicleNumber: 'BC005', driverName: 'Emily Davis',
            status: 'completed', timestamp: '2024-11-09T16:20:00Z',
            defectCount: 2, score: 85, location: 'Service Center', duration: 22
          },
          {
            id: '5', vehicleNumber: 'BC004', driverName: 'Robert Brown',
            status: 'overdue', timestamp: '2024-11-08T14:30:00Z',
            defectCount: 0, score: 0, location: 'Depot A', duration: 0
          },
          {
            id: '6', vehicleNumber: 'BC006', driverName: 'Lisa Wilson',
            status: 'pending', timestamp: '2024-11-11T06:00:00Z',
            defectCount: 0, score: 0, location: 'Depot C', duration: 0
          }
        ]
        setInspections(mockInspections)
        setLoading(false)
      }, 1000)
    }

    fetchInspections()
  }, [])

  const filteredInspections = filter === 'all' 
    ? inspections 
    : inspections.filter(inspection => inspection.status === filter)

  const getStatusColor = (status: Inspection['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'overdue': return 'bg-red-100 text-red-800'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 95) return 'text-green-600'
    if (score >= 85) return 'text-yellow-600'
    if (score >= 70) return 'text-orange-600'
    return 'text-red-600'
  }

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }
  }

  const handleViewInspection = (inspection: Inspection) => {
    alert(`Viewing inspection details for:\n\nVehicle: ${inspection.vehicleNumber}\nDriver: ${inspection.driverName}\nStatus: ${inspection.status}\nScore: ${inspection.score}%\nDefects: ${inspection.defectCount}\n\nDetailed inspection view coming soon!`)
  }

  const handleAdvancedFilters = () => {
    alert('Advanced Filters coming soon!\n\nWill include:\n• Date range filters\n• Driver selection\n• Score range filtering\n• Location filtering\n• Custom search criteria')
  }

  const handleExportReport = () => {
    alert('Export functionality coming soon!\n\nWill support:\n• PDF reports\n• Excel spreadsheets\n• CSV data export\n• Custom date ranges')
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <ClipboardDocumentListIcon className="h-6 w-6 mr-2 text-buscor-orange" />
                Inspection Management
              </h1>
              <p className="text-gray-600 mt-1">
                Monitor and manage vehicle inspection activities
              </p>
            </div>
            <button 
              onClick={handleExportReport}
              className="btn-primary"
            >
              Export Report
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              {['all', 'completed', 'in_progress', 'pending', 'overdue'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status as any)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filter === status
                      ? 'bg-buscor-orange text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? 'All Inspections' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  {status !== 'all' && ` (${inspections.filter(i => i.status === status).length})`}
                </button>
              ))}
            </div>
            <button 
              onClick={handleAdvancedFilters}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              Advanced Filters
            </button>
          </div>
        </div>

        {/* Inspections Table */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Inspection Records ({filteredInspections.length} records)
            </h3>
          </div>
          
          {loading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vehicle & Driver
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Defects
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInspections.map((inspection) => {
                    const { date, time } = formatDateTime(inspection.timestamp)
                    return (
                      <tr key={inspection.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {inspection.vehicleNumber}
                            </div>
                            <div className="text-sm text-gray-500">
                              {inspection.driverName}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(inspection.status)}`}>
                            {inspection.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>{date}</div>
                          <div className="text-gray-500">{time}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {inspection.status === 'completed' ? (
                            <span className={`text-sm font-medium ${getScoreColor(inspection.score)}`}>
                              {inspection.score}%
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {inspection.defectCount > 0 ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              {inspection.defectCount}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">None</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {inspection.location}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button 
                            onClick={() => handleViewInspection(inspection)}
                            className="text-buscor-orange hover:text-orange-600 flex items-center"
                          >
                            <EyeIcon className="h-4 w-4 mr-1" />
                            View
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}