# Yifei Zhang — personal homepage

A static, two-page site for GitHub Pages. HTML, CSS, JavaScript, fonts, icons, and web-sized images are served directly; no production build is required.

## Local preview

Python 3 is required:

```sh
./start.sh          # http://localhost:8035
./start.sh 8000     # optional port
```

The server binds to localhost and serves the site directory, even when the script is called from another directory.

## Editing

- `index.html`: biography, news, selected publications, and experiences.
- `publications.html`: full publication list, research categories, and native abstract disclosures.
- `styles.css` and `main.js`: shared presentation and progressive enhancement.
- `fonts/`: local Latin font subsets and their licenses.
- `img/icons.svg`: the small, shared Font Awesome Free icon sprite; attribution and license are included alongside it.

Keep the selected entries and full publication list consistent when updating research. Update both pages' metadata and asset version query strings when appropriate. The canonical deployment URL is `https://hoder-zyf.github.io/`.

Content remains readable without JavaScript. Pagination, filters, theme controls, and star badges are enabled only when their scripts are ready. GitHub counts are requested once per repository, cached locally for one hour, and omitted if unavailable. Never put an API token in this public site.

## Images and fonts

Original images in `img/` are preserved for full-size figure links. Pages use the responsive WebP assets in `img/optimized/`; below-the-fold images are lazy-loaded. Regenerate assets only when sources change:

```sh
python3 -m pip install Pillow 'fonttools[woff]'
python3 scripts/generate_images.py
python3 scripts/generate_fonts.py
```

The font generator downloads the versioned source URLs listed in `fonts/sources.json`. The image generator works locally. Add new paper images to its `PAPERS` list, then use matching `srcset` widths in the publication markup.

## Browser regressions

Node.js 20 or later and the test dependencies are needed only for development:

```sh
npm ci
npx playwright install chromium
npm test
```

For another installed Playwright engine, use `HOMEPAGE_BROWSER=firefox npm test` or `HOMEPAGE_BROWSER=webkit npm test`.

The test starts its own temporary local server and mocks GitHub responses. It checks mobile/desktop overflow, sticky-header anchors, WCAG accessibility rules in both themes, keyboard controls, dialog focus and short-screen bounds, printing, reduced motion, JavaScript failure, disabled storage, and star-count caching/failure behavior. Browser automation complements manual checks; it does not establish complete accessibility conformance or cross-browser compatibility.
