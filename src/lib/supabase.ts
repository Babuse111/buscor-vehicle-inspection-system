import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types for TypeScript
export interface Vehicle {
  id: string
  license_plate: string
  vehicle_type: string
  make: string
  model: string
  year: number
  mileage: number
  status: 'active' | 'maintenance' | 'retired'
  last_inspection: string
  created_at: string
  updated_at: string
}

export interface Inspection {
  id: string
  vehicle_id: string
  driver_id: string
  inspection_date: string
  mileage: number
  fuel_level: number
  overall_status: 'pending' | 'completed' | 'failed'
  notes: string
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  employee_id: string
  name: string
  email: string
  role: string
  department: string
  phone?: string
  created_at: string
  updated_at: string
}

export interface InspectionItem {
  id: string
  inspection_id: string
  item_name: string
  category: string
  status: 'pass' | 'fail' | 'na'
  notes?: string
  photo_url?: string
  created_at: string
}