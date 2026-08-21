# Guide de création et de maintenance de WapiGarage

## Architecture

WapiGarage comprend une application mobile React Native/Expo, une API Node.js/Express, une base PostgreSQL Supabase, un dashboard React/tRPC/Supabase et des intégrations Google OAuth, Infobip et KPay. Le mobile ne doit jamais devenir la source de vérité pour les paiements, les rôles, les statuts ou les autorisations.

## Méthode de travail

Avant une modification, identifier l’emplacement exact : mobile, API, base, dashboard ou documentation. Ajouter une tâche dans le suivi, faire une modification minimale, écrire ou mettre à jour un test, lancer le typecheck et le build, vérifier le rendu, puis créer un checkpoint. Ne jamais remplacer des données réelles par des données de démonstration.

Pour toute migration, commencer par une requête de lecture seule. Utiliser uniquement des migrations additives lorsque cela est possible. Créer les tables avant les contraintes dépendantes, activer RLS, vérifier l’existence par une seconde requête de lecture et conserver le SQL dans `docs/`. Ne jamais lancer `DROP`, `DELETE` ou une modification destructive sans procédure de sauvegarde et approbation explicite.

## Développement mobile

Utiliser Expo Router, SecureStore pour les sessions, des gardes de rôle côté serveur, des états loading/error/empty pour chaque appel réseau et `FlatList` pour les collections longues. Toute modification de paiement doit être testée avec une facture réelle de test, un montant falsifié, une facture expirée, un webhook répété et un paiement déjà confirmé.

## Développement dashboard

Utiliser le layout admin existant, des procédures tRPC protégées par `adminProcedure`, Supabase côté serveur avec la clé service role, RLS sur les tables exposées et des états vides explicites. Les exports doivent refléter les données chargées et ne doivent pas inventer de lignes. Les actions sensibles doivent demander confirmation et générer un audit.

## Qualité

Un changement est considéré comme prêt lorsque le typecheck, les tests Vitest, le build et le contrôle visuel passent. Les erreurs de compilation, les messages Vite, les tests fragiles et les dépendances ajoutées doivent être traités avant le checkpoint.

## Gestion des versions

Les contenus distants, comme les bannières, peuvent évoluer sans nouvelle publication mobile. Le code mobile, les permissions natives, les dépendances et la navigation doivent être livrés par une version progressive : branche de travail, tests, build interne, test fermé, déploiement progressif, surveillance puis généralisation.
