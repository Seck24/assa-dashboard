const BASE = 'https://automation.preo-ia.info/webhook'

async function post<T>(path: string, body: object): Promise<T> {
  const res = await fetch(`${BASE}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  return data
}

// Auth — passe par les API routes locales (rate limited, URL n8n cachée)
async function authPost<T>(path: string, body: object): Promise<T> {
  const res = await fetch(`/api/auth/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json() as Promise<T>
}

export async function checkAccess(uid: string) {
  return post<{ access_granted: boolean; account_status: string; trial_remaining_days: number; message: string }>('access-check', { uid })
}

export async function login(telephone: string, mot_de_passe: string) {
  return authPost<{ success: boolean; uid: string; nom_commerce: string; error?: string; data?: { uid: string; nom_commerce: string } }>('login', {
    telephone,
    mot_de_passe,
  })
}

export async function inscription(telephone: string, mot_de_passe: string, nom_commerce: string, ville_commune: string, nom_complet = '', code_commercial = '') {
  return authPost<{ success: boolean; uid: string; nom_commerce: string; error?: string; data?: { uid: string; nom_commerce: string } }>('register', {
    telephone,
    mot_de_passe,
    nom_commerce,
    ville_commune,
    nom_complet,
    code_commercial,
  })
}

export async function resetPassword(telephone: string, mot_de_passe: string) {
  return authPost<{ success: boolean; message: string }>('reset', {
    telephone,
    mot_de_passe,
  })
}

// Rapport
export interface Vente {
  nom_affiche: string
  quantite: number
  sous_total: number  // CA = prix_vente * quantite
  marge: number       // marge totale
}

export interface Depense {
  uid: string
  categorie: string
  description: string
  montant: number
  date_depense: string
}

export interface Rapport {
  total_marge: number
  total_depenses: number
  benefice_net: number
  chiffre_affaires?: number
  ventes: Vente[]
  depenses: Depense[]
}

export async function getRapport(user_uid: string, date_debut: string, date_fin: string) {
  return post<Rapport>('assa-rapport', { user_uid, date_debut, date_fin })
}

// Produits
export interface Produit {
  uid: string
  nom: string
  stock_actuel: number
  seuil_alerte: number
  unite: string
  prix_vente_defaut: number
}

export async function getProduits(user_uid: string) {
  return post<{ success: boolean; produits: Produit[] }>('list-produits', { user_uid })
}

// Stats serveurs
export interface StatServeur {
  nom_serveur: string
  ca_total: number
  nb_ventes: number
}

export async function getStatsServeurs(user_uid: string, date_debut: string, date_fin: string) {
  return post<{ success: boolean; serveurs: StatServeur[] }>('stats-serveurs', { user_uid, date_debut, date_fin })
}

// Rappels
export interface Rappel {
  uid: string
  titre: string
  description: string
  date_limite: string
}

// Activation par capture de paiement
export async function activerParCapture(uid: string, telephone: string, image: File) {
  const formData = new FormData()
  formData.append('uid', uid)
  formData.append('telephone', telephone)
  formData.append('capture', image)
  const res = await fetch(`${BASE}/activation-capture`, {
    method: 'POST',
    body: formData,
  })
  return res.json() as Promise<{ success: boolean; message: string }>
}

export async function effacerDonnees(user_uid: string) {
  return post<{ success: boolean }>('effacer-donnees', { user_uid })
}

export async function getRappels(user_uid: string) {
  return post<{ success: boolean; rappels: Rappel[] }>('list-rappels', { user_uid })
}

// Livraisons
export interface Livraison {
  id: string
  produit_uid: string
  nom_produit: string
  quantite: number
  date_livraison: string
}

export async function getLivraisons(user_uid: string) {
  return post<{ success: boolean; livraisons: Livraison[] }>('list-livraisons-v2', { user_uid })
}

export async function addLivraison(user_uid: string, uid: string, total_unites: number) {
  return post<{ uid: string; nom: string; stock_actuel: number }>('enregistrer-livraison', {
    user_uid,
    uid,
    total_unites,
  })
}

// Inventaires
export interface Inventaire {
  id: string
  produit_uid: string
  nom_produit: string
  stock_actuel: number
  stock_compte: number
  ecart: number
  date_inventaire: string
}

export async function getInventaires(user_uid: string) {
  return post<{ success: boolean; inventaires: Inventaire[] }>('list-inventaires-v2', { user_uid })
}

export async function updateInventaire(user_uid: string, uid: string, stock_actuel: number) {
  return post<{ uid: string; nom: string; stock_actuel: number }>('enregistrer-inventaire', {
    user_uid,
    uid,
    stock_actuel,
  })
}
