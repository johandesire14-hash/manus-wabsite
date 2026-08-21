# Feuille de route des demandes WapiGarage

## Résumé exécutif

Les demandes se répartissent en cinq ensembles : **sécurité et paiements**, **dashboard d’administration**, **application mobile**, **pilotage économique**, puis **documentation et automatisation**. L’ordre recommandé est important : il faut d’abord empêcher les fraudes et sécuriser les comptes, ensuite fiabiliser les données financières, puis ajouter les fonctions de gestion et enfin les fonctions de confort.

> Principe directeur : aucune fonctionnalité d’interface ne doit afficher une information financière ou administrative qui ne provient pas d’une donnée serveur vérifiée.

## Priorité 0 — Bloquants de sécurité et de paiement

| N° | Demande | Emplacement | Ce qu’il faut faire | Exemple concret | Dépendance |
|---:|---|---|---|---|---|
| 1 | Vérifier la faille des utilisateurs souvent administrateurs | API, dashboard, mobile | Vérifier les rôles côté serveur, refuser tout rôle envoyé par le client, contrôler chaque procédure sensible avec `adminProcedure` | Un utilisateur modifie son profil en `admin` dans la requête : le serveur doit quand même le refuser | Colonne ou source officielle du rôle admin |
| 2 | Ajouter une connexion limitée à deux adresses e-mail | Dashboard | Créer une page de connexion, vérifier l’e-mail côté serveur et refuser toute autre adresse | Seules `admin1@...` et `admin2@...` peuvent ouvrir le dashboard | Les deux adresses exactes doivent être fournies |
| 3 | Ajouter la 2FA | Dashboard | Ajouter un second facteur après le mot de passe ou OAuth : code TOTP ou code e-mail/SMS, avec limitation d’essais | Même si le mot de passe est connu, un code temporaire est nécessaire | Choisir TOTP, e-mail ou Infobip |
| 4 | Ne pas pouvoir interrompre une transaction | API KPay, mobile | Rendre la transaction serveur-autorisée : le mobile ne peut ni annuler ni modifier un paiement après émission ; gérer les états `pending`, `paid`, `failed`, `expired` | Fermer l’application ne doit pas annuler le paiement ; le webhook reste la source de vérité | Webhook KPay fiable et idempotence |
| 5 | Ajouter un délai de validation de facture de 3 minutes | API, mobile | Enregistrer `expires_at` côté serveur, refuser toute tentative après expiration et afficher le compte à rebours côté mobile | Une facture créée à 10:00 expire à 10:03, même si le mobile affiche encore l’écran | Table `invoices` et horloge serveur |
| 6 | Afficher les auteurs de la facture | Dashboard, API | Relier facture, client et garage ; afficher nom, prénom, e-mail ou téléphone et identifiants internes | Pour la facture INV-123, voir le client et le garage qui l’ont créée | Relations `invoices`, `users`, `garages` |
| 7 | Afficher l’auteur complet des signalements | Dashboard | Afficher qui a signalé, qui est concerné, l’objet, la date, le numéro de facture et le statut de traitement | « Jean, client, a signalé le garage A le 21 août au sujet de la facture INV-123 » | Table `support_reports` et relation facture |

## Priorité 1 — Données financières et gestion des garages

| N° | Demande | Emplacement | Ce qu’il faut faire | Exemple concret | Dépendance |
|---:|---|---|---|---|---|
| 8 | Voir les garages qui ont payé | Dashboard | Relier `subscriptions`, `garages`, `users` et paiements ; créer une vue « Garages abonnés » avec statut et dernière échéance | Garage Mvoumvou — offre Pro — active — dernier paiement le 20 août | Tables d’abonnement et paiements créées ; relations à confirmer |
| 9 | Voir l’historique des transactions | Dashboard | Ajouter une page filtrable par garage, client, période, fournisseur, statut et facture ; exporter en CSV | Filtrer les paiements KPay du garage A entre le 1er et le 31 août | `kpay_payments`, `invoices`, relations utilisateurs |
| 10 | Mettre l’abonnement garage avec KPay | API, mobile, dashboard | Créer les offres, générer une facture serveur, lancer KPay avec `invoiceId`, traiter le webhook et activer l’abonnement uniquement après confirmation | Un garage choisit Pro : le serveur crée la facture, KPay paie, le webhook active Pro | KPay production, webhook, prix validés |
| 11 | Créer les offres d’abonnement | Dashboard et règles serveur | Définir les plans, prix, durée, avantages, période d’essai, renouvellement et résiliation | Essentiel à X FCFA/mois, Pro à Y FCFA/mois, Premium à Z FCFA/mois | Décision commerciale et validation des montants |
| 12 | Calculer abonnements, commissions, publicité, dépenses et bénéfice net | Dashboard | Construire un module financier avec revenus par source, coûts, commissions KPay, dépenses et bénéfice | Revenus 500 000 FCFA − commissions 30 000 − dépenses 150 000 = bénéfice net 320 000 FCFA | Catégories comptables et données de coûts réels |
| 13 | Répartition géographique | Dashboard | Ajouter filtres, compteurs et graphique par Brazzaville, Pointe-Noire et Dolisie ; normaliser les valeurs existantes | 12 garages à Brazzaville, 4 à Pointe-Noire, 2 à Dolisie | Colonne de localisation fiable et valeurs normalisées |

