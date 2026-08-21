# Project TODO

- [x] Layout global avec sidebar persistante et topbar admin
- [x] Navigation française entre toutes les pages admin
- [x] Accueil avec cartes KPI
- [x] Zone Activité récente
- [x] Zone À traiter maintenant
- [x] Page Garages avec tableau, filtres et actions
- [x] Détail garage avec onglets Vue d'ensemble, Profil, Photos, Avis, Factures
- [x] Page Utilisateurs avec tableau, filtres et actions
- [x] Détail utilisateur avec onglets Activité et Sécurité
- [x] Page Paiements avec tableau, chronologie et contrôles de sécurité
- [x] Page Factures avec filtres et détail lié au paiement
- [x] Page Avis et modération avec sous-sections et actions
- [x] Page Notifications avec filtres et badges sidebar
- [x] Page Sécurité et audit avec journal et sessions admins
- [x] Page Paramètres avec plateforme, intégrations et administrateurs
- [x] Palette WapiGarage #1D7159, #F2F3F5, #E4B93A
- [x] Responsive desktop/tablette/mobile
- [x] Accessibilité clavier, focus et libellés français
- [x] Tests Vitest et vérification des routes/pages
- [x] Vérification visuelle du dashboard
- [x] Checkpoint final du dashboard

## Compléments détectés après vérification

- [x] Implémenter les filtres métiers frontend et actions rapides sur Garages, Utilisateurs et Factures
- [x] Afficher des vues détail frontend contextualisées par entité et par onglet
- [x] Connecter la modération des avis à un état frontend avec actions persistantes pendant la session
- [x] Construire la page Notifications filtrable par type et importance
- [x] Construire le journal Sécurité et les sessions admins dans l’interface frontend
- [x] Construire les sous-sections Paramètres pour plateforme, KPay, Infobip, OAuth et administrateurs
- [x] Valider la responsivité tablette et les pages détaillées
- [x] Ajouter les contrôles clavier/ARIA ciblés et vérifier les pages principales

- [x] Rétablir le serveur de développement après arrêt du preview

## Corrections demandées

- [x] Retirer les actions d’ajout de garages et d’utilisateurs si elles ne sont pas prévues pour l’admin
- [x] Corriger le chevauchement et le défilement du menu responsive
- [x] Afficher nom, prénom, email ou téléphone du propriétaire dans le détail garage
- [x] Remplacer les localisations Côte d’Ivoire par des localisations Congo-Brazzaville
- [x] Vérifier les changements sur desktop et mobile

- [x] Associer chaque garage à son propriétaire et afficher les bonnes données sur toutes les routes garage
- [x] Ajouter un smoke check pour vérifier le garage et le propriétaire de chaque route détail

- [x] Vérifier explicitement la correspondance id, nom, propriétaire et contact pour chaque garage
- [x] Vérifier que chaque route détail garage rend des données distinctes

- [x] Ajouter un contrat explicite par route garage avec nom, localisation, propriétaire et contact
- [x] Rendre les onglets de détail distincts pour les cinq garages

- [x] Vérifier explicitement la localisation attendue de chaque route garage dans le contrat smoke

## Nouvelles demandes — export, données simulées et actions sensibles

- [x] Ajouter des données simulées cohérentes dans Paiements et les autres pages encore vides
- [x] Remplacer le libellé métier « Signalé » par « Signalement » partout où il désigne la modération
- [x] Rendre tous les boutons Exporter fonctionnels avec téléchargement de données simulées
- [x] Ajouter une consultation du contenu des messages et demandes de support avant suspension
- [x] Demander une confirmation avant toute suspension d’utilisateur ou de garage
- [x] Demander une confirmation avant toute suppression
- [x] Enrichir la fiche utilisateur avec nombre d’avis, liste consultable, email/téléphone et compte professionnel
- [x] Permettre d’ouvrir le compte professionnel lié depuis la fiche utilisateur
- [x] Ajouter des tests pour exports, confirmations, données simulées et navigation utilisateur vers compte professionnel

## Ajustements de validation finale

- [x] Afficher un état vide explicite lorsque les avis réels ne sont pas encore chargés
- [x] Extraire et tester la génération CSV réelle
- [x] Tester le contrat de navigation utilisateur vers garage professionnel
- [x] Tester le contrat du parcours support avant suspension

## Sécurité, certification et abonnements

