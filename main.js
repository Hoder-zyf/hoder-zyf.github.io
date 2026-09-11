/* ============================================================
   Yifei Zhang — Personal Homepage
   Shared logic for index.html and publications.html
   Every feature guards on element existence so one file can
   serve both pages safely.
   ============================================================ */

/* ---------- Theme toggle ---------- */
(function initThemeToggle() {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    function updateState() {
        const dark = document.documentElement.getAttribute('data-theme') === 'dark';
        btn.setAttribute('aria-pressed', String(dark));
        btn.title = dark ? 'Switch to light mode' : 'Switch to dark mode';
    }
    btn.addEventListener('click', function () {
        const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', current);
        try {
            localStorage.setItem('theme', current);
        } catch (e) { /* private mode etc. */ }
        updateState();
    });
    updateState();
    btn.hidden = false;
})();

/* ---------- Keep anchor headings below the sticky header ---------- */
(function initHeaderOffset() {
    const header = document.querySelector('.topbar');
    if (!header) return;
    function update() {
        document.documentElement.style.setProperty('--header-height', header.getBoundingClientRect().height + 'px');
    }
    update();
    if ('ResizeObserver' in window) {
        new ResizeObserver(update).observe(header);
    } else {
        window.addEventListener('resize', update, { passive: true });
        if (document.fonts) document.fonts.ready.then(update);
    }
})();

/* ---------- News pagination (index) ---------- */
(function initNewsPagination() {
    const newsList = document.getElementById('news-list');
    const pagination = document.querySelector('.pagination');
    if (!newsList || !pagination) return;

    const items = Array.from(newsList.querySelectorAll('.news-item'));
    if (!items.length) return;

    const newsPerPage = 5;
    let currentPage = 1;

    function showPage(page) {
        const totalPages = Math.ceil(items.length / newsPerPage);
        const start = (page - 1) * newsPerPage;
        items.forEach((item, i) => { item.hidden = i < start || i >= start + newsPerPage; });

        const cur = document.getElementById('current-page');
        const total = document.getElementById('total-pages');
        const prev = document.getElementById('prev-btn');
        const next = document.getElementById('next-btn');
        if (cur) cur.textContent = page;
        if (total) total.textContent = totalPages;
        if (prev) prev.disabled = (page === 1);
        if (next) next.disabled = (page === totalPages);
    }

    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    if (prevBtn) {
        prevBtn.addEventListener('click', function () {
            if (currentPage > 1) showPage(--currentPage);
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', function () {
            const totalPages = Math.ceil(items.length / newsPerPage);
            if (currentPage < totalPages) showPage(++currentPage);
        });
    }

    showPage(1);
    pagination.hidden = items.length <= newsPerPage;
})();

/* ---------- WeChat modal (index) ---------- */
(function initWechatModal() {
    const link = document.getElementById('wechat-link');
    const modal = document.getElementById('wechat-modal');
    // Unsupported browsers and disabled JS can still open the QR image directly.
    if (!link || !modal || typeof modal.showModal !== 'function') return;
    let previousFocus;
    let previousOverflow;
    link.setAttribute('aria-haspopup', 'dialog');

    function open(e) {
        if (e) e.preventDefault();
        previousFocus = document.activeElement;
        previousOverflow = document.body.style.overflow;
        modal.showModal();
        document.body.style.overflow = 'hidden';
    }

    function close(e) {
        if (e) e.preventDefault();
        modal.close();
    }

    link.addEventListener('click', open);
    modal.addEventListener('click', function (e) {
        if (e.target !== modal) return;
        const rect = modal.getBoundingClientRect();
        if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) close();
    });
    modal.addEventListener('close', function () {
        document.body.style.overflow = previousOverflow;
        if (previousFocus && previousFocus.isConnected) previousFocus.focus({ preventScroll: true });
    });

    const closeBtn = modal.querySelector('.wechat-close');
    if (closeBtn) closeBtn.addEventListener('click', close);
})();

