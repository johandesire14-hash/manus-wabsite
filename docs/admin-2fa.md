# 2FA Authenticator du dashboard

La connexion administrateur utilise un code TOTP compatible avec Google Authenticator et Microsoft Authenticator. L’administrateur saisit d’abord son e-mail et son mot de passe, demande le QR code, le scanne dans son application, puis saisit le code à six chiffres.

Le secret TOTP n’est jamais envoyé au navigateur et n’est jamais affiché dans l’interface. Le serveur utilise `ADMIN_TOTP_SECRET` lorsqu’il est configuré comme secret d’environnement. Si ce secret dédié n’est pas renseigné, le serveur dérive une clé stable à partir de `JWT_SECRET`, qui reste côté serveur. Cette solution évite à l’administrateur de chercher ou saisir une valeur technique dans Settings → Secrets.

Le QR code est généré par le serveur via `/api/auth/admin/totp/setup` après vérification de l’adresse allowlistée et du mot de passe. La connexion `/api/auth/admin/login` exige ensuite un code TOTP valide ; les codes absents, invalides ou expirés sont refusés. Le QR code renvoie uniquement une image PNG et jamais l’URI otpauth ni la clé brute.

En cas de changement de `JWT_SECRET`, l’association Authenticator doit être réinitialisée, car la clé dérivée change. En production, un `ADMIN_TOTP_SECRET` dédié peut être ajouté dans les secrets du projet pour dissocier la 2FA de `JWT_SECRET`, mais aucune valeur n’est nécessaire pour utiliser le parcours automatique actuel.
