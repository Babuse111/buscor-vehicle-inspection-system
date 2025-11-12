'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DatabaseTestPage() {
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [inspections, setInspections] = useState<any[]>([])

  const testDatabaseConnection = async () => {
    setLoading(true)
    setStatus('Testing database connection...')
    
    try {
      // Test 1: Check connection
      const { data: testData, error: testError } = await supabase
        .from('inspections')
        .select('*')
        .limit(1)

      if (testError) {
        setStatus(`❌ Connection Error: ${testError.message}`)
        return
      }

      setStatus('✅ Database connection successful!')

      // Test 2: Insert a test record
      const testInspection = {
        vehicle_id: 'BC999',
        driver_id: 'TEST_DRIVER',
        inspection_date: new Date().toISOString(),
        mileage: 50000,
        fuel_level: 85,
        overall_status: 'completed',
        notes: 'Test inspection from admin dashboard - ' + new Date().toLocaleTimeString()
      }

      const { data: insertData, error: insertError } = await supabase
        .from('inspections')
        .insert([testInspection])
        .select()

      if (insertError) {
        setStatus(`❌ Insert Error: ${insertError.message}`)
        return
      }

      setStatus('✅ Test inspection created successfully!')

      // Fetch all inspections to show
      await fetchInspections()

    } catch (error) {
      setStatus(`❌ Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const fetchInspections = async () => {
    try {
      const { data, error } = await supabase
        .from('inspections')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        setStatus(`❌ Fetch Error: ${error.message}`)
        return
      }

      setInspections(data || [])
      setStatus(`✅ Found ${data?.length || 0} inspections in database`)
    } catch (error) {
      setStatus(`❌ Error: ${error}`)
    }
  }

  const clearTestData = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('inspections')
        .delete()
        .eq('vehicle_id', 'BC999')

      if (error) {
        setStatus(`❌ Clear Error: ${error.message}`)
        return
      }

      setStatus('✅ Test data cleared')
      await fetchInspections()
    } catch (error) {
      setStatus(`❌ Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Database Connection Test</h1>
          
          <div className="space-y-4 mb-6">
            <button
              onClick={testDatabaseConnection}
              disabled={loading}
              className="bg-buscor-orange text-white px-4 py-2 rounded-md hover:bg-orange-600 disabled:bg-gray-400"
            >
              {loading ? 'Testing...' : 'Test Database Connection'}
            </button>

            <button
              onClick={fetchInspections}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 ml-2"
            >
              Fetch All Inspections
            </button>

            <button
              onClick={clearTestData}
              disabled={loading}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:bg-gray-400 ml-2"
            >
              Clear Test Data
            </button>
          </div>

          <div className="bg-gray-100 p-4 rounded-md mb-6">
            <h3 className="font-medium mb-2">Status:</h3>
            <pre className="text-sm whitespace-pre-wrap">{status}</pre>
          </div>

          {inspections.length > 0 && (
            <div>
              <h3 className="font-medium mb-4">Inspections in Database:</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 border text-left">Vehicle ID</th>
                      <th className="px-4 py-2 border text-left">Driver ID</th>
                      <th className="px-4 py-2 border text-left">Status</th>
                      <th className="px-4 py-2 border text-left">Date</th>
                      <th className="px-4 py-2 border text-left">Mileage</th>
                      <th className="px-4 py-2 border text-left">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inspections.map((inspection) => (
                      <tr key={inspection.id} className="border-b">
                        <td className="px-4 py-2 border">{inspection.vehicle_id}</td>
                        <td className="px-4 py-2 border">{inspection.driver_id}</td>
                        <td className="px-4 py-2 border">{inspection.overall_status}</td>
                        <td className="px-4 py-2 border">
                          {new Date(inspection.inspection_date).toLocaleString()}
                        </td>
                        <td className="px-4 py-2 border">{inspection.mileage}</td>
                        <td className="px-4 py-2 border text-xs">{inspection.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}