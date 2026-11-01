/* ─── Helper: run callback when DOM ready or immediately ─── */
window.whenCms = function (cb) {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", cb);
    } else {
        cb();
    }
};

/* ─── LOADING SCREEN (Animated Cat Loader) ─── */
(function () {
    var loader = document.getElementById("loader");
    if (!loader) {
        window.__loaderDone = true;
        return;
    }
    window.__loaderDone = false;
    var MIN_SHOW = 1900;
    var done = false;
    var catAnim = null;

    if (document.body) {
        document.body.classList.add("is-loading");
    } else {
        document.addEventListener("DOMContentLoaded", function () {
            document.body.classList.add("is-loading");
        });
    }

    // Initialize Lottie Cat Animation immediately
    var catContainer = document.getElementById("catLoaderContainer");
    if (catContainer && window.lottie) {
        try {
            catAnim = window.lottie.loadAnimation({
                container: catContainer,
                renderer: "svg",
                loop: true,
                autoplay: true,
                animationData: window.__CAT_ANIMATION_DATA || undefined,
                path: (!window.__CAT_ANIMATION_DATA) ? "https://lottie.host/8cf4ba71-e5fb-44f3-8134-178c4d389417/0CCsdcgNIP.json" : undefined
            });
        } catch (e) {
            console.warn("[CatLoader] init failed:", e);
        }
    }

    function hide() {
        if (done) return;
        done = true;
        window.__loaderDone = true;
        loader.classList.add("is-hidden");
        if (document.body) document.body.classList.remove("is-loading");
        try {
            window.dispatchEvent(new CustomEvent("siteLoaded"));
        } catch (e) {
            var ev = document.createEvent("Event");
            ev.initEvent("siteLoaded", true, true);
            window.dispatchEvent(ev);
        }
        setTimeout(function () {
            if (catAnim && catAnim.destroy) catAnim.destroy();
            if (loader.parentNode) loader.parentNode.removeChild(loader);
        }, 650);
    }

    function start() {
        if (document.readyState === "complete") {
            setTimeout(hide, MIN_SHOW);
            return;
        }
        window.addEventListener("load", function () {
            setTimeout(hide, MIN_SHOW);
        });
    }

    start();
    setTimeout(hide, 4500); // fail-safe fallback
})();

/* ─── SMOOTH SCROLL (Vanilla Desktop) ─── */
(function () {
    var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    var html = document.documentElement;

    if (fine) {
        var target = window.scrollY, current = window.scrollY, raf = null, ease = 0.12;

        function clamp() {
            target = Math.max(0, Math.min(target, html.scrollHeight - window.innerHeight));
        }

        function tick() {
            if (document.hidden) {
                current = target;
                window.scrollTo(0, current);
                raf = null;
                return;
            }
            current += (target - current) * ease;
            if (Math.abs(target - current) < 0.5) current = target;
            window.scrollTo(0, current);

            if (Math.abs(target - current) > 0.5) {
                raf = requestAnimationFrame(tick);
            } else {
                raf = null;
            }
        }

        function kick() {
            if (!raf) raf = requestAnimationFrame(tick);
        }

        window.addEventListener("wheel", function (e) {
            if (document.body.style.overflow === "hidden") return;
            if (e.ctrlKey) return;
            if (e.target.closest && e.target.closest("input, textarea, .cms-sidebar, .pdf-modal")) return;
            target += e.deltaY;
            clamp();
            e.preventDefault();
            kick();
        }, { passive: false });

        window.addEventListener("resize", function () {
            current = window.scrollY;
            target = current;
        });

        // Sync when scroll occurs outside RAF (scrollbar drag, hash change, programmatic)
        window.addEventListener("scroll", function () {
            if (!raf) {
                current = window.scrollY;
                target = current;
            }
        }, { passive: true });

        // Global smooth scroll controller for entire website
        window.smoothScrollTo = function (y, instant) {
            target = Math.max(0, Math.min(y, html.scrollHeight - window.innerHeight));
            if (instant) {
                if (raf) {
                    cancelAnimationFrame(raf);
                    raf = null;
                }
                current = target;
                window.scrollTo(0, current);
            } else {
                clamp();
                kick();
            }
        };

        html.classList.add("js-smooth");

        // Smooth scroll untuk klik tautan jangkar (#)
        window.addEventListener("click", function (e) {
            var a = e.target.closest && e.target.closest('a[href^="#"]');
            if (!a) return;
            var id = a.getAttribute("href").slice(1);
            if (!id) return;
            var el = document.getElementById(id);
            if (!el) return;
            e.preventDefault();
            window.smoothScrollTo(Math.max(0, el.offsetTop - 60));
            history.replaceState(null, "", "#" + id);
        });
    } else {
        window.smoothScrollTo = function (y, instant) {
            if (instant) {
                window.scrollTo(0, y);
            } else {
                window.scrollTo({ top: y, behavior: "smooth" });
            }
        };
    }
})();

/* ─── NAVBAR & SCROLL-SPY: compact nav & sync anime-navbar link ─── */
(function () {
    var navPill = document.querySelector(".anime-nav__pill") || document.querySelector(".nav__pill");
    var sections = Array.prototype.slice.call(document.querySelectorAll("section[id]"));

    var navMap = {
        "home": "Home",
        "about": "About",
        "projects": "Projects",
        "skills": "Skills",
        "education": "Education",
        "certificates": "Certificates",
        "contact": "Contact"
    };

    var compacting = false;
    var currentActiveId = "";
    var ticking = false;

    function onScroll() {
        var scrollY = window.scrollY;

        // 1. Compact Navbar
        if (navPill) {
            var on = scrollY > 140;
            if (on !== compacting) {
                compacting = on;
                navPill.classList.toggle("nav__pill--scrolled", on);
            }
        }

        // 2. Active Section Spy
        if (sections.length && window.AnimeNavBar && window.AnimeNavBar.setActive) {
            var checkY = scrollY + Math.min(window.innerHeight * 0.35, 260);
            var matchedId = "";

            for (var i = 0; i < sections.length; i++) {
                var sec = sections[i];
                var top = sec.offsetTop;
                var height = sec.offsetHeight;
                if (checkY >= top && checkY < top + height) {
                    matchedId = sec.getAttribute("id");
                    break;
                }
            }

            if (!matchedId && scrollY < 200) {
                matchedId = "home";
            }

            if (matchedId && matchedId !== currentActiveId && navMap[matchedId]) {
                currentActiveId = matchedId;
                window.AnimeNavBar.setActive(navMap[matchedId]);
            }
        }

        ticking = false;
    }

    function requestScrollTick() {
        if (document.hidden) {
            onScroll();
            return;
        }
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(onScroll);
        }
    }

    window.addEventListener("scroll", requestScrollTick, { passive: true });
    requestScrollTick();
})();

