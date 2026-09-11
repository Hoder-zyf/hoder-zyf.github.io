// Browser regressions for the static site. No production build or API credentials needed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium, firefox, webkit } = require('playwright');
const browserType = { chromium, firefox, webkit }[process.env.HOMEPAGE_BROWSER || 'chromium'];

const root = path.resolve(__dirname, '..');
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.pdf': 'application/pdf' };
const server = http.createServer((req, res) => {
    const file = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
        res.writeHead(404).end();
        return;
    }
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    fs.createReadStream(file).pipe(res);
});

(async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const base = 'http://127.0.0.1:' + server.address().port;
    assert.ok(browserType, 'HOMEPAGE_BROWSER must be chromium, firefox, or webkit');
    const browser = await browserType.launch();
    const pageErrors = [];
    const localFailures = [];
    const requests = [];
    try {
        const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
        await context.route('https://api.github.com/**', route => {
            requests.push(route.request().url());
            return route.fulfill({ json: { stargazers_count: 1234 } });
        });
        const page = await context.newPage();
        page.on('pageerror', e => pageErrors.push(e.message));
        page.on('response', r => { if (r.url().startsWith(base) && r.status() >= 400) localFailures.push(r.url()); });
        const externalAssets = [];
        page.on('request', r => {
            if (!r.url().startsWith(base) && !r.url().startsWith('https://api.github.com/')) externalAssets.push(r.url());
        });

        for (const file of ['index.html', 'publications.html']) {
            await page.goto(base + '/' + file, { waitUntil: 'networkidle' });
            await page.evaluate(() => document.fonts.ready);
            for (const width of [320, 375, 480, 600, 768, 769, 1280]) {
                await page.setViewportSize({ width, height: 900 });
                assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), file + ' overflows at ' + width);
            }
            await page.setViewportSize({ width: 1280, height: 900 });
            for (const theme of ['light', 'dark']) {
                await page.evaluate(t => { document.documentElement.dataset.theme = t; }, theme);
                await page.waitForTimeout(600);
                await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
                const violations = await page.evaluate(async () => (await axe.run(document, {
                    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] }
                })).violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })));
                assert.deepEqual(violations, [], file + ' / ' + theme + ': ' + JSON.stringify(violations));
            }
        }
        assert.deepEqual(externalAssets, [], 'Fonts and icons should work without external CDNs');
        assert.equal(requests.filter(u => u.endsWith('/microsoft/RD-Agent')).length, 1, 'Deduplicate and reuse the cached repository count');
        const requestCount = requests.length;
        await page.reload({ waitUntil: 'networkidle' });
        assert.equal(requests.length, requestCount, 'A reload should reuse fresh star counts');
        assert.equal(await page.locator('.github-stars:visible').count(), 7);

        await page.locator('[data-filter="finance"]').focus();
        await page.keyboard.press('Enter');
        assert.equal(await page.locator('.publication-card:visible').count(), 3);
        assert.equal(await page.locator('[data-filter="finance"]').getAttribute('aria-pressed'), 'true');
        await page.locator('[data-filter="cs"]').focus();
        await page.keyboard.press('Space');
        assert.equal(await page.locator('.publication-card:visible').count(), 8);
        await page.locator('[data-filter="all"]').click();
        const details = page.locator('.abstract-details').first();
        await details.locator('summary').focus();
        await page.keyboard.press('Enter');
        assert.equal(await details.evaluate(el => el.open), true, 'Native abstract disclosure is keyboard operable');

        // Printing must include all papers and abstracts without destroying screen state.
        await page.locator('[data-filter="cs"]').click();
        await page.emulateMedia({ media: 'print' });
        await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
        assert.equal(await page.locator('.publication-card:visible').count(), 11);
        assert.equal(await page.locator('.abstract-box:visible').count(), 3);
        await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
        await page.emulateMedia({ media: 'screen' });
        assert.equal(await page.locator('.publication-card:visible').count(), 8);
        assert.equal(await details.evaluate(el => el.open), true, 'Preserve an abstract that was already open');
        assert.equal(await page.locator('.abstract-details[open]').count(), 1);

        await page.goto(base + '/index.html', { waitUntil: 'networkidle' });
        for (const width of [320, 375]) {
            await page.setViewportSize({ width, height: 812 });
            await page.locator('nav a[href="#news"]').click();
            await page.waitForTimeout(800);
            const anchor = await page.evaluate(() => ({
                header: document.querySelector('.topbar').getBoundingClientRect().bottom,
                heading: document.querySelector('#news h2').getBoundingClientRect().top
            }));
            assert.ok(anchor.heading >= anchor.header, 'The News heading must clear the sticky header at ' + width);
        }
        assert.equal(await page.locator('.news-item:visible').count(), 5);
        await page.locator('#next-btn').click();
        assert.equal(await page.locator('#current-page').textContent(), '2');
        await page.locator('#next-btn').click();
        assert.equal(await page.locator('.news-item:visible').count(), 3);
        assert.equal(await page.locator('#next-btn').isDisabled(), true);
        await page.locator('#prev-btn').click();
        assert.equal(await page.locator('#current-page').textContent(), '2');

        await page.setViewportSize({ width: 667, height: 375 });
        await page.locator('#wechat-link').focus();
        await page.keyboard.press('Enter');
        assert.equal(await page.locator('#wechat-modal').evaluate(el => el.open), true);
        assert.equal(await page.evaluate(() => document.activeElement.className), 'wechat-close');
        const closeRect = await page.locator('.wechat-close').boundingBox();
        const modalRect = await page.locator('#wechat-modal').boundingBox();
        assert.ok(closeRect.y >= 0 && closeRect.y + closeRect.height <= 375);
        assert.ok(modalRect.y >= 0 && modalRect.y + modalRect.height <= 375);
        await page.keyboard.press('Tab');
        assert.ok(await page.evaluate(() => document.activeElement === document.body || !!document.activeElement.closest('#wechat-modal')), 'Focus cannot move to a background link');
        await page.keyboard.press('Escape');
        await page.waitForFunction(() => !document.querySelector('#wechat-modal').open &&
            document.activeElement.id === 'wechat-link' && document.body.style.overflow === '');
        assert.equal(await page.evaluate(() => document.body.style.overflow), '');

        await page.emulateMedia({ reducedMotion: 'reduce' });
        assert.ok(await page.locator('.skip-link').evaluate(e => e.getBoundingClientRect().bottom < 0), 'Reduced motion should not expose the unfocused skip link');
        assert.ok(await page.locator('.hero > *, .reveal').evaluateAll(es => es.every(e => getComputedStyle(e).animationName === 'none')), 'Reduced motion must disable hero and reveal animations');
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForFunction(() => document.querySelector('#backToTop').classList.contains('show'));
        await page.locator('#backToTop').click();
        assert.equal(await page.evaluate(() => Math.round(scrollY)), 0);
        assert.equal(await page.evaluate(() => document.activeElement.id), 'main-content');

        for (const theme of ['light', 'dark']) {
            await page.goto(base + '/index.html', { waitUntil: 'networkidle' });
            await page.evaluate(t => { document.documentElement.dataset.theme = t; }, theme);
            await page.emulateMedia({ media: 'print' });
            assert.equal(await page.locator('.news-item:visible').count(), 13);
            assert.ok(await page.locator('.reveal').evaluateAll(es => es.every(e => getComputedStyle(e).opacity === '1')));
            assert.equal(await page.locator('.about-text p').first().evaluate(e => getComputedStyle(e).color), 'rgb(34, 34, 34)');
            await page.emulateMedia({ media: 'screen' });
        }

        const nojs = await browser.newContext({ javaScriptEnabled: false });
        const plain = await nojs.newPage();
        await plain.goto(base + '/index.html');
        assert.equal(await plain.locator('.news-item:visible').count(), 13);
        assert.equal(await plain.locator('.pagination:visible').count(), 0);
        assert.equal(await plain.locator('#theme-toggle:visible').count(), 0);
        assert.equal(await plain.locator('#wechat-link').getAttribute('href'), 'img/wechat.png');
        await plain.goto(base + '/publications.html');
        assert.equal(await plain.locator('.publication-card:visible').count(), 11);
        assert.equal(await plain.locator('.filter-tags:visible').count(), 0);
        await plain.locator('summary').first().click();
        assert.equal(await plain.locator('.abstract-box:visible').count(), 1);

        const failed = await browser.newContext();
        await failed.route('**/main.js*', route => route.abort());
        const offline = await failed.newPage();
        await offline.goto(base + '/index.html', { waitUntil: 'networkidle' });
        assert.equal(await offline.locator('.news-item:visible').count(), 13);
        assert.ok(await offline.locator('.reveal').evaluateAll(es => es.every(e => getComputedStyle(e).opacity === '1')));

        const unavailable = await browser.newContext();
        await unavailable.route('https://api.github.com/**', route => route.fulfill({ status: 403, json: { message: 'Rate limited' } }));
        await unavailable.addInitScript(() => {
            Storage.prototype.getItem = () => { throw new Error('Storage disabled'); };
            Storage.prototype.setItem = () => { throw new Error('Storage disabled'); };
            delete window.IntersectionObserver;
        });
        const fallback = await unavailable.newPage();
        fallback.on('pageerror', e => pageErrors.push(e.message));
        await fallback.goto(base + '/publications.html', { waitUntil: 'networkidle' });
        assert.equal(await fallback.locator('.github-stars:visible').count(), 0, 'Failed counts must not look like a permanent loading state');
        assert.equal(await fallback.locator('.pub-links a:visible').count() > 0, true);
        await fallback.locator('#theme-toggle').click();
        assert.equal(await fallback.locator('#theme-toggle').getAttribute('aria-pressed'), 'true');
        assert.deepEqual(pageErrors, [], 'Uncaught browser errors');
        assert.deepEqual(localFailures, [], 'Missing local assets');
        console.log('Passed: responsive layouts, WCAG scans, keyboard controls, pagination, dialog, reduced motion, print, no-JS, failed scripts, unavailable storage/API, and star caching.');
    } finally {
        await browser.close();
    }
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
}).finally(() => server.close());
