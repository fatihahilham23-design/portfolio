-- ===============================================================
-- supabase-schema.sql
-- Skema Database & Storage untuk Portofolio CMS
-- Jalankan di: Supabase Dashboard → SQL Editor → New Query → Run
-- ===============================================================

create extension if not exists "pgcrypto";

-- ─── 1. TABEL KONTEN (Key-Value: teks, link, gambar profil) ───
create table if not exists content (
  key        text primary key,
  value      text not null default '',
  type       text not null default 'text',
  updated_at timestamptz not null default now()
);

-- ─── 2. TABEL PENDIDIKAN ───
create table if not exists education (
  id          uuid primary key default gen_random_uuid(),
  period      text not null,
  degree      text not null,
  institution text not null,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- ─── 3. TABEL PROYEK ───
create table if not exists projects (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  tags        text[] default '{}',
  image_url   text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- ─── 4. TABEL KEAHLIAN (Skills) ───
create table if not exists skills (
  id         uuid primary key default gen_random_uuid(),
  group_name text not null,
  tags       text[] default '{}',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ─── 5. TABEL SERTIFIKAT ───
create table if not exists certificates (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  issuer     text,
  year       int,
  pdf_url    text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ─── 6. ROW LEVEL SECURITY (RLS) UNTUK SEMUA TABEL ───
-- Aturan: Publik hanya boleh SELECT (membaca), hanya user login yang boleh INSERT / UPDATE / DELETE
do $$
declare t text;
begin
  foreach t in array array['content', 'education', 'projects', 'skills', 'certificates'] loop
    execute format('alter table %I enable row level security', t);

    -- Hapus policy lama jika ada
    execute format('drop policy if exists "publik baca %s" on %I', t, t);
    execute format('drop policy if exists "login insert %s" on %I', t, t);
    execute format('drop policy if exists "login update %s" on %I', t, t);
    execute format('drop policy if exists "login delete %s" on %I', t, t);

    -- Buat policy baru per aksi
    execute format('create policy "publik baca %s" on %I for select using (true)', t, t);
    execute format('create policy "login insert %s" on %I for insert with check (auth.uid() is not null)', t, t);
    execute format('create policy "login update %s" on %I for update using (auth.uid() is not null) with check (auth.uid() is not null)', t, t);
    execute format('create policy "login delete %s" on %I for delete using (auth.uid() is not null)', t, t);
  end loop;
end $$;

-- ─── 7. STORAGE BUCKETS: certificates (PDF) + media (gambar) ───
insert into storage.buckets (id, name, public)
values ('certificates', 'certificates', true),
       ('media', 'media', true)
on conflict (id) do nothing;

-- RLS Storage: Publik hanya boleh baca, hanya user login yang boleh upload/ubah/hapus
drop policy if exists "publik baca bucket" on storage.objects;
create policy "publik baca bucket" on storage.objects
  for select using (bucket_id in ('certificates', 'media'));

drop policy if exists "login insert bucket" on storage.objects;
create policy "login insert bucket" on storage.objects
  for insert with check (bucket_id in ('certificates', 'media') and auth.uid() is not null);

drop policy if exists "login update bucket" on storage.objects;
create policy "login update bucket" on storage.objects
  for update using (bucket_id in ('certificates', 'media') and auth.uid() is not null)
  with check (bucket_id in ('certificates', 'media') and auth.uid() is not null);

drop policy if exists "login delete bucket" on storage.objects;
create policy "login delete bucket" on storage.objects
  for delete using (bucket_id in ('certificates', 'media') and auth.uid() is not null);

-- ─── 8. RELOAD SCHEMA CACHE ───
notify pgrst, 'reload schema';