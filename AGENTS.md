# Guide de contribution pour les agents

Ce fichier s'applique a tout le depot. Il permet a plusieurs humains et agents, y compris des
modeles peu couteux, de travailler sans ecraser une version plus recente.

## Avant toute modification

1. Executer `git fetch origin --prune` puis `git status --short`.
2. Sur `main`, executer `git pull --ff-only origin main`.
3. Creer une branche courte : `git switch -c opencode/<sujet>` ou `codex/<sujet>`.
4. Lire les fichiers concernes avant de les modifier. Ne jamais reconstruire `index.html` depuis
   une ancienne copie ou depuis la production.

Si `git pull --ff-only` echoue ou si le depot contient des modifications inconnues, ne pas forcer,
ne pas reinitialiser et demander une verification humaine.

## Contrats a preserver

- Production utilisateurs : `https://riskveillecrf-824.pages.dev/`.
- Le bouton `#btnHome` est un lien `href="/"` avec le paon
  `assets/brand/peacock.png` et le texte `Veille`.
- L'etat initial est : Vue globale, Monde, toutes les categories, tous les articles et tri
  `Plus aimes`.
- La langue initiale est toujours le francais. Le bouton Royaume-Uni traduit l'interface en
  anglais sans modifier la langue des articles sources.
- Les resumes IA francais et anglais sont stockes separement dans
  `article_ai_summaries_i18n`. Ne jamais remplacer une langue par l'autre.
- Conserver exactement 66 sources globales, 18 sources concurrentielles et 1 source de veille
  Carrefour, sauf demande explicite.
- Ne jamais supprimer ou reinitialiser les donnees D1, les archives, J'aime, commentaires ou resumes.
- Ne jamais placer un jeton GitHub ou Cloudflare dans un fichier, un commit, un log ou un message.

## Validation obligatoire

Apres chaque modification :

1. Executer `npm run check`.
2. Pour une modification d'interface, lancer le serveur Wrangler local puis `npm run test:ui`.
3. Examiner `git diff --check`, `git diff` et `git status --short`.
4. Faire un commit limite au sujet traite et ouvrir une pull request.

La sortie de `npm run check` doit etre verte avant fusion. Ne jamais contourner un test en
supprimant son assertion. Corriger le comportement ou expliquer clairement pourquoi le contrat
doit changer.

## Publication

Une seule personne publie a la fois. Apres fusion :

1. Revenir sur `main` et executer `git pull --ff-only origin main`.
2. Verifier que `git rev-list --left-right --count main...origin/main` retourne `0 0`.
3. Executer `npm run check`, puis `npm run deploy:cloudflare`.
4. Tester l'URL de production dans un nouveau contexte navigateur.
5. Verifier que le commit local et `origin/main` sont identiques.

Ne jamais deployer depuis une branche locale en retard ou contenant des modifications non commitees.

## Carte rapide

- `index.html` : interface et logique navigateur.
- `worker.js` : API, authentification, D1, IA et collecte.
- `feeds.generated.json` : registre genere par `npm run build:feeds`.
- `scripts/check-html.mjs` : controles statiques de l'interface.
- `tests/` : tests unitaires et parcours Playwright.
- `deploy-cloudflare.ps1` : migrations, Worker et Pages.