/* ─── HERO: Animated "My Portofolio" Handwriting Drawing Effect (Optimized) ─── */
(function () {
    var heroSection = document.getElementById("home");
    var wrap = document.getElementById("heroHello");
    var svg = wrap ? wrap.querySelector(".apple-portfolio-svg, .apple-hello-svg") : null;
    if (!wrap || !svg) return;

    var paths = Array.prototype.slice.call(svg.querySelectorAll(".portfolio-path"));
    if (!paths.length) return;

    var isAnimating = false;
    var hasPlayedThisVisit = false;
    var rafId = null;

    // Pre-calculate path lengths (batch DOM read)
    var pathDashes = paths.map(function (p) {
        var len = (p.getTotalLength ? p.getTotalLength() : 800);
        return Math.ceil(len) + 2;
    });

    // Animation config (tuned for smoothness)
    var INITIAL_DELAY = 120;
    var STEP_INTERVAL = 135;
    var PAUSE_AFTER_MY = 90;
    var DRAW_DURATION = 420; // ms
    var FILL_DELAY = 80;

    function cancelRAF() {
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
    }

    function resetAnimation() {
        cancelRAF();
        isAnimating = false;
        hasPlayedThisVisit = false;
        svg.classList.remove("is-filled");

        paths.forEach(function (p, idx) {
            var dash = pathDashes[idx];
            p.style.transition = "none";
            p.style.strokeDasharray = dash;
            p.style.strokeDashoffset = dash;
            p.style.opacity = "0";
        });
    }

    function playAnimation(force) {
        if (!window.__loaderDone && !force) return;
        if (isAnimating && !force) return;
        if (hasPlayedThisVisit && !force) return;

        cancelRAF();
        isAnimating = true;
        hasPlayedThisVisit = true;
        svg.classList.remove("is-filled");

        // Initial: hide all strokes
        paths.forEach(function (p, idx) {
            var dash = pathDashes[idx];
            p.style.transition = "none";
            p.style.strokeDasharray = dash;
            p.style.strokeDashoffset = dash;
            p.style.opacity = "0";
        });

        // RAF-based sequencer (smooth, no timer overhead)
        var startTime = performance.now() + INITIAL_DELAY;
        var letterTimings = [];
        var currentOffset = 0;

        paths.forEach(function (p, idx) {
            if (idx === 2) currentOffset += PAUSE_AFTER_MY;
            letterTimings.push(currentOffset);
            currentOffset += STEP_INTERVAL;
        });

        var fillTime = currentOffset + DRAW_DURATION - FILL_DELAY;

        function animate(now) {
            var elapsed = now - startTime;

            paths.forEach(function (p, idx) {
                var letterStart = letterTimings[idx];
                if (elapsed >= letterStart && p.style.opacity === "0") {
                    p.style.transition = "stroke-dashoffset " + (DRAW_DURATION / 1000) + "s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.18s ease-out";
                    p.style.opacity = "1";
                    p.style.strokeDashoffset = "0";
                }
            });

            if (elapsed >= fillTime && !svg.classList.contains("is-filled")) {
                svg.classList.add("is-filled");
                isAnimating = false;
                rafId = null;
                return;
            }

            if (elapsed < fillTime) {
                rafId = requestAnimationFrame(animate);
            }
        }

        rafId = requestAnimationFrame(animate);
    }

    // 1. Initial setup
    resetAnimation();

    // 2. Trigger on site load
    window.addEventListener("siteLoaded", function () {
        if (window.scrollY < 300) {
            setTimeout(function () {
                playAnimation(true);
            }, 180);
        }
    });

    // 3. IntersectionObserver: main trigger (no scroll listener fallback to avoid lag)
    if ("IntersectionObserver" in window) {
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    if (window.__loaderDone) {
                        playAnimation();
                    }
                } else {
                    resetAnimation();
                }
            });
        }, {
            threshold: 0.2,
            rootMargin: "0px 0px -10% 0px"
        });

        if (heroSection) {
            observer.observe(heroSection);
        } else {
            observer.observe(wrap);
        }
    }

    // 4. Scroll handler (throttled, no layout thrashing)
    var scrollTicking = false;
    function handleScroll() {
        if (!window.__loaderDone) return;
        var isAtHome = window.scrollY < 300;

        if (isAtHome) {
            playAnimation();
        }
    }

    window.addEventListener("scroll", function () {
        if (!scrollTicking) {
            scrollTicking = true;
            requestAnimationFrame(function () {
                handleScroll();
                scrollTicking = false;
            });
        }
    }, { passive: true });

    // 5. Initial trigger on page load (if loader was already gone or disabled)
    setTimeout(function () {
        if (window.__loaderDone && window.scrollY < 300) {
            playAnimation();
        }
    }, 280);

    // 6. Replay on click/tap
    wrap.addEventListener("click", function () {
        playAnimation(true);
    });
})();

/* ─── WORKS: PROJECT ACCORDION & SLIDER ─── */
whenCms(function () {
    var scale = document.querySelector(".hover-slider");
    if (!scale) return;

    function setupSlider(wrap) {
        var slider = wrap || scale;
        var titles = Array.prototype.slice.call(slider.querySelectorAll(".hover-slider__title"));
        var imgs = Array.prototype.slice.call(slider.querySelectorAll(".hover-slider__image"));
        var details = Array.prototype.slice.call(slider.querySelectorAll(".hover-slider__detail"));

        var activeIdx = -1;
        var wipeTimer = null;

        function selectProject(i, force) {
            if (!titles.length) return;
            var idx = Math.max(0, Math.min(i, titles.length - 1));

            // Jika mengklik judul yang sedang aktif, jangan hilangkan deskripsi, berikan feedback sentuhan
            if (idx === activeIdx && !force) {
                var curTitle = titles[idx];
                if (curTitle) {
                    curTitle.classList.remove("is-clicked");
                    void curTitle.offsetWidth;
                    curTitle.classList.add("is-clicked");
                }
                return;
            }

            var prevIdx = activeIdx;
            activeIdx = idx;

            // 1. Indikator dan status tombol judul
            titles.forEach(function (t, k) {
                var on = (k === idx);
                t.classList.toggle("is-active", on);
                t.setAttribute("aria-expanded", String(on));
            });

            // 2. Transisi perpindahan gambar tirai (curtain wipe)
            imgs.forEach(function (im, k) {
                if (k === idx) {
                    im.classList.remove("was-active");
                    im.classList.add("is-active");
                } else if (k === prevIdx && prevIdx !== -1) {
                    im.classList.remove("is-active");
                    im.classList.add("was-active");
                } else {
                    im.classList.remove("is-active", "was-active");
                }
            });

            clearTimeout(wipeTimer);
            wipeTimer = setTimeout(function () {
                imgs.forEach(function (im, k) {
                    if (k !== activeIdx) {
                        im.classList.remove("was-active");
                    }
                });
            }, 620);

            // 3. Animasi pop-up deskripsi yang smooth (tanpa blocking reflow)
            details.forEach(function (d, k) {
                var on = (k === idx);
                d.removeAttribute("hidden");
                if (on) {
                    if (!d.classList.contains("is-open")) {
                        d.classList.add("is-open");
                    }
                } else {
                    d.classList.remove("is-open");
                }
            });
        }

        // Pre-decode seluruh gambar ke GPU VRAM agar pergantian gambar 100% instan tanpa lag decode
        imgs.forEach(function (im) {
            if (im.decode) {
                im.decode().catch(function () {});
            }
        });

        titles.forEach(function (t, i) {
            t.onclick = function (e) {
                if (e) e.preventDefault();
                selectProject(i);
            };
        });

        // Buka deskripsi proyek pertama secara default saat website dimuat
        selectProject(0, true);
    }

    // Ekspor fungsi init untuk render ulang oleh CMS loader
    window.initHoverSlider = function (wrap) {
        setupSlider(wrap);
    };

    setupSlider(scale);
});

