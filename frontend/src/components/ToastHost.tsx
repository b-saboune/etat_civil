import { useEffect, useState } from 'react'
import { AlertOctagon, CheckCircle2, Info, X } from 'lucide-react'
import { retirerToast, sAbonnerAuxToasts, type ToastMessage } from '@/lib/toast'

const ICONES = {
  erreur: <AlertOctagon size={17} />,
  succes: <CheckCircle2 size={17} />,
  information: <Info size={17} />,
}

/** Monte une seule fois (dans App.tsx) : affiche les toasts emis depuis n'importe
 *  ou dans l'application (voir lib/toast.ts), notamment les echecs d'appel API
 *  qui autrement passaient totalement inapercus. */
export default function ToastHost() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(() => sAbonnerAuxToasts(setToasts), [])

  if (toasts.length === 0) return null

  return (
    <div className="civilis-toast-pile" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`civilis-toast niveau-${t.niveau}`}>
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
