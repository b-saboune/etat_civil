import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area,
} from 'recharts'
import { apiClient } from '@/api/client'
import { useAuth } from '@/auth/AuthContext'
import { useCompteurAnime } from '@/hooks/useCompteurAnime'
import type { TableauBordDTO } from '@/types'
import {
  FileStack, Users, BookMarked, Building2, TrendingUp, ArrowUpRight,
  Search, FileBarChart2, UserCog, Settings, BookMarked as BookMarkedIcon,
} from 'lucide-react'

const PALETTE = ['#1e3a5f', '#c8862a', '#2f7d55', '#6c4fa1', '#b23b3b', '#2a7f9e']

interface AccesRapide { to: string; label: string; sousLibelle: string; icone: React.ReactNode; permission?: string }

const ACCES_RAPIDES: AccesRapide[] = [
  { to: '/recherche', label: 'Recherche', sousLibelle: 'Localiser un acte', icone: <Search size={19} />, permission: 'RECHERCHE_CONSULTER' },
  { to: '/indexation', label: 'Indexation', sousLibelle: 'Nouvelle fiche', icone: <FileStack size={19} />, permission: 'INDEXATION_CREER' },
  { to: '/rapports', label: 'Rapports', sousLibelle: 'Statistiques', icone: <FileBarChart2 size={19} />, permission: 'PILOTAGE_CONSULTER' },
  { to: '/registres', label: 'Registres', sousLibelle: 'Etat des lieux', icone: <BookMarkedIcon size={19} /> },
  { to: '/utilisateurs', label: 'Agents', sousLibelle: 'Gestion des comptes', icone: <UserCog size={19} />, permission: 'UTILISATEUR_GERER' },
  { to: '/parametrage', label: 'Parametrage', sousLibelle: 'Sauvegardes', icone: <Settings size={19} />, permission: 'PARAMETRAGE_GERER' },
]

function salutationDuMoment() {
  const heure = new Date().getHours()
  if (heure < 12) return 'Bonjour'
  if (heure < 18) return 'Bon apres-midi'
  return 'Bonsoir'
}

