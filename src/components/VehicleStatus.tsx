'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TruckIcon, CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { supabase, Vehicle } from '../lib/supabase'

export default function VehicleStatus() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchVehicles()
  }, [])

  const fetchVehicles = async () => {
    try {
      setLoading(true)
      
      // Fetch vehicles from Supabase
      const { data: vehicleData, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) {
        console.error('Error fetching vehicles:', error)
        // Fall back to mock data if Supabase fails
        setVehicles([
          {
            id: '1',
            license_plate: 'BC001',
            vehicle_type: 'Bus',
            make: 'Mercedes',
            model: 'Sprinter',
            year: 2022,
            mileage: 45000,
            status: 'active',
            last_inspection: '2024-11-10',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
      } else {
        setVehicles(vehicleData || [])
      }
    } catch (err) {
      console.error('Error:', err)
      // Fallback to mock data
      setVehicles([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: Vehicle['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'maintenance':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
      case 'retired':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      default:
        return <TruckIcon className="h-5 w-5 text-blue-500" />
    }
  }

  const getStatusColor = (status: Vehicle['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800'
      case 'retired':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  const getStatusLabel = (status: Vehicle['status']) => {
    switch (status) {
      case 'active':
        return 'Active'
      case 'maintenance':
        return 'Maintenance'
      case 'retired':
        return 'Retired'
      default:
        return 'Unknown'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Vehicle Status</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Vehicle Status</h3>
        <p className="text-sm text-gray-600">Current fleet status overview</p>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {getStatusIcon(vehicle.status)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900">{vehicle.license_plate}</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                      {getStatusLabel(vehicle.status)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                    <span>{vehicle.vehicle_type || 'Bus'}</span>
                    <span>{vehicle.make} {vehicle.model}</span>
                    <span>Last: {vehicle.last_inspection ? new Date(vehicle.last_inspection).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {vehicle.mileage ? vehicle.mileage.toLocaleString() : '0'} km
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <button 
            onClick={() => router.push('/vehicles')}
            className="w-full text-center text-sm text-buscor-orange hover:text-orange-600 font-medium"
          >
            View All Vehicles →
          </button>
        </div>
      </div>
    </div>
  )
}