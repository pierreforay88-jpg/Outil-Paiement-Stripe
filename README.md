# BD Commission Tool — Pierre Foray

Outil de génération de liens de paiement Stripe avec split automatique commission / partenaire.

---

## Déploiement sur Vercel (30 min)

### Étape 1 — Compte GitHub
1. Va sur https://github.com
2. Crée un compte gratuit
3. Clique sur "New repository"
4. Nomme-le `bd-commission-tool`
5. Clique "Create repository"
6. Upload tous les fichiers de ce dossier

### Étape 2 — Déploiement Vercel
1. Va sur https://vercel.com
2. Connecte-toi avec ton compte GitHub
3. Clique "New Project"
4. Sélectionne ton repo `bd-commission-tool`
5. Clique "Deploy"

### Étape 3 — Variable d'environnement (mot de passe)
1. Dans Vercel → ton projet → Settings → Environment Variables
2. Ajoute :
   - Name: `NEXT_PUBLIC_APP_PASSWORD`
   - Value: le mot de passe que tu veux (ex: `MonMotDePasse2026!`)
3. Clique Save
4. Redéploie (Deployments → Redeploy)

C'est tout — l'outil est en ligne sur une URL du type `bd-commission-tool.vercel.app`

---

## Comment configurer un partenaire

En visio avec le partenaire (~15 min) :

1. Il va sur https://dashboard.stripe.com
2. Menu Paramètres → Connect → Activer Connect
3. Il te crée une clé API restreinte :
   - Paramètres → Clés API → Créer une clé restreinte
   - Permission : "Payment Links" → Write
   - Permission : "Payment Intents" → Write
4. Il t'envoie :
   - La clé API (commence par sk_live_...)
   - Son ID de compte (commence par acct_..., visible dans Paramètres → Compte)

Tu entres ces deux infos dans l'onglet "Partenaires" de l'outil.

---

## Utilisation quotidienne

1. Ouvre l'outil (URL Vercel)
2. Connecte-toi avec ton mot de passe
3. Onglet "Générer un lien"
4. Sélectionne le partenaire
5. Entre le montant (€ HT)
6. Choisis ton taux (20%, 25% ou 30%)
7. Génère le lien → copie → envoie au client

Le split est automatique :
- Ta commission → ton compte Stripe instantanément
- Le reste → compte Stripe du partenaire

---

## Sécurité

- Accès protégé par mot de passe
- Clés API stockées dans le localStorage de ton navigateur
- Elles ne transitent jamais en clair — envoyées directement à l'API Stripe
- La clé API du partenaire est masquée dans l'interface
