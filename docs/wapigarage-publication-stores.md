# Publier WapiGarage sur Google Play et l’App Store

## Préparer la version

Avant toute publication, vérifier le typecheck, les tests, le build, les variables publiques et serveur, l’URL API de production, le fonctionnement Google OAuth, Infobip, KPay, les webhooks, les factures, les avis et les permissions. Tester sur un appareil Android réel et un iPhone réel. Ne jamais publier une version contenant des secrets dans le bundle mobile.

Le projet Expo doit avoir un identifiant stable, une version lisible et un numéro de build croissant. Une correction de code nécessite une nouvelle version publiée. Une modification de contenu distant, comme une bannière déjà prévue par le dashboard, peut être effectuée sans nouvelle version si elle ne modifie pas le code ou les permissions.

## Comptes nécessaires

Il faut un compte Apple Developer pour iOS et un compte Google Play Console pour Android. Les comptes de paiement, les informations de confidentialité, les coordonnées de support et les informations légales doivent être prêtes avant l’envoi.

## Construire avec Expo EAS

Depuis la racine du projet mobile, installer et utiliser EAS CLI selon la configuration du projet, puis se connecter au compte Expo autorisé. Configurer les identifiants iOS et Android dans EAS, vérifier les variables d’environnement de production, puis lancer un build de production Android et iOS. Conserver les identifiants de build et les artefacts dans un emplacement sécurisé.

Le flux recommandé par Expo est de construire les binaires avec EAS Build puis de les envoyer avec EAS Submit. La documentation officielle est disponible dans [EAS Build](https://docs.expo.dev/build/introduction/) et [Submit to app stores](https://docs.expo.dev/deploy/submit-to-app-stores/).

## Google Play

Créer l’application dans Google Play Console, choisir le nom WapiGarage, la langue française, la catégorie et la classification adaptée. Ajouter la fiche store : icône, captures Android, description courte, description longue, coordonnées de contact, politique de confidentialité et questionnaire de contenu.

Commencer par un test interne ou fermé. Installer la version sur plusieurs appareils, vérifier la connexion, les paiements, les notifications, les images et les parcours client/pro. Corriger les problèmes avant de demander la production. Le point d’entrée officiel est [Google Play Console Publishing overview](https://play.google.com/console/about/publishingoverview/).

## App Store

Créer l’application dans App Store Connect avec l’identifiant bundle correspondant. Ajouter le nom, le sous-titre, la description, les mots-clés, les captures iPhone, l’icône, les informations de confidentialité et les coordonnées de support. Si une fonctionnalité nécessite une connexion, fournir les informations de test dans la section prévue pour l’examen.

Envoyer le build, l’associer à la version, répondre aux questions de conformité et soumettre à l’examen. Le flux officiel est décrit dans [App Store Connect Help](https://developer.apple.com/help/app-store-connect/) et [Submit an app](https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-an-app/).

## Après publication

Surveiller les erreurs, les paiements, les webhooks, les crashs et les retours utilisateurs. Une mise à jour progressive doit commencer par un petit pourcentage d’utilisateurs, puis augmenter après vérification des indicateurs. Ne jamais modifier directement une base de production pour contourner un contrôle de version ; créer une migration additive, la tester, puis la documenter.

## Critères de blocage

Ne pas publier si les paiements ne sont pas validés par webhook, si les secrets apparaissent dans le bundle, si une route privée est accessible sans session, si la politique de confidentialité est incomplète, si les statuts de facture sont incohérents ou si l’application se ferme pendant un parcours principal.