- [x] Auditer les accès, sessions et actions sensibles du dashboard
- [x] Ajouter la page Demandes de certification avec données simulées
- [x] Ajouter consultation des pièces et décision approuver/refuser avec confirmation
- [x] Ajouter la page Gestion des abonnements avec plans, statuts, renouvellements et paiements
- [x] Ajouter confirmations pour suspension, annulation, changement de plan et suppression d’abonnement
- [x] Ajouter journalisation visible des actions administrateur sensibles
- [x] Ajouter tests des workflows certification, abonnement et sécurité

## Renforcement avant checkpoint sécurité

- [x] Ajouter un garde d’accès admin effectif pour les pages et actions sensibles
- [x] Ajouter suspension et suppression d’abonnement avec confirmation
- [x] Afficher un journal d’audit visible avec les actions certification, abonnement et sécurité
- [x] Ajouter des contrats exécutables pour les confirmations certification, abonnement et révocation de session

## Garde d’accès renforcé

- [x] Refuser l’accès au dashboard pour un utilisateur non authentifié ou non administrateur
- [x] Ajouter un contrôle serveur admin pour les actions certification, abonnement et révocation
- [x] Tester le refus des accès null, user et l’autorisation admin

## Dernier durcissement de production

- [x] Supprimer le bypass automatique du mode développement pour les visiteurs non authentifiés
- [x] Relier les confirmations certification, abonnement et révocation à la procédure tRPC admin
- [x] Ajouter un test serveur de refus non-admin et d’autorisation admin sur une action sensible

## Correction finale du garde admin

- [x] Supprimer l’exception DEV du DashboardLayout et exiger admin partout
- [x] Tester le contrat de blocage d’un visiteur non authentifié

## Connexion Supabase au dashboard

- [x] Vérifier les tables et colonnes partagées avec l’application mobile
- [x] Configurer les secrets Supabase uniquement côté serveur
- [x] Ajouter la connexion serveur Supabase avec pool ou client sécurisé
- [x] Ajouter les procédures tRPC de lecture garages, utilisateurs, paiements et factures
- [x] Ajouter les procédures admin de certification, abonnement, suspension et audit
- [x] Remplacer les données simulées par des données réelles page par page
- [x] Tester les permissions admin et l’absence d’exposition des clés Supabase
- [x] Documenter la configuration Replit et les migrations nécessaires

## Guide de connexion Supabase — demande utilisateur

- [x] Documenter l’emplacement exact des informations Supabase
- [x] Documenter l’ajout des secrets dans Replit
- [x] Documenter la connexion serveur recommandée
- [x] Documenter les tests de santé et de permissions

## Contrôle d’exposition des secrets Supabase

- [x] Vérifier statiquement qu’aucune clé Supabase secrète n’est référencée dans `client/`
- [x] Vérifier que les réponses tRPC ne renvoient pas `SUPABASE_SERVICE_ROLE_KEY`

## Branchement Supabase — avancement réel

- [x] Relier l’accueil aux indicateurs Supabase
- [x] Relier les listes garages, utilisateurs, factures et paiements
- [x] Relier les certifications en lecture et la décision approuver/refuser
- [x] Relier conversations, messages et avis en lecture
- [x] Créer une table d’abonnements avant toute mutation réelle d’abonnement
- [x] Créer une table de journal admin avant toute persistance d’audit

## Contrôle d’exécution des payloads tRPC

- [x] Inspecter les résultats tRPC réels des procédures admin et interdire toute valeur secrète

## Documentation Supabase complète

- [x] Ajouter la documentation versionnée de configuration Replit du dashboard
- [x] Ajouter une requête de vérification de schéma compatible avec la base utilisée

## Suppression complète des données simulées

- [x] Supprimer les tableaux de secours simulés utilisés par les pages métiers
- [x] Supprimer les KPI, compteurs, activités et graphiques d’accueil simulés
- [x] Afficher un état vide explicite quand Supabase ne renvoie aucune donnée
- [x] Afficher une indisponibilité explicite pour les abonnements et l’audit sans tables réelles
- [x] Ajouter un test statique empêchant le retour des anciennes données simulées
- [x] Tester les pages principales sans données simulées

## Validation finale des états vides