/* ─── CERTIFICATES: INTERACTIVE WALLET / FOLDER GALLERY & MODAL PDF ─── */
(function () {
    var gallery = document.getElementById("walletGallery");
    var stage = document.getElementById("walletStage");
    var cardsWrap = document.getElementById("walletCards");
    var frontCover = document.getElementById("walletFront");
    var countBadge = document.getElementById("walletCount");
    var closeBtn = document.getElementById("walletCloseBtn");

    var pdfModal = document.getElementById("pdfModal");
    var pdfTitle = document.getElementById("pdfModalTitle");
    var pdfOpenTab = document.getElementById("pdfOpenTab");
    var pdfClose = document.getElementById("pdfClose");
    var pdfEmbed = document.getElementById("pdfEmbed");

    var certs = [];
    var isOpen = false;
    var isHover = false;
    var dragStartY = 0;
    var isDragging = false;
    var clearStaggerTimer = null;

    function openModal(cert) {
        if (!pdfModal || !cert || !cert.pdf) return;
        if (pdfTitle) pdfTitle.textContent = cert.label || cert.title || "Certificate";
        if (pdfOpenTab) pdfOpenTab.href = cert.pdf;
        if (pdfEmbed) pdfEmbed.src = cert.pdf;
        pdfModal.hidden = false;
        document.body.style.overflow = "hidden";
    }

    function closeModal() {
        if (!pdfModal) return;
        pdfModal.hidden = true;
        if (pdfEmbed) pdfEmbed.src = "";
        document.body.style.overflow = "";
    }

    if (pdfClose) pdfClose.addEventListener("click", closeModal);
    if (pdfModal) {
        pdfModal.addEventListener("click", function (e) {
            if (e.target === pdfModal) closeModal();
        });
    }
    window.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
            if (pdfModal && !pdfModal.hidden) {
                closeModal();
            } else if (isOpen) {
                closeWallet();
            }
        }
    });

    function certFallbackThumb(title, issuer) {
        return "data:image/svg+xml;utf8," + encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450">' +
            '<rect width="600" height="450" fill="#18181b"/>' +
            '<rect x="18" y="18" width="564" height="414" rx="14" fill="#222226" stroke="rgba(255,255,255,0.14)" stroke-width="2"/>' +
            '<circle cx="300" cy="170" r="46" fill="#0066cc" fill-opacity="0.18"/>' +
            '<path d="M288 170l9 9 16-16" stroke="#2997ff" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
            '<text x="300" y="250" text-anchor="middle" font-family="-apple-system, sans-serif" font-size="20" font-weight="700" fill="#ffffff">' + (title || 'Sertifikat') + '</text>' +
            '<text x="300" y="285" text-anchor="middle" font-family="-apple-system, sans-serif" font-size="14" fill="#a1a1aa">' + (issuer || 'Verified Credential') + '</text>' +
            '<rect x="230" y="325" width="140" height="30" rx="15" fill="#0066cc"/>' +
            '<text x="300" y="345" text-anchor="middle" font-family="-apple-system, sans-serif" font-size="12" font-weight="600" fill="#ffffff">PREVIEW PDF</text>' +
            '</svg>'
        );
    }

    function positionCards(openState, hoverState) {
        if (!cardsWrap) return;
        var cardEls = cardsWrap.querySelectorAll(".wallet-card");
        var total = cardEls.length;
        if (!total) return;

        var mid = (total - 1) / 2;
        var winW = window.innerWidth;
        var isMobile = winW < 680;
        var isTablet = winW >= 680 && winW < 960;

        var cardWidth = isMobile ? Math.min(270, winW - 48) : (isTablet ? 260 : 290);
        var cardHeight = Math.round(cardWidth * (215 / 290));
        var gapX = isMobile ? 16 : (isTablet ? 20 : 24);
        var gapY = isMobile ? 20 : (isTablet ? 22 : 24);

        var cols = isMobile ? 1 : (isTablet ? 2 : 3);
        var totalRows = Math.ceil(total / cols);
        var topClearance = isMobile ? 55 : 50;

        clearTimeout(clearStaggerTimer);

        if (openState) {
            // Expand stage height smoothly to fit all rows
            var totalGridHeight = totalRows * (cardHeight + gapY) - gapY;
            var targetStageHeight = totalGridHeight + 110;
            if (stage) {
                stage.style.minHeight = Math.max(480, targetStageHeight) + "px";
            }

            cardEls.forEach(function (card, i) {
                card.style.setProperty("--stagger", i);

                var row = Math.floor(i / cols);
                var cardsInThisRow = Math.min(cols, total - row * cols);
                var colInRow = i % cols;
                var colOffset = colInRow - (cardsInThisRow - 1) / 2;

                var targetX = colOffset * (cardWidth + gapX);
                var targetY = row * (cardHeight + gapY) - topClearance;
                var targetRot = isMobile ? 0 : (colOffset * 1.0);
                var targetScale = 1;

                card.style.setProperty("--tx", Math.round(targetX) + "px");
                card.style.setProperty("--ty", Math.round(targetY) + "px");
                card.style.setProperty("--rot", targetRot.toFixed(1) + "deg");
                card.style.setProperty("--scale", targetScale.toString());
                card.style.zIndex = 10;
            });

            // After opening transition settles, reset stagger to 0 so card hovers are instantaneous
            clearStaggerTimer = setTimeout(function () {
                if (isOpen) {
                    cardEls.forEach(function (card) {
                        card.style.setProperty("--stagger", "0");
                    });
                }
            }, 680);

        } else {
            cardEls.forEach(function (card, i) {
                var offset = total > 1 ? (i - mid) : 0;
                var stagger = hoverState ? 0 : (total - 1 - i);
                card.style.setProperty("--stagger", stagger);

                var x, y, rot, scale, zIndex;

                if (hoverState) {
                    x = offset * (isMobile ? 16 : 26);
                    y = -offset * 10 - 42;
                    rot = offset * 4.5;
                    scale = 1 - Math.abs(offset) * 0.02;
                    zIndex = i + 10;
                } else {
                    x = offset * 5;
                    y = -offset * 6;
                    rot = offset * 2.5;
                    scale = 1 - Math.abs(offset) * 0.02;
                    zIndex = i + 10;
                }

                card.style.setProperty("--tx", Math.round(x) + "px");
                card.style.setProperty("--ty", Math.round(y) + "px");
                card.style.setProperty("--rot", rot.toFixed(1) + "deg");
                card.style.setProperty("--scale", scale.toFixed(3));
                card.style.zIndex = zIndex;
            });

            clearStaggerTimer = setTimeout(function () {
                if (!isOpen) {
                    cardEls.forEach(function (card) {
                        card.style.setProperty("--stagger", "0");
                    });
                }
            }, 680);
        }
    }

    function openWallet() {
        if (isOpen || !gallery) return;
        isOpen = true;
        gallery.classList.remove("is-closing");
        gallery.classList.add("is-open");
        if (frontCover) frontCover.setAttribute("aria-expanded", "true");

        // Align view if certificates heading is partly scrolled above viewport
        var certSection = document.getElementById("certificates");
        if (certSection) {
            var rect = certSection.getBoundingClientRect();
            if (rect.top < -30) {
                var currentScroll = window.pageYOffset || document.documentElement.scrollTop || 0;
                var targetY = Math.max(0, Math.round(rect.top + currentScroll - 40));
                if (window.smoothScrollTo) {
                    window.smoothScrollTo(targetY);
                } else {
                    window.scrollTo({ top: targetY, behavior: "smooth" });
                }
            }
        }

        positionCards(true, false);
    }

    function closeWallet() {
        if (!isOpen || !gallery) return;
        isOpen = false;
        gallery.classList.remove("is-open");
        gallery.classList.add("is-closing");
        if (frontCover) frontCover.setAttribute("aria-expanded", "false");

        // 1. Calculate the exact scroll position of #certificates
        var certSection = document.getElementById("certificates");
        var currentScroll = window.pageYOffset || document.documentElement.scrollTop || 0;
        var certRect = certSection ? certSection.getBoundingClientRect() : null;
        var certPageTop = certRect ? (certRect.top + currentScroll) : 0;
        var targetY = Math.max(0, Math.round(certPageTop - 40));

        // 2. If user scrolled down into expanded cards, smoothly glide back to top of certificates
        if (currentScroll > targetY + 30) {
            if (window.smoothScrollTo) {
                window.smoothScrollTo(targetY);
            } else {
                window.scrollTo({ top: targetY, behavior: "smooth" });
            }
        }

        // 3. Play reverse card flight back into wallet pocket
        positionCards(false, false);

        // 4. Keep stage height intact during the smooth scroll & reverse flight
        // Only release minHeight after the user has safely returned to certificates
        setTimeout(function () {
            if (!isOpen) {
                var st = document.getElementById("walletStage");
                if (st) st.style.minHeight = "";
                gallery.classList.remove("is-closing");

                // Lock scroll safely at targetY if we scrolled, so shrinking height never shifts page
                if (currentScroll > targetY + 30) {
                    if (window.smoothScrollTo) {
                        window.smoothScrollTo(targetY, true);
                    } else {
                        window.scrollTo(0, targetY);
                    }
                }
            }
        }, 550);
    }

    function renderCards(items) {
        if (!cardsWrap) return;
        certs = Array.isArray(items) ? items : [];

        if (countBadge) {
            countBadge.textContent = certs.length;
        }
        var topCountBadge = document.getElementById("walletTopCount");
        if (topCountBadge) {
            topCountBadge.textContent = certs.length;
        }

        cardsWrap.innerHTML = "";

        certs.forEach(function (cert, idx) {
            var card = document.createElement("div");
            card.className = "wallet-card";
            card.setAttribute("data-idx", idx);
            card.style.setProperty("--idx", idx);
            card.setAttribute("role", "button");
            card.setAttribute("tabindex", "0");
            card.setAttribute("aria-label", "Certificate: " + (cert.title || cert.label));

            var thumbSrc = cert.url || cert.thumbUrl || certFallbackThumb(cert.title, cert.issuer);

            var img = document.createElement("img");
            img.className = "wallet-card-thumb";
            img.src = thumbSrc;
            img.alt = cert.title || cert.label || "Certificate";
            img.loading = "lazy";

            var badge = document.createElement("span");
            badge.className = "wallet-card-badge";
            badge.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> PDF';

            var overlay = document.createElement("div");
            overlay.className = "wallet-card-overlay";

            var titleSpan = document.createElement("span");
            titleSpan.className = "wallet-card-title";
            titleSpan.textContent = cert.title || cert.label || "Certificate";

            var issuerSpan = document.createElement("span");
            issuerSpan.className = "wallet-card-issuer";
            var issuerText = cert.issuer || "";
            if (cert.year) issuerText += (issuerText ? " • " : "") + cert.year;
            issuerSpan.textContent = issuerText || "Verified Credential";

            overlay.appendChild(titleSpan);
            overlay.appendChild(issuerSpan);

            card.appendChild(img);
            card.appendChild(badge);
            card.appendChild(overlay);

            // Drag down to close gesture
            card.addEventListener("pointerdown", function (e) {
                if (!isOpen) return;
                dragStartY = e.clientY;
                isDragging = true;
            });
            card.addEventListener("pointermove", function (e) {
                if (isDragging && isOpen && (e.clientY - dragStartY > 65)) {
                    isDragging = false;
                    closeWallet();
                }
            });

            // Click action
            card.addEventListener("click", function (e) {
                if (isOpen) {
                    e.stopPropagation();
                    openModal(cert);
                } else {
                    openWallet();
                }
            });

            card.addEventListener("keydown", function (e) {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    if (isOpen) openModal(cert);
                    else openWallet();
                }
            });

            cardsWrap.appendChild(card);
        });

        positionCards(isOpen, isHover);
    }

    if (frontCover) {
        frontCover.addEventListener("mouseenter", function () {
            if (!isOpen) {
                isHover = true;
                positionCards(false, true);
            }
        });
        frontCover.addEventListener("mouseleave", function () {
            if (!isOpen) {
                isHover = false;
                positionCards(false, false);
            }
        });
        frontCover.addEventListener("click", function () {
            if (!isOpen) openWallet();
            else closeWallet();
        });
        frontCover.addEventListener("keydown", function (e) {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (!isOpen) openWallet();
                else closeWallet();
            }
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener("click", closeWallet);
    }

    var topCloseBtn = document.getElementById("walletTopCloseBtn");
    if (topCloseBtn) {
        topCloseBtn.addEventListener("click", closeWallet);
    }

    window.addEventListener("pointerup", function () {
        isDragging = false;
    });
    window.addEventListener("pointercancel", function () {
        isDragging = false;
    });

    // Window resize handler to readjust fan spacing
    var resizeTimer = null;
    window.addEventListener("resize", function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            if (!isOpen && stage) stage.style.minHeight = "";
            positionCards(isOpen, isHover);
        }, 150);
    });

    window.WalletGallery = {
        init: function (items) {
            renderCards(items);
        },
        open: openWallet,
        close: closeWallet,
        patchThumbs: function (items) {
            if (!cardsWrap || !items || !items.length) return;
            var imgs = cardsWrap.querySelectorAll(".wallet-card-thumb");
            items.forEach(function (c, idx) {
                if (imgs[idx] && c.url && imgs[idx].getAttribute("src") !== c.url) {
                    imgs[idx].src = c.url;
                }
            });
        }
    };
    window.Carousel360 = window.WalletGallery; // Backward compatibility

    // Initial fallback data from Supabase credentials or verified certificates
    whenCms(function () {
        if (window.CMS && window.CMS.data && window.CMS.data.certificates && window.CMS.data.certificates.length) {
            window.WalletGallery.init(window.CMS.data.certificates);
        } else if (!certs.length) {
            var initialCerts = [
                {
                    id: "ac99baab-3753-4782-8022-3a47bcf44738",
                    title: "INTRO TO SOFTWARE ENGINEERING",
                    issuer: "REVOU",
                    year: 2026,
                    label: "INTRO TO SOFTWARE ENGINEERING (2026) - REVOU",
                    pdf: "https://nlwbznpksqwhaacshqbx.supabase.co/storage/v1/object/public/certificates/certs/1791292763252-83417.pdf",
                    url: ""
                },
                {
                    id: "1abbeb17-7d1d-4077-a3dd-844701b57e8f",
                    title: "Aptitude Test",
                    issuer: "Universitas Gunadarma",
                    year: 2026,
                    label: "Aptitude Test (2026) - Universitas Gunadarma",
                    pdf: "https://nlwbznpksqwhaacshqbx.supabase.co/storage/v1/object/public/certificates/certs/1791334658867-682283.pdf",
                    url: ""
                }
            ];
            renderCards(initialCerts);
        }
    });
})();

