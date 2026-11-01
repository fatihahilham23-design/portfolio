/* ─── NAVBAR: glass pill + glowbar liquid hover (clean) ─── */
(function() {
    var ICONS = {
        home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>',
        about: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-3.5 3.6-5 8-5s8 1.5 8 5"/>',
        projects: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
        skills: '<path d="M12 3 3 8l9 5 9-5Z"/><path d="m3 13 9 5 9-5"/>',
        education: '<path d="M22 10 12 5 2 10l10 5Z"/><path d="M6 12v4c0 1.5 2.7 3 6 3s6-1.5 6-3v-4"/>',
        certificates: '<circle cx="12" cy="9" r="6"/><path d="M8.5 14 7 22l5-3 5 3-1.5-8"/>',
        contact: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/>'
    };

    var items = [
        { name: "Home", url: "#home", icon: "home" },
        { name: "About", url: "#about", icon: "about" },
        { name: "Projects", url: "#projects", icon: "projects" },
        { name: "Skills", url: "#skills", icon: "skills" },
        { name: "Education", url: "#education", icon: "education" },
        { name: "Certificates", url: "#certificates", icon: "certificates" },
        { name: "Contact", url: "#contact", icon: "contact" }
    ];

    var pill = document.getElementById("animePill");
    if (!pill) return;

    var els = [];

    function svg(path) {
        return '<svg class="anime-nav__icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + path + '</svg>';
    }

    function setActive(name) {
        els.forEach(function(it) {
            var on = it.name === name;
            it.el.classList.toggle("is-active", on);
            if (on) it.el.setAttribute("aria-current", "page");
            else it.el.removeAttribute("aria-current");
        });
    }

    items.forEach(function(item) {
        var a = document.createElement("a");
        a.className = "anime-nav__item" + (item.name === "Home" ? " is-active" : "");
        a.href = item.url;
        a.setAttribute("role", "menuitem");
        a.innerHTML = svg(ICONS[item.icon]) +
            '<span class="anime-nav__label">' + item.name + '</span>';
        a.addEventListener("click", function() { setActive(item.name); });
        pill.appendChild(a);
        els.push({ name: item.name, el: a });
    });

    // ── Glowbar: indicator glass meluncur ke item yang di-hover ──
    var glowbar = document.createElement("span");
    glowbar.className = "anime-nav__glowbar";
    glowbar.setAttribute("aria-hidden", "true");
    pill.insertBefore(glowbar, pill.firstChild);

    function showGlowbar(el) {
        if (!el) return;
        glowbar.style.width = el.offsetWidth + "px";
        glowbar.style.transform = "translateX(" + el.offsetLeft + "px)";
        glowbar.classList.add("is-visible");
    }
    function syncGlowbar() {
        var cur = pill.querySelector(".anime-nav__item.is-active");
        if (cur) showGlowbar(cur);
    }

    els.forEach(function(it) {
        it.el.addEventListener("mouseenter", function() {
            if (it.el.classList.contains("is-active")) return;
            showGlowbar(it.el);
        });
        it.el.addEventListener("mouseleave", function() {
            if (it.el.classList.contains("is-active")) return;
            syncGlowbar();
        });
    });
    pill.addEventListener("mouseleave", syncGlowbar);

    // Sinkronisasi dari scroll-spy (script.js langsung toggle .is-active)
    new MutationObserver(function(mutations) {
        mutations.forEach(function(m) {
            if (m.type === "attributes" && m.attributeName === "class") {
                var t = m.target;
                if (t.classList && t.classList.contains("is-active")) {
                    showGlowbar(t);
                }
            }
        });
    }).observe(pill, { subtree: true, attributeFilter: ["class"] });

    window.AnimeNavBar = { setActive: setActive };
    setActive("Home");
    syncGlowbar();
})();