## Priorité 2 — Fonctions dashboard de gestion

| N° | Demande | Emplacement | Ce qu’il faut faire | Exemple concret | Dépendance |
|---:|---|---|---|---|---|
| 14 | Modifier certains éléments de l’application depuis le site | Dashboard et mobile | Créer un espace de configuration distant limité à des contenus non critiques : bannières, textes, ordre d’affichage ; versionner chaque changement | Modifier la bannière d’accueil sans publier une nouvelle version mobile | API de configuration et stratégie de cache |
| 15 | Upload de bannières avec numéro | Dashboard | Ajouter upload sécurisé, validation du type et de la taille, numéro d’ordre, aperçu, activation/désactivation et stockage S3 | Bannière 01 en haut, bannière 02 ensuite ; aucune image locale dans le dépôt | Stockage S3, dimensions et poids maximum |
| 16 | Instructions guidées sur le site | Dashboard | Ajouter un mode « Aide » par page et par élément, avec textes courts, étapes et éventuellement visite guidée | Sur Paiements : « 1. filtrez ; 2. ouvrez une transaction ; 3. consultez la facture » | Contenu validé et composants d’aide |
| 17 | Renommer « mode garage » en « pro » | Mobile et API | Modifier les libellés visibles et vérifier les valeurs métier, routes, permissions et notifications pour éviter une simple modification cosmétique incohérente | Le bouton affiche « Passer en mode Pro » et non « mode garage » | Inventaire des chaînes et contrats API |
| 18 | Localisation dans l’application | Mobile | Ajouter la localisation ou sélection de ville, permissions claires, fallback manuel et stockage de la ville normalisée | Un utilisateur choisit Pointe-Noire si le GPS est refusé | Choix GPS automatique, saisie manuelle ou les deux |
| 19 | Corriger l’attente pendant l’upload photo | Mobile, API, stockage | Afficher progression, miniature immédiate, compression, reprise ou annulation contrôlée, timeout explicite et message d’erreur | Une photo de 5 Mo devient une miniature puis montre « 65 % » au lieu d’un écran bloqué | Stratégie image et stockage S3 |
| 20 | Demander périodiquement une note App Store/Play Store | Mobile | Afficher une demande après une action positive, avec fréquence limitée et possibilité « plus tard » ; utiliser les APIs natives | Après trois paiements réussis, demander une note, au maximum une fois par période | Identifiants stores et seuils UX validés |
| 21 | Mises à jour progressives | Mobile et publication | Séparer mises à jour de contenu distant et nouvelles versions natives ; utiliser un numéro de version, notes de version, tests et déploiement progressif | Changer une bannière à distance sans remplacer l’application ; pour une nouvelle permission, publier une version contrôlée | Stratégie Expo/EAS, stores et environnement staging |

## Priorité 3 — Automatisations et agent IA

| N° | Demande | Emplacement | Ce qu’il faut faire | Exemple concret | Dépendance |
|---:|---|---|---|---|---|
| 22 | Traiter automatiquement les e-mails | Service serveur et dashboard | Recevoir les e-mails, classer, extraire les références, résumer et créer une tâche ; prévoir validation humaine pour les actions sensibles | Un e-mail de support devient un résumé et un signalement à vérifier | Fournisseur e-mail, API et règles de confidentialité |
| 23 | Agent IA pour e-mails, signalements et notifications | Service serveur et dashboard | Séparer lecture, résumé, classification et action ; journaliser les décisions ; interdire à l’agent de rembourser, suspendre ou supprimer seul | L’agent propose « priorité élevée » mais un admin confirme la suspension | Modèle IA, budget, garde-fous et validation humaine |
| 24 | Notifications de transactions | API, mobile, dashboard | Envoyer notifications sur facture créée, paiement confirmé, échec ou expiration, sans révéler de secret | Le garage reçoit « paiement confirmé » après webhook vérifié | Push, SMS ou e-mail à choisir |
| 25 | Créer trois nouvelles adresses e-mail | Domaine et fournisseur e-mail | Créer les boîtes, configurer SPF, DKIM, DMARC et définir les usages | `support@`, `facturation@`, `securite@` | Nom de domaine et fournisseur choisi |

