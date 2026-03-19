export interface Pays {
  nom: string
  code: string
  flag: string
}

export const PAYS: Pays[] = [
  { nom: "Côte d'Ivoire", code: '+225', flag: '🇨🇮' },
  { nom: 'Sénégal',       code: '+221', flag: '🇸🇳' },
  { nom: 'Mali',          code: '+223', flag: '🇲🇱' },
  { nom: 'Burkina Faso',  code: '+226', flag: '🇧🇫' },
  { nom: 'Guinée',        code: '+224', flag: '🇬🇳' },
  { nom: 'Togo',          code: '+228', flag: '🇹🇬' },
  { nom: 'Bénin',         code: '+229', flag: '🇧🇯' },
  { nom: 'Niger',         code: '+227', flag: '🇳🇪' },
  { nom: 'Cameroun',      code: '+237', flag: '🇨🇲' },
  { nom: 'Congo',         code: '+242', flag: '🇨🇬' },
  { nom: 'RD Congo',      code: '+243', flag: '🇨🇩' },
  { nom: 'Gabon',         code: '+241', flag: '🇬🇦' },
  { nom: 'Tchad',         code: '+235', flag: '🇹🇩' },
  { nom: 'Centrafrique',  code: '+236', flag: '🇨🇫' },
  { nom: 'Guinée-Bissau', code: '+245', flag: '🇬🇼' },
  { nom: 'Madagascar',    code: '+261', flag: '🇲🇬' },
  { nom: 'Maroc',         code: '+212', flag: '🇲🇦' },
  { nom: 'Algérie',       code: '+213', flag: '🇩🇿' },
  { nom: 'Tunisie',       code: '+216', flag: '🇹🇳' },
]

/** Combine indicatif + numéro local → format E.164 ex: +2250708063437 */
export function buildPhone(code: string, local: string): string {
  const digits = local.replace(/\s/g, '')
  return `${code}${digits}`
}
