# Todo: Fitur Edit Konten (Supabase)

- [ ] Task 1: Setup Supabase — project, `supabase-schema.sql`, bucket `certificates`+`media`, user auth `fatihahilham23@gmail.com`
  - Acceptance: 2 tabel + 2 bucket ada; login sukses; `SELECT` publik jalan; tulis tanpa login ditolak (42501)
  - Verify: query tes di SQL Editor
  - Files: `supabase-schema.sql`
  - Deps: None

## Checkpoint: Foundation
- [ ] RLS terbukti: publik baca bisa, tulis anon ditolak, login menulis bisa

- [ ] Task 2: `cms-loader.js` — fetch content+certificates, render ke `data-cms-key`, fallback ke HTML hardcoded
  - Acceptance: offline → halaman normal; isi 1 row → reload berubah; tanpa key → tanpa error console
  - Verify: `python -m http.server`, tes 3 kondisi
  - Files: `cms-loader.js` (baru), `index.html`
  - Deps: Task 1

- [ ] Task 3: List dinamis dari DB (certs carousel, education, projects, skills) + fallback array hardcoded `script.js:191`
  - Acceptance: tambah 1 sertifikat via DB → muncul di carousel; tanpa data → konten lama tampil; carousel jalan
  - Verify: manual carousel + tambah/hapus 1 item tiap tipe
  - Files: `script.js`, `index.html`
  - Deps: Task 2

## Checkpoint: Core read path
- [ ] Konten dari DB tampil, fallback aman, console bersih

- [ ] Task 4: Login admin — tombol admin → modal password → `signInWithPassword`, sidebar terkunci tanpa login
  - Acceptance: salah password error; benar buka; DevTools tak bisa buka editor
  - Verify: 3 kasus manual
  - Files: `cms-admin.js` (baru), `index.html` (load css+js+CDN supabase-js)
  - Deps: Task 1

- [ ] Task 5: Form edit teks per key + list repeatable (education/projects/skills) → `upsert` → tampil lintas perangkat
  - Acceptance: edit di browser A terlihat di browser B/HP; tambah/hapus list jalan; field kosong ditolak
  - Verify: tes lintas perangkat
  - Files: `cms-admin.js`
  - Deps: Task 4, Task 3

## Checkpoint: Edit teks
- [ ] Semua teks & list bisa diedit dari website, terlihat untuk pengunjung lain

- [ ] Task 6: Upload gambar (foto profil, gambar project) ke bucket `media`
  - Acceptance: ganti foto profil dari admin tampil; >5MB ditolak dengan pesan
  - Files: `cms-admin.js`
  - Deps: Task 5

- [ ] Task 7: Upload/hapus PDF sertifikat + metadata → carousel + modal `<embed>` isi PDF + buka di tab baru
  - Acceptance: upload → carousel update → isi PDF tampil di halaman → hapus bersihkan Storage; tamu tak punya tombol hapus
  - Verify: PDF multi-halaman nyata, di HP
  - Files: `cms-admin.js`, `index.html`, `style.css`
  - Deps: Task 6

## Checkpoint: Files
- [ ] Tambah sertifikat PDF + ganti teks/gambar semua dari dalam website

- [ ] Task 8: Tes alur penuh dari HP via server lokal; console bersih; hanya anon key di kode
  - Acceptance: checklist lolos → siap tahap rombak UI/animasi (task terpisah, nanti)
  - Files: fix kecil bila perlu
  - Deps: Task 7
