@AGENTS.md

# FoodScanner — Instructions pour Claude

## Stack
- Next.js 16.2.2 (Turbopack), React 19, TypeScript, Tailwind CSS 4
- Supabase (PostgreSQL) — pas de RLS active, auth via localStorage
- Anthropic Claude API pour l'analyse des repas
- Déployé sur Vercel (projet : `arnauds-projects-84fc44a0/foodscanner`)

## Lancer en local
```bash
npm run dev -- -p 3007
```
(d'autres localhost tournent souvent sur cette machine, toujours utiliser le port 3007)

## Déploiement
- Vercel **n'est PAS en auto-deploy** — après chaque push, lancer manuellement :
  ```bash
  npx vercel --prod
  ```
- URL de prod : https://foodscanner-three.vercel.app

## Profils & Auth
- Pas de JWT/OAuth — authentification par `localStorage` (`food-analyzer-profile-id`)
- `is_admin = true` → profil Arnaud (ID : `8e54eab4-adc6-4174-bdbc-4104b1309025`)
- L'admin voit tous les profils ; les autres ne voient que le leur
- **Lien de secours iPhone** (si localStorage effacé) :
  `https://foodscanner-three.vercel.app/?pid=8e54eab4-adc6-4174-bdbc-4104b1309025`

## Modèles Anthropic (IMPORTANT)
- Les IDs de modèles sont définis dans `src/app/api/analyze/route.ts` **et** `src/app/api/suggest/route.ts` (const `MODELS` dans chaque fichier — penser à les garder synchro).
- Modèles actuels : `claude-sonnet-4-6` (principal) → fallback `claude-haiku-4-5-20251001` si 529.
- ⚠️ **Ne JAMAIS utiliser un ID daté retiré.** `claude-sonnet-4-20250514` a été retiré le 15/06/2026 → `404 not_found_error` sur `/api/analyze` ("failed to analyse"). Préférer les alias non datés (`claude-sonnet-4-6`).
- Si l'analyse renvoie une erreur 404 modèle : vérifier que les IDs dans `MODELS` sont toujours actifs (les modèles datés finissent par être retirés).

## Fonctionnalités clés
- Analyse repas via photo ou texte (Claude Sonnet → fallback Haiku si 529)
- Rapport hebdo automatique après le dîner du dimanche
- Mode admin : bouton "← Mon profil" quand Arnaud navigue sur un autre compte
- Suivi du poids + recalcul TDEE automatique
- **Idées de plats** : bouton « 💡 Idées de plats » sous chaque section repas (petit-déj/déj/dîner) du dashboard. Appelle `/api/suggest` **uniquement au clic** (pas d'appel automatique — économie de tokens). Propose 3-4 plats simples calibrés sur le budget calorique restant du repas (objectif − déjà mangé, réparti sur les repas non encore loggés : petit-déj 25 % / déj 40 % / dîner 35 %), ajusté par la moyenne glissante 7j pour viser un déficit hebdo. Un tap sur une idée ouvre `/analyze?meal=...&prefill=...` (repas pré-sélectionné + description pré-remplie en mode texte) ; les vraies valeurs sont recalculées à l'enregistrement.

## Fichiers importants
- `src/lib/hooks.ts` — gestion profils + localStorage + adminProfileId
- `src/components/ProfileSelector.tsx` — sélecteur avec badge admin
- `src/app/analyze/page.tsx` — saisie repas + rapport dominical (lit les params `meal`/`prefill` pour les idées de plats)
- `src/app/page.tsx` — dashboard principal (boutons « Idées de plats »)
- `src/app/api/suggest/route.ts` — suggestions de plats (on-demand, budget calorique + ajustement hebdo)
- `src/app/api/profiles/route.ts` — CRUD profils avec contrôle admin
