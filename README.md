# CIVILIS

Application d'indexation, de recherche et de localisation des actes d'etat
civil dans les collectivites territoriales du Togo — projet de memoire de
fin d'etudes (BRAHIM Fadoul Saboune).

CIVILIS ne remplace jamais l'acte papier (RG-JUR-001). Elle permet a un
agent habilite de retrouver rapidement une fiche d'indexation et de savoir
precisement ou se trouve physiquement le registre et la page qui contiennent
l'acte recherche : Collectivite -> Centre -> Salle d'archives -> Rayonnage
-> Registre -> Page.

## Etat d'avancement (Palier 1 — socle)

- [x] Schema PostgreSQL (26 tables), valide (chargement teste sans erreur)
- [x] Backend Spring Boot : structure, securite JWT, authentification
- [x] Backend : module Recherche & Localisation (RG-REC-005/006/007, RG-LOC-001)
- [x] Frontend React/TypeScript : ecran de connexion + ecran de recherche
- [ ] Modules Indexation (creation de fiches), Registres, Personnes (CRUD complet)
- [ ] RBAC dynamique, Administration, Audit, Pilotage, Parametrage
- [ ] Palier 2 (numerisation), Palier 3 (front-office citoyen, bloque — RG-FO-001)

Voir `Prompt_Maitre_Developpement_Complet.md` pour le detail complet des
regles de gestion, phases et arbitrages du projet.

## Lancer le projet en local

### 1. Prerequis
Java 17+, Maven, Node.js 18+, PostgreSQL 14+ (ou Docker).

### 2. Base de donnees

Avec Docker :
```
docker compose up -d
```
Sans Docker, creer manuellement une base `civilis` avec l'utilisateur
`civilis_admin` / mot de passe `civilis_dev_password` (ou adapter
`backend/src/main/resources/application-dev.yml`).

### 3. Backend
```
cd backend
mvn spring-boot:run
```
L'API demarre sur `http://localhost:8080`. Flyway cree automatiquement le
schema (V1) et charge les donnees de demonstration (V2) au premier
demarrage. Documentation interactive : `http://localhost:8080/swagger-ui.html`.

### 4. Frontend
```
cd frontend
npm install
npm run dev
```
Application sur `http://localhost:5173`.

### 5. Comptes de demonstration

| Identifiant   | Mot de passe   | Role           |
|---------------|----------------|----------------|
| admin.demo    | Civilis#2026   | ADMINISTRATEUR |
| agent.lome1   | Civilis#2026   | AGENT          |

### 6. Parcours de demonstration

Se connecter avec `agent.lome1`, aller sur l'ecran de recherche, chercher
`AMEGAN` / `Kossi Edem` (ou seulement `AMEGAN`) : le resultat affiche l'acte
de naissance, les personnes associees (pere, mere, titulaire) et la chaine
de localisation physique complete du registre.

## Structure du depot

```
backend/    Spring Boot (Java 17, packages tg.civilis.*)
frontend/   React + TypeScript + Vite
database/   Reserve pour scripts complementaires
docs/       Documentation technique
scripts/    Scripts d'exploitation
```
