# FoodScanner — Suivi nutritionnel par IA

Application web multi-profils de suivi nutritionnel. L'utilisateur photographie ses repas ou les décrit en texte, et l'IA Claude (Anthropic) identifie les aliments et calcule automatiquement les valeurs nutritionnelles (calories, protéines, glucides, lipides). Le site suit l'évolution dans le temps et s'adapte à l'objectif de chaque profil.

**Site en production :** [foodscanner-three.vercel.app](https://foodscanner-three.vercel.app)

---

## Description

FoodScanner s'adresse aux particuliers souhaitant suivre leur alimentation simplement, sans saisie manuelle fastidieuse. Il supporte plusieurs profils (usage familial ou coaching), avec un système admin/utilisateur. Pas de compte ni de mot de passe — identification par UUID de profil stocké en `localStorage`.

---

## Stack technique

| Technologie | Version |
|---|---|
| **Next.js** (App Router, full-stack) | 16.2.2 |
| **React** | 19.2.4 |
| **TypeScript** | ^5 |
| **Tailwind CSS** | v4 (`@tailwindcss/postcss`) |
| **Supabase** (PostgreSQL) | ^2.101.1 |
| **Anthropic Claude SDK** | ^0.82.0 |
| **Recharts** | ^3.8.1 |
| **Lucide React** | ^1.7.0 |
| **date-fns** (locale `fr`) | ^4.1.0 |
| **Vercel** | Hébergement |

**Modèles IA utilisés :**
- `claude-sonnet-4-20250514` — modèle primaire
- `claude-haiku-4-5-20251001` — fallback automatique si Sonnet est surchargé (code 529)

---

## Structure du projet

```
foodscanner/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Dashboard principal (tableau de bord quotidien)
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── analyze/page.tsx      # Page d'analyse de repas (photo ou texte)
│   │   ├── history/page.tsx      # Historique 7 ou 30 jours
│   │   ├── settings/page.tsx     # Gestion des profils
│   │   └── api/
│   │       ├── analyze/route.ts  # Appel Claude : retourne JSON nutritionnel
│   │       ├── meals/route.ts    # CRUD repas + food_items
│   │       ├── profiles/route.ts # CRUD profils
│   │       └── weight/route.ts   # CRUD poids + recalcul TDEE automatique
│   ├── components/
│   │   ├── CalorieRing.tsx       # Anneau SVG de progression calorique
│   │   ├── Navigation.tsx        # Barre de navigation inférieure
│   │   ├── OnboardingWizard.tsx  # Wizard 8 étapes création de profil
│   │   └── ProfileSelector.tsx   # Sélecteur de profil actif
│   └── lib/
│       ├── hooks.ts              # useProfiles()
│       ├── supabase.ts           # Client Supabase
│       └── types.ts              # Interfaces TypeScript
├── supabase-schema.sql           # Schéma initial
├── supabase-migration-byok.sql   # Migration clé API individuelle
├── supabase-migration-weight-tdee.sql
├── migrations/add_is_admin.sql
├── .env.example
└── next.config.ts
```

---

## Base de données (Supabase)

4 tables PostgreSQL :

| Table | Colonnes clés |
|---|---|
| `profiles` | id (UUID), name, daily_calories_goal, daily_protein/carbs/fat_goal, sex, age, height, activity_level, deficit_target, **claude_api_key** (BYOK), is_admin |
| `meals` | id, profile_id, meal_type (breakfast/lunch/dinner/snack), date, total_calories/protein/carbs/fat, photo_url |
| `food_items` | id, meal_id, name, quantity, unit, calories, protein, carbs, fat |
| `weight_entries` | id, profile_id, date, weight |

---

## Routes API

| Méthode | Route | Description |
|---|---|---|
| POST | `/api/analyze` | Analyse une image (base64) ou texte via Claude, retourne JSON nutritionnel structuré |
| GET | `/api/meals` | Récupère les repas par profil + date ou plage de dates |
| POST | `/api/meals` | Crée un repas avec ses `food_items` |
| PUT | `/api/meals` | Modifie un repas (remplace les `food_items`) |
| DELETE | `/api/meals` | Supprime un repas |
| GET | `/api/profiles` | Liste les profils (admin voit tout, user voit le sien) |
| POST | `/api/profiles` | Crée un profil |
| PUT | `/api/profiles` | Modifie un profil |
| DELETE | `/api/profiles` | Supprime un profil |
| GET | `/api/weight` | Récupère les 30 dernières pesées |
| POST | `/api/weight` | Upsert poids + **recalcul automatique TDEE et objectifs macros** |
| DELETE | `/api/weight` | Supprime une entrée poids |

---

## Fonctionnalités détaillées

### 1. Analyse IA de repas
L'utilisateur prend une photo ou décrit son repas en texte. Claude identifie chaque aliment, estime les quantités et renvoie un JSON structuré avec calories + macros par item. **Fallback automatique** : si Sonnet retourne une erreur 529 (surcharge), la requête est relancée sur Haiku.

### 2. Dashboard quotidien
- Navigation par date (J-1 / J+1)
- 4 sections de repas : petit-déjeuner, déjeuner, dîner, snack
- **Anneau SVG calorique** : progression visuelle (calories consommées vs objectif)
- Barres de progression pour les 3 macros (protéines / glucides / lipides)
- Suppression d'un repas ou d'un item individuel
- Édition des quantités unitaires en ligne

### 3. Onboarding wizard (8 étapes)
Prénom → Sexe → Âge → Poids → Taille → Niveau d'activité (5 niveaux) → Objectif de déficit (léger / modéré / agressif) → Récapitulatif avec objectifs calculés. Formule : **Mifflin-St Jeor** pour le TDEE, répartition macros **30 / 40 / 30** (protéines / glucides / lipides). À chaque nouvelle pesée, le TDEE est recalculé automatiquement.

### 4. Historique
- Vue semaine ou 30 jours
- Repas regroupés par date
- Rapport hebdomadaire : moyenne calorique, jours dans l'objectif, moyenne protéines

### 5. Multi-profils et BYOK
- Système **admin / user** : l'admin voit tous les profils, un user ne voit que le sien
- Mode **BYOK (Bring Your Own Key)** : chaque profil peut stocker sa propre clé API Claude en base — utilisée en priorité sur la clé serveur

---

## Installation et configuration

### Prérequis

- Node.js >= 18
- Projet Supabase avec les tables créées (scripts `.sql` fournis)
- Clé API Anthropic

### Étapes

```bash
git clone https://github.com/arnov8/foodscanner.git
cd foodscanner
npm install
cp .env.example .env.local
npm run dev
# Accessible sur http://localhost:3000
```

### Variables d'environnement

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
```

### Initialisation de la base de données

```bash
# Appliquer dans l'ordre dans l'éditeur SQL Supabase :
# 1. supabase-schema.sql
# 2. supabase-migration-byok.sql
# 3. supabase-migration-weight-tdee.sql
# 4. migrations/add_is_admin.sql
```

---

## Déploiement

```bash
npx vercel --prod
```

> Pas de système d'authentification : l'identification se fait par UUID de profil stocké en `localStorage`. Configurer les RLS Supabase selon le niveau de sécurité souhaité.
