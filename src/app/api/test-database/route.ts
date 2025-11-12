import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Test API endpoint to verify Supabase connection and insert test data
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Testing Supabase connection...')

    // Test 2: Insert a test inspection using the mobile app's field structure
    const testInspection = {
      vehicle_id: 'TEST001',
      driver_id: 'test_driver_id', // Use driver_id as per schema
      inspection_date: new Date().toISOString(),
      mileage: 45000,
      fuel_level: 75,
      overall_status: 'pending',
      notes: 'Test inspection created from admin dashboard'
    }

    const { data: insertedData, error: insertError } = await supabase
      .from('inspections')
      .insert([testInspection])
      .select()

    if (insertError) {
      console.error('❌ Insert failed:', insertError)
      return NextResponse.json({ 
        error: 'Failed to insert test data', 
        details: insertError 
      }, { status: 500 })
    }

    console.log('✅ Test inspection inserted:', insertedData)

    return NextResponse.json({ 
      success: true,
      message: 'Test inspection created successfully',
      data: insertedData
    })

  } catch (error) {
    console.error('❌ API error:', error)
    return NextResponse.json({ 
      error: 'Server error', 
      details: error 
    }, { status: 500 })
  }
}

// GET endpoint to list all inspections for debugging
export async function GET() {
  try {
    console.log('📋 Fetching all inspections for debugging...')

    const { data, error } = await supabase
      .from('inspections')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`📊 Found ${data?.length || 0} total inspections`)
    
    return NextResponse.json({ 
      success: true,
      count: data?.length || 0,
      inspections: data || []
    })

  } catch (error) {
    console.error('❌ API error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}