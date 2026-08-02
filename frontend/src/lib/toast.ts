// Correctif systemique : la plupart des pages faisaient `apiClient.get(...).then(...).finally(...)`
// sans jamais de `.catch()` -> en cas d'erreur reseau/serveur (ex. 500), l'ecran affichait
// silencieusement "Aucun ... enregistre" au lieu de signaler l'echec (constate en test reel sur
// /registres et /referentiels). Plutot que de dupliquer un traitement d'erreur dans chaque page,
// ce petit bus d'evenements centralise l'affichage : l'intercepteur de reponse de apiClient (voir
// api/client.ts) emet un toast des qu'une requete echoue, sans que chaque page ait besoin de s'en
// preoccuper individuellement.

export type NiveauToast = 'erreur' | 'succes' | 'information'

export interface ToastMessage {
  id: number
  niveau: NiveauToast
  texte: string
}

type Abonne = (toasts: ToastMessage[]) => void

let compteur = 0
let toasts: ToastMessage[] = []
const abonnes = new Set<Abonne>()

function notifier() {
  abonnes.forEach((fn) => fn(toasts))
}

export function afficherToast(texte: string, niveau: NiveauToast = 'information', dureeMs = 6000) {
  const id = ++compteur
  toasts = [...toasts, { id, niveau, texte }]
  notifier()
  if (dureeMs > 0) {
    setTimeout(() => retirerToast(id), dureeMs)
  }
  return id
}

export function retirerToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id)
  notifier()
}

export function sAbonnerAuxToasts(fn: Abonne) {
  abonnes.add(fn)
  fn(toasts)
  return () => {
    abonnes.delete(fn)
  }
}
