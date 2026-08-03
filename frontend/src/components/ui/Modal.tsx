import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  ouvert: boolean
  onFermer: () => void
  titre: string
  children: ReactNode
  /** Pied de modale (boutons d'action). Optionnel : certaines modales sont purement informatives. */
  pied?: ReactNode
  /** Empeche la fermeture par Echap/clic sur le voile — reserve aux actions ou une confirmation
   *  explicite est requise avant toute sortie (ex. restauration en cours). */
  bloquant?: boolean
  taille?: 'md' | 'lg'
}

/**
 * Modale accessible reutilisable (WCAG 2.2 AA) :
 * - role="dialog" + aria-modal + aria-labelledby relie au titre
 * - focus deplace sur la modale a l'ouverture, restitue au declencheur a la fermeture
 * - piege du focus (Tab/Shift+Tab boucle a l'interieur tant que la modale est ouverte)
 * - fermeture par Echap et par clic sur le voile (sauf si `bloquant`)
 * - anime (fondu + leger zoom), respecte prefers-reduced-motion (regle globale existante
 *   dans styles.css qui neutralise deja toutes les animations/transitions)
 *
 * Remplace le premier usage de window.prompt()/window.confirm() de l'application
 * (restauration de sauvegarde, RG-PAR-001) par un composant coherent avec l'identite
 * visuelle CIVILIS plutot qu'une boite de dialogue systeme non stylable.
 */
export default function Modal({ ouvert, onFermer, titre, children, pied, bloquant = false, taille = 'md' }: ModalProps) {
  const conteneurRef = useRef<HTMLDivElement>(null)
  const declencheurRef = useRef<Element | null>(null)
  const titreId = useRef(`modal-titre-${Math.random().toString(36).slice(2, 9)}`).current

  useEffect(() => {
    if (!ouvert) return
    declencheurRef.current = document.activeElement

    const noeud = conteneurRef.current
    const premierFocusable = noeud?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    premierFocusable?.focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !bloquant) {
        e.stopPropagation()
        onFermer()
        return
      }
      if (e.key === 'Tab' && noeud) {
        const focusables = Array.from(
          noeud.querySelectorAll<HTMLElement>(
            'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
          )
        )
        if (focusables.length === 0) return
        const premier = focusables[0]
        const dernier = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === premier) {
          e.preventDefault()
          dernier.focus()
        } else if (!e.shiftKey && document.activeElement === dernier) {
          e.preventDefault()
          premier.focus()
        }
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      document.body.style.overflow = previousOverflow
      if (declencheurRef.current instanceof HTMLElement) declencheurRef.current.focus()
    }
  }, [ouvert, onFermer, bloquant])

  if (!ouvert) return null

  return (
    <div
      className="civilis-modal-voile"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !bloquant) onFermer()
      }}
    >
      <div
        ref={conteneurRef}
        className={`civilis-modal civilis-modal-${taille}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titreId}
      >
        <div className="civilis-modal-entete">
          <h2 id={titreId}>{titre}</h2>
          {!bloquant && (
            <button type="button" className="civilis-modal-fermer" onClick={onFermer} aria-label="Fermer">
              <X size={17} />
            </button>
          )}
        </div>
        <div className="civilis-modal-corps">{children}</div>
        {pied && <div className="civilis-modal-pied">{pied}</div>}
      </div>
    </div>
  )
}