Deux architectures sont possibles pour l’automatisation. Une solution légère consiste à utiliser des règles serveur et une exécution périodique pour les résumés peu fréquents ; elle est simple et moins coûteuse, mais moins immédiate. Une solution plus complète consiste à recevoir les nouveaux e-mails par événement, les placer dans une file, puis utiliser l’IA pour résumer et classer ; elle est plus réactive, mais demande davantage de configuration, de contrôle et de budget. Pour les signalements et transactions, l’événement serveur est préférable au polling lent.

## Priorité 4 — Documentation et compétences réutilisables

| N° | Document ou compétence | Contenu attendu | Exemple de résultat |
|---:|---|---|---|
| 26 | Skill pour l’application mobile | Architecture Expo, navigation, auth, paiements, permissions, stockage sécurisé, tests et publication | Une compétence qui sait où modifier un écran mobile sans casser Expo Router |
| 27 | Skill pour le dashboard | Architecture React/tRPC, Supabase, rôles admin, RLS, exports, audit et états vides | Une compétence qui applique automatiquement les garde-fous du dashboard |
| 28 | Guide de création comme celui-ci | Installation, structure, variables, base, démarrage local, tests, branches et déploiement | Un nouveau développeur peut lancer le projet avec une procédure pas à pas |
| 29 | Fichier des besoins de l’application | Fonctionnalités, rôles, flux clients/pro, paiements, avis, sécurité et règles métier | Une référence unique qui explique ce que l’application doit toujours respecter |
| 30 | Livre blanc | Fonctionnement global, acteurs, flux de données, modèle économique, sécurité et évolutions | Un document compréhensible par un partenaire ou un investisseur |
| 31 | Guide App Store et Play Store | Comptes développeur, icônes, captures, confidentialité, builds, tests, soumission et mises à jour | Une checklist pour publier sans oublier les déclarations obligatoires |

## Ordre d’exécution recommandé

### Lot A — Sécuriser avant d’ajouter des fonctions

Commencer par le contrôle des rôles admin, la connexion limitée aux adresses autorisées, la 2FA, la facture serveur, l’expiration de trois minutes et l’impossibilité d’interrompre ou de modifier une transaction côté mobile. Ce lot évite qu’une nouvelle page de gestion amplifie une faille existante.

### Lot B — Fiabiliser les abonnements et la finance

Définir les offres, connecter l’abonnement à KPay, activer l’abonnement après webhook, afficher les garages payeurs, l’historique et la répartition géographique. Ensuite seulement, calculer les revenus, dépenses et bénéfices sur des données réelles.

### Lot C — Enrichir le dashboard

Ajouter les auteurs de factures et signalements, les filtres géographiques, les instructions guidées et la gestion des bannières. La gestion distante doit rester limitée aux contenus et ne doit jamais permettre de contourner les règles de paiement ou de sécurité.

### Lot D — Améliorer l’application mobile

Renommer le mode Pro, ajouter la localisation, améliorer les uploads, introduire les demandes de notation et formaliser les mises à jour progressives. Chaque changement mobile doit être testé sur Android et iOS avant publication.

### Lot E — Automatiser et documenter

Créer les adresses e-mail, brancher le traitement automatique, ajouter l’agent IA avec validation humaine, puis rédiger les deux skills, le guide technique, le fichier des besoins, le livre blanc et le guide de publication.

## Prérequis à fournir ou décider

| Décision | Pourquoi elle est nécessaire |
|---|---|
| Les deux adresses admin autorisées | Sans elles, la restriction de connexion ne peut pas être définie |
| Méthode 2FA : TOTP, e-mail ou SMS | Elle détermine les écrans, les secrets et les coûts |
| Prix et avantages des offres | Nécessaire avant de brancher les abonnements KPay |
| Règle de commission | Nécessaire pour calculer le bénéfice net |
| Coûts fixes et variables | Nécessaire pour calculer les dépenses réelles |
| Fournisseur des trois boîtes e-mail | Nécessaire pour l’automatisation et SPF/DKIM/DMARC |
| Mode de localisation | GPS, saisie manuelle ou les deux |
| Format des bannières | Dimensions, poids maximal, nombre actif et ordre |
| Canaux de notification | Push, SMS, e-mail ou combinaison |

## Ce qui ne doit pas être fait maintenant

Il ne faut pas commencer par l’agent IA, les bannières ou les pop-ups de notation. Il ne faut pas non plus calculer un bénéfice avec des montants simulés, ni permettre au client mobile d’envoyer un montant de paiement. Ces éléments dépendent d’abord de la sécurité, des factures et des données financières serveur.
