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

## Fonctionnalités clés
- Analyse repas via photo ou texte (Claude Sonnet → fallback Haiku si 529)
- Rapport hebdo automatique après le dîner du dimanche
- Mode admin : bouton "← Mon profil" quand Arnaud navigue sur un autre compte
- Suivi du poids + recalcul TDEE automatique

## Fichiers importants
- `src/lib/hooks.ts` — gestion profils + localStorage + adminProfileId
- `src/components/ProfileSelector.tsx` — sélecteur avec badge admin
- `src/app/analyze/page.tsx` — saisie repas + rapport dominical
- `src/app/page.tsx` — dashboard principal
- `src/app/api/profiles/route.ts` — CRUD profils avec contrôle admin
