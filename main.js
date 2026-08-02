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
    btn.addEventListener('click', function () {
        const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', current);
        try {
            localStorage.setItem('theme', current);
        } catch (e) { /* private mode etc. */ }
    });
})();

/* ---------- News pagination (index) ---------- */
(function initNewsPagination() {
    const newsList = document.getElementById('news-list');
    if (!newsList) return;

    const newsPerPage = 5;
    let currentPage = 1;

    function showPage(page) {
        const items = newsList.querySelectorAll('.news-item');
        const totalPages = Math.ceil(items.length / newsPerPage);

        items.forEach(item => item.classList.remove('active'));
        const start = (page - 1) * newsPerPage;
        for (let i = start; i < start + newsPerPage && i < items.length; i++) {
            items[i].classList.add('active');
        }

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
            const totalPages = Math.ceil(newsList.querySelectorAll('.news-item').length / newsPerPage);
            if (currentPage < totalPages) showPage(++currentPage);
        });
    }

    showPage(1);
})();

/* ---------- WeChat modal (index) ---------- */
(function initWechatModal() {
    const link = document.getElementById('wechat-link');
    const modal = document.getElementById('wechat-modal');
    if (!link || !modal) return;

    function open(e) {
        if (e) e.preventDefault();
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function close(e) {
        if (e) e.preventDefault();
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    link.addEventListener('click', open);
    modal.addEventListener('click', close);

    const content = modal.querySelector('.wechat-content');
    if (content) {
        content.addEventListener('click', function (e) {
            e.stopPropagation();
        });
    }

    const closeBtn = modal.querySelector('.wechat-close');
    if (closeBtn) closeBtn.addEventListener('click', close);

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') close();
    });
})();

/* ---------- Abstract toggle (publications, called via inline onclick) ---------- */
function toggleAbstract(id) {
    const abstract = document.getElementById(id);
    if (!abstract) return;
    const hidden = window.getComputedStyle(abstract).display === 'none';
    abstract.style.display = hidden ? 'block' : 'none';
}

/* ---------- GitHub stars ---------- */
(function initGitHubStars() {
    const starElements = document.querySelectorAll('.github-stars');
    if (!starElements.length) return;

    function format(count) {
        return count >= 1000 ? (count / 1000).toFixed(1) + 'k' : String(count);
    }

    starElements.forEach(async function (el) {
        const repo = el.getAttribute('data-repo');
        if (!repo) return;
        try {
            const res = await fetch('https://api.github.com/repos/' + repo);
            if (!res.ok) return;
            const data = await res.json();
            const span = el.querySelector('.star-count');
            if (span && typeof data.stargazers_count === 'number') {
                span.textContent = format(data.stargazers_count);
            }
        } catch (e) { /* offline / rate limited — leave placeholder */ }
    });
})();

/* ---------- Publication filter (publications) ---------- */
(function initPubFilter() {
    const tags = document.querySelectorAll('.filter-tag');
    if (!tags.length) return;
    const cards = document.querySelectorAll('.publication-card');

    tags.forEach(function (tag) {
        tag.addEventListener('click', function () {
            tags.forEach(t => t.classList.remove('active'));
            tag.classList.add('active');

            const filter = tag.getAttribute('data-filter');
            cards.forEach(function (card) {
                const cardTags = card.getAttribute('data-tags') || '';
                const show = filter === 'all' || cardTags.split(/\s+/).indexOf(filter) !== -1;
                card.classList.toggle('hidden', !show);
            });

            // Hide year sections that end up with no visible cards
            document.querySelectorAll('.year-section').forEach(function (section) {
                const anyVisible = section.querySelector('.publication-card:not(.hidden)') !== null;
                section.style.display = anyVisible ? '' : 'none';
            });
        });
    });
})();

/* ---------- Back to top ---------- */
(function initBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;

    window.addEventListener('scroll', function () {
        btn.classList.toggle('show', window.pageYOffset > 300);
    }, { passive: true });

    btn.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
    if (reduced || !('IntersectionObserver' in window)) {
        items.forEach(el => el.classList.add('visible'));
        return;
    }

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
