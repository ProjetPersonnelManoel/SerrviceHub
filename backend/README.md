# ServiceHub — Backend

API REST de ServiceHub, écrite en TypeScript avec Express. Elle est consommée par le frontend Next.js situé dans [`../frontend`](../frontend).

> **Statut :** projet en démarrage. Les dépendances sont installées, mais `src/server.ts`, `drizzle.config.ts`, `swagger.yml` et `.env` sont encore vides.

## Stack

| Rôle | Outil |
| --- | --- |
| Serveur HTTP | [Express 5](https://expressjs.com/) |
| Langage | TypeScript, exécuté en dev avec [tsx](https://tsx.is/) |
| Base de données | MySQL via [mysql2](https://github.com/sidorares/node-mysql2) |
| ORM et migrations | [Drizzle ORM](https://orm.drizzle.team/) + drizzle-kit |
| Validation | [Zod](https://zod.dev/) |
| Authentification | [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) (JWT) + [bcrypt](https://github.com/kelektiv/node.bcrypt.js) pour les mots de passe |
| CORS | [cors](https://github.com/expressjs/cors) |
| Configuration | [dotenv](https://github.com/motdotla/dotenv) |
| Documentation de l'API | OpenAPI / Swagger (`swagger.yml`) |

## Prérequis

- Node.js 20 ou plus récent
- npm
- Un serveur MySQL accessible (local ou distant)

## Installation

```bash
cd backend
npm install
```

## Configuration

Créer un fichier `.env` à la racine de `backend/` (il est ignoré par git). Variables prévues :

```env
# Port d'écoute de l'API
PORT=4000

# Connexion MySQL
DATABASE_URL=mysql://utilisateur:motdepasse@localhost:3306/servicehub

# Secret de signature des JWT (longue chaîne aléatoire)
JWT_SECRET=change-moi

# Origine autorisée par CORS (le frontend)
CORS_ORIGIN=http://localhost:3000
```

Pour générer un secret JWT :

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Scripts

| Commande | Effet |
| --- | --- |
| `npm run dev` | Lance l'API en mode watch avec tsx (rechargement à chaque modification) |
| `npm run build` | Compile le TypeScript avec `tsc` |
| `npm start` | Lance la version compilée depuis `dist/` |

## Base de données (Drizzle)

La configuration de drizzle-kit se trouve dans `drizzle.config.ts`. Commandes utiles :

```bash
npx drizzle-kit generate   # génère les fichiers de migration à partir du schéma
npx drizzle-kit migrate    # applique les migrations à la base
npx drizzle-kit push       # synchronise directement le schéma (pratique en dev)
npx drizzle-kit studio     # ouvre une interface web pour explorer les données
```

## Structure

```
backend/
├── src/
│   └── server.ts        # Point d'entrée de l'API
├── drizzle.config.ts    # Configuration drizzle-kit
├── swagger.yml          # Spécification OpenAPI de l'API
├── tsconfig.json
├── package.json
└── .env                 # Variables d'environnement (non versionné)
```

## Documentation de l'API

Les routes sont décrites dans [`swagger.yml`](swagger.yml). Le fichier peut être ouvert dans [Swagger Editor](https://editor.swagger.io/) en attendant qu'une page de documentation soit servie par l'API.
