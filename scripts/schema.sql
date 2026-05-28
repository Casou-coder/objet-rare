-- ============================================================
-- Objet Rare — schéma initial
-- Coller dans Supabase > SQL Editor > New query > Run
-- ============================================================

-- Types enum
create type item_category  as enum ('handbag', 'sneaker', 'watch', 'other');
create type item_condition as enum ('mint', 'excellent', 'good', 'fair', 'poor');
create type document_type  as enum ('invoice', 'certificate', 'warranty', 'other');
create type ocr_status     as enum ('pending', 'done', 'failed');
create type plan_type      as enum ('free', 'premium');

-- Profils utilisateurs
create table public.profiles (
  id                  uuid primary key references auth.users on delete cascade,
  email               text not null,
  full_name           text,
  avatar_url          text,
  plan                plan_type not null default 'free',
  premium_expires_at  timestamptz,
  created_at          timestamptz not null default now()
);

-- Créer automatiquement un profil à l'inscription
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Objets de collection
create table public.items (
  id                uuid primary key default gen_random_uuid(),
  owner_id          uuid not null references public.profiles on delete cascade,
  category          item_category not null,
  brand             text not null,
  model             text,
  name              text not null,
  serial_number     text,
  purchase_date     date,
  purchase_price    numeric(12,2),
  purchase_currency text default 'EUR',
  condition         item_condition not null default 'good',
  is_authenticated  boolean not null default false,
  metadata          jsonb not null default '{}',
  cover_photo_url   text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Photos d'un objet
create table public.item_photos (
  id       uuid primary key default gen_random_uuid(),
  item_id  uuid not null references public.items on delete cascade,
  url      text not null,
  position integer not null default 0,
  is_cover boolean not null default false
);

-- Documents (factures, certificats, garanties)
create table public.documents (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references public.profiles on delete cascade,
  item_id      uuid references public.items on delete set null,
  type         document_type not null default 'other',
  storage_path text not null,
  filename     text not null,
  ocr_status   ocr_status not null default 'pending',
  ocr_data     jsonb,
  created_at   timestamptz not null default now()
);

-- Certificats numériques
create table public.certificates (
  id        uuid primary key default gen_random_uuid(),
  item_id   uuid not null references public.items on delete cascade,
  category  item_category not null,
  payload   jsonb not null default '{}',
  pdf_url   text,
  issued_at timestamptz not null default now()
);

-- Mise à jour automatique de updated_at sur items
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger items_updated_at
  before update on public.items
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

alter table public.profiles    enable row level security;
alter table public.items       enable row level security;
alter table public.item_photos enable row level security;
alter table public.documents   enable row level security;
alter table public.certificates enable row level security;

-- Profiles : lecture/écriture sur son propre profil
create policy "profiles: own" on public.profiles
  using (auth.uid() = id) with check (auth.uid() = id);

-- Items : CRUD sur ses propres objets
create policy "items: own" on public.items
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Photos : via les items
create policy "item_photos: own" on public.item_photos
  using (exists (select 1 from public.items where items.id = item_photos.item_id and items.owner_id = auth.uid()));

-- Documents : propriétaire
create policy "documents: own" on public.documents
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Certificats : via les items
create policy "certificates: own" on public.certificates
  using (exists (select 1 from public.items where items.id = certificates.item_id and items.owner_id = auth.uid()));