export default function TableauDeBordPage() {
  const { aPermission, utilisateur } = useAuth()
  const [donnees, setDonnees] = useState<TableauBordDTO | null>(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState<string | null>(null)

  const dateDuJour = useMemo(
    () => new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    []
  )

  useEffect(() => {
    let annule = false
    apiClient
      .get<TableauBordDTO>('/tableau-de-bord')
      .then(({ data }) => { if (!annule) setDonnees(data) })
      .catch(() => { if (!annule) setErreur("Impossible de charger le tableau de bord.") })
      .finally(() => { if (!annule) setChargement(false) })
    return () => { annule = true }
  }, [])

  if (chargement) {
    return (
      <div className="civilis-page">
        <div className="civilis-kpi-grille">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="civilis-kpi-carte civilis-skeleton" style={{ height: 108 }} />
          ))}
        </div>
      </div>
    )
  }

  if (erreur || !donnees) {
    return (
      <div className="civilis-page">
        <div className="civilis-alerte-erreur">{erreur ?? 'Donnees indisponibles.'}</div>
      </div>
    )
  }

  const repartition = Object.entries(donnees.repartitionParTypeActe).map(([nom, valeur]) => ({ nom, valeur }))
  const accesVisibles = ACCES_RAPIDES.filter((a) => !a.permission || aPermission(a.permission))

  return (
    <div className="civilis-page civilis-entree-douce">
      <div className="civilis-page-entete civilis-tdb-entete">
        <div>
          <h1>{salutationDuMoment()}{utilisateur ? `, ${utilisateur.identifiant}` : ''}</h1>
          <p>Vue d'ensemble en temps reel de l'activite d'indexation et de localisation des actes pour les collectivites territoriales.</p>
        </div>
        <div className="civilis-tdb-date">{dateDuJour}</div>
      </div>

      {donnees.evolutionMensuelle.length > 0 && (
        <div className="civilis-carte civilis-pouls-carte">
          <div className="civilis-pouls-entete">
            <TrendingUp size={16} />
            <span>Pouls de l'activite — indexations mensuelles</span>
          </div>
          <ResponsiveContainer width="100%" height={70}>
            <AreaChart data={donnees.evolutionMensuelle} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="poulsDegrade" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--bleu-600)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--bleu-600)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="nombreFiches" stroke="var(--bleu-700)" strokeWidth={2} fill="url(#poulsDegrade)" />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="civilis-kpi-grille">
        <KpiCarte to="/indexation" icone={<FileStack size={20} />} libelle="Fiches indexees" valeur={donnees.totalFichesIndexees} accent="bleu" />
        <KpiCarte to="/personnes" icone={<Users size={20} />} libelle="Personnes recensees" valeur={donnees.totalPersonnes} accent="ocre" />
        <KpiCarte to="/registres" icone={<BookMarked size={20} />} libelle="Registres physiques" valeur={donnees.totalRegistres} accent="vert" />
        <KpiCarte to="/referentiels" icone={<Building2 size={20} />} libelle="Centres actifs" valeur={donnees.totalCentres} accent="violet" />
      </div>

      <div className="civilis-carte civilis-kpi-semaine">
        <TrendingUp size={22} />
        <div>
          <div className="civilis-kpi-semaine-valeur">{donnees.fichesIndexeesCetteSemaine}</div>
          <div className="civilis-kpi-semaine-libelle">fiches indexees cette semaine</div>
        </div>
      </div>

      {accesVisibles.length > 0 && (
        <div className="civilis-carte">
          <h2>Acces rapides</h2>
          <div className="civilis-acces-rapides">
            {accesVisibles.map((a, i) => (
              <Link key={a.to} to={a.to} className="civilis-acces-carte" style={{ animationDelay: `${i * 45}ms` }}>
                <div className="civilis-acces-icone">{a.icone}</div>
                <div>
                  <div className="civilis-acces-libelle">{a.label}</div>
                  <div className="civilis-acces-sous-libelle">{a.sousLibelle}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="civilis-grille-graphiques">
        <div className="civilis-carte civilis-carte-graphique">
          <h2>Evolution mensuelle des indexations</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={donnees.evolutionMensuelle}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gris-200)" />
              <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="nombreFiches" stroke="#1e3a5f" strokeWidth={2.5} dot={{ r: 3 }} name="Fiches" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="civilis-carte civilis-carte-graphique">
          <h2>Repartition par type d'acte</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={repartition} dataKey="valeur" nameKey="nom" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2}>
                {repartition.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="civilis-carte civilis-carte-graphique civilis-carte-pleine-largeur">
          <h2>Charge par centre d'etat civil</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={donnees.chargeParCentre}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gris-200)" />
              <XAxis dataKey="centre" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="nombreFiches" fill="#1e3a5f" name="Fiches indexees" radius={[4, 4, 0, 0]} />
              <Bar dataKey="nombreRegistres" fill="#c8862a" name="Registres" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="civilis-pied-institutionnel">CIVILIS · Republique Togolaise · Collectivites territoriales</div>
    </div>
  )
}

function KpiCarte({ to, icone, libelle, valeur, accent }: { to: string; icone: React.ReactNode; libelle: string; valeur: number; accent: string }) {
  const valeurAnimee = useCompteurAnime(valeur)
  return (
    <Link to={to} className="civilis-kpi-lien">
      <div className={`civilis-kpi-carte accent-${accent}`} style={{ position: 'relative' }}>
        <div className="civilis-kpi-icone-fond">{icone}</div>
        <ArrowUpRight size={16} className="civilis-kpi-fleche" />
        <div className="civilis-kpi-icone">{icone}</div>
        <div className="civilis-kpi-valeur">{valeurAnimee.toLocaleString('fr-FR')}</div>
        <div className="civilis-kpi-libelle">{libelle}</div>
      </div>
    </Link>
  )
}
