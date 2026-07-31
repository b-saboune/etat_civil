import { useEffect, useState } from 'react'

/**
 * Anime un nombre de 0 vers sa valeur finale (effet "compteur" sur les
 * indicateurs du tableau de bord). Purement cosmetique : la valeur reelle
 * est toujours celle fournie par l'API, jamais recalculee ici.
 */
export function useCompteurAnime(valeurFinale: number, dureeMs = 700): number {
  const [valeur, setValeur] = useState(0)

  useEffect(() => {
    let frame: number
    const depart = performance.now()
    const origine = 0

    function etape(maintenant: number) {
      const progression = Math.min(1, (maintenant - depart) / dureeMs)
      const facilite = 1 - Math.pow(1 - progression, 3)
      setValeur(Math.round(origine + (valeurFinale - origine) * facilite))
      if (progression < 1) frame = requestAnimationFrame(etape)
    }

    frame = requestAnimationFrame(etape)
    return () => cancelAnimationFrame(frame)
  }, [valeurFinale, dureeMs])

  return valeur
}
