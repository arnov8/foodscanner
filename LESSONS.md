# Lessons Learned — FoodScanner

## Auth localStorage : penser au mobile dès le départ

**Problème :** L'app stocke le profil actif dans `localStorage`. Quand un utilisateur vide le cache Safari sur iPhone, l'app charge le premier profil en DB (ordre `created_at ASC`) — pas forcément le bon.

**Ce qui s'est passé :** Arnaud s'est retrouvé bloqué sur le compte de Charly sur son iPhone. Les non-admins ne voient que leur propre profil → impossible de switcher manuellement.

**Solution appliquée :**
1. Paramètre URL `?pid=<profile_id>` qui force le profil et se nettoie de l'URL
2. Lien de secours bookmarké sur iPhone

**À retenir :** Pour toute app multi-profils sans vrai auth, prévoir dès le début un mécanisme de récupération de session (lien magique, QR code, etc.)

---

## Admin : stocker l'ID dans une clé localStorage séparée

**Problème :** Quand l'admin switche vers un autre profil, son propre ID est écrasé dans `food-analyzer-profile-id`. Impossible de revenir sans navigation privée.

**Solution appliquée :** Clé dédiée `food-analyzer-admin-profile-id` persistée dès qu'un profil `is_admin=true` est détecté. Le bouton "← Mon profil" apparaît uniquement quand l'admin visualise un autre compte.

---

## Vercel : pas d'auto-deploy sur ce projet

Les déploiements sont **toujours manuels** : `npx vercel --prod` depuis la racine. Ne pas oublier après chaque push.

---

## Rapport hebdo : utiliser `getDay()` de date-fns, pas `new Date().getDay()`

`new Date("YYYY-MM-DD").getDay()` parse la date en UTC → décalage horaire possible. Toujours utiliser `getDay(parseISO(dateString))` de date-fns pour rester cohérent avec le fuseau local.
