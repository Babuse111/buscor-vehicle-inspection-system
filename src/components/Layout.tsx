'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Bars3Icon, BellIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    router.push('/login')
  }

  const handleNotifications = () => {
    alert('Notifications feature coming soon!\n\nThis will show:\n• Inspection alerts\n• Vehicle maintenance reminders\n• System notifications\n• Critical safety issues')
  }

  const navigation = [
    { name: 'Dashboard', href: '/', current: pathname === '/' },
    { name: 'Vehicles', href: '/vehicles', current: pathname === '/vehicles' },
    { name: 'Inspections', href: '/inspections', current: pathname === '/inspections' },
    { name: 'Reports', href: '/reports', current: pathname === '/reports' },
    { name: 'Settings', href: '/settings', current: pathname === '/settings' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="buscor-header shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            {/* Logo and Title */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="flex items-center">
                  <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center p-2 hover:bg-gray-50 transition-colors">
                    <Image
                      src="/buscor-logo.png"
                      alt="Buscor Logo"
                      width={40}
                      height={40}
                      className="object-contain"
                    />
                  </div>
                  <div className="ml-3">
                    <h1 className="text-xl font-bold text-white">Buscor Admin</h1>
                  </div>
                </Link>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    item.current
                      ? 'bg-white/20 text-white'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Right side buttons */}
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleNotifications}
                className="text-white/80 hover:text-white p-2 relative"
                title="Notifications"
              >
                <BellIcon className="h-6 w-6" />
                {/* Notification badge - optional for future use */}
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>
              <button 
                onClick={() => router.push('/settings')}
                className="text-white/80 hover:text-white p-2"
                title="Settings"
              >
                <Cog6ToothIcon className="h-6 w-6" />
              </button>
              <button
                onClick={handleLogout}
                className="text-white/80 hover:text-white p-2"
                title="Logout"
              >
                <ArrowRightOnRectangleIcon className="h-6 w-6" />
              </button>

              {/* Mobile menu button */}
              <button
                className="md:hidden text-white p-2"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {sidebarOpen && (
          <div className="md:hidden bg-white/10 backdrop-blur-sm">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    item.current
                      ? 'bg-white/20 text-white'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}