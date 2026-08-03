export default function PageLoader() {
  return (
    <div className="civilis-page-chargement" role="status" aria-live="polite">
      <span className="civilis-spinner grand" />
      <span className="civilis-page-chargement-texte">Chargement...</span>
    </div>
  )
}