/* ─── REVEAL: munculkan elemen .reveal saat masuk viewport ─── */
(function () {
    var io = null;

    function initReveal() {
        var els = document.querySelectorAll(".reveal:not(.is-visible)");
        if (!els.length) return;

        if (!("IntersectionObserver" in window)) {
            els.forEach(function (el) { el.classList.add("is-visible"); });
            return;
        }

        if (!io) {
            io = new IntersectionObserver(function (entries) {
                entries.forEach(function (e) {
                    if (e.isIntersecting) {
                        e.target.classList.add("is-visible");
                        io.unobserve(e.target);
                    }
                });
            }, { threshold: 0.05, rootMargin: "0px 0px 50px 0px" });
        }

        els.forEach(function (el) {
            var rect = el.getBoundingClientRect();
            // If already inside or above current viewport, reveal immediately
            if (rect.top < window.innerHeight + 60 && rect.bottom > -60) {
                el.classList.add("is-visible");
            } else {
                io.observe(el);
            }
        });
    }

    window.refreshReveal = initReveal;
    initReveal();

    window.addEventListener("load", initReveal);
    window.addEventListener("siteLoaded", initReveal);
    var revealScrollTicking = false;
    window.addEventListener("scroll", function () {
        if (!revealScrollTicking) {
            revealScrollTicking = true;
            requestAnimationFrame(function () {
                initReveal();
                revealScrollTicking = false;
            });
        }
    }, { passive: true });
})();

