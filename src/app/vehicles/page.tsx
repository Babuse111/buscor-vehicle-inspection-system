'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { TruckIcon, PlusIcon, FunnelIcon } from '@heroicons/react/24/outline'

interface Vehicle {
  id: string
  number: string
  type: string
  status: 'active' | 'maintenance' | 'inspection' | 'out_of_service'
  lastInspection: string
  nextInspection: string
  defectCount: number
  driver?: string
  mileage: number
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'maintenance' | 'inspection' | 'out_of_service'>('all')

  useEffect(() => {
    const fetchVehicles = async () => {
      setLoading(true)
      
      // Mock data - replace with API call
      setTimeout(() => {
        const mockVehicles: Vehicle[] = [
          {
            id: '1', number: 'BC001', type: 'Bus', status: 'active',
            lastInspection: '2024-11-10', nextInspection: '2024-11-17',
            defectCount: 0, driver: 'John Smith', mileage: 45678
          },
          {
            id: '2', number: 'BC002', type: 'Bus', status: 'maintenance',
            lastInspection: '2024-11-09', nextInspection: '2024-11-16',
            defectCount: 2, mileage: 52341
          },
          {
            id: '3', number: 'BC003', type: 'Bus', status: 'inspection',
            lastInspection: '2024-11-08', nextInspection: '2024-11-15',
            defectCount: 1, driver: 'Sarah Johnson', mileage: 38945
          },
          {
            id: '4', number: 'BC004', type: 'Van', status: 'out_of_service',
            lastInspection: '2024-11-05', nextInspection: '2024-11-12',
            defectCount: 5, mileage: 67823
          },
          {
            id: '5', number: 'BC005', type: 'Bus', status: 'active',
            lastInspection: '2024-11-09', nextInspection: '2024-11-16',
            defectCount: 0, driver: 'Emily Davis', mileage: 41256
          }
        ]
        setVehicles(mockVehicles)
        setLoading(false)
      }, 800)
    }

    fetchVehicles()
  }, [])

  const filteredVehicles = filter === 'all' 
    ? vehicles 
    : vehicles.filter(vehicle => vehicle.status === filter)

  const getStatusColor = (status: Vehicle['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'maintenance': return 'bg-yellow-100 text-yellow-800'
      case 'inspection': return 'bg-blue-100 text-blue-800'
      case 'out_of_service': return 'bg-red-100 text-red-800'
    }
  }

  const handleAddVehicle = () => {
    alert('Add Vehicle functionality coming soon!\n\nWill include:\n• Vehicle registration form\n• Driver assignment\n• Maintenance schedule setup\n• Initial inspection booking')
  }

  const handleViewDetails = (vehicle: Vehicle) => {
    alert(`Vehicle Details for ${vehicle.number}:\n\nType: ${vehicle.type}\nStatus: ${vehicle.status}\nDriver: ${vehicle.driver || 'Unassigned'}\nMileage: ${vehicle.mileage.toLocaleString()} km\nLast Inspection: ${vehicle.lastInspection}\nNext Inspection: ${vehicle.nextInspection}\nDefects: ${vehicle.defectCount}\n\nDetailed view coming soon!`)
  }

  const handleEditVehicle = (vehicle: Vehicle) => {
    alert(`Edit Vehicle ${vehicle.number}:\n\nEdit functionality coming soon!\n\nWill allow editing:\n• Vehicle information\n• Driver assignment\n• Status updates\n• Maintenance schedules`)
  }

  const handleMoreFilters = () => {
    alert('Advanced Filters coming soon!\n\nWill include:\n• Vehicle type filtering\n• Mileage range\n• Driver assignment status\n• Inspection due dates\n• Custom search')
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <TruckIcon className="h-6 w-6 mr-2 text-buscor-orange" />
                Vehicle Fleet Management
              </h1>
              <p className="text-gray-600 mt-1">
                Manage and monitor your complete vehicle fleet
              </p>
            </div>
            <button 
              onClick={handleAddVehicle}
              className="btn-primary flex items-center"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Vehicle
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              {['all', 'active', 'maintenance', 'inspection', 'out_of_service'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status as any)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filter === status
                      ? 'bg-buscor-orange text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? 'All Vehicles' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  {status !== 'all' && ` (${vehicles.filter(v => v.status === status).length})`}
                </button>
              ))}
            </div>
            <button 
              onClick={handleMoreFilters}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              More Filters
            </button>
          </div>
        </div>

        {/* Vehicle List */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Fleet Overview ({filteredVehicles.length} vehicles)
            </h3>
          </div>
          
          {loading ? (
            <div className="p-6">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center p-4 border border-gray-100 rounded-lg">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg mr-4"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredVehicles.map((vehicle) => (
                <div key={vehicle.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 bg-buscor-orange rounded-lg flex items-center justify-center">
                          {/* Better Bus Icon */}
                          <svg className="h-10 w-10 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 6c0-1.1.9-2 2-2h12c1.1 0 2 .9 2 2v2H4V6zm0 3h16v7c0 1.1-.9 2-2 2h-1c0 1.1-.9 2-2 2s-2-.9-2-2H9c0 1.1-.9 2-2 2s-2-.9-2-2H4c-1.1 0-2-.9-2-2V9zm2 6.5c.8 0 1.5-.7 1.5-1.5s-.7-1.5-1.5-1.5S4.5 13.2 4.5 14s.7 1.5 1.5 1.5zm12 0c.8 0 1.5-.7 1.5-1.5s-.7-1.5-1.5-1.5-1.5.7-1.5 1.5.7 1.5 1.5 1.5zM7 6.5v1h2v-1H7zm3 0v1h4v-1h-4zm5 0v1h2v-1h-2z"/>
                          </svg>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{vehicle.number}</h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                            {vehicle.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                          {vehicle.defectCount > 0 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              {vehicle.defectCount} defects
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Type:</span> {vehicle.type}
                          </div>
                          <div>
                            <span className="font-medium">Driver:</span> {vehicle.driver || 'Unassigned'}
                          </div>
                          <div>
                            <span className="font-medium">Mileage:</span> {vehicle.mileage.toLocaleString()} km
                          </div>
                          <div>
                            <span className="font-medium">Next Inspection:</span> {vehicle.nextInspection}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleViewDetails(vehicle)}
                        className="px-3 py-1 text-sm text-buscor-orange hover:text-orange-600 font-medium"
                      >
                        View Details
                      </button>
                      <button 
                        onClick={() => handleEditVehicle(vehicle)}
                        className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}