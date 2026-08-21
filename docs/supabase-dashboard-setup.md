# Configuration Supabase du dashboard WapiGarage

Le dashboard admin est un projet séparé de l’application mobile Replit. Les deux projets peuvent utiliser le même projet Supabase, mais le dashboard ne doit pas être copié dans le workspace mobile.

## Secrets serveur

Dans les secrets du projet dashboard, ajouter exactement :

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

`SUPABASE_URL` est le Project URL affiché dans Supabase → Settings → API. `SUPABASE_SERVICE_ROLE_KEY` est la clé secrète serveur affichée dans Supabase → Settings → API → Secret keys.

La clé `SUPABASE_SERVICE_ROLE_KEY` ne doit jamais être placée dans `client/`, dans une variable `VITE_*`, dans le dépôt Git ou dans une réponse tRPC. Elle est consommée uniquement par `server/supabase.ts`.

## Installation

Depuis la racine du projet dashboard, qui contient `package.json`, exécuter :

```bash
pnpm add @supabase/supabase-js
```

Ne pas exécuter cette commande avec `-w` dans le workspace mobile Replit. Après l’installation, redémarrer le serveur du dashboard.

## Fichiers concernés

| Fichier | Rôle |
|---|---|
| `server/supabase.ts` | Client Supabase serveur privé |
| `server/routers.ts` | Procédures tRPC protégées par `adminProcedure` |
| `client/src/pages/Home.tsx` | Affichage des résultats tRPC |
| `server/supabase.secrets.test.ts` | Vérification de lecture des tables |
| `server/supabase.exposure.test.ts` | Vérification statique et runtime de non-exposition |

## Validations

```bash
pnpm check
pnpm test
```

Les tests doivent confirmer la lecture des tables principales, le refus des non-admins et l’absence de la valeur `SUPABASE_SERVICE_ROLE_KEY` dans les sources frontend et dans les payloads tRPC.

## Séparation avec le mobile

Le projet mobile Replit reste dans son workspace propre. Aucun fichier `artifacts/mobile`, aucun écran Expo et aucune configuration OAuth/KPay/Infobip ne doit être modifié pour configurer ce dashboard.