/* ─── TEXT SCROLL CHARACTER ANIMATION (CharacterV1 Scroll-Driven Convergence) ─── */
(function () {
    var targets = [];
    var rafActive = false;

    function buildHeading(el, text) {
        var rawText = (text != null ? text : (el.getAttribute('data-raw-text') || el.textContent || '')).trim();
        if (!rawText) return null;

        // Clean extra whitespace
        rawText = rawText.replace(/\s+/g, ' ');
        el.setAttribute('data-raw-text', rawText);
        el.setAttribute('aria-label', rawText);

        var words = rawText.split(' ');
        var totalChars = rawText.length;
        var centerIndex = Math.floor(totalChars / 2);

        var html = '';
        var charCounter = 0;

        words.forEach(function (w, wIdx) {
            html += '<span class="t-scroll-word" aria-hidden="true">';
            var chars = w.split('');
            chars.forEach(function (c) {
                var dist = charCounter - centerIndex;
                var safeChar = c === '<' ? '&lt;' : (c === '>' ? '&gt;' : (c === '&' ? '&amp;' : c));
                html += '<span class="t-scroll-char" data-dist="' + dist + '">' + safeChar + '</span>';
                charCounter++;
            });
            html += '</span>';

            if (wIdx < words.length - 1) {
                var spaceDist = charCounter - centerIndex;
                html += '<span class="t-scroll-space" data-dist="' + spaceDist + '" aria-hidden="true">&nbsp;</span>';
                charCounter++;
            }
        });

        el.innerHTML = html;
        var charEls = Array.from(el.querySelectorAll('.t-scroll-char'));

        return {
            el: el,
            charEls: charEls,
            currentFactor: 1, // 1 = fully scattered, 0 = fully assembled
            targetFactor: 1
        };
    }

    function computeTargetFactor(el) {
        var rect = el.getBoundingClientRect();
        var vh = window.innerHeight;

        // When element is at or below bottom edge of viewport: factor = 1 (scattered)
        // When element reaches around 68% of viewport height: factor = 0 (solidly assembled)
        var enterY = vh;
        var settleY = vh * 0.68;

        if (rect.top >= enterY) {
            return 1;
        }
        if (rect.top <= settleY) {
            return 0;
        }

        var progress = (enterY - rect.top) / (enterY - settleY);
        return Math.max(0, Math.min(1, 1 - progress));
    }

    function update() {
        var isIdle = true;
        var winWidth = window.innerWidth;
        // Responsive spread: wider on desktop, compact on mobile to prevent overflow
        var spread = Math.min(26, Math.max(12, winWidth * 0.026));

        targets.forEach(function (item) {
            item.targetFactor = computeTargetFactor(item.el);

            var diff = item.targetFactor - item.currentFactor;
            if (Math.abs(diff) > 0.002) {
                item.currentFactor += diff * 0.16;
                isIdle = false;
            } else {
                item.currentFactor = item.targetFactor;
            }

            var f = item.currentFactor;

            item.charEls.forEach(function (charEl) {
                var dist = parseFloat(charEl.getAttribute('data-dist')) || 0;
                if (f <= 0.001) {
                    charEl.style.transform = '';
                    charEl.style.opacity = '';
                    charEl.style.filter = '';
                } else {
                    var x = (dist * spread * f).toFixed(2);
                    var rotX = (dist * 3.2 * f).toFixed(2);
                    var rotY = (-dist * 2.2 * f).toFixed(2);
                    var y = (Math.abs(dist) * 1.8 * f).toFixed(2);
                    var op = Math.max(0.12, (1 - f * 0.88)).toFixed(3);
                    var bl = (f * 1.5).toFixed(1);

                    charEl.style.transform =
                        'translate3d(' + x + 'px, ' + y + 'px, 0) rotateX(' + rotX + 'deg) rotateY(' + rotY + 'deg)';
                    charEl.style.opacity = op;
                    if (f > 0.08 && winWidth >= 768) {
                        charEl.style.filter = 'blur(' + bl + 'px)';
                    } else {
                        charEl.style.filter = '';
                    }
                }
            });
        });

        if (!isIdle) {
            requestAnimationFrame(update);
        } else {
            rafActive = false;
        }
    }

    function requestUpdate() {
        if (!rafActive) {
            rafActive = true;
            requestAnimationFrame(update);
        }
    }

    function init() {
        var headingEls = document.querySelectorAll('.text-scroll-heading');
        targets = [];
        headingEls.forEach(function (el) {
            var item = buildHeading(el);
            if (item) targets.push(item);
        });
        requestUpdate();
    }

    window.TextScrollAnimation = {
        init: init,
        refresh: init,
        update: function (el, newText) {
            if (!el) return;
            var item = buildHeading(el, newText);
            if (item) {
                var idx = -1;
                for (var i = 0; i < targets.length; i++) {
                    if (targets[i].el === el) { idx = i; break; }
                }
                if (idx !== -1) targets[idx] = item;
                else targets.push(item);
                requestUpdate();
            }
        }
    };

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate, { passive: true });
    window.addEventListener('siteLoaded', init);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

/* ─── TEXT BLOCK REVEALER ANIMATION (About Explanation) ─── */
(function () {
    var instances = [];

    function cleanString(str) {
        if (!str) return "";
        return String(str)
            .replace(/&amp;/g, "&")
            .replace(/amp;/g, "&")
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n");
    }

    function getLinesForParagraph(paraText, container) {
        var words = paraText.replace(/\s+/g, " ").trim().split(" ");
        if (!words.length || (words.length === 1 && !words[0])) return [];

        var measure = document.createElement("div");
        measure.style.cssText = "position: relative; width: 100%; visibility: hidden; pointer-events: none; margin: 0; padding: 0; font: inherit; line-height: inherit; letter-spacing: inherit; word-spacing: inherit; box-sizing: border-box;";

        var spans = [];
        words.forEach(function (w, idx) {
            var s = document.createElement("span");
            s.textContent = w;
            measure.appendChild(s);
            if (idx < words.length - 1) {
                measure.appendChild(document.createTextNode(" "));
            }
            spans.push(s);
        });

        container.appendChild(measure);

        var lines = [];
        var currentWords = [];
        var lastTop = null;

        spans.forEach(function (span) {
            var rect = span.getBoundingClientRect();
            var top = Math.round(rect.top);
            if (lastTop !== null && Math.abs(top - lastTop) > 4) {
                if (currentWords.length) {
                    lines.push(currentWords.join(" "));
                    currentWords = [];
                }
            }
            currentWords.push(span.textContent);
            lastTop = top;
        });

        if (currentWords.length) {
            lines.push(currentWords.join(" "));
        }

        container.removeChild(measure);

        // Widow/orphan prevention: avoid single-word lines at the end of a paragraph
        if (lines.length > 1) {
            var lastLineWords = lines[lines.length - 1].split(" ");
            if (lastLineWords.length === 1) {
                var prevLineWords = lines[lines.length - 2].split(" ");
                if (prevLineWords.length > 3) {
                    var stolenWord = prevLineWords.pop();
                    lines[lines.length - 2] = prevLineWords.join(" ");
                    lines[lines.length - 1] = stolenWord + " " + lastLineWords[0];
                }
            }
        }

        return lines;
    }

    function setupElement(container, overrideText) {
        var raw = overrideText;
        if (typeof raw !== "string" || !raw) {
            raw = container.getAttribute("data-raw-text");
        }
        if (!raw) {
            raw = container.textContent.trim();
        }
        raw = cleanString(raw);
        container.setAttribute("data-raw-text", raw);

        // Split by paragraphs (double newlines or lines)
        var rawParas = raw.split(/\n\s*\n/).map(function (p) {
            return p.trim();
        }).filter(Boolean);

        if (!rawParas.length) {
            rawParas = [raw];
        }

        container.innerHTML = "";
        var blockColor = container.getAttribute("data-block-color") || "var(--primary, #0066cc)";
        var allLineWrappers = [];

        rawParas.forEach(function (paraText) {
            var paraDiv = document.createElement("div");
            paraDiv.className = "text-block-para";

            var lines = getLinesForParagraph(paraText, container);
            if (!lines.length) return;

            lines.forEach(function (lineStr) {
                var wrapper = document.createElement("div");
                wrapper.className = "text-block-line-wrapper";

                var textNode = document.createElement("span");
                textNode.className = "text-block-line-text";
                textNode.textContent = lineStr;

                var bar = document.createElement("span");
                bar.className = "text-block-revealer-bar";
                if (blockColor) {
                    bar.style.backgroundColor = blockColor;
                }

                wrapper.appendChild(textNode);
                wrapper.appendChild(bar);
                paraDiv.appendChild(wrapper);
                allLineWrappers.push(wrapper);
            });

            container.appendChild(paraDiv);
        });

        // Find existing instance or create new
        var existing = instances.filter(function (it) {
            return it.container === container;
        })[0];

        if (existing) {
            existing.timers.forEach(function (t) { clearTimeout(t); });
            existing.timers = [];
            existing.lineWrappers = allLineWrappers;
            existing.hasPlayed = false;
            return existing;
        }

        var newInst = {
            container: container,
            lineWrappers: allLineWrappers,
            hasPlayed: false,
            timers: []
        };
        instances.push(newInst);
        return newInst;
    }

    function playInstance(inst, force) {
        if (!inst || !inst.lineWrappers.length) return;
        if (inst.hasPlayed && !force) return;
        inst.hasPlayed = true;

        inst.timers.forEach(function (t) { clearTimeout(t); });
        inst.timers = [];

        var container = inst.container;
        var dur = parseFloat(container.getAttribute("data-block-duration")) || 0.52;
        var stagger = parseFloat(container.getAttribute("data-block-stagger")) || 0.06;
        var baseDelay = parseFloat(container.getAttribute("data-block-delay")) || 0.08;

        inst.lineWrappers.forEach(function (wrapper, idx) {
            var text = wrapper.querySelector(".text-block-line-text");
            var bar = wrapper.querySelector(".text-block-revealer-bar");
            if (!text || !bar) return;

            // Reset initial state
            text.style.opacity = "0";
            bar.style.transition = "none";
            bar.style.transformOrigin = "left center";
            bar.style.transform = "scaleX(0)";

            void bar.offsetWidth; // Force layout

            var lineDelay = baseDelay + (idx * stagger);

            var t1 = setTimeout(function () {
                // Step A: Sweep block across (scaleX: 0 -> 1)
                bar.style.transition = "transform " + (dur * 0.46) + "s cubic-bezier(0.77, 0, 0.175, 1)";
                bar.style.transformOrigin = "left center";
                bar.style.transform = "scaleX(1)";

                // Step B: Reveal text halfway through & Step C: Collapse block to right
                var t2 = setTimeout(function () {
                    text.style.opacity = "1";
                    bar.style.transformOrigin = "right center";
                    bar.style.transform = "scaleX(0)";
                }, (dur * 0.40) * 1000);
                inst.timers.push(t2);
            }, lineDelay * 1000);
            inst.timers.push(t1);
        });
    }

    function initAll() {
        var targets = document.querySelectorAll(".text-block-target");
        targets.forEach(function (el) {
            setupElement(el);
        });
    }

    // Observer setup
    var observer = null;
    function setupObserver() {
        if (!("IntersectionObserver" in window)) {
            instances.forEach(function (inst) { playInstance(inst); });
            return;
        }

        if (observer) {
            observer.disconnect();
        }

        observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                var match = instances.filter(function (inst) {
                    return inst.container === entry.target;
                })[0];
                if (!match) return;

                if (entry.isIntersecting) {
                    playInstance(match);
                }
            });
        }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });

        instances.forEach(function (inst) {
            observer.observe(inst.container);
        });
    }

    whenCms(function () {
        initAll();
        setupObserver();

        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(function () {
                initAll();
                setupObserver();
            });
        }

        window.addEventListener("siteLoaded", function () {
            initAll();
            setupObserver();
        });

        // Window resize debouncer
        var lastWidth = window.innerWidth;
        var resizeTimer = null;
        window.addEventListener("resize", function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function () {
                if (Math.abs(window.innerWidth - lastWidth) > 25) {
                    lastWidth = window.innerWidth;
                    initAll();
                    setupObserver();
                }
            }, 250);
        });
    });

    window.TextBlockAnimation = {
        init: function () {
            initAll();
            setupObserver();
        },
        update: function (container, newText) {
            if (!container) return;
            var inst = setupElement(container, newText);
            setupObserver();
            var rect = container.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                playInstance(inst, true);
            }
        },
        playAll: function () {
            instances.forEach(function (inst) { playInstance(inst, true); });
        }
    };
})();

