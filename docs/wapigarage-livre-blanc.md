# Livre blanc WapiGarage

## Résumé

WapiGarage est une plateforme mobile et web qui met en relation des clients et des professionnels de l’entretien automobile au Congo-Brazzaville. Le client découvre un garage, échange avec lui, reçoit une facture, paie et peut laisser un avis après confirmation du paiement. Le professionnel présente son activité, gère ses demandes, ses factures et son abonnement. Le dashboard admin permet de surveiller les utilisateurs, garages, paiements, factures, avis, certifications, abonnements, bannières et événements de sécurité.

## Fonctionnement économique

La plateforme peut combiner plusieurs modèles : abonnement pro, commission sur transaction et publicité. Les revenus confirmés doivent venir des paiements réellement enregistrés. Les frais KPay, les coûts d’infrastructure, les coûts SMS, les remboursements et les dépenses publicitaires doivent être enregistrés séparément avant de calculer un bénéfice net. Une dépense inconnue ne doit jamais être considérée comme nulle.

## Paiement de confiance

Une facture possède un identifiant opaque, un montant, une devise, un garage, un client éventuel, un statut et une date d’expiration. Le mobile envoie l’identifiant de facture au serveur ; le serveur recharge le montant depuis la base. Le QR code et les paramètres transmis par le client ne peuvent pas modifier le prix. KPay confirme le paiement par webhook authentifié et idempotent. Une notification répétée ne doit pas créer un second paiement.

## Confiance et avis

Un avis est lié à un paiement confirmé auprès du garage concerné. Le client ne peut pas déposer un avis pour une facture qui n’est pas la sienne, un garage différent, un paiement échoué ou une facture expirée. L’interface doit expliquer clairement pourquoi un avis est accepté ou refusé.

## Administration

Le dashboard est réservé aux administrateurs autorisés. La connexion utilise une allowlist d’adresses, un mot de passe serveur et un code Authenticator. Les opérations sensibles sont protégées côté serveur, demandent une confirmation dans l’interface et doivent laisser une trace d’audit. Les données absentes sont affichées comme absentes, jamais remplacées par des exemples inventés.

## Données et confidentialité

Les données comprennent les comptes, coordonnées, garages, photos, conversations, factures, paiements, avis, notifications et journaux de sécurité. Les sessions et secrets sont protégés. Les images sont stockées dans le stockage prévu et la base conserve leurs métadonnées. La conservation, la suppression, l’accès et les sous-traitants doivent être décrits dans la politique de confidentialité réellement appliquée.

## Déploiement

L’API et le dashboard sont déployés séparément du mobile. Les environnements développement, staging et production utilisent des secrets distincts. Une publication mobile suit un cycle de build, test interne, test fermé, examen store et déploiement progressif. Les contenus administrables, comme les bannières, peuvent évoluer sans publication mobile lorsqu’ils sont servis depuis le dashboard.

## Risques à surveiller

Les risques principaux sont le contournement du montant client, la réutilisation d’un webhook, l’accès à un garage qui ne correspond pas au rôle, la fuite de session, l’upload massif, l’exposition de données personnelles et l’absence de journal des opérations admin. Chaque risque doit posséder un contrôle côté serveur et un test reproductible.

## Vision

WapiGarage doit devenir une infrastructure de confiance pour les services automobiles locaux : recherche géographique simple, communication directe, paiement vérifiable, réputation fondée sur des transactions réelles et pilotage transparent par les administrateurs.
