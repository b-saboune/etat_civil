import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface PaginationProps {
  page: number
  totalPages: number
  onChangerPage: (page: number) => void
  totalElements: number
  tailleParPage: number
  onChangerTaille?: (taille: number) => void
  optionsTaille?: number[]
}

/**
 * Pagination generique et reutilisable, pour toute liste deja chargee cote
 * client (aucun endpoint de l'API n'expose actuellement page/size — voir
 * ROADMAP_CONFORMITE.md, vague 1). Le composant est volontairement agnostique
 * de la source de donnees : la page en cours reste geree par l'ecran appelant.
 */
export default function Pagination({
  page,
  totalPages,
  onChangerPage,
  totalElements,
  tailleParPage,
  onChangerTaille,
  optionsTaille = [10, 25, 50, 100],
}: PaginationProps) {
  if (totalElements === 0) return null

  const premierElement = page * tailleParPage + 1
  const dernierElement = Math.min(totalElements, (page + 1) * tailleParPage)

  const numerosPages = () => {
    const numeros: number[] = []
    const debut = Math.max(0, Math.min(page - 2, totalPages - 5))
    const fin = Math.min(totalPages, debut + 5)
    for (let i = debut; i < fin; i++) numeros.push(i)
    return numeros
  }

  return (
    <div className="civilis-pagination">
      <span>
        {premierElement}–{dernierElement} sur {totalElements}
      </span>
      <div className="civilis-pagination-boutons">
        <button className="civilis-pagination-page" onClick={() => onChangerPage(0)} disabled={page === 0} aria-label="Premiere page">
          <ChevronsLeft size={14} />
        </button>
        <button className="civilis-pagination-page" onClick={() => onChangerPage(page - 1)} disabled={page === 0} aria-label="Page precedente">
          <ChevronLeft size={14} />
        </button>
        {numerosPages().map((n) => (
          <button
            key={n}
            className={`civilis-pagination-page ${n === page ? 'actif' : ''}`}
            onClick={() => onChangerPage(n)}
            aria-current={n === page ? 'page' : undefined}
            aria-label={`Page ${n + 1}`}
          >
            {n + 1}
          </button>
        ))}
        <button
          className="civilis-pagination-page"
          onClick={() => onChangerPage(page + 1)}
          disabled={page >= totalPages - 1}
          aria-label="Page suivante"
        >
          <ChevronRight size={14} />
        </button>
        <button
          className="civilis-pagination-page"
          onClick={() => onChangerPage(totalPages - 1)}
          disabled={page >= totalPages - 1}
          aria-label="Derniere page"
        >
          <ChevronsRight size={14} />
        </button>
      </div>
      {onChangerTaille && (
        <label className="civilis-pagination-taille">
          Par page
          <select value={tailleParPage} onChange={(e) => onChangerTaille(Number(e.target.value))}>
            {optionsTaille.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
      )}
    </div>
  )
}