/* ───────── CLOUD WATCH CONTACT CONTROLLER ───────── */
(function () {
    var cloud = document.getElementById("cloudCharacter");
    var cloudBody = document.getElementById("cloudBody");
    var pupilLeft = document.getElementById("cloudPupilLeft");
    var pupilRight = document.getElementById("cloudPupilRight");
    var form = document.getElementById("contactForm");
    var statusEl = document.getElementById("formStatus");

    if (!cloud || !pupilLeft || !pupilRight) return;

    var isTyping = false;
    var isFocused = false;
    var currentX = 0;
    var currentY = 0;
    var currentTiltX = 0;
    var currentTiltY = 0;
    var targetX = 0;
    var targetY = 0;
    var targetTiltX = 0;
    var targetTiltY = 0;
    var animFrame = null;
    var inView = true;

    function kickEyes() {
        if (!animFrame && inView) {
            animFrame = requestAnimationFrame(updateEyes);
        }
    }

    // Fast, responsive lerp rendering for snappy eye & tilt movements (idle-aware)
    function updateEyes() {
        var dx = targetX - currentX;
        var dy = targetY - currentY;
        var dtx = targetTiltX - currentTiltX;
        var dty = targetTiltY - currentTiltY;

        var moving = Math.abs(dx) > 0.04 || Math.abs(dy) > 0.04 || Math.abs(dtx) > 0.04 || Math.abs(dty) > 0.04;

        if (moving) {
            currentX += dx * 0.48;
            currentY += dy * 0.48;
            currentTiltX += dtx * 0.32;
            currentTiltY += dty * 0.32;
        } else {
            currentX = targetX;
            currentY = targetY;
            currentTiltX = targetTiltX;
            currentTiltY = targetTiltY;
        }

        var pupilTransform = "translate(" + currentX.toFixed(2) + "px, " + currentY.toFixed(2) + "px)";
        pupilLeft.style.transform = pupilTransform;
        pupilRight.style.transform = pupilTransform;

        if (cloudBody && !isTyping) {
            cloudBody.style.transform = "perspective(600px) rotateY(" + currentTiltY.toFixed(2) + "deg) rotateX(" + currentTiltX.toFixed(2) + "deg)";
        }

        if (moving && inView) {
            animFrame = requestAnimationFrame(updateEyes);
        } else {
            animFrame = null;
        }
    }
    kickEyes();

    // Pause RAF when contact section is not in viewport
    if ("IntersectionObserver" in window) {
        var contactSec = document.getElementById("contact");
        if (contactSec) {
            var contactObserver = new IntersectionObserver(function (entries) {
                inView = entries[0].isIntersecting;
                if (inView) kickEyes();
            }, { threshold: 0.05 });
            contactObserver.observe(contactSec);
        }
    }

    // Mouse / Pointer Move
    function handlePointerMove(clientX, clientY) {
        if (isFocused || isTyping) return;

        var rect = cloud.getBoundingClientRect();
        var centerX = rect.left + rect.width / 2;
        var centerY = rect.top + rect.height / 2;

        var normX = (clientX - centerX) / (window.innerWidth / 2);
        var normY = (clientY - centerY) / (window.innerHeight / 2);

        normX = Math.max(-1, Math.min(1, normX));
        normY = Math.max(-1, Math.min(1, normY));

        targetX = normX * 8;
        targetY = normY > 0 ? normY * 4.5 : normY * 7;
        targetTiltY = normX * 9;
        targetTiltX = -normY * 6;
        kickEyes();
    }

    window.addEventListener("mousemove", function (e) {
        handlePointerMove(e.clientX, e.clientY);
    }, { passive: true });

    window.addEventListener("touchmove", function (e) {
        if (e.touches && e.touches[0]) {
            handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
        }
    }, { passive: true });

    // Periodic blinking every ~3-4.5s
    function scheduleBlink() {
        var delay = 2600 + Math.random() * 1800;
        setTimeout(function () {
            if (!inView) {
                scheduleBlink();
                return;
            }
            if (!isTyping && !cloud.classList.contains("is-happy")) {
                cloud.classList.add("is-blinking");
                setTimeout(function () {
                    cloud.classList.remove("is-blinking");
                    scheduleBlink();
                }, 190);
            } else {
                scheduleBlink();
            }
        }, delay);
    }
    scheduleBlink();

    // Click cloud directly for a cute playful wink
    cloud.addEventListener("click", function () {
        cloud.classList.add("is-happy");
        setTimeout(function () {
            cloud.classList.remove("is-happy");
        }, 800);
    });

    // Form inputs interaction
    if (form) {
        var inputs = form.querySelectorAll("input, textarea");
        var typingTimer = null;

        inputs.forEach(function (input) {
            // When focusing on input: look down towards the form
            input.addEventListener("focus", function () {
                isFocused = true;
                targetX = 0;
                targetY = 5.5; // looking down at inputs
                targetTiltX = 4;
                targetTiltY = 0;
                kickEyes();
            });

            // While typing: playful reaction
            input.addEventListener("input", function () {
                isTyping = true;
                cloud.classList.add("is-typing");
                kickEyes();
                clearTimeout(typingTimer);
                typingTimer = setTimeout(function () {
                    isTyping = false;
                    cloud.classList.remove("is-typing");
                    if (isFocused) {
                        targetX = 0;
                        targetY = 5.5;
                        kickEyes();
                    }
                }, 500);
            });

            input.addEventListener("blur", function () {
                isFocused = false;
                isTyping = false;
                cloud.classList.remove("is-typing");
                targetX = 0;
                targetY = 0;
                targetTiltX = 0;
                targetTiltY = 0;
                kickEyes();
            });
        });

        // Submit handler
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            var btn = document.getElementById("contactSubmitBtn");
            if (btn) btn.disabled = true;

            // Cloud celebrates!
            cloud.classList.add("is-happy");

            if (statusEl) {
                statusEl.textContent = "Sending message...";
                statusEl.className = "form-status";
            }

            setTimeout(function () {
                if (statusEl) {
                    statusEl.textContent = "✓ Thank you! Your message has been sent.";
                    statusEl.className = "form-status is-success";
                }
                form.reset();
                if (btn) btn.disabled = false;

                setTimeout(function () {
                    cloud.classList.remove("is-happy");
                }, 1800);

                setTimeout(function () {
                    if (statusEl) {
                        statusEl.textContent = "";
                        statusEl.className = "form-status";
                    }
                }, 5000);
            }, 800);
        });
    }
})();

