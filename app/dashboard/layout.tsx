'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { checkAccess } from '@/lib/api'

const tabs = [
  { href: '/dashboard',           label: 'Accueil',  icon: '🏠' },
  { href: '/dashboard/stock',     label: 'Stock',    icon: '📦' },
  { href: '/dashboard/ventes',    label: 'Ventes',   icon: '💰' },
  { href: '/dashboard/depenses',  label: 'Dépenses', icon: '📉' },
  { href: '/dashboard/rappels',   label: 'Serveurs', icon: '👤' },
]

const pageTitles: Record<string, string> = {
  '/dashboard':              'Accueil',
  '/dashboard/stock':        'Stock',
  '/dashboard/ventes':       'Ventes',
  '/dashboard/depenses':     'Dépenses',
  '/dashboard/rappels':      'Serveurs',
  '/dashboard/livraisons':   'Livraisons',
  '/dashboard/inventaires':  'Inventaires',
  '/dashboard/activer':      'Activation',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [nom, setNom] = useState('')
  const [animClass, setAnimClass] = useState('')
  const pageTitle = pageTitles[pathname] ?? ''

  // Swipe
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

  useEffect(() => {
    const s = getSession()
    if (!s) { router.replace('/login'); return }
    setNom(s.nom_commerce)

    // Vérifier si le compte est actif — si non, rediriger vers /dashboard/activer
    if (pathname !== '/dashboard/activer') {
      checkAccess(s.uid).then(res => {
        if (!res.access_granted) {
          router.replace('/dashboard/activer')
        }
      }).catch(() => {})
    }
  }, [router, pathname])

  function navigate(href: string, direction: 'left' | 'right') {
    setAnimClass(direction === 'left' ? 'animate-slide-left' : 'animate-slide-right')
    router.push(href)
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    if (Math.abs(dy) > Math.abs(dx) * 0.8) return
    if (Math.abs(dx) < 60) return

    const currentIdx = tabs.findIndex(t => t.href === pathname)
    if (currentIdx === -1) return

    if (dx < 0 && currentIdx < tabs.length - 1) {
      navigate(tabs[currentIdx + 1].href, 'left')
    } else if (dx > 0 && currentIdx > 0) {
      navigate(tabs[currentIdx - 1].href, 'right')
    }

    touchStartX.current = null
    touchStartY.current = null
  }

  const isActiverPage = pathname === '/dashboard/activer'

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
        <span className="text-brand font-bold text-lg w-14">ASSA</span>
        <span className="text-white font-semibold text-sm flex-1 text-center">{pageTitle}</span>
        <span className="text-gray-300 text-sm truncate w-14 text-right">{nom}</span>
      </header>

      {/* Content */}
      <main
        key={pathname}
        className={`flex-1 overflow-y-auto ${isActiverPage ? '' : 'pb-20'} ${animClass}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onAnimationEnd={() => setAnimClass('')}
      >
        {children}
      </main>

      {/* Bottom nav — masquée sur la page d'activation */}
      {!isActiverPage && (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-gray-900 border-t border-gray-800 safe-bottom z-10">
          <div className="flex">
            {tabs.map(tab => {
              const active = pathname === tab.href
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  onClick={() => {
                    const currentIdx = tabs.findIndex(t => t.href === pathname)
                    const targetIdx  = tabs.findIndex(t => t.href === tab.href)
                    if (targetIdx > currentIdx) setAnimClass('animate-slide-left')
                    else if (targetIdx < currentIdx) setAnimClass('animate-slide-right')
                  }}
                  className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-xs transition-colors ${
                    active ? 'text-white' : 'text-gray-500'
                  }`}
                >
                  <span className={`text-lg leading-none ${active ? 'bg-brand rounded-md px-1.5 py-0.5' : ''}`}>
                    {tab.icon}
                  </span>
                  <span className={active ? 'text-brand font-semibold' : ''}>{tab.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      )}
    </div>
  )
}
