import {
  mysqlTable,
  mysqlEnum,
  int,
  varchar,
  text,
  boolean,
  decimal,
  date,
  timestamp,
  primaryKey,
  unique,
  index,
  check,
  type AnyMySqlColumn,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

// On défini le schéma ici. C'est ce qui sera utilisé pour créer les tables dans la base de données.
// On utilise les types de Drizzle pour définir les colonnes de chaque table.
// Chaque colonne est définie avec un type, une longueur (si applicable) et des contraintes.

// Valeurs possibles des statuts, réutilisées par plusieurs tables
const requestStatuses = [
  "OUVERTE",
  "ATTRIBUEE",
  "EN_COURS",
  "TERMINEE",
  "ANNULEE",
] as const;

// Utilisateurs (clients, prestataires et administrateurs)
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(), // hash, jamais en clair
  role: mysqlEnum("role", ["CLIENT", "PRESTATAIRE", "ADMIN"])
    .default("CLIENT")
    .notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  city: varchar("city", { length: 100 }),
  emailVerified: boolean("email_verified").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
});

// Profil complémentaire d'un prestataire (0 ou 1 par utilisateur)
export const providerProfiles = mysqlTable("provider_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  bio: text("bio"),
  experienceYears: int("experience_years"),
  availability: varchar("availability", { length: 255 }),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
});

// Catégories de services, avec sous-catégories via parent_id
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  parentId: int("parent_id").references((): AnyMySqlColumn => categories.id, {
    onDelete: "set null",
  }),
  name: varchar("name", { length: 100 }).notNull(),
});

// Table de liaison : catégories maîtrisées par un prestataire
export const providerCategories = mysqlTable(
  "provider_categories",
  {
    providerId: int("provider_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    categoryId: int("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.providerId, t.categoryId] })],
);

// Demandes de service publiées par les clients
export const requests = mysqlTable(
  "requests",
  {
    id: int("id").autoincrement().primaryKey(),
    clientId: int("client_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    categoryId: int("category_id")
      .notNull()
      .references(() => categories.id),
    title: varchar("title", { length: 150 }).notNull(),
    description: text("description").notNull(),
    location: varchar("location", { length: 255 }),
    budget: decimal("budget", { precision: 10, scale: 2 }),
    priority: mysqlEnum("priority", ["BASSE", "NORMALE", "HAUTE", "URGENTE"])
      .default("NORMALE")
      .notNull(),
    desiredDate: date("desired_date"),
    status: mysqlEnum("status", requestStatuses).default("OUVERTE").notNull(),
    createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [index("requests_status_idx").on(t.status)],
);

// Propositions envoyées par les prestataires en réponse à une demande
export const proposals = mysqlTable(
  "proposals",
  {
    id: int("id").autoincrement().primaryKey(),
    requestId: int("request_id")
      .notNull()
      .references(() => requests.id, { onDelete: "cascade" }),
    providerId: int("provider_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    message: text("message"),
    estimatedDays: int("estimated_days"),
    status: mysqlEnum("status", [
      "EN_ATTENTE",
      "ACCEPTEE",
      "REFUSEE",
      "RETIREE",
    ])
      .default("EN_ATTENTE")
      .notNull(),
    createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
  },
  // Un prestataire ne peut faire qu'une proposition par demande
  (t) => [
    unique("proposals_request_provider_uq").on(t.requestId, t.providerId),
  ],
);

// Réservation : une proposition acceptée devient une prestation
export const bookings = mysqlTable("bookings", {
  id: int("id").autoincrement().primaryKey(),
  proposalId: int("proposal_id")
    .notNull()
    .unique()
    .references(() => proposals.id),
  status: mysqlEnum("status", ["CONFIRMEE", "EN_COURS", "TERMINEE", "ANNULEE"])
    .default("CONFIRMEE")
    .notNull(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
});

// Conversation entre un client et un prestataire au sujet d'une demande
export const conversations = mysqlTable(
  "conversations",
  {
    id: int("id").autoincrement().primaryKey(),
    requestId: int("request_id")
      .notNull()
      .references(() => requests.id, { onDelete: "cascade" }),
    clientId: int("client_id")
      .notNull()
      .references(() => users.id),
    providerId: int("provider_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
  },
  (t) => [
    unique("conversations_request_provider_uq").on(t.requestId, t.providerId),
  ],
);

// Messages échangés dans une conversation
export const messages = mysqlTable(
  "messages",
  {
    id: int("id").autoincrement().primaryKey(),
    conversationId: int("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderId: int("sender_id")
      .notNull()
      .references(() => users.id),
    content: text("content").notNull(),
    attachment: varchar("attachment", { length: 255 }),
    isRead: boolean("is_read").default(false).notNull(),
    createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
  },
  (t) => [
    index("messages_conversation_created_idx").on(
      t.conversationId,
      t.createdAt,
    ),
  ],
);

// Avis laissé par le client après une prestation (1 par réservation)
export const reviews = mysqlTable(
  "reviews",
  {
    id: int("id").autoincrement().primaryKey(),
    bookingId: int("booking_id")
      .notNull()
      .unique()
      .references(() => bookings.id, { onDelete: "cascade" }),
    rating: int("rating").notNull(),
    comment: text("comment"),
    createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
  },
  (t) => [check("reviews_rating_check", sql`${t.rating} BETWEEN 1 AND 5`)],
);

// Notifications envoyées aux utilisateurs
export const notifications = mysqlTable(
  "notifications",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 50 }).notNull(),
    title: varchar("title", { length: 150 }).notNull(),
    content: text("content"),
    isRead: boolean("is_read").default(false).notNull(),
    createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
  },
  (t) => [index("notifications_user_read_idx").on(t.userId, t.isRead)],
);

// Signalements : target_type + target_id pointent vers n'importe quelle entité
// (pas de clé étrangère possible sur une cible polymorphe)
export const reports = mysqlTable(
  "reports",
  {
    id: int("id").autoincrement().primaryKey(),
    reporterId: int("reporter_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    targetType: mysqlEnum("target_type", [
      "USER",
      "REQUEST",
      "PROPOSAL",
      "MESSAGE",
      "REVIEW",
    ]).notNull(),
    targetId: int("target_id").notNull(),
    reason: text("reason").notNull(),
    status: mysqlEnum("status", ["EN_ATTENTE", "EN_COURS", "TRAITE", "REJETE"])
      .default("EN_ATTENTE")
      .notNull(),
    createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
  },
  (t) => [index("reports_target_idx").on(t.targetType, t.targetId)],
);

// Historique des changements de statut d'une demande
export const requestEvents = mysqlTable("request_events", {
  id: int("id").autoincrement().primaryKey(),
  requestId: int("request_id")
    .notNull()
    .references(() => requests.id, { onDelete: "cascade" }),
  actorId: int("actor_id").references(() => users.id, { onDelete: "set null" }),
  oldStatus: mysqlEnum("old_status", requestStatuses), // null à la création
  newStatus: mysqlEnum("new_status", requestStatuses).notNull(),
  createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
});
