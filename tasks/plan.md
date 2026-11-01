# Implementation Plan: Fitur Edit Konten Portofolio via Supabase

## Overview
Portofolio statis (HTML/CSS/JS, tanpa build step) diberi CMS: kamu edit semua isi website (teks, list, gambar, PDF sertifikat) langsung dari halaman admin di website itu sendiri, pengunjung publik hanya bisa melihat. Backend: Supabase (database + storage + auth). Hosting, rombak UI, animasi, dan contact form DI LUAR scope plan ini.

## Architecture Decisions
- **Supabase** — teks → tabel `content` (key-value), sertifikat → tabel `certificates`, file → storage bucket. Alasan: IndexedDB/`cms-db.js` lokal per-browser, pengunjung tidak melihat editan.
- **`supabase-js` via CDN** — project plain HTML/JS tanpa npm/build.
- **Edit binding via atribut `data-cms-key`** di elemen HTML → daftar key didokumentasikan di bawah, dipindah saat UI rework nanti.
- **Fallback wajib** — kalau Supabase gagal/tidak ada row, halaman tampil persis seperti hardcoded HTML sekarang.
- **Keamanan** — RLS: publik hanya `SELECT`, tulis hanya akun login Supabase Auth. Password admin tidak pernah ada di kode. Anon key memang publik, RLS penjaganya.
- **List repeatable** (education, projects, skills) disimpan sebagai JSON di `content` dengan `type='json'` — cukup, tanpa tabel tambahan (YAGNI).
- **`cms-db.js` tidak dipakai, tidak dihapus** (di luar scope).
- **PDF dirender browser native** via `<embed>` di modal — tanpa pdf.js.

## Task List

### Phase 1 — Fondasi Supabase
- [ ] Task 1: Setup project Supabase + `supabase-schema.sql` + bucket + user auth (email: fatihahilham23@gmail.com)

### Checkpoint: Foundation
- [ ] Login sukses, RLS bukti tulis anon ditolak, publik baca bisa

### Phase 2 — Website baca data
- [ ] Task 2: `cms-loader.js` + atribut `data-cms-key` di semua bidang + fallback
- [ ] Task 3: List dinamis (certificates carousel, education, projects, skills) dari DB dengan fallback ke konten hardcoded

### Checkpoint: Core read path
- [ ] Konten dari DB tampil, fallback aman, console bersih

### Phase 3 — Panel admin
- [ ] Task 4: Login admin (`cms-admin.js`, modal password → Supabase Auth, tanpa login sidebar terkunci)
- [ ] Task 5: Form edit teks per `data-cms-key` + list repeatable, simpan → `upsert` → terlihat lintas perangkat

### Checkpoint: Edit teks
- [ ] Edit dari HP terlihat di browser lain; tamu tidak bisa masuk admin

### Phase 4 — Upload file
- [ ] Task 6: Upload gambar (foto profil, gambar project) ke bucket `media`
- [ ] Task 7: Upload/hapus PDF sertifikat ke bucket `certificates` + modal `<embed>` isi PDF

### Checkpoint: Files
- [ ] Tambah sertifikat PDF dari dalam website → muncul di carousel → isi PDF tampil

### Phase 5 — Tes pra-hosting
- [ ] Task 8: Tes alur penuh dari HP via server lokal, console bersih, tak ada password di kode

### Checkpoint: Complete
- [ ] Fitur edit stabil → rombak UI/animasi boleh mulai

## Daftar `data-cms-key` (pindahkan lagi saat UI rework)
| Key | Elemen (index.html) |
|---|---|
| `hero.line1` / `hero.line2` | `#heroHeadline` span baris 1/2 (baris ~215-216) |
| `about.title` / `about.body` | About section title + `.body-text` (~260-266) |
| `about.photo` | `.media-placeholder` → ganti jadi `<img>` (~269) |
| `education.items` (json) | `.timeline` (~282) |
| `projects.items` (json) | `#works` hover-slider (~315) |
| `skills.items` (json) | `.skill-grid` (~355) |
| `certs.items` (table) | `#certRing` + `#certCenter` (~402) |
| `footer.copy` | footer `<p>` (~478) |
| `social.instagram/github/linkedin` | footer social links (~482, 491, 500) |
| `label.<section>` | judul section + eyebrow tiap section |

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Anon key bocor ke publik | Med | RLS tulis butuh login; password tak pernah di kode |
| Supabase free idle-pause (1 minggu tanpa request) | Low | Buka dashboard sekali untuk wake-up |
| Folder OneDrive ber-spasi sebelum hosting | Med | Saat deploy: rename `project-website`/pindah dari OneDrive |
| UI rework memutus `data-cms-key` | Med | Tabel key di atas jadi daftar pindah |

## Open Questions
- [ ] Hosting target (GitHub Pages/Netlify/Vercel) — nanti, setelah Task 8
- [ ] Contact form — nanti
- [ ] Rombak UI + animasi — nanti, setelah fitur edit stabil
