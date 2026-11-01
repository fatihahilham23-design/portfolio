/* ─── CMS LOADER (publik) ───
   Baca data dari Supabase, render ke halaman. Thumbnails sertifikat
   dibuat otomatis dari PDF halaman 1 via PDF.js (canvas -> dataURL).
   Kalau gagal/offline/kosong: fallback ke HTML statis. */
(function () {
    'use strict';

    var cfg = window.CMS_CONFIG || {};
    var CMS = window.CMS = { client: null, data: null, ready: null, esc: esc, publicUrl: publicUrl };

    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function publicUrl(bucket, path) {
        if (!path) return '';
        if (/^(https?:|data:|assets\/|\.{0,2}\/)/i.test(path)) return path;
        return cfg.url + '/storage/v1/object/public/' + bucket + '/' + path;
    }

    if (!cfg.url || !cfg.anonKey || typeof supabase === 'undefined' || !supabase.createClient) {
        CMS.ready = Promise.resolve(null);
        return;
    }

    try { CMS.client = supabase.createClient(cfg.url, cfg.anonKey); }
    catch (e) { CMS.ready = Promise.resolve(null); return; }

    /* ── PDF → thumbnail (halaman 1, rasio asli) ── */
    var PDFJS_URL = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
    var pdfjsLoaded = null;
    function ensurePdfjs() {
        if (pdfjsLoaded !== null) return pdfjsLoaded;
        if (window.pdfjsLib) { pdfjsLoaded = Promise.resolve(window.pdfjsLib); return pdfjsLoaded; }
        pdfjsLoaded = new Promise(function (res, rej) {
            var s = document.createElement('script');
            s.src = PDFJS_URL;
            s.onload = function () {
                if (!window.pdfjsLib) return rej(new Error('pdfjsLib missing'));
                window.pdfjsLib.GlobalWorkerOptions.workerSrc =
                    'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
                res(window.pdfjsLib);
            };
            s.onerror = rej;
            document.head.appendChild(s);
        });
        return pdfjsLoaded;
    }

    var pdfThumbCache = {};
    function pdfToThumb(pdfUrl) {
        if (!pdfUrl) return Promise.resolve(null);
        if (pdfThumbCache[pdfUrl]) return Promise.resolve(pdfThumbCache[pdfUrl]);
        var timeout = new Promise(function (resolve) {
            setTimeout(function () { resolve(null); }, 3000);
        });
        var work = ensurePdfjs().then(function (pdfjsLib) {
            return pdfjsLib.getDocument({ url: pdfUrl, withCredentials: false }).promise;
        }).then(function (pdf) {
            return pdf.getPage(1);
        }).then(function (page) {
            var viewport = page.getViewport({ scale: 1.2 });
            var canvas = document.createElement('canvas');
            canvas.width = Math.round(viewport.width);
            canvas.height = Math.round(viewport.height);
            var ctx = canvas.getContext('2d');
            return page.render({ canvasContext: ctx, viewport: viewport }).promise.then(function () {
                var dataUrl = canvas.toDataURL('image/jpeg', 0.72);
                pdfThumbCache[pdfUrl] = dataUrl;
                return dataUrl;
            });
        }).catch(function (e) {
            console.warn('[CMS] pdf thumbnail gagal:', pdfUrl, e && e.message || e);
            return null;
        });
        return Promise.race([work, timeout]);
    }

    function renderEducation(items) {
        var wrap = document.getElementById('eduDeckWrapper');
        if (!wrap) return;
        var stage = document.getElementById('eduDeckStage');

        var displayItems = items.slice(0, 3);
        if (stage) stage.classList.toggle('is-duo', displayItems.length <= 2);

        var variants = ['yellow', 'pink', 'blue'];
        var icons = [
            '<svg viewBox="0 0 24 24" class="edu-logo-svg" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>',
            '<svg viewBox="0 0 24 24" class="edu-logo-svg" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
            '<svg viewBox="0 0 24 24" class="edu-logo-svg" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>'
        ];

        wrap.innerHTML = displayItems.map(function (it, idx) {
            var variant = variants[idx % variants.length];
            var posClass = idx === 0 ? 'edu-pos-center' : (idx === 1 ? 'edu-pos-right' : 'edu-pos-left');
            var icon = icons[idx % icons.length];
            var tags = (it.tags || []).map(function (t) {
                return '<span>' + esc(t) + '</span>';
            }).join('');
            if (!tags) tags = '<span>' + esc(it.degree || 'Education') + '</span>';
            var subText = esc(it.sub || it.gpa || it.period || 'Academic');

            return '<div class="edu-stacked-card edu-stacked-card--' + variant + ' ' + posClass + '" data-card-idx="' + idx + '" role="button" tabindex="0">' +
                '<div class="edu-card-tilt-inner">' +
                '<div class="edu-card-header">' +
                '<div class="edu-card-logo-badge edu-card-logo-badge--' + variant + '">' + icon + '</div>' +
                '<span class="edu-card-org">' + esc(it.institution) + '</span>' +
                '</div>' +
                '<div class="edu-card-details">' +
                '<h3 class="edu-card-title">' + esc(it.degree) + '</h3>' +
                '<p class="edu-card-salary">' + subText + '</p>' +
                '</div>' +
                '<div class="edu-card-tags">' + tags + '</div>' +
                '<div class="edu-card-footer">' +
                '<span class="edu-card-status"><span class="edu-status-dot"></span> Graduated</span>' +
                '<span class="edu-card-date">' + esc(it.period) + '</span>' +
                '</div>' +
                '</div></div>';
        }).join('');

        var dotsWrap = document.getElementById('eduDeckDots');
        if (dotsWrap) {
            dotsWrap.innerHTML = displayItems.map(function (_, i) {
                return '<button type="button" class="edu-deck-dot' + (i === 0 ? ' is-active' : '') + '" data-target-idx="' + i + '" aria-label="Card ' + (i + 1) + (i === 0 ? ' (Active)' : '') + '"></button>';
            }).join('');
        }

        if (window.initEduDeck) window.initEduDeck();
        if (window.refreshReveal) window.refreshReveal();
    }

    function renderSkills(items) {
        var wrap = document.querySelector('.skill-grid');
        if (!wrap) return;

        var icons = {
            'frontend': '<svg viewBox="0 0 24 24" class="glass-card__badge-icon" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>',
            'backend': '<svg viewBox="0 0 24 24" class="glass-card__badge-icon" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>',
            'tools': '<svg viewBox="0 0 24 24" class="glass-card__badge-icon" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>'
        };

        var descriptions = {
            'frontend': 'Antarmuka web interaktif, layout adaptif, dan transisi animasi mikro yang halus.',
            'backend': 'Perancangan REST API, pemodelan data relasional, dan otentikasi pengguna.',
            'tools': 'Version control Git, kontainerisasi dasar, dan workflow deployment web.'
        };

        var eyebrows = {
            'frontend': 'Client Side',
            'backend': 'Server & Data',
            'tools': 'Workflow & DevOps'
        };

        wrap.innerHTML = items.map(function (g) {
            var rawKey = (g.group_name || '').toLowerCase().trim();
            var key = 'frontend';
            if (rawKey.indexOf('back') !== -1) key = 'backend';
            else if (rawKey.indexOf('tool') !== -1 || rawKey.indexOf('dev') !== -1) key = 'tools';

            var icon = icons[key] || icons['frontend'];
            var desc = descriptions[key] || esc(g.description || 'Penguasaan keahlian teknologi untuk membangun solusi digital.');
            var eyebrow = eyebrows[key] || 'Tech Stack';
            var tags = (g.tags || []).map(function (t, idx) {
                return '<span style="--tag-idx: ' + (idx + 1) + ';">' + esc(t) + '</span>';
            }).join('');

            return '<div class="glass-card" data-category="' + esc(key) + '">' +
                '<div class="glass-card__inner">' +
                '<div class="glass-card__frost"></div>' +
                '<div class="glass-card__circles-wrap">' +
                '<div class="glass-card__circle glass-card__circle--1"></div>' +
                '<div class="glass-card__circle glass-card__circle--2"></div>' +
                '<div class="glass-card__circle glass-card__circle--3"></div>' +
                '<div class="glass-card__circle glass-card__circle--4"></div>' +
                '<div class="glass-card__badge" aria-label="' + esc(g.group_name) + ' Badge">' + icon + '</div>' +
                '</div>' +
                '<div class="glass-card__content">' +
                '<div class="glass-card__header">' +
                '<span class="glass-card__eyebrow">' + esc(eyebrow) + '</span>' +
                '<h3 class="glass-card__title">' + esc(g.group_name) + '</h3>' +
                '<p class="glass-card__desc">' + desc + '</p>' +
                '</div>' +
                '<div class="glass-card__tags">' + tags + '</div>' +
                '</div>' +
                '<div class="glass-card__footer">' +
                '<span class="glass-card__status"><span class="glass-card__status-dot"></span> Active Stack</span>' +
                '</div>' +
                '</div></div>';
        }).join('');

        wrap.classList.add('is-visible');

        if (window.initGlassCardTilt) {
            window.initGlassCardTilt();
        }
        if (window.refreshReveal) {
            window.refreshReveal();
        }
    }

    function renderProjects(items) {
        var wrap = document.getElementById('works');
        if (!wrap) return;
        var titles = '', imgs = '';
        items.forEach(function (p, i) {
            var tags = (p.tags || []).map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('');
            titles += '<div class="hover-slider__item">' +
                '<button class="hover-slider__title' + (i === 0 ? ' is-active' : '') + '" data-index="' + i +
                '" aria-expanded="' + (i === 0 ? 'true' : 'false') + '" aria-controls="detail-' + i + '">' + esc(p.title) + '</button>' +
                '<div class="hover-slider__detail' + (i === 0 ? ' is-open' : '') + '" id="detail-' + i + '" role="region" aria-label="' + esc(p.title) + '">' +
                '<div class="hover-slider__detail-inner"><p>' + esc(p.description) + '</p>' +
                (tags ? '<div class="tags">' + tags + '</div>' : '') + '</div></div></div>';
            imgs += '<img class="hover-slider__image' + (i === 0 ? ' is-active' : '') + '" src="' +
                esc(publicUrl('media', p.image_url)) + '" alt="" decoding="async">';
        });
        wrap.innerHTML = '<div class="hover-slider__titles">' + titles + '</div>' +
            '<div class="hover-slider__image-wrap" aria-hidden="true">' + imgs + '</div>';
        // re-init hover slider after DOM replaced
        if (window.initHoverSlider) window.initHoverSlider(wrap);
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

    /* ── render teks per data-cms-key ── */
    function applyContent(rows) {
        rows.forEach(function (row) {
            if (row.value == null) return;
            var nodes = document.querySelectorAll('[data-cms-key="' + row.key + '"]');
            for (var i = 0; i < nodes.length; i++) {
                var el = nodes[i];
                if (row.type === 'image') {
                    if (!row.value) continue;
                    el.innerHTML = '<img src="' + esc(row.value) + '" alt="" style="display:block;width:100%;height:100%;object-fit:cover;border-radius:inherit">';
                } else if (row.type === 'url') {
                    if (!row.value) continue;
                    if (el.tagName === 'A') el.setAttribute('href', row.value);
                } else {
                    var val = row.value;
                    if (typeof val === 'string') {
                        val = val.replace(/&amp;/g, '&').replace(/amp;/g, '&');
                        var trimmed = val.trim();
                        if (EN_TITLES[trimmed]) val = EN_TITLES[trimmed];
                    }
                    if (el.classList.contains('text-block-target') || row.key === 'about.body') {
                        el.setAttribute('data-raw-text', val);
                        if (window.TextBlockAnimation && window.TextBlockAnimation.update) {
                            window.TextBlockAnimation.update(el, val);
                            continue;
                        }
                    }
                    if (el.classList.contains('text-scroll-heading')) {
                        el.setAttribute('data-raw-text', val);
                        if (window.TextScrollAnimation && window.TextScrollAnimation.update) {
                            window.TextScrollAnimation.update(el, val);
                            continue;
                        }
                    }
                    el.textContent = val;
                }
            }
        });
        if (window.TextBlockAnimation && window.TextBlockAnimation.init) {
            try { window.TextBlockAnimation.init(); } catch (e) { /* noop */ }
        }
        if (window.TextScrollAnimation && window.TextScrollAnimation.refresh) {
            try { window.TextScrollAnimation.refresh(); } catch (e) { /* noop */ }
        }
    }

    function mapCert(c) {
        var label = c.title || 'Certificate';
        if (c.year) label += ' (' + c.year + ')';
        if (c.issuer) label += ' - ' + c.issuer;
        var localThumb = 'assets/certs/' + c.id + '.webp';
        return {
            id: c.id,
            title: c.title,
            issuer: c.issuer,
            year: c.year,
            label: label,
            pdf: publicUrl('certificates', c.pdf_url),
            thumbUrl: c.thumb_url ? publicUrl('media', c.thumb_url) : localThumb
        };
    }

    /* ── render carousel dari mapCert + thumbnail instan ── */
    function renderCerts(mapped) {
        if (!mapped || !mapped.length) return Promise.resolve(null);

        var certs = mapped.map(function (m) {
            var localThumb = 'assets/certs/' + m.id + '.webp';
            return {
                id: m.id,
                title: m.title,
                issuer: m.issuer,
                year: m.year,
                label: m.label,
                pdf: m.pdf,
                url: m.thumbUrl || localThumb
            };
        });

        window.CMS.data = window.CMS.data || {};
        window.CMS.data.certificates = certs;
        return Promise.resolve(certs);
    }

    var db = CMS.client;
    CMS.ready = Promise.all([
        db.from('content').select('key,value,type'),
        db.from('education').select('*').order('sort_order'),
        db.from('projects').select('*').order('sort_order'),
        db.from('skills').select('*').order('sort_order'),
        db.from('certificates').select('*').order('sort_order')
    ]).then(function (r) {
        function rows(i) { return (r[i] && !r[i].error && r[i].data) ? r[i].data : []; }
        var content = rows(0), education = rows(1), projects = rows(2), skills = rows(3), certs = rows(4);
        if (r[0].error) console.warn('[CMS] content error:', r[0].error);
        if (r[1].error) console.warn('[CMS] education error:', r[1].error);
        if (r[2].error) console.warn('[CMS] projects error:', r[2].error);
        if (r[3].error) console.warn('[CMS] skills error:', r[3].error);
        if (r[4].error) console.warn('[CMS] certificates error:', r[4].error);

        applyContent(content);
        if (education.length) renderEducation(education);
        if (projects.length) renderProjects(projects);
        if (skills.length) renderSkills(skills);
        if (window.ScrollTrigger) { try { ScrollTrigger.refresh(); } catch (e) { /* noop */ } }

        var mapped = certs.map(mapCert);
        CMS.data = {
            content: content, education: education, projects: projects, skills: skills,
            certificates: null
        };

        if (!mapped.length) return CMS.data;

        // Render wallet langsung dengan placeholder/thumb awal
        if (window.WalletGallery && window.WalletGallery.init) {
            try { window.WalletGallery.init(mapped); } catch (e) { }
        }

        return renderCerts(mapped).then(function (finalCerts) {
            CMS.data.certificates = finalCerts && finalCerts.length ? finalCerts : null;
            if (finalCerts && finalCerts.length) {
                if (window.WalletGallery && window.WalletGallery.patchThumbs) {
                    window.WalletGallery.patchThumbs(finalCerts);
                } else if (window.WalletGallery && window.WalletGallery.init) {
                    try { window.WalletGallery.init(finalCerts); } catch (e) { console.warn('[CMS] wallet init:', e); }
                } else if (window.Carousel360 && window.Carousel360.init) {
                    try { window.Carousel360.init(finalCerts); } catch (e) { console.warn('[CMS] carousel init:', e); }
                }
                if (window.ScrollTrigger) {
                    try { ScrollTrigger.refresh(); } catch (e) { }
                }
            }
            return CMS.data;
        });
    }).catch(function (e) { console.error('[CMS] Load failed:', e); CMS.data = null; return null; });
})();
