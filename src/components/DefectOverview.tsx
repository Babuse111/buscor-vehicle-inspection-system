'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ExclamationTriangleIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline'

interface Defect {
  id: string
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  count: number
  vehicles: string[]
  lastReported: string
}

export default function DefectOverview() {
  const [defects, setDefects] = useState<Defect[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Mock data - replace with API call
    const fetchDefects = async () => {
      setLoading(true)
      
      setTimeout(() => {
        const mockDefects: Defect[] = [
          {
            id: '1',
            type: 'Brake Issues',
            severity: 'critical',
            count: 2,
            vehicles: ['BC002', 'BC004'],
            lastReported: '2024-11-10T06:30:00Z'
          },
          {
            id: '2',
            type: 'Tire Wear',
            severity: 'high',
            count: 3,
            vehicles: ['BC001', 'BC003', 'BC005'],
            lastReported: '2024-11-09T14:15:00Z'
          },
          {
            id: '3',
            type: 'Light Malfunction',
            severity: 'medium',
            count: 1,
            vehicles: ['BC003'],
            lastReported: '2024-11-09T10:20:00Z'
          },
          {
            id: '4',
            type: 'Mirror Adjustment',
            severity: 'low',
            count: 2,
            vehicles: ['BC001', 'BC002'],
            lastReported: '2024-11-08T16:45:00Z'
          }
        ]
        setDefects(mockDefects)
        setLoading(false)
      }, 900)
    }

    fetchDefects()
  }, [])

  const getSeverityColor = (severity: Defect['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const getSeverityIcon = (severity: Defect['severity']) => {
    if (severity === 'critical' || severity === 'high') {
      return <ShieldExclamationIcon className="h-5 w-5 text-red-500" />
    }
    return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
  }

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Defect Overview</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-5 h-5 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="w-12 h-6 bg-gray-200 rounded-full"></div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const totalDefects = defects.reduce((sum, defect) => sum + defect.count, 0)

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Defect Overview</h3>
            <p className="text-sm text-gray-600">Safety issues requiring attention</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-red-600">{totalDefects}</p>
            <p className="text-xs text-gray-500">Total Issues</p>
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {defects.map((defect) => (
            <div key={defect.id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 pt-1">
                    {getSeverityIcon(defect.severity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <p className="text-sm font-medium text-gray-900">{defect.type}</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(defect.severity)}`}>
                        {defect.severity}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>{defect.count} incidents</span>
                      <span>Vehicles: {defect.vehicles.join(', ')}</span>
                      <span>{formatTimeAgo(defect.lastReported)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-red-100 text-red-800 text-xs font-bold rounded-full">
                    {defect.count}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {defects.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            <ExclamationTriangleIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p>No defects reported</p>
          </div>
        )}

        <div className="mt-6">
          <button 
            onClick={() => router.push('/reports')}
            className="w-full text-center text-sm text-buscor-orange hover:text-orange-600 font-medium"
          >
            View Detailed Report →
          </button>
        </div>
      </div>
    </div>
  )
}