import { useState } from 'react'
import { today } from './format'

export function useDateRange(key: string) {
  const storageKey = `dateRange_${key}`

  function read(): { debut: string; fin: string } {
    try {
      const stored = sessionStorage.getItem(storageKey)
      if (stored) return JSON.parse(stored)
    } catch {}
    const t = today()
    return { debut: t, fin: t }
  }

  const initial = read()
  const [dateDebut, _setDateDebut] = useState(initial.debut)
  const [dateFin, _setDateFin] = useState(initial.fin)

  function setDateDebut(v: string) {
    _setDateDebut(v)
    try { sessionStorage.setItem(storageKey, JSON.stringify({ debut: v, fin: dateFin })) } catch {}
  }

  function setDateFin(v: string) {
    _setDateFin(v)
    try { sessionStorage.setItem(storageKey, JSON.stringify({ debut: dateDebut, fin: v })) } catch {}
  }

  function setRange(debut: string, fin: string) {
    _setDateDebut(debut)
    _setDateFin(fin)
    try { sessionStorage.setItem(storageKey, JSON.stringify({ debut, fin })) } catch {}
  }

  return { dateDebut, dateFin, setDateDebut, setDateFin, setRange }
}
