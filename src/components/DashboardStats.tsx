'use client'

import { useState, useEffect } from 'react'
import { CheckCircleIcon, ExclamationTriangleIcon, TruckIcon, ClockIcon } from '@heroicons/react/24/outline'

interface StatsData {
  totalVehicles: number
  activeInspections: number
  criticalDefects: number
  completedToday: number
}

export default function DashboardStats() {
  const [stats, setStats] = useState<StatsData>({
    totalVehicles: 0,
    activeInspections: 0,
    criticalDefects: 0,
    completedToday: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate API call - replace with real data
    const fetchStats = async () => {
      setLoading(true)
      
      // Mock data
      setTimeout(() => {
        setStats({
          totalVehicles: 45,
          activeInspections: 12,
          criticalDefects: 3,
          completedToday: 8
        })
        setLoading(false)
      }, 1000)
    }

    fetchStats()
  }, [])

  const statCards = [
    {
      title: 'Total Vehicles',
      value: stats.totalVehicles,
      icon: TruckIcon,
      change: '+2',
      changeType: 'positive',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200'
    },
    {
      title: 'Active Inspections',
      value: stats.activeInspections,
      icon: ClockIcon,
      change: '+5',
      changeType: 'positive',
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      borderColor: 'border-yellow-200'
    },
    {
      title: 'Critical Defects',
      value: stats.criticalDefects,
      icon: ExclamationTriangleIcon,
      change: '-2',
      changeType: 'negative',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      borderColor: 'border-red-200'
    },
    {
      title: 'Completed Today',
      value: stats.completedToday,
      icon: CheckCircleIcon,
      change: '+3',
      changeType: 'positive',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      borderColor: 'border-green-200'
    }
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              <div className="ml-4 flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <div
          key={index}
          className={`bg-white rounded-lg shadow-sm border ${stat.borderColor} p-6 hover:shadow-md transition-shadow`}
        >
          <div className="flex items-center">
            <div className={`flex-shrink-0 p-3 ${stat.bgColor} rounded-lg`}>
              <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <div className="flex items-baseline">
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                <span
                  className={`ml-2 text-sm font-medium ${
                    stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {stat.change}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}