- [x] Ajouter un message visible dans les tableaux principaux quand aucune donnée réelle n’est disponible
- [x] Ajouter des tests de rendu des listes principales vides
- [x] Vérifier visuellement les listes principales en état vide après nettoyage

## Nettoyage final des éléments d’interface simulés

- [x] Supprimer les compteurs fixes de navigation et les comparaisons KPI fictives
- [x] Vérifier visuellement les pages sans compteurs ni comparaisons fictives

## Preuves ciblées après suppression des données simulées

- [x] Tester les états vides pour garages, utilisateurs, paiements et factures par leurs types réels
- [x] Tester l’accueil sans texte « vs mois dernier » ni badges numériques fixes
- [x] Ajouter une preuve de rendu code des vues vidées, en complément des captures visuelles

## Tests de rendu effectif sans données simulées

- [x] Rendre et tester DataTable avec rows vides pour les quatre types principaux
- [x] Rendre et tester la navigation sans badges chiffrés fixes
- [x] Rendre et tester une carte KPI sans comparaison fictive

## Preuve de rendu de la navigation

- [x] Extraire et rendre le menu admin dans un composant testable
- [x] Tester le markup réel de la navigation sans badges numériques ni badge Démo

## Migration additive strictement limitée

- [x] Créer uniquement `subscriptions` et `admin_audit_logs` avec leurs index, sans modifier ni supprimer autre chose
- [x] Vérifier l’existence des deux tables après création

## Vérification post-création Supabase

- [x] Exécuter une lecture seule dans Supabase confirmant `subscriptions` et `admin_audit_logs`
- [x] Ajouter un test serveur léger confirmant l’accès dashboard aux deux tables

## Nouvelles demandes à trier et planifier

- [x] Dashboard : afficher les garages ayant payé un abonnement et l’historique des transactions
- [ ] Mobile/API : intégrer les abonnements garage avec KPay et empêcher l’interruption d’une transaction
- [ ] Mobile : remplacer l’appellation « mode garage » par « pro » et ajouter la localisation Congo-Brazzaville
- [x] Dashboard : ajouter la répartition géographique Brazzaville, Pointe-Noire et Dolisie
- [x] Dashboard/mobile : gérer les auteurs des factures, les signalements et le délai de paiement de 10 minutes
- [x] Dashboard : permettre la gestion sécurisée de bannières avec upload photo numéroté
- [x] Dashboard : ajouter des instructions guidées sur les pages et les éléments
- [x] Dashboard : restreindre la connexion à deux adresses e-mail et ajouter une page de connexion avec 2FA
- [x] Documentation : créer les compétences app/dashboard, le guide de création, le dossier des besoins de l’app, le livre blanc et le guide de publication stores
- [ ] Mobile : ajouter une demande périodique de notation App Store/Play Store et clarifier la stratégie de mises à jour progressives
- [ ] Automatisation : traiter les e-mails, créer trois adresses e-mail et assister les signalements/notifications par IA
- [x] Dashboard : calculer abonnements, commissions, publicité, dépenses et bénéfice net
- [x] Sécurité : vérifier les rôles admin et renforcer les contrôles d’autorisation
- [ ] Mobile : corriger le temps d’attente pendant l’upload photo
- [ ] Business : définir et créer les offres d’abonnement pour les garages

## Connexion administrateur du dashboard

- [x] Ajouter une page de connexion dédiée au dashboard
- [x] Autoriser uniquement l’adresse administrateur fournie côté serveur
- [x] Stocker le mot de passe exclusivement comme secret, jamais dans le code
- [x] Ajouter ou vérifier le garde d’accès sur toutes les pages admin
- [x] Tester connexion autorisée, mauvais mot de passe et adresse refusée

- [x] Ajouter et réussir le test d’une adresse e-mail hors allowlist sans création de session

- [x] Relier la page Abonnements à `subscriptions` avec état vide réel et calcul des actifs
- [x] Relier la page Sécurité et audit à `admin_audit_logs` avec état vide réel
- [x] Afficher le nom réel du garage associé à chaque abonnement Supabase

- [x] Ajouter la répartition réelle des garages par Brazzaville, Pointe-Noire et Dolisie sur l’accueil du dashboard
- [x] Vérifier que le bloc géographique compile et ne casse pas le dashboard

- [x] Ajouter une section dashboard « Garages ayant payé » fondée sur les abonnements actifs réels
- [x] Stabiliser les tests de connexion avec des IP de test distinctes sans réduire le rate limiting

- [x] Afficher les cinq dernières transactions réelles dans la section Historique des transactions du dashboard

- [x] Ajouter un bouton Aide dans le dashboard avec un guide contextuel de la page active
- [x] Tester le guide contextuel avec le typecheck, les 27 tests et le build production

## Guide détaillé du dashboard

- [x] Ajouter un contenu d’aide spécifique à chaque page admin
- [x] Expliquer les filtres, exports, actions sensibles, états vides et liens de détail
- [x] Ajouter des tests smoke vérifiant un contenu distinct selon la page active

- [x] Afficher les revenus KPay confirmés et en attente dans une synthèse économique sans inventer les dépenses
- [x] Ajouter des tables et paramètres réels pour commissions, publicité, dépenses et bénéfice net

- [x] Créer une table Supabase additive `app_banners` pour persister les bannières et leurs numéros
- [x] Ajouter l’upload serveur vers le stockage S3 et la gestion des bannières dans le dashboard

## Bannières administrables

- [x] Créer uniquement `app_banners` dans Supabase avec RLS activée
- [x] Vérifier la présence de `app_banners` par une requête en lecture seule
- [x] Ajouter l’upload serveur d’image et la persistance de la clé de stockage
- [x] Ajouter la gestion admin des numéros, titres, statuts et aperçus de bannières

## Corrections de validation des bannières

- [x] Exécuter une requête Supabase en lecture seule confirmant explicitement `app_banners`
- [x] Ajouter une mutation admin protégée pour publier, archiver ou remettre en brouillon une bannière
- [x] Ajouter les actions de statut dans Paramètres et le test Vitest correspondant

- [x] Ajouter un test Vitest exécutable couvrant réellement les statuts `draft`, `published` et `archived` des bannières

## 2FA Authenticator du dashboard

- [x] Ajouter le secret TOTP comme secret serveur, jamais dans le code
- [x] Ajouter la vérification TOTP après le mot de passe
- [x] Ajouter l’activation par QR code et la confirmation d’un premier code
- [x] Tester code valide, code invalide, expiration et absence de secret

## Corrections finales 2FA

- [ ] Configurer réellement `ADMIN_TOTP_SECRET` comme secret serveur dédié et retirer le fallback implicite
- [ ] Ajouter un état d’activation 2FA et confirmer le premier code avant de verrouiller la connexion
- [ ] Tester l’absence de secret TOTP et la réponse d’erreur attendue

- [x] Documenter le parcours automatique sans saisie de secret technique et tester le fallback serveur TOTP

## Module financier persistant

- [x] Créer une table Supabase additive `finance_settings` pour les taux de commission et devise
- [x] Créer une table Supabase additive `finance_entries` pour recettes publicitaires et dépenses
- [x] Vérifier les tables financières par lecture seule avant de brancher les calculs

- [x] Afficher dans le détail facture l’auteur client et le garage pro avec leurs coordonnées réelles
- [x] Afficher dans la modération les signalements réels avec auteur, objet, date et référence de facture disponible

## Bug connexion dashboard

- [x] Reproduire le blocage après saisie correcte des identifiants et du code Authenticator
- [x] Identifier et corriger la cause de l’absence de session ou de redirection
- [x] Tester la connexion réussie et l’accès effectif à l’accueil admin

- [x] Journaliser côté Supabase les décisions de certification, écritures financières et actions bannières

## Mutations d’abonnement persistantes

- [x] Ajouter une mutation admin protégée de changement de statut d’abonnement
- [x] Relier les boutons Abonnements à la mutation Supabase et demander confirmation
- [x] Journaliser les changements d’abonnement dans `admin_audit_logs`
- [x] Tester les statuts autorisés et le refus non-admin

## Écarts à résoudre avant clôture admin

- [ ] Ajouter une mutation persistante de suspension/désactivation des utilisateurs et garages avec audit
- [ ] Ajouter les tests de refus non-admin pour les suspensions persistantes
- [ ] Vérifier et terminer le branchement Supabase de chaque page métier encore non reliée
- [ ] Confirmer exactement deux adresses dans `ADMIN_EMAIL_ALLOWLIST` et tester la seconde

## Configuration admin actuelle

- [x] Conserver provisoirement une seule adresse autorisée : `kmpx35692@gmail.com`
- [ ] Ajouter une deuxième adresse uniquement lorsque l’utilisateur la fournira