/* ───────── EDUCATION 3D FAN DECK (Interactive Stack & Swap) ───────── */
(function () {
    function initEduDeck() {
        var stage = document.getElementById('eduDeckStage');
        if (!stage) return;

        var cards = Array.from(stage.querySelectorAll('.edu-stacked-card'));
        if (!cards.length) return;

        if (cards.length <= 2) {
            stage.classList.add('is-duo');
            return;
        } else {
            stage.classList.remove('is-duo');
        }

        var activeIdx = 0;
        cards.forEach(function (c, i) {
            if (c.classList.contains('edu-pos-center')) activeIdx = i;
        });

        function applyPositions() {
            cards.forEach(function (card) {
                card.classList.remove('edu-pos-left', 'edu-pos-center', 'edu-pos-right');
            });

            if (cards.length === 1) {
                cards[0].classList.add('edu-pos-center');
            } else if (cards.length === 2) {
                cards[activeIdx].classList.add('edu-pos-center');
                var otherIdx = activeIdx === 0 ? 1 : 0;
                cards[otherIdx].classList.add('edu-pos-right');
            } else {
                cards[activeIdx].classList.add('edu-pos-center');
                var prevIdx = (activeIdx - 1 + cards.length) % cards.length;
                var nextIdx = (activeIdx + 1) % cards.length;
                cards[prevIdx].classList.add('edu-pos-left');
                cards[nextIdx].classList.add('edu-pos-right');
            }

            // Update dot indicators
            var dots = stage.querySelectorAll('.edu-deck-dot');
            dots.forEach(function (dot, i) {
                dot.classList.toggle('is-active', activeIdx === i);
            });
        }

        // Click to swap into center
        cards.forEach(function (card, cardIdx) {
            card.onclick = function () {
                if (activeIdx === cardIdx) return;
                activeIdx = cardIdx;
                applyPositions();
            };

            card.onkeydown = function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    card.click();
                }
            };
        });

        // Dot navigation buttons
        var dots = stage.querySelectorAll('.edu-deck-dot');
        dots.forEach(function (dot, dotIdx) {
            dot.onclick = function () {
                var targetIdx = parseInt(dot.getAttribute('data-target-idx'), 10);
                if (isNaN(targetIdx)) targetIdx = dotIdx;
                if (activeIdx === targetIdx) return;
                activeIdx = targetIdx;
                applyPositions();
            };
        });

        applyPositions();

        // 3D Spring Mousemove Tilt on Cards
        var isCoarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
        if (!isCoarse) {
            cards.forEach(function (card) {
                var tiltInner = card.querySelector('.edu-card-tilt-inner');
                if (!tiltInner) return;

                var targetRotX = 0, targetRotY = 0;
                var currentRotX = 0, currentRotY = 0;
                var isHovered = false;
                var rafId = null;

                function animateTilt() {
                    var ease = isHovered ? 0.16 : 0.10;
                    currentRotX += (targetRotX - currentRotX) * ease;
                    currentRotY += (targetRotY - currentRotY) * ease;

                    var diff = Math.abs(targetRotX - currentRotX) + Math.abs(targetRotY - currentRotY);

                    if (isHovered || diff > 0.04) {
                        tiltInner.style.transform =
                            'rotateX(' + currentRotX.toFixed(2) + 'deg) rotateY(' + currentRotY.toFixed(2) + 'deg)';
                        rafId = requestAnimationFrame(animateTilt);
                    } else {
                        currentRotX = 0;
                        currentRotY = 0;
                        targetRotX = 0;
                        targetRotY = 0;
                        tiltInner.style.transform = '';
                        rafId = null;
                    }
                }

                card.addEventListener('mousemove', function (e) {
                    var rect = card.getBoundingClientRect();
                    var cx = rect.left + rect.width / 2;
                    var cy = rect.top + rect.height / 2;
                    var dx = (e.clientX - cx) / (rect.width / 2);
                    var dy = (e.clientY - cy) / (rect.height / 2);

                    dx = Math.max(-1, Math.min(1, dx));
                    dy = Math.max(-1, Math.min(1, dy));

                    targetRotX = -dy * 10;
                    targetRotY = dx * 10;

                    if (!rafId) rafId = requestAnimationFrame(animateTilt);
                }, { passive: true });

                card.addEventListener('mouseenter', function () {
                    isHovered = true;
                });

                card.addEventListener('mouseleave', function () {
                    isHovered = false;
                    targetRotX = 0;
                    targetRotY = 0;
                    if (!rafId) rafId = requestAnimationFrame(animateTilt);
                });
            });
        }

        applyPositions();
    }

    window.initEduDeck = initEduDeck;

    // ───────── 3D GLASS CARD INTERACTION (Specular Glass Highlight) ─────────
    function initGlassCardTilt() {
        var cards = document.querySelectorAll('.glass-card');
        if (!cards.length) return;

        cards.forEach(function (card) {
            if (card.__tiltInitialized) return;
            card.__tiltInitialized = true;

            var inner = card.querySelector('.glass-card__inner');
            if (inner) {
                // Remove any inline transform so pure CSS 3D rotate3d transition runs flawlessly
                inner.style.transform = '';
            }

            var glareRaf = null;
            function onMouseMove(e) {
                if (glareRaf) return;
                var clientX = e.clientX;
                var clientY = e.clientY;
                glareRaf = requestAnimationFrame(function () {
                    glareRaf = null;
                    var rect = card.getBoundingClientRect();
                    var glareX = ((clientX - rect.left) / rect.width * 100).toFixed(1);
                    var glareY = ((clientY - rect.top) / rect.height * 100).toFixed(1);
                    card.style.setProperty('--glare-x', glareX + '%');
                    card.style.setProperty('--glare-y', glareY + '%');
                });
            }

            card.addEventListener('mousemove', onMouseMove, { passive: true });
        });
    }

    window.initGlassCardTilt = initGlassCardTilt;

    function initAllTilts() {
        if (window.initEduDeck) window.initEduDeck();
        if (window.initGlassCardTilt) window.initGlassCardTilt();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAllTilts);
    } else {
        initAllTilts();
    }
})();