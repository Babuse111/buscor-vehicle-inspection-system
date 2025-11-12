import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// API endpoint to sync inspection data from mobile app
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { inspection, vehicle_id, inspector_id } = body

    // Insert inspection data into Supabase
    const { data, error } = await supabase
      .from('inspections')
      .insert([
        {
          vehicle_id,
          inspector_id,
          inspection_date: new Date().toISOString(),
          status: inspection.status || 'completed',
          score: inspection.score || 85,
          defects_found: inspection.defects_found || 0,
          safety_critical_issues: inspection.safety_critical_issues || 0,
          notes: inspection.notes || ''
        }
      ])
      .select()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Also insert inspection items if provided
    if (inspection.items && data && data[0]) {
      const inspectionItems = inspection.items.map((item: any) => ({
        inspection_id: data[0].id,
        item_name: item.name,
        category: item.category,
        status: item.status,
        notes: item.notes || null,
        photo_url: item.photo_url || null
      }))

      await supabase
        .from('inspection_items')
        .insert(inspectionItems)
    }

    return NextResponse.json({ 
      success: true, 
      inspection_id: data?.[0]?.id,
      message: 'Inspection synced successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// GET endpoint to fetch recent inspections for dashboard
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('inspections')
      .select(`
        *,
        vehicle:vehicles(*),
        inspector:users(*)
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ inspections: data })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}