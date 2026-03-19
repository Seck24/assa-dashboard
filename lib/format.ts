export function formatMoney(amount: number | string): string {
  const n = Number(amount)
  if (isNaN(n)) return '—'
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n) + ' FCFA'
}

export function formatDate(raw: string): string {
  if (!raw) return '—'
  // Handle DD/MM/YYYY HH:mm:ss or DD/MM/YYYY
  const ddmmyyyy = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (ddmmyyyy) {
    return `${ddmmyyyy[1]}/${ddmmyyyy[2]}/${ddmmyyyy[3]}`
  }
  const d = new Date(raw)
  if (isNaN(d.getTime())) return raw
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function today(): string {
  return new Date().toISOString().split('T')[0]
}

export function firstDayOfMonth(): string {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]
}
