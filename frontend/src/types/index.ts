export interface LoginResponse {
  accessToken: string
  refreshToken: string
  identifiant: string
  typeCompte: 'SUPER_ADMIN' | 'ADMINISTRATEUR' | 'AGENT'
}

export interface LocalisationDTO {
  commune: string
  centre: string
  salleArchive: string
  rayonnage: string
  numeroRegistre: string
  annee: number
  page: number
}

export interface PersonneAssocieeDTO {
  personneId: number
  nom: string
  prenoms: string
  role: string
}

export interface ResultatRechercheDTO {
  ficheIndexationId: number
  numeroActe: string
  typeActe: string
  dateEvenement: string
  statut: 'VALIDE' | 'ERRONEE'
  correspondanceApprochee: boolean
  personnesAssociees: PersonneAssocieeDTO[]
  localisation: LocalisationDTO
}

export interface CentreChargeDTO {
  centre: string
  nombreFiches: number
  nombreRegistres: number
}

export interface EvolutionMensuelleDTO {
  mois: string
  nombreFiches: number
}

export interface TableauBordDTO {
  totalFichesIndexees: number
  totalPersonnes: number
  totalRegistres: number
  totalCentres: number
  fichesIndexeesCetteSemaine: number
  repartitionParTypeActe: Record<string, number>
  chargeParCentre: CentreChargeDTO[]
  evolutionMensuelle: EvolutionMensuelleDTO[]
}

export interface CommuneDTO { id: number; nom: string }
export interface CentreDTO { id: number; communeId: number; nom: string; adresse?: string; statut: string }
export interface SalleDTO { id: number; centreId: number; designation: string }
export interface RayonnageDTO { id: number; salleId: number; designation: string }
export interface TypeActeDTO { id: number; libelle: string; actif: boolean }
export interface RegistreDTO { id: number; centreId: number; rayonnageId: number; typeActeId: number; numeroRegistre: string; annee: number; nbPages: number; statut: string }
export interface RegistreVueDTO {
  id: number
  numeroRegistre: string
  annee: number
  nbPages: number
  statut: string
  centreId: number
  centreNom: string
  communeId: number
  communeNom: string
  salleId: number
  salleDesignation: string
  rayonnageId: number
  rayonnageDesignation: string
  typeActeId: number
  typeActeLibelle: string
}
export interface HistoriqueDeplacementDTO {
  id: number
  ancienRayonnage?: string
  nouveauRayonnage: string
  dateDeplacement: string
  auteurIdentifiant?: string
}
export interface CouvertureRecensementDTO { nbPages: number; nbFichesIndexees: number; tauxCouverturePourcent: number }
export interface FicheIndexationDTO {
  id: number
  registre: { id: number }
  numeroActe: string
  page: number
  typeActe: { id: number; libelle: string }
  dateEvenement: string
  dateIndexation: string
  agent: { id: number; identifiant: string }
  statut: string
  motifErreur?: string
}
export interface AgentDTO { id: number; identifiant: string; typeCompte: string; statut: string }
export interface HistoriqueConnexionDTO { id: number; dateConnexion: string; adresseIp?: string; statut: string }
export interface RoleDTO { id: number; libelle: string; description?: string }
export interface PermissionDTO { id: number; module: string; action: string; code: string }
export interface JournalEntreeDTO { id: number; utilisateur?: string; module: string; action: string; horodatage: string; details?: string }
export interface ParametreDTO { id: number; cle: string; valeur: string; description?: string }
export interface SauvegardeDTO { id: number; dateExecution: string; statut: string; typeDeclenchement: string }
export interface PersonneDTO { id: number; nom: string; prenoms: string; sexe?: string; dateNaissance?: string; dateApproximative: boolean }

export interface RapportResumeDTO { id: number; type: string; genereParIdentifiant: string; dateGeneration: string }
export interface RapportSnapshot { criteres: { dateDebut: string; dateFin: string; centreId: number | null }; colonnes: string[]; lignes: (string | number)[][] }
export interface RapportDTO { id: number; type: string; criteres: string; dateGeneration: string }

export interface NotificationDTO {
  id: number
  niveau: 'INFORMATION' | 'ATTENTION' | 'CRITIQUE'
  module: string
  message: string
  lien?: string
  dateCreation: string
  lu: boolean
}

// Affiliation / filiation (section 11.7 du prompt maitre) : voir backend LienParente.
export interface LienParenteDTO {
  id: number
  personneApparenteeId: number
  nomApparente: string
  prenomsApparente: string
  typeLien: string
  modeCreation: 'DEDUIT' | 'MANUEL'
}