/* ---------- GitHub stars ---------- */
(function initGitHubStars() {
    const starElements = document.querySelectorAll('.github-stars');
    if (!starElements.length) return;
    const requests = new Map();
    const cacheLifetime = 60 * 60 * 1000;

    function format(count) {
        return count >= 1000 ? (count / 1000).toFixed(1) + 'k' : String(count);
    }

    async function getCount(repo) {
        const cacheKey = 'github-stars:v1:' + repo;
        try {
            const cached = JSON.parse(localStorage.getItem(cacheKey));
            if (cached && Number.isInteger(cached.count) && cached.count >= 0 &&
                Number.isFinite(cached.time) && cached.time <= Date.now() && Date.now() - cached.time < cacheLifetime) {
                return cached.count;
            }
        } catch (e) { /* Storage may be unavailable or contain invalid data. */ }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        try {
            const res = await fetch('https://api.github.com/repos/' + repo, { signal: controller.signal });
            if (!res.ok) throw new Error('GitHub count unavailable');
            const data = await res.json();
            const count = data.stargazers_count;
            if (!Number.isInteger(count) || count < 0) throw new Error('Invalid GitHub count');
            try {
                localStorage.setItem(cacheKey, JSON.stringify({ count: count, time: Date.now() }));
            } catch (e) { /* The current page can still use the result. */ }
            return count;
        } finally {
            clearTimeout(timeout);
        }
    }

    starElements.forEach(async function (el) {
        const repo = el.getAttribute('data-repo');
        if (!repo) return;
        try {
            if (!requests.has(repo)) requests.set(repo, getCount(repo));
            const count = await requests.get(repo);
            const span = el.querySelector('.star-count');
            if (span) {
                span.textContent = format(count);
                el.title = count.toLocaleString() + ' GitHub stars';
                el.hidden = false;
            }
        } catch (e) { el.hidden = true; /* Keep the repository link usable. */ }
    });
})();

/* ---------- Publication filter (publications) ---------- */
(function initPubFilter() {
    const tags = document.querySelectorAll('.filter-tag');
    if (!tags.length) return;
    const cards = document.querySelectorAll('.publication-card');
    const status = document.getElementById('filter-status');

    tags.forEach(function (tag) {
        tag.addEventListener('click', function () {
            tags.forEach(function (t) {
                t.classList.toggle('active', t === tag);
                t.setAttribute('aria-pressed', String(t === tag));
            });

            const filter = tag.getAttribute('data-filter');
            cards.forEach(function (card) {
                const cardTags = card.getAttribute('data-tags') || '';
                const show = filter === 'all' || cardTags.split(/\s+/).indexOf(filter) !== -1;
                card.hidden = !show;
            });

            // Hide year sections that end up with no visible cards
            document.querySelectorAll('.year-section').forEach(function (section) {
                const anyVisible = section.querySelector('.publication-card:not([hidden])') !== null;
                section.hidden = !anyVisible;
            });
            if (status) {
                const count = Array.from(cards).filter(card => !card.hidden).length;
                status.textContent = 'Showing ' + count + ' publications';
            }
        });
    });
    document.querySelector('.filter-tags').hidden = false;
})();

/* ---------- Back to top ---------- */
(function initBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;
    btn.hidden = false;

    window.addEventListener('scroll', function () {
        btn.classList.toggle('show', window.pageYOffset > 300);
    }, { passive: true });

    btn.addEventListener('click', function () {
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({ top: 0, behavior: reduced ? 'instant' : 'smooth' });
        const main = document.querySelector('main');
        if (main) main.focus({ preventScroll: true });
    });
})();

/* ---------- Footer year ---------- */
(function initFooterYear() {
    const el = document.getElementById('year');
    if (el) el.textContent = new Date().getFullYear();
})();

/* ---------- Scroll reveal ---------- */
(function initReveal() {
    const items = document.querySelectorAll('.reveal');
    if (!items.length) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.06 });

    items.forEach(el => observer.observe(el));
})();

/* ---------- Include abstracts when printing, preserving screen state ---------- */
(function initPrint() {
    let openedForPrint = [];
    window.addEventListener('beforeprint', function () {
        document.querySelectorAll('.abstract-details:not([open])').forEach(function (details) {
            openedForPrint.push(details);
            details.open = true;
        });
    });
    window.addEventListener('afterprint', function () {
        openedForPrint.forEach(details => { details.open = false; });
        openedForPrint = [];
    });
})();
