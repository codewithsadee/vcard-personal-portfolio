# charlie-lindgren.github.io

Personal academic website of Charlie Lindgren. Plain HTML, CSS and a little JavaScript, with no build step and no dependencies.

- `index.html`, `research.html`, `teaching.html` and `cv.html` hold the content.
- `assets/css/style.css` holds the design.
- `assets/js/site.js` adds animated filtering and search, expandable abstracts, dark mode, the figure viewer and copy buttons. It uses no libraries, and every page reads properly without it.

To add a publication, copy a `<li class="pub card">` block in `research.html`, give it the next `data-order` value (lower means newer), and update the count on the home page.

The CV at `assets/charlie-lindgren-cv.pdf` is the funding build from the CV repository, which leaves out personal contact details. Replace it when the CV changes.

Fonts: Source Serif 4 and Source Sans 3, both under the SIL Open Font License. The figure on the home page comes from Lindgren et al. (2026), published under CC BY 4.0.
