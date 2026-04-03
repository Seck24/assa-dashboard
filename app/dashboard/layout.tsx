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
      {/* ── Header — Obsidian Sommelier ───────────────────── */}
      <header
        className="flex items-center justify-between px-4 py-3 sticky top-0 z-10"
        style={{
          background: 'rgba(14,14,14,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          boxShadow: '0 1px 24px rgba(0,0,0,0.5)',
        }}
      >
        <span
          className="font-display font-bold text-base w-14"
          style={{ color: '#00c853', fontFamily: 'Manrope, sans-serif', letterSpacing: '0.04em' }}
        >
          ASSA
        </span>
        <span
          className="font-semibold text-sm flex-1 text-center"
          style={{ fontFamily: 'Manrope, sans-serif', color: '#ffffff', letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: '0.75rem' }}
        >
          {pageTitle}
        </span>
        <span className="text-sm truncate w-14 text-right" style={{ color: '#adaaaa', fontFamily: 'Inter, sans-serif', fontSize: '0.75rem' }}>
          {nom}
        </span>
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

      {/* ── Bottom nav — glass obsidian ───────────────────── */}
      {!isActiverPage && (
        <nav
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md safe-bottom z-10"
          style={{
            background: 'rgba(14,14,14,0.88)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderTop: '1px solid rgba(255,255,255,0.05)',
          }}
        >
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
                  className="flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-colors"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  <span
                    className="text-lg leading-none"
                    style={active ? {
                      background: 'rgba(0,200,83,0.15)',
                      borderRadius: 8,
                      padding: '4px 8px',
                      boxShadow: '0 0 12px rgba(0,200,83,0.20)',
                    } : {}}
                  >
                    {tab.icon}
                  </span>
                  <span
                    className="text-xs font-semibold"
                    style={{ color: active ? '#00c853' : '#777575' }}
                  >
                    {tab.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </nav>
      )}
    </div>
  )
}
