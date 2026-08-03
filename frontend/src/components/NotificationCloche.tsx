import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Info, AlertTriangle, AlertOctagon } from 'lucide-react'
import { apiClient } from '@/api/client'
import type { NotificationDTO } from '@/types'

const ICONES: Record<NotificationDTO['niveau'], React.ReactNode> = {
  INFORMATION: <Info size={15} />,
  ATTENTION: <AlertTriangle size={15} />,
  CRITIQUE: <AlertOctagon size={15} />,
}

/**
 * Cloche de notifications internes (section 20/46 du Prompt Maitre V3) :
 * trois niveaux (information/attention/critique), chaque notification peut
 * porter un lien de contexte -> action. Rafraichissement au montage et a
 * l'ouverture du menu, volontairement sans polling continu (coherent avec
 * l'architecture "modular monolith" simple visee au Palier 1).
 */
export default function NotificationCloche() {
  const [notifications, setNotifications] = useState<NotificationDTO[]>([])
  const [nonLues, setNonLues] = useState(0)
  const [ouvert, setOuvert] = useState(false)
  const conteneurRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const charger = () => {
    apiClient.get<NotificationDTO[]>('/notifications').then(({ data }) => setNotifications(data)).catch(() => {})
    apiClient.get<{ nombre: number }>('/notifications/nombre-non-lues').then(({ data }) => setNonLues(data.nombre)).catch(() => {})
  }

  useEffect(() => {
    charger()
  }, [])

  // Accessibilite du menu deroulant (vague 2 de la refonte UI) : fermeture au
  // clic exterieur (deja present) ET a la touche Echap (manquante), comme
  // pour la modale generique -- coherence attendue pour tout menu deroulant.
  useEffect(() => {
    if (!ouvert) return
    const handleClicExterieur = (e: MouseEvent) => {
      if (conteneurRef.current && !conteneurRef.current.contains(e.target as Node)) setOuvert(false)
    }
    const handleEchap = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOuvert(false)
    }
    document.addEventListener('mousedown', handleClicExterieur)
    document.addEventListener('keydown', handleEchap)
    return () => {
      document.removeEventListener('mousedown', handleClicExterieur)
      document.removeEventListener('keydown', handleEchap)
    }
  }, [ouvert])

  const ouvrirMenu = () => {
    setOuvert((v) => !v)
    if (!ouvert) charger()
  }

  const traiter = async (n: NotificationDTO) => {
    if (!n.lu) {
      await apiClient.patch(`/notifications/${n.id}/lue`)
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, lu: true } : x)))
      setNonLues((v) => Math.max(0, v - 1))
    }
    setOuvert(false)
    if (n.lien) navigate(n.lien)
  }

  return (
    <div className="civilis-notif-conteneur" ref={conteneurRef}>
      <button
        className="civilis-btn secondaire civilis-btn-icone civilis-notif-bouton"
        onClick={ouvrirMenu}
        title="Notifications"
        aria-haspopup="true"
        aria-expanded={ouvert}
        aria-label={`Notifications${nonLues > 0 ? ` (${nonLues} non lue${nonLues > 1 ? 's' : ''})` : ''}`}
      >
        <Bell size={16} />
        {nonLues > 0 && <span className="civilis-notif-pastille">{nonLues > 9 ? '9+' : nonLues}</span>}
      </button>
      {ouvert && (
        <div className="civilis-notif-menu" role="menu">
          <div className="civilis-notif-titre">Notifications</div>
          {notifications.length === 0 && <div className="civilis-vide" style={{ padding: 24 }}>Aucune notification.</div>}
          {notifications.map((n) => (
            <button key={n.id} role="menuitem" className={`civilis-notif-item niveau-${n.niveau.toLowerCase()} ${n.lu ? 'lue' : ''}`} onClick={() => traiter(n)}>
              <span className="civilis-notif-icone">{ICONES[n.niveau]}</span>
              <span className="civilis-notif-corps">
                <span className="civilis-notif-message">{n.message}</span>
                <span className="civilis-notif-date">{new Date(n.dateCreation).toLocaleString('fr-FR')}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
