# Portfolio d'Ikram Zyat (React + Vite)

Portfolio en React. Les **projets** et les **expériences professionnelles** se gèrent
**sans toucher au code** : avec un espace admin protégé par e-mail et mot de passe sur votre
ordinateur, ou avec une commande dans le terminal.

## 1. Démarrer

Il faut [Node.js](https://nodejs.org) (version 18 ou plus).

```bash
npm install        # une seule fois : installe React et Vite
npm run dev        # lance le site sur http://localhost:5173
```

## 2. Gérer les projets et les expériences

### Option A : l'espace admin (le plus simple)

```bash
npm run admin
```

**Première fois** : la page vous demande de créer votre accès : un e-mail, un mot de passe
(10 caractères minimum) et une **adresse secrète** qui remplace `/admin.html`
(par exemple `http://localhost:5173/gestion-k3x9ab`). Ensuite, `npm run admin` ouvre directement
cette adresse sur l'écran de connexion. `/admin.html` n'existe plus.

Une fois connectée, deux onglets :

- **Projets** : ajouter, modifier, supprimer, réordonner (flèches ↑ ↓), avec photos (facultatives,
  réduites automatiquement à 1600 px de large ; la première sert d'aperçu) ;
- **Expériences professionnelles** : entreprise, poste, période, description. Ajouter, modifier,
  supprimer, réordonner. Une nouvelle expérience apparaît en premier.

Le bouton **Se déconnecter** ferme votre session (elle se ferme aussi toute seule après 8 heures).

#### Sécurité

- L'espace admin n'existe que sur votre ordinateur (pendant `npm run dev` ou `npm run admin`). Il n'est
  **jamais publié** avec le site : personne d'autre ne peut y accéder en ligne.
- La connexion est vérifiée par le serveur : sans être connecté, aucune donnée n'est lisible ni modifiable.
- Votre mot de passe n'est jamais enregistré en clair, seulement son empreinte, dans le fichier
  `.admin-auth.json` (réservé à votre session, jamais envoyé sur GitHub grâce à `.gitignore`).
- Après 5 mots de passe incorrects, la connexion est bloquée 15 minutes.
- **Mot de passe ou adresse oubliés ?** Supprimez le fichier `.admin-auth.json` à la racine du projet,
  puis relancez `npm run admin` : vous recréez un accès.

### Option B : des commandes

```bash
npm run add-project         # ajouter un projet (questions pas à pas)
npm run list-projects       # voir la liste
npm run remove-project      # supprimer un projet
npm run add-experience      # ajouter une expérience
npm run remove-experience   # supprimer une expérience
```

Pour les photos d'un projet, donnez le chemin des fichiers séparés par des virgules (ou glissez-les dans le terminal).

### Option C : à la main

- Projets : `src/data/projects.json`, photos dans `public/images/projects/<id>/`.
- Expériences : `src/data/experience.json`.

## 3. Mettre en ligne

Première fois (avec GitHub et Vercel) :

1. Créez un dépôt sur GitHub, puis dans le dossier du projet :
   ```bash
   git init
   git add -A
   git commit -m "Premier commit"
   git branch -M main
   git remote add origin https://github.com/VOTRE-NOM/portfolio.git
   git push -u origin main
   ```
2. Sur [vercel.com](https://vercel.com), choisissez **Add New > Project**, importez le dépôt.
   Vercel détecte Vite tout seul : cliquez sur **Deploy**.

Ensuite, à chaque nouveau projet ajouté (admin ou commande) :

```bash
npm run publish
```

Cette commande enregistre vos changements et les envoie sur GitHub : Vercel met le site à jour en quelques secondes.

## 4. Modifier le reste du contenu

Le texte du site est dans `src/data/profile.json` : présentation, compétences, formations, services,
certifications, langues, centres d'intérêt, coordonnées. (Les projets et les expériences se gèrent dans
l'espace admin.) Les compteurs (expériences, technologies, projets, certifications) se calculent tout seuls.

- Couleur principale : variable `--accent` en haut de `src/style.css`.
- Photo : `public/images/ikram.png`. CV : `public/cv-ikram-zyat.pdf` (gardez le même nom, ou changez `cv` dans `profile.json`).

## 5. Structure

```
admin.html                  page de l'espace admin (dev uniquement)
index.html                  page du site
.admin-auth.json            votre accès admin (créé au premier lancement, jamais publié)
scripts/
  store.mjs                 lecture/écriture des projets, des expériences et des photos
  auth.mjs                  e-mail, mot de passe (empreinte) et adresse secrète de l'admin
  projects-cli.mjs          commandes add-project, add-experience…
  vite-admin-plugin.mjs     petit serveur sécurisé de l'espace admin (dev uniquement)
src/
  data/profile.json         vos informations
  data/projects.json        vos projets
  data/experience.json      vos expériences professionnelles
  components/               les parties du site (Header, Hero, Projects…)
  admin/                    l'espace admin
  style.css                 le design
public/                     CV, photo, photos des projets
```

## Notes

- Le formulaire de contact ouvre l'application mail du visiteur vers votre adresse. Pour un envoi
  direct sans application mail, utilisez un service comme Formspree ou EmailJS.
- `npm run build` crée le site final dans `dist/` (c'est ce que Vercel fait pour vous).
- Si vous publiez dans un sous-dossier (par exemple GitHub Pages sans domaine perso), ajoutez
  `base: "/nom-du-depot/"` dans `vite.config.js`.
