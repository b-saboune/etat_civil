import { useEffect, useRef, useState } from 'react'
import { AlertOctagon, CheckCircle2, Info, X } from 'lucide-react'
import { retirerToast, sAbonnerAuxToasts, type ToastMessage } from '@/lib/toast'

const ICONES = {
  erreur: <AlertOctagon size={17} />,
  succes: <CheckCircle2 size={17} />,
  information: <Info size={17} />,
}

// Duree de l'animation de sortie (doit correspondre a @keyframes sortie-toast
// dans styles.css) : un toast retire du bus (lib/toast.ts) reste affiche avec
// la classe "sortant" le temps de l'animation, au lieu de disparaitre
// instantanement (vague 4 de la refonte UI : l'entree etait deja animee,
// la sortie non — demande explicite "Toast animation").
const DUREE_SORTIE_MS = 200

export default function ToastHost() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [sortants, setSortants] = useState<Set<number>>(new Set())
  const sortantsRef = useRef<Set<number>>(new Set())

  useEffect(
    () =>
      sAbonnerAuxToasts((nouveaux) => {
        const idsNouveaux = new Set(nouveaux.map((t) => t.id))
        setToasts((actuels) => {
          const disparus = actuels.filter((t) => !idsNouveaux.has(t.id) && !sortantsRef.current.has(t.id))
          if (disparus.length > 0) {
            disparus.forEach((t) => sortantsRef.current.add(t.id))
            setSortants(new Set(sortantsRef.current))
            setTimeout(() => {
              disparus.forEach((t) => sortantsRef.current.delete(t.id))
              setSortants(new Set(sortantsRef.current))
              setToasts((v) => v.filter((x) => !disparus.some((d) => d.id === x.id)))
            }, DUREE_SORTIE_MS)
          }
          const conservesEnSortie = actuels.filter((t) => sortantsRef.current.has(t.id))
          return [...nouveaux, ...conservesEnSortie]
        })
      }),
    []
  )

  if (toasts.length === 0) return null

  return (
    <div className="civilis-toast-pile" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`civilis-toast niveau-${t.niveau} ${sortants.has(t.id) ? 'sortant' : ''}`}>
          <span className="civilis-toast-icone">{ICONES[t.niveau]}</span>
          <span className="civilis-toast-texte">{t.texte}</span>
          <button className="civilis-toast-fermer" onClick={() => retirerToast(t.id)} aria-label="Fermer">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
