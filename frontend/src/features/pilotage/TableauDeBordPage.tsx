import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts'
import { apiClient } from '@/api/client'
import type { TableauBordDTO } from '@/types'
import { FileStack, Users, BookMarked, Building2, TrendingUp } from 'lucide-react'

const PALETTE = ['#1e3a5f', '#c8862a', '#2f7d55', '#6c4fa1', '#b23b3b', '#2a7f9e']

export default function TableauDeBordPage() {
  const [donnees, setDonnees] = useState<TableauBordDTO | null>(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState<string | null>(null)

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

  return (
    <div className="civilis-page civilis-entree-douce">
      <div className="civilis-page-entete">
        <h1>Tableau de bord</h1>
        <p>Vue d'ensemble en temps reel de l'activite d'indexation et de localisation des actes.</p>
      </div>

      <div className="civilis-kpi-grille">
        <KpiCarte icone={<FileStack size={20} />} libelle="Fiches indexees" valeur={donnees.totalFichesIndexees} accent="bleu" />
        <KpiCarte icone={<Users size={20} />} libelle="Personnes recensees" valeur={donnees.totalPersonnes} accent="ocre" />
        <KpiCarte icone={<BookMarked size={20} />} libelle="Registres physiques" valeur={donnees.totalRegistres} accent="vert" />
        <KpiCarte icone={<Building2 size={20} />} libelle="Centres actifs" valeur={donnees.totalCentres} accent="violet" />
      </div>

      <div className="civilis-carte civilis-kpi-semaine">
        <TrendingUp size={22} />
        <div>
          <div className="civilis-kpi-semaine-valeur">{donnees.fichesIndexeesCetteSemaine}</div>
          <div className="civilis-kpi-semaine-libelle">fiches indexees cette semaine</div>
        </div>
      </div>

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
    </div>
  )
}

function KpiCarte({ icone, libelle, valeur, accent }: { icone: React.ReactNode; libelle: string; valeur: number; accent: string }) {
  return (
    <div className={`civilis-kpi-carte accent-${accent}`}>
      <div className="civilis-kpi-icone">{icone}</div>
      <div className="civilis-kpi-valeur">{valeur.toLocaleString('fr-FR')}</div>
      <div className="civilis-kpi-libelle">{libelle}</div>
    </div>
  )
}
