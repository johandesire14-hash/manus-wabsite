# Besoins de l’application mobile WapiGarage

## Vision

WapiGarage est une application mobile destinée aux clients qui recherchent un garage au Congo-Brazzaville et aux professionnels qui présentent leurs services. L’application doit rester en français, utiliser les villes de Brazzaville, Pointe-Noire et Dolisie, et ne jamais afficher de données fictives en production.

## Parcours client

Le client peut créer un compte par Google ou par téléphone, consulter les garages, filtrer par ville, ouvrir une fiche garage, consulter les services et photos, envoyer un message, demander une facture, payer via KPay et laisser un avis seulement après un paiement confirmé auprès du garage concerné.

Le paiement doit toujours être piloté par le serveur. Le client envoie un identifiant de facture, son téléphone et son fournisseur de paiement. Le montant, la devise, le garage et le statut proviennent de la facture enregistrée côté serveur. Le QR code ne doit jamais être considéré comme une source fiable pour le montant.

## Parcours professionnel

Le professionnel peut créer son profil pro, renseigner son garage, sa localisation, ses horaires, ses services, ses photos et ses coordonnées. Il peut recevoir des demandes, établir des factures, suivre les paiements confirmés et consulter ses avis. L’appellation visible dans l’interface doit être « pro » et non « mode garage ».

## Sécurité obligatoire

Les sessions doivent être conservées dans SecureStore côté mobile. Les routes privées doivent vérifier la session et le rôle côté serveur. Les montants et statuts de paiement ne doivent jamais être acceptés depuis le client. Les webhooks KPay doivent être authentifiés, idempotents et capables de rejeter une notification répétée ou incohérente.

Les demandes de paiement doivent posséder une durée de validité, par exemple trois minutes lorsque ce délai est confirmé par les règles métier. Une facture expirée doit être refusée, et une transaction déjà confirmée ne doit pas pouvoir être interrompue par une action client.

## Données principales

Les entités de référence sont les utilisateurs, garages, photos, factures, paiements KPay, avis, conversations, messages, notifications, demandes de certification, abonnements et signalements. Les relations doivent permettre de retrouver l’auteur client et l’auteur pro d’une facture, ainsi que l’auteur, l’objet, la date et la facture associée à un signalement.

## Performance et expérience

Les longues listes doivent utiliser `FlatList` ou `SectionList`. Les images doivent utiliser des tailles adaptées et des miniatures. Les uploads doivent afficher une progression, gérer l’annulation locale avant envoi et présenter un message clair en cas de réseau lent. Chaque requête doit avoir un état de chargement, un état vide et un état d’erreur compréhensible.

## Publication et évolution

Les modifications doivent être livrées par versions progressives. Une version doit être testée sur Android et iOS, puis publiée en test fermé avant la production. Les changements de contenu tels que les bannières peuvent être gérés à distance depuis le dashboard ; les changements de code, de navigation ou de permissions nécessitent une nouvelle version de l’application.
