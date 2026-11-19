-- Vault V1 — schéma initial (Data model logique final, décisions 2026-11-19)

create extension if not exists pgcrypto;

create table users (
  id              uuid primary key default gen_random_uuid(),
  auth_uid        text not null unique,          -- Firebase uid
  email           text,
  full_name       text,                          -- obligatoire avant tout ajout d'objet (US2.3)
  plan            text not null default 'free' check (plan in ('free', 'premium')),
  plan_updated_at timestamptz,
  created_at      timestamptz not null default now()
);

-- Liste contrôlée « Autres objets certifiés » (aucun texte libre côté utilisateur)
create table controlled_other_types (
  id              text primary key,
  label_fr        text not null,
  label_en        text not null,
  unique_id_label text not null,
  active          boolean not null default false
);

-- Liste contrôlée des sources de certificat
create table certificate_issuers (
  id        text primary key,
  label_fr  text not null,
  label_en  text not null,
  position  int not null default 0
);

insert into certificate_issuers (id, label_fr, label_en, position) values
  ('brand',       'Marque',        'Brand',       1),
  ('third_party', 'Tiers reconnu', 'Recognised third party', 2),
  ('purchase',    'Achat',         'Purchase',    3);

-- Brouillons d'ajout (décision T2) : jamais visibles dans le coffre, purgés après 24 h
create table item_drafts (
  id                    uuid primary key,
  user_id               uuid not null references users(id) on delete cascade,
  certificate_key       text,
  certificate_hash      text,
  certificate_mime      text,
  readability_score     int,
  holder_name_detected  text,
  ocr_fields            jsonb,
  photo_key             text,
  created_at            timestamptz not null default now()
);

create table items (
  id                        uuid primary key,
  user_id                   uuid not null references users(id) on delete cascade,
  category                  text not null check (category in ('watch', 'handbag', 'sneaker', 'certified_other')),
  controlled_other_type_id  text references controlled_other_types(id),
  brand                     text not null,
  model                     text,
  reference_code            text,
  attributes                jsonb not null default '{}',  -- sku, size, order_id…
  unique_id_type            text not null,
  unique_id_value           text not null,               -- valeur saisie
  unique_id_normalized      text not null,               -- valeur normalisée (T4)
  acquisition_amount        numeric(14,2) not null,
  acquisition_currency      text not null,
  acquisition_date          date,
  cover_photo_key           text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  constraint items_unique_id unique (unique_id_type, unique_id_normalized)
);
create index items_user_idx on items(user_id, created_at desc);

create table certificates (
  id                    uuid primary key default gen_random_uuid(),
  item_id               uuid not null unique references items(id) on delete cascade,
  file_hash             text not null,
  storage_key           text not null,
  mime_type             text not null,
  issuer_id             text not null references certificate_issuers(id),
  certificate_type      text not null,
  external_id           text,
  readability_score     int not null check (readability_score between 0 and 100),
  holder_name_detected  text,
  holder_match          text not null default 'unknown' check (holder_match in ('match', 'mismatch', 'unknown')),
  uploaded_at           timestamptz not null default now()
);

create table documents (
  id           uuid primary key default gen_random_uuid(),
  item_id      uuid not null references items(id) on delete cascade,
  type         text not null check (type in ('insurance', 'invoice', 'maintenance', 'other')),
  file_hash    text not null,
  storage_key  text not null,
  mime_type    text not null,
  uploaded_at  timestamptz not null default now()
);
create index documents_item_idx on documents(item_id);

-- Registre global des empreintes : un même fichier ne peut jamais être importé deux fois
-- (certificat ou document, tous utilisateurs confondus — CONTRAT §5.2)
create table file_hashes (
  hash        text primary key,
  item_id     uuid not null references items(id) on delete cascade,
  created_at  timestamptz not null default now()
);

create table market_values (
  item_id       uuid primary key references items(id) on delete cascade,
  value_amount  numeric(14,2),
  currency      text,
  confidence    text check (confidence in ('low', 'medium', 'high')),
  sources       jsonb not null default '[]',
  as_of         timestamptz,
  status        text not null default 'idle' check (status in ('idle', 'updating')),
  updated_at    timestamptz not null default now()
);

create table value_timeseries (
  item_id       uuid not null references items(id) on delete cascade,
  as_of_date    date not null,
  value_amount  numeric(14,2) not null,
  currency      text not null,
  source        text not null,
  primary key (item_id, as_of_date)
);

-- Journal de suppression (usage interne uniquement), purgé à la suppression du compte
create table deletion_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  item_id     uuid not null,
  reason      text not null check (reason in ('lost', 'stolen', 'sold', 'given', 'destroyed', 'other')),
  free_text   text,
  created_at  timestamptz not null default now()
);

-- Conflits d'unicité (BUSINESS_RULES §5) — gestion manuelle par le support
create table conflicts (
  id                uuid primary key default gen_random_uuid(),
  unique_id_type    text not null,
  unique_id_value   text not null,              -- valeur normalisée
  existing_item_id  uuid references items(id) on delete set null,
  attempt_user_id   uuid references users(id) on delete cascade,
  status            text not null default 'open',
  attempt_payload   jsonb not null default '{}', -- minimal, sans documents
  created_at        timestamptz not null default now()
);
create index conflicts_existing_idx on conflicts(existing_item_id);
