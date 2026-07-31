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
