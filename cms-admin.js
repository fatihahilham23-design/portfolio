/* ─── CMS ADMIN ───
   Tombol gear (kanan-bawah) → login Supabase Auth → sidebar editor.
   Tamu tanpa login: sidebar tidak bisa dibuka (cek lewat getSession;
   tulis tetap diverifikasi server oleh RLS).
   Semua tulis lewat window.CMS.client (session JWT otomatis dipakai). */
(function () {
    'use strict';
    if (!window.CMS || !window.CMS.client) return;   // supabase gagal → tanpa admin
    var client = window.CMS.client;
    var esc = window.CMS.esc;
    var cfg = window.CMS_CONFIG;

    var TEXT_FIELDS = [
        { key: 'hero.line1',        label: 'Hero — baris 1' },
        { key: 'hero.line2',        label: 'Hero — baris 2' },
        { key: 'label.about',       label: 'Eyebrow About' },
        { key: 'title.about',       label: 'Judul About' },
        { key: 'about.body',        label: 'Teks About', area: true },
        { key: 'about.photo',       label: 'Foto Profil', type: 'image' },
        { key: 'title.education',   label: 'Judul Pendidikan' },
        { key: 'label.projects',    label: 'Eyebrow Proyek' },
        { key: 'title.projects',    label: 'Judul Proyek' },
        { key: 'title.skills',      label: 'Judul Keahlian' },
        { key: 'label.certificates',label: 'Eyebrow Sertifikat' },
        { key: 'title.certificates',label: 'Judul Sertifikat' },
        { key: 'label.contact',     label: 'Eyebrow Kontak' },
        { key: 'title.contact',     label: 'Judul Kontak' },
        { key: 'contact.body',      label: 'Teks Kontak', area: true },
        { key: 'footer.copy',       label: 'Teks Footer' },
        { key: 'social.instagram',  label: 'URL Instagram', type: 'url' },
        { key: 'social.github',     label: 'URL GitHub',    type: 'url' },
        { key: 'social.linkedin',   label: 'URL LinkedIn',  type: 'url' }
    ];

    var $ = function (s, r) { return (r || document).querySelector(s); };
    var uid = function () {
        return (window.crypto && crypto.randomUUID) ? crypto.randomUUID()
            : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 3 | 0); return v.toString(16);
            });
    };
    var tagsOf = function (v) {
        return Array.isArray(v) ? v.slice() : String(v || '').split(',').map(function (t) { return t.trim(); }).filter(Boolean);
    };

    /* ── toast ── */
    var toastEl = null, toastTimer = null;
    function toast(msg, kind) {
        if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'cms-toast'; document.body.appendChild(toastEl); }
        toastEl.textContent = msg;
        toastEl.className = 'cms-toast is-visible ' + (kind === 'err' ? 'cms-toast--error' : 'cms-toast--success');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { toastEl.classList.remove('is-visible'); }, 2800);
    }

    /* ── upload ── */
    function uploadFile(bucket, file) {
        var ext = (file.name.split('.').pop() || 'bin').toLowerCase();
        var path = (bucket === 'certificates' ? 'certs/' : 'img/') + Date.now() + '-' + Math.floor(Math.random() * 1e6) + '.' + ext;
        return client.storage.from(bucket).upload(path, file, { contentType: file.type }).then(function (r) {
            if (r.error) throw new Error(r.error.message);
            return client.storage.from(bucket).getPublicUrl(path).data.publicUrl;
        });
    }
    function storagePath(url, bucket) {
        var marker = '/object/public/' + bucket + '/';
        var i = String(url || '').indexOf(marker);
        return i < 0 ? null : decodeURIComponent(url.slice(i + marker.length).split('?')[0]);
    }
    function removeStorage(bucket, url) {
        var p = storagePath(url, bucket);
        if (p) { try { client.storage.from(bucket).remove([p]); } catch (e) { /* noop */ } }
    }
    function validateFile(file, kind) {
        if (kind === 'pdf') {
            if (file.type !== 'application/pdf') { toast('File harus PDF', 'err'); return false; }
            if (file.size > 10 * 1048576) { toast('PDF maksimal 10MB', 'err'); return false; }
        } else {
            if (!/^image\//.test(file.type)) { toast('File harus gambar (png/jpg/webp)', 'err'); return false; }
            if (file.size > 5 * 1048576) { toast('Gambar maksimal 5MB', 'err'); return false; }
        }
        return true;
    }

    /* ── state daftar ── */
    var state = null;   // { edu, proj, skill, cert, del:{...} }

    function $$sel(sel) { return [].slice.call(document.querySelectorAll(sel)); }
    function seedEducation() {
        var eduCards = $$sel('.edu-stacked-card');
        if (eduCards.length) {
            return eduCards.map(function (it) {
                return {
                    period: (it.querySelector('.edu-card-date') || {}).textContent || '',
                    degree: (it.querySelector('.edu-card-title') || {}).textContent || '',
                    institution: (it.querySelector('.edu-card-org') || {}).textContent || ''
                };
            });
        }
        return $$sel('.timeline-item').map(function (it) {
            return {
                period: (it.querySelector('.timeline-date') || {}).textContent || '',
                degree: (it.querySelector('.timeline-title') || {}).textContent || '',
                institution: (it.querySelector('.timeline-location') || {}).textContent || ''
            };
        });
    }
    function seedProjectsFixed() {
        var imgs = $$sel('#works .hover-slider__image');
        return $$sel('#works .hover-slider__item').map(function (it, i) {
            var t = it.querySelector('.hover-slider__title');
            var p = it.querySelector('.hover-slider__detail p');
            return {
                title: t ? t.textContent.trim() : '',
                description: p ? p.textContent.trim() : '',
                tags: [].map.call(it.querySelectorAll('.tags span'), function (s) { return s.textContent; }),
                image_url: imgs[i] ? imgs[i].getAttribute('src') : ''
            };
        });
    }
    function seedSkills() {
        var cards = $$sel('.glass-card');
        if (cards.length) {
            return cards.map(function (g) {
                return {
                    group_name: (g.querySelector('.glass-card__title') || {}).textContent || '',
                    tags: [].map.call(g.querySelectorAll('.glass-card__tags span'), function (s) { return s.textContent.trim(); })
                };
            });
        }
        return $$sel('.skill-group').map(function (g) {
            return {
                group_name: (g.querySelector('h3') || {}).textContent || '',
                tags: [].map.call(g.querySelectorAll('.tags span'), function (s) { return s.textContent; })
            };
        });
    }

    var EN_TITLES = {
        'Background Pendidikan': 'Education',
        '02 - Karya': '02 - Projects',
        'Karya Unggulan': 'Featured Projects',
        'Keahlian': 'Skills',
        'Sertifikat': 'Certificates',
        '03 - Kontak': '03 - Contact',
        'Mari Berdiskusi': 'Get In Touch',
        'Perkenalan': 'About Me',
        'Punya ide proyek atau sekadar ingin menyapa? Silakan kirim pesan.': 'Have a project idea or just want to say hi? Feel free to send a message.',
        '© 2026 Portofolio. Dibuat dengan ketelitian.': '© 2026 Portfolio. Crafted with precision.',
        'Portofolio': 'Portfolio'
    };

    /* ── load data untuk form ── */
    function fetchAll() {
        return Promise.all([
            client.from('content').select('key,value,type'),
            client.from('education').select('*').order('sort_order'),
            client.from('projects').select('*').order('sort_order'),
            client.from('skills').select('*').order('sort_order'),
            client.from('certificates').select('*').order('sort_order')
        ]).then(function (r) {
            function rows(i) { return (r[i] && !r[i].error && r[i].data) ? r[i].data : null; }
            var map = {};
            (rows(0) || []).forEach(function (c) {
                if (c && typeof c.value === 'string' && EN_TITLES[c.value.trim()]) {
                    c.value = EN_TITLES[c.value.trim()];
                }
                map[c.key] = c;
            });
            var d = rows(1), p = rows(2), s = rows(3), c = rows(4);
            return {
                contentMap: map,
                edu: (d && d.length) ? d : seedEducation(),
                proj: (p && p.length) ? p : seedProjectsFixed(),
                skill: (s && s.length) ? s : seedSkills(),
                cert: c || []
            };
        });
    }

    /* ═════════ UI ═════════ */
    var overlay, sidebar, body, loginEl;

    function buildChrome() {
        var host = document.createElement('div');
        host.innerHTML =
            '<button type="button" class="cms-admin-btn" id="cmsBtn" aria-label="Buka panel admin" title="Panel admin">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>' +
            '</button>' +
            '<div class="cms-sidebar-overlay" id="cmsOverlay"></div>' +
            '<aside class="cms-sidebar" id="cmsSidebar" aria-label="Panel edit konten">' +
            '  <div class="cms-sidebar__header"><span class="cms-sidebar__title">Edit Konten</span>' +
            '  <button type="button" class="cms-sidebar__close" id="cmsClose" aria-label="Tutup panel">&times;</button></div>' +
            '  <div class="cms-sidebar__body" id="cmsBody"></div>' +
            '  <div class="cms-sidebar__footer">' +
            '    <button type="button" class="cms-btn cms-btn--primary" style="flex:1" id="cmsSave">Simpan Semua</button>' +
            '    <button type="button" class="cms-btn cms-btn--danger" id="cmsLogout">Keluar</button>' +
            '  </div>' +
            '</aside>' +
            '<div class="cms-pw-overlay" id="cmsLogin"><form class="cms-pw-modal" id="cmsLoginBox">' +
            '  <h3>Masuk Admin</h3><p>Edit isi portofolio. Pengunjung tetap hanya bisa melihat.</p>' +
            '  <div class="cms-form-group"><label>Email</label><input type="email" id="cmsEmail" autocomplete="username" required></div>' +
            '  <div class="cms-form-group"><label>Password</label><input type="password" id="cmsPw" autocomplete="current-password" required></div>' +
            '  <div class="cms-pw-error" id="cmsLoginErr"></div>' +
            '  <div class="cms-pw-actions"><button type="button" class="cms-btn" id="cmsLoginCancel">Batal</button>' +
            '  <button type="submit" class="cms-btn cms-btn--primary" id="cmsLoginGo">Masuk</button></div>' +
            '</form></div>';
        document.body.appendChild(host);
        overlay = $('#cmsOverlay'); sidebar = $('#cmsSidebar'); body = $('#cmsBody'); loginEl = $('#cmsLogin');
    }

    function openSide() { sidebar.classList.add('is-open'); overlay.classList.add('is-open'); }
    function closeSide() { sidebar.classList.remove('is-open'); overlay.classList.remove('is-open'); }

    /* ── form builders ── */
    function secTitle(t) { return '<h4 style="color:var(--cms-accent);margin:1.6rem 0 1rem;font-size:1rem">' + esc(t) + '</h4>'; }

    function buildTextSection(contentMap) {
        var html = secTitle('Teks & Info');
        TEXT_FIELDS.forEach(function (f) {
            var row = contentMap[f.key];
            var val = row ? row.value : domVal(f.key, f.type);
            html += '<div class="cms-form-group"><label>' + esc(f.label) + '</label>';
            if (f.type === 'image') {
                html += '<input type="text" data-t="text" data-k="' + f.key + '" data-type="image" value="' + esc(val || '') + '" placeholder="URL foto (upload di bawah)">' +
                    '<div class="cms-upload-zone' + (val ? ' has-image' : '') + '" style="margin-top:.5rem" data-bucket="media" data-target="text" data-k="' + f.key + '" data-kind="image">' +
                    '<div class="cms-upload-zone__placeholder">Klik / seret gambar (maks 5MB)</div>' +
                    '<img class="cms-upload-zone__preview" alt=""' + (val ? ' src="' + esc(val) + '"' : '') + ' hidden><button type="button" class="cms-upload-zone__remove" aria-label="Hapus gambar">&times;</button>' +
                    '<input type="file" accept="image/*"></div>';
            } else if (f.area) {
                html += '<textarea data-t="text" data-k="' + f.key + '" data-type="text">' + esc(val) + '</textarea>';
            } else {
                html += '<input type="text" data-t="text" data-k="' + f.key + '" data-type="' + (f.type === 'url' ? 'url' : 'text') + '" value="' + esc(val) + '">';
            }
            html += '</div>';
        });
        return html;
    }

    function domVal(key, type) {
        var el = document.querySelector('[data-cms-key="' + key + '"]');
        if (!el) return '';
        if (el.tagName === 'IMG') return el.getAttribute('src') || '';
        if (type === 'url' && el.tagName === 'A') return el.getAttribute('href') || '';
        if (type === 'image') { var im = el.querySelector('img'); return im ? im.getAttribute('src') : ''; }
        return el.getAttribute('data-raw-text') || el.textContent.trim();
    }

    function buildEdu(edu) {
        var html = secTitle('Pendidikan');
        state.edu = edu;
        html += '<div id="cmsEdu">' + edu.map(eduCard).join('') + '</div>' +
            '<button type="button" class="cms-add-btn" data-add="edu">+ Tambah pendidikan</button>';
        return html;
    }
    function eduCard(it, i) {
        return '<div class="cms-item-card" data-list="edu" data-i="' + i + '">' +
            '<div class="cms-item-card__header"><span class="cms-item-card__number">#' + (i + 1) + '</span>' +
            '<button type="button" class="cms-item-card__delete" data-del="edu" data-i="' + i + '" aria-label="Hapus">&times;</button></div>' +
            '<div class="cms-form-group"><label>Periode</label><input data-l="edu" data-i="' + i + '" data-f="period" value="' + esc(it.period) + '"></div>' +
            '<div class="cms-form-group"><label>Gelar</label><input data-l="edu" data-i="' + i + '" data-f="degree" value="' + esc(it.degree) + '"></div>' +
            '<div class="cms-form-group"><label>Institusi</label><input data-l="edu" data-i="' + i + '" data-f="institution" value="' + esc(it.institution) + '"></div>' +
            '</div>';
    }

    function buildProj(proj) {
        var html = secTitle('Proyek');
        state.proj = proj;
        html += '<div id="cmsProj">' + proj.map(projCard).join('') + '</div>' +
            '<button type="button" class="cms-add-btn" data-add="proj">+ Tambah proyek</button>';
        return html;
    }
    function projCard(p, i) {
        var src = p.image_url && /^(https?:|assets\/|\.)/.test(p.image_url) ? p.image_url : '';
        return '<div class="cms-item-card" data-list="proj" data-i="' + i + '">' +
            '<div class="cms-item-card__header"><span class="cms-item-card__number">#' + (i + 1) + '</span>' +
            '<button type="button" class="cms-item-card__delete" data-del="proj" data-i="' + i + '" aria-label="Hapus">&times;</button></div>' +
            '<div class="cms-form-group"><label>Judul</label><input data-l="proj" data-i="' + i + '" data-f="title" value="' + esc(p.title) + '"></div>' +
            '<div class="cms-form-group"><label>Deskripsi</label><textarea data-l="proj" data-i="' + i + '" data-f="description">' + esc(p.description) + '</textarea></div>' +
            '<div class="cms-form-group"><label>Tags (pisahkan koma)</label><input data-l="proj" data-i="' + i + '" data-f="tags" value="' + esc(tagsOf(p.tags).join(', ')) + '"></div>' +
            '<div class="cms-form-group"><label>Gambar</label>' +
            '<div class="cms-upload-zone' + (src ? ' has-image' : '') + '" data-bucket="media" data-target="proj" data-i="' + i + '" data-kind="image">' +
            '<div class="cms-upload-zone__placeholder">Klik / seret gambar (maks 5MB)</div>' +
            '<img class="cms-upload-zone__preview" alt=""' + (src ? ' src="' + esc(src) + '"' : ' hidden') + '>' +
            '<button type="button" class="cms-upload-zone__remove" aria-label="Hapus gambar">&times;</button>' +
            '<input type="file" accept="image/*"></div></div>' +
            '</div>';
    }

    function buildSkill(skill) {
        var html = secTitle('Keahlian');
        state.skill = skill;
        html += '<div id="cmsSkill">' + skill.map(skillCard).join('') + '</div>' +
            '<button type="button" class="cms-add-btn" data-add="skill">+ Tambah grup keahlian</button>';
        return html;
    }
    function skillCard(s, i) {
        return '<div class="cms-item-card" data-list="skill" data-i="' + i + '">' +
            '<div class="cms-item-card__header"><span class="cms-item-card__number">#' + (i + 1) + '</span>' +
            '<button type="button" class="cms-item-card__delete" data-del="skill" data-i="' + i + '" aria-label="Hapus">&times;</button></div>' +
            '<div class="cms-form-group"><label>Nama grup</label><input data-l="skill" data-i="' + i + '" data-f="group_name" value="' + esc(s.group_name) + '"></div>' +
            '<div class="cms-form-group"><label>Keahlian (pisahkan koma)</label><input data-l="skill" data-i="' + i + '" data-f="tags" value="' + esc(tagsOf(s.tags).join(', ')) + '"></div>' +
            '</div>';
    }

    function buildCert(cert) {
        var html = secTitle('Sertifikat');
        state.cert = cert;
        html += '<div id="cmsCert">' + cert.map(certCard).join('') + '</div>' +
            '<button type="button" class="cms-add-btn" data-add="cert">+ Tambah sertifikat</button>' +
            '<p style="font-size:.8rem;color:var(--cms-text-sec);margin-top:.75rem">PDF wajib diupload; thumbnail opsional (kalau kosong, pakai placeholder PDF).</p>';
        return html;
    }
    function certCard(c, i) {
        return '<div class="cms-item-card" data-list="cert" data-i="' + i + '">' +
            '<div class="cms-item-card__header"><span class="cms-item-card__number">#' + (i + 1) + '</span>' +
            '<button type="button" class="cms-item-card__delete" data-del="cert" data-i="' + i + '" aria-label="Hapus">&times;</button></div>' +
            '<div class="cms-form-group"><label>Judul</label><input data-l="cert" data-i="' + i + '" data-f="title" value="' + esc(c.title) + '"></div>' +
            '<div class="cms-form-group"><label>Penerbit</label><input data-l="cert" data-i="' + i + '" data-f="issuer" value="' + esc(c.issuer || '') + '"></div>' +
            '<div class="cms-form-group"><label>Tahun</label><input type="number" data-l="cert" data-i="' + i + '" data-f="year" value="' + esc(c.year || '') + '"></div>' +
            '<div class="cms-form-group"><label>File PDF (wajib)</label>' +
            '<div class="cms-upload-zone" data-bucket="certificates" data-target="cert" data-i="' + i + '" data-kind="pdf">' +
            '<div class="cms-upload-zone__placeholder">' + (c.pdf_url ? 'PDF: ' + esc(pdfName(c.pdf_url)) : 'Klik / seret PDF (maks 10MB)') + '</div>' +
            '<input type="file" accept="application/pdf,.pdf"></div></div>' +
            '</div>';
    }
    function pdfName(u) { return decodeURIComponent((String(u).split('/').pop() || '').split('?')[0]); }

    /* ── render form ── */
    function renderForm(d) {
        state = { edu: d.edu, proj: d.proj, skill: d.skill, cert: d.cert, del: { edu: [], proj: [], skill: [], cert: [] } };
        body.innerHTML =
            buildTextSection(d.contentMap) +
            buildEdu(d.edu) +
            buildProj(d.proj) +
            buildSkill(d.skill) +
            buildCert(d.cert);
    }

    /* ── re-render satu list ── */
    function rerenderList(name) {
        var map = { edu: ['#cmsEdu', eduCard], proj: ['#cmsProj', projCard], skill: ['#cmsSkill', skillCard], cert: ['#cmsCert', certCard] };
        var box = $(map[name][0]);
        if (!box) return;
        box.innerHTML = state[name].map(map[name][1]).join('');
    }

    /* ── events (delegasi) ── */
    function bindEvents() {
        body.addEventListener('input', function (e) {
            var el = e.target;
            var l = el.getAttribute && el.getAttribute('data-l');
            if (l) {
                var i = +el.getAttribute('data-i'), f = el.getAttribute('data-f');
                if (f === 'tags') state[l][i].tags = el.value;
                else if (f === 'year') state[l][i].year = el.value ? +el.value : null;
                else state[l][i][f] = el.value;
            }
        });
        body.addEventListener('click', function (e) {
            var t = e.target;
            if (t.closest && t.closest('.cms-item-card__delete')) {
                var b = t.closest('.cms-item-card__delete');
                var name = b.getAttribute('data-del'), i = +b.getAttribute('data-i');
                var row = state[name][i];
                if (row && row.id) state.del[name].push(row.id);
                if (name === 'cert') { removeStorage('certificates', row.pdf_url); removeStorage('media', row.thumb_url); }
                if (name === 'proj') { /* image dibiarkan (tak melacak hapus file yatim) */ }
                state[name].splice(i, 1);
                rerenderList(name);
                return;
            }
            if (t.closest && t.closest('.cms-add-btn')) {
                var add = t.closest('.cms-add-btn').getAttribute('data-add');
                var blank = { edu: { period: '', degree: '', institution: '' },
                              proj: { title: '', description: '', tags: '', image_url: '' },
                              skill: { group_name: '', tags: '' },
                              cert: { title: '', issuer: '', year: null, pdf_url: '' } };
                state[add].push(blank[add]);
                rerenderList(add);
                return;
            }
            if (t.closest && t.closest('.cms-upload-zone__remove')) {
                var zone = t.closest('.cms-upload-zone');
                var target = zone.getAttribute('data-target'), idx = +zone.getAttribute('data-i');
                var kind = zone.getAttribute('data-kind');
                if (kind === 'image') {
                    zone.classList.remove('has-image');
                    var prev = zone.querySelector('.cms-upload-zone__preview');
                    if (prev) { prev.hidden = true; prev.src = ''; }
                    if (target === 'text') { var ti = body.querySelector('[data-t="text"][data-k="about.photo"]'); if (ti) ti.value = ''; }
                    else if (target === 'proj') { removeStorage('media', state.proj[idx].image_url); state.proj[idx].image_url = ''; }
                }
                return;
            }
        });
        body.addEventListener('change', function (e) {
            var el = e.target;
            if (el.type !== 'file' || !el.files || !el.files[0]) return;
            var zone = el.closest('.cms-upload-zone');
            var bucket = zone.getAttribute('data-bucket');
            var kind = zone.getAttribute('data-kind');
            var file = el.files[0];
            if (!validateFile(file, kind)) { el.value = ''; return; }
            toast('Mengupload…');
            uploadFile(bucket, file).then(function (url) {
                var target = zone.getAttribute('data-target');
                var idx = zone.hasAttribute('data-i') ? +zone.getAttribute('data-i') : -1;
                if (target === 'text') {
                    var ti = body.querySelector('[data-t="text"][data-k="' + zone.getAttribute('data-k') + '"]');
                    if (ti) ti.value = url;
                    zone.classList.add('has-image');
                    var pv0 = zone.querySelector('.cms-upload-zone__preview');
                    if (pv0) { pv0.src = url; pv0.hidden = false; }
                } else if (target === 'proj') {
                    removeStorage('media', state.proj[idx].image_url);
                    state.proj[idx].image_url = url;
                    zone.classList.add('has-image');
                    var pv = zone.querySelector('.cms-upload-zone__preview');
                    pv.src = url; pv.hidden = false;
                } else if (target === 'cert') {
                    removeStorage('certificates', state.cert[idx].pdf_url);
                    state.cert[idx].pdf_url = url;
                    var ph2 = zone.querySelector('.cms-upload-zone__placeholder');
                    ph2.textContent = 'PDF: ' + pdfName(url);
                }
                toast('Upload selesai', 'ok');
                el.value = '';
            }).catch(function (err) { toast('Upload gagal: ' + err.message, 'err'); });
        });
        /* drag & drop untuk upload-zone */
        body.addEventListener('dragover', function (e) {
            var z = e.target.closest && e.target.closest('.cms-upload-zone');
            if (z) { e.preventDefault(); z.classList.add('is-dragover'); }
        });
        body.addEventListener('dragleave', function (e) {
            var z = e.target.closest && e.target.closest('.cms-upload-zone');
            if (z) z.classList.remove('is-dragover');
        });
        body.addEventListener('drop', function (e) {
            var z = e.target.closest && e.target.closest('.cms-upload-zone');
            if (!z) return;
            e.preventDefault();
            z.classList.remove('is-dragover');
            var f = e.dataTransfer.files && e.dataTransfer.files[0];
            if (!f) return;
            var input = z.querySelector('input[type=file]');
            // set file via DataTransfer (Chrome/FF); kalau tak ada, abaikan drop (klik tetap jalan)
            if (typeof DataTransfer === 'undefined') { toast('Browser tidak mendukung drop — klik untuk pilih file', 'err'); return; }
            var dt = new DataTransfer();
            dt.items.add(f);
            input.files = dt.files;
            input.dispatchEvent(new Event('change', { bubbles: true }));
        });
    }

    /* ── SIMPAN ── */
    function saveAll() {
        var btn = $('#cmsSave');
        btn.disabled = true; btn.textContent = 'Menyimpan…';

        var ops = [];
        var built;
        try {
            // 1. teks: upsert semua TEXT_FIELDS
            var textRows = TEXT_FIELDS.map(function (f) {
                var el = body.querySelector('[data-t="text"][data-k="' + f.key + '"]');
                var v = el ? el.value.trim() : '';
                var type = el && el.getAttribute('data-type') === 'image' ? 'image' : (f.type === 'url' ? 'url' : 'text');
                return { key: f.key, value: v, type: type };
            });

            // 2. list: payload
            var eduRows = state.edu.map(function (it, i) {
                var r = { period: String(it.period || '').trim(), degree: String(it.degree || '').trim(), institution: it.institution || '', sort_order: i };
                if (it.id) r.id = it.id;
                return r;
            });
            var projRows = [];
            state.proj.forEach(function (it, i) {
                if (!String(it.title || '').trim()) throw new Error('Ada judul proyek kosong — isi atau hapus kartunya');
                var r = { title: it.title.trim(), description: it.description || '', tags: tagsOf(it.tags), image_url: it.image_url || '', sort_order: i };
                if (it.id) r.id = it.id;
                projRows.push(r);
            });
            var skillRows = [];
            state.skill.forEach(function (it, i) {
                if (!String(it.group_name || '').trim()) throw new Error('Ada nama grup keahlian kosong');
                var r = { group_name: it.group_name.trim(), tags: tagsOf(it.tags), sort_order: i };
                if (it.id) r.id = it.id;
                skillRows.push(r);
            });
            var certRows = [];
            state.cert.forEach(function (it, i) {
                if (!String(it.title || '').trim()) return;
                if (!it.pdf_url) { toast('Sertifikat "' + it.title + '": PDF belum diupload — dilewati', 'err'); return; }
                var r = { title: it.title.trim(), issuer: it.issuer || null, year: it.year ? +it.year : null,
                          pdf_url: it.pdf_url, sort_order: i };
                if (it.id) r.id = it.id;
                certRows.push(r);
            });

            ops.push(client.from('content').upsert(textRows, { onConflict: 'key' }));
            ops.push(saveList('education', eduRows, state.del.edu));
            ops.push(saveList('projects', projRows, state.del.proj));
            ops.push(saveList('skills', skillRows, state.del.skill));
            ops.push(saveList('certificates', certRows, state.del.cert));
        } catch (e) {
            toast(e.message, 'err');
            btn.disabled = false; btn.textContent = 'Simpan Semua';
            return;
        }

        Promise.all(ops).then(function (results) {
            var err = null;
            results.forEach(function (r) { if (r && r.error && !err) err = r; });
            if (err) throw new Error(err.error.message);
            toast('Tersimpan ✓ — memuat ulang…', 'ok');
            setTimeout(function () { location.reload(); }, 900);
        }).catch(function (e) {
            toast('Gagal: ' + e.message, 'err');
            btn.disabled = false; btn.textContent = 'Simpan Semua';
        });
    }

    function saveList(table, rows, removed) {
        var tasks = [];
        if (removed.length) tasks.push(client.from(table).delete().in('id', removed));
        if (rows.length) {
            var toInsert = rows.filter(function (r) { return !r.id; });
            var toUpdate = rows.filter(function (r) { return r.id; });
            if (toInsert.length) tasks.push(client.from(table).insert(toInsert).select());
            if (toUpdate.length) tasks.push(client.from(table).upsert(toUpdate, { onConflict: 'id' }).select());
        }
        return Promise.all(tasks).then(function (rs) {
            var err = null;
            (rs || []).forEach(function (r) { if (r && r.error && !err) err = r; });
            return err || { error: null };
        });
    }

    /* ── auth ── */
    function currentSession() {
        return client.auth.getSession().then(function (r) { return (r.data && r.data.session) || null; });
    }
    function openLogin() {
        loginEl.classList.add('is-open');
        setTimeout(function () { var f = $('#cmsEmail'); if (f) f.focus(); }, 350);
    }
    function closeLogin() { loginEl.classList.remove('is-open'); $('#cmsLoginErr').textContent = ''; }

    function wire() {
        $('#cmsBtn').addEventListener('click', function () {
            currentSession().then(function (s) {
                if (s) { openSide(); fetchAll().then(renderForm).catch(function (e) { toast('Gagal memuat data: ' + e.message, 'err'); }); }
                else openLogin();
            });
        });
        $('#cmsClose').addEventListener('click', closeSide);
        overlay.addEventListener('click', closeSide);
        $('#cmsLoginCancel').addEventListener('click', closeLogin);
        $('#cmsLoginBox').addEventListener('submit', function (e) {
            e.preventDefault();
            var err = $('#cmsLoginErr');
            err.textContent = '';
            $('#cmsLoginGo').disabled = true; $('#cmsLoginGo').textContent = 'Cek…';
            client.auth.signInWithPassword({
                email: $('#cmsEmail').value.trim(),
                password: $('#cmsPw').value
            }).then(function (r) {
                $('#cmsLoginGo').disabled = false; $('#cmsLoginGo').textContent = 'Masuk';
                if (r.error) {
                    err.textContent = /invalid/i.test(r.error.message) ? 'Email atau password salah' : ('Login gagal: ' + r.error.message);
                    return;
                }
                closeLogin();
                $('#cmsPw').value = '';
                toast('Berhasil masuk ✓', 'ok');
                openSide();
                fetchAll().then(renderForm).catch(function (e2) { toast('Gagal memuat data: ' + e2.message, 'err'); });
            });
        });
        $('#cmsLogout').addEventListener('click', function () {
            client.auth.signOut().then(function () { closeSide(); toast('Keluar', 'ok'); });
        });
        $('#cmsSave').addEventListener('click', saveAll);
        bindEvents();
        // tombol aktif jika sudah ada session (restore)
        currentSession().then(function (s) { $('#cmsBtn').classList.toggle('is-active', !!s); });
    }

    buildChrome();
    wire();
})();