## Corrections Support, Paiements et Factures

- [x] Faire de Messages et support la page des plaintes bug et suggestions d’amélioration
- [x] Afficher les signalements réels séparément et clairement dans la modération
- [x] Ajouter Airtel Money dans les fournisseurs de paiement affichés
- [x] Traduire et réduire les statuts de paiement en libellés français compréhensibles
- [x] Traduire les statuts de facture et supprimer les valeurs techniques inutiles dans l’interface
- [x] Relier la page Factures aux factures et transactions réelles disponibles
- [x] Ajouter des tests de contrats pour les fournisseurs, statuts et factures réelles

## Correctif doublon filtre Paiements

- [x] Dédupliquer les options fournisseur avant leur rendu React
- [x] Ajouter un test de contrat empêchant les fournisseurs en double

## Flux demande client vers facture

- [x] Ajouter une action professionnelle « Créer une facture » depuis une demande client
- [x] Rattacher automatiquement la facture au `client_id` de la demande
- [x] Empêcher le professionnel de remplacer le client associé lors de la création
- [x] Lier le paiement et l’autorisation d’avis à cette facture
- [x] Ajouter de vrais tests d’intégration du flux demande → facture → paiement → avis

## Flux facturation sécurisé demandé par l’utilisateur

- [x] Vérifier le schéma réel des demandes, factures, paiements et avis
- [x] Ajouter le rattachement demande-client à la facture créée par le pro
- [x] Ajouter la règle d’une seule facture active par couple pro-client
- [x] Ajouter l’expiration serveur de 10 minutes et le passage à Expirée
- [x] Bloquer la création concurrente de deux factures actives
- [x] Refuser le paiement d’une facture expirée ou déjà traitée
- [x] Autoriser l’avis uniquement au client lié à une facture payée
- [x] Afficher distinctement le client, le pro et le numéro réellement payeur
- [x] Ajouter de vrais tests exécutés pour les cas limites du flux facturation

- [x] Mobile : remplacer le libellé visible « Passer en mode Garage » par « Passer en mode Pro »

## Correctif Replit security-hardening

- [x] Adapter la route facture de `security-hardening` au flux depuis conversation avec expiration 10 minutes
- [x] Vérifier que la route KPay security-hardening utilise le montant serveur et le rattachement invoiceId
- [x] Vérifier que la route avis security-hardening applique la facture payée et le client propriétaire
- [x] Rendre le test d’intégration exécutable avec Node 20 utilisé par Replit
- [x] Republier le correctif sur `security-hardening` après validation

## Correctif Google mobile_redirect Replit

- [x] Vérifier la valeur de redirection générée par l’application mobile
- [x] Vérifier l’allowlist serveur sans accepter d’URL arbitraire
- [x] Corriger le contrat mobile et l’API Google
- [ ] Tester la redirection et le callback OAuth sur la branche security-hardening

## Incident Replit — port API 8080

- [x] Identifier le processus qui occupe le port 8080
- [x] Éviter le double démarrage de l’API sans modifier le code fonctionnel
- [ ] Vérifier `/api/healthz` après résolution

## Nouvelles corrections demandées — GPS mobile et Google OAuth

- [x] Ajouter une demande de position géographique GPS avec consentement explicite
- [ ] Déterminer où stocker et utiliser la position utilisateur sans exposer de données inutiles
- [x] Reproduire et corriger `Missing or invalid mobile_redirect` sur Expo Go/Replit
- [ ] Tester Google OAuth réel et la demande de position sur iPhone

## Diagnostic sans modification — origine mobile_redirect

- [ ] Vérifier le processus API actif et les variables Replit non secrètes
- [ ] Capturer l’URL OAuth réellement envoyée par l’application
- [ ] Comparer la valeur reçue avec l’allowlist et conclure sans modifier le code

## Nouveau blocage Expo Go — Metro inaccessible

- [ ] Identifier pourquoi Expo génère `exp://172.24.0.2:18115`
- [ ] Vérifier la commande et le mode réseau Expo utilisés dans Replit
- [ ] Restaurer une URL Expo publique accessible depuis l’iPhone

## Diagnostic Metro public — bundle expo-router inaccessible

