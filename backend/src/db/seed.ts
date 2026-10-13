// Données de référence : catégories et sous-catégories de services.
// Lancer avec : npm run seed
// Idempotent : on peut le relancer sans créer de doublons (les catégories existantes sont ignorées)
import "dotenv/config";
import { closeConnection } from "./connection";
import { CategoryRepository } from "../repositories/categories.repositories";

// Catégorie principale -> sous-catégories (2 niveaux maximum, comme dans le service)
const CATEGORIES: Record<string, string[]> = {
  Maison: [
    "Plomberie",
    "Électricité",
    "Peinture",
    "Menuiserie",
    "Petits travaux",
  ],
  Extérieur: ["Jardinage", "Tonte de pelouse", "Déneigement"],
  Ménage: ["Ménage à domicile", "Nettoyage après travaux", "Repassage"],
  "Cours particuliers": [
    "Mathématiques",
    "Français",
    "Anglais",
    "Musique",
    "Aide aux devoirs",
  ],
  Informatique: [
    "Dépannage informatique",
    "Création de site web",
    "Installation de logiciels",
  ],
  Déménagement: ["Aide au déménagement", "Transport d'objets", "Montage de meubles"],
  "Aide à la personne": ["Garde d'enfants", "Aide aux aînés", "Courses à domicile"],
  Animaux: ["Promenade de chiens", "Garde d'animaux", "Toilettage"],
  Événements: ["Photographie", "Traiteur", "DJ / Animation"],
  Automobile: ["Mécanique", "Lavage de voiture"],
};

const repo = new CategoryRepository();

// Renvoie la catégorie existante, ou la crée si elle n'existe pas encore
async function findOrCreate(name: string, parentId: number | null) {
  const existing = await repo.findCategoryByNameAndParent(name, parentId);
  if (existing) return { category: existing, created: false };
  const category = await repo.createCategory({ name, parentId });
  return { category, created: true };
}

async function seed() {
  let created = 0;
  let skipped = 0;
  const count = (wasCreated: boolean) => (wasCreated ? created++ : skipped++);

  for (const [parentName, children] of Object.entries(CATEGORIES)) {
    const parent = await findOrCreate(parentName, null);
    count(parent.created);

    for (const childName of children) {
      const child = await findOrCreate(childName, parent.category.id);
      count(child.created);
    }
  }

  console.log(`Seed terminé : ${created} catégorie(s) créée(s), ${skipped} déjà présente(s).`);
}

seed()
  .catch((error) => {
    console.error("Échec du seed :", error);
    process.exitCode = 1;
  })
  .finally(closeConnection);