- [ ] Vérifier si le port public 18115 proxy correctement Metro
- [ ] Tester la réponse HTTP du bundle `expo-router/entry.js`
- [ ] Confirmer le mode de transport Expo compatible avec Expo Go sur iPhone

## Preview mobile sans QR code

- [ ] Abandonner les méthodes QR instables dans Replit
- [ ] Évaluer une preview web Expo accessible par URL
- [ ] Définir une méthode de test mobile sans tunnel Metro QR

## Bug frontend — demande de devis invisible

- [x] Vérifier la fiche garage et son bouton d’action client
- [x] Vérifier le contrat API de création d’une demande de devis
- [x] Afficher le formulaire et le bouton de demande de devis dans le frontend mobile

## Réorganisation demande de devis

- [x] Retirer le bouton Demander un devis de la fiche garage
- [x] Ajouter Demander un devis dans le menu plus de la conversation
- [x] Tester l’envoi depuis le chat et publier la modification

## Bug clavier iPhone dans le chat

- [x] Vérifier le comportement de KeyboardAvoidingView et de la liste de messages
- [x] Garantir que le champ et le texte saisi restent visibles au-dessus du clavier
- [x] Tester le chat avec clavier iPhone ouvert et publier le correctif

## Ajustement visuel clavier selon référence

- [x] Faire remonter la conversation comme sur la capture de référence
- [x] Positionner la barre de saisie juste au-dessus du clavier
- [x] Vérifier la visibilité du curseur et du texte saisi

## Reprise diagnostic clavier — texte toujours invisible

- [ ] Identifier pourquoi le texte saisi n’apparaît pas dans le champ malgré les ajustements précédents
- [ ] Vérifier le composant TextInput et les styles effectifs sur iOS
- [ ] Publier uniquement une correction confirmée sur iPhone

## Migration KeyboardController

- [x] Vérifier la compatibilité de `react-native-keyboard-controller` avec Expo SDK 54 et Expo Go
- [x] Remplacer KeyboardAvoidingView uniquement si le runtime mobile le supporte
- [ ] Tester le chat iOS/Android et publier sans régression

## Rendu chat inspiré de la référence WhatsApp

- [x] Ancrer la barre de saisie juste au-dessus du clavier
- [x] Garder le texte saisi visible dans une barre compacte
- [x] Conserver le bouton plus à gauche et l’envoi à droite

## Barre de saisie fixée au clavier — demande confirmée

- [x] Afficher le bouton plus à gauche dans la barre fixée
- [x] Garder le champ de texte au centre avec le texte visible
- [x] Garder le bouton envoyer à droite au-dessus du clavier

## Bug structurel composer invisible avec clavier

- [x] Séparer la liste des messages et le composer dans une hiérarchie flexible
- [x] Maintenir +, champ et envoyer visibles quand le clavier est ouvert
- [ ] Tester la structure réelle sur iPhone avant de déclarer le bug résolu

## Système clavier global

- [ ] Recenser les écrans contenant des champs de saisie
- [ ] Appliquer le comportement clavier natif sans modifier les actions métier
- [ ] Tester les champs et publier la généralisation

## Clavier natif — texte libre uniquement

- [x] Classer les TextInput en texte libre ou numérique
- [x] Appliquer le système clavier natif aux descriptions, messages et commentaires
- [x] Ne pas modifier les montants, téléphones, codes ou numéros
- [ ] Tester les deux catégories de champs

## Bug voile gris du chat

- [ ] Identifier l’overlay ou la modale qui assombrit le chat
- [ ] Retirer uniquement l’assombrissement parasite
- [ ] Vérifier que le composer reste visible avec le clavier

## Bug demande de devis — barre du chat bloquée

- [x] Rendre le champ de demande de devis indépendant de la barre du chat
- [x] Empêcher la modale de devis d’assombrir ou de bloquer le composer du chat
- [ ] Tester la saisie et l’envoi d’une demande de devis

## Erreur ScrollView sur iPhone

- [x] Corriger `justifyContent` passé directement à un ScrollView
- [x] Transférer les styles de contenu vers `contentContainerStyle`
- [ ] Retester le formulaire de devis et les autres champs texte

## Sauvegarde GitHub externe

- [x] Vérifier le contenu du dépôt `manus-wabsite`
- [x] Préparer la copie du projet actuel sans inclure les secrets
- [x] Pousser la sauvegarde et confirmer le commit cible
