(() => {
  /* ---------- ?debug: an on-screen log of what moves the page (for chasing a jump seen only on a phone) ---------- */
  if (/[?&]debug\b/.test(window.location.search)) {
    const t0 = window.performance.now();
    const lines = [];
    const box = document.createElement('pre');
    box.style.cssText = 'position:fixed;left:6px;right:6px;bottom:6px;z-index:9999;max-height:46vh;overflow:auto;margin:0;padding:8px;' +
      'font:10px/1.35 ui-monospace,Menlo,monospace;color:#fff;background:rgba(0,0,0,.78);border-radius:10px;white-space:pre-wrap;pointer-events:auto';
    const scene = () => document.documentElement.dataset.scene || '';
    const cls = () => document.documentElement.className.replace(/\bjs\b|\bpinned\b/g, '').trim().replace(/\s+/g, ',');
    const log = (what) => {
      lines.push(`${String(Math.round(window.performance.now() - t0)).padStart(5)} y${Math.round(window.scrollY)} ${window.innerWidth}x${window.innerHeight} ${scene()} [${cls()}] ${what}`);
      if (lines.length > 80) lines.shift();
      box.textContent = lines.join('\n');
      box.scrollTop = box.scrollHeight;
    };
    const where = () => { const st = (new Error().stack || '').split('\n').slice(2, 4).map((l) => l.trim().replace(/^at /, '').replace(/https?:\/\/[^/]+/, '')).join(' < '); return st; };
    const origScrollTo = window.scrollTo.bind(window);
    window.scrollTo = function (...a) { log('scrollTo(' + JSON.stringify(a[0] && a[0].top !== undefined ? a[0].top : a[1]) + ') ' + where()); return origScrollTo(...a); };
    const origSIV = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function (...a) { log('scrollIntoView ' + (this.id || this.className) + ' ' + where()); return origSIV.apply(this, a); };
    const origFocus = HTMLElement.prototype.focus;
    HTMLElement.prototype.focus = function (...a) { log('focus ' + (this.id || this.tagName) + ' ' + JSON.stringify(a[0] || {})); return origFocus.apply(this, a); };
    let lastY = -1;
    window.addEventListener('scroll', () => { const y = Math.round(window.scrollY); if (Math.abs(y - lastY) >= 20 || y === 0) { log('scroll'); lastY = y; } }, { passive: true, capture: true });
    ['resize', 'orientationchange', 'popstate', 'hashchange', 'pageshow', 'load', 'touchstart', 'touchend', 'focusin'].forEach((t) =>
      window.addEventListener(t, (e) => log(t + (t === 'pageshow' ? ' persisted=' + e.persisted : '') + (t === 'focusin' ? ' ' + (e.target.id || e.target.tagName) : '')), { passive: true, capture: true }));
    if (window.visualViewport) window.visualViewport.addEventListener('resize', () => log('vv ' + Math.round(window.visualViewport.height)));
    new MutationObserver(() => log('class')).observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-scene'] });
    const nav = window.performance.getEntriesByType && window.performance.getEntriesByType('navigation')[0];
    log('start nav=' + (nav && nav.type) + ' ua=' + navigator.userAgent.replace(/.*\) /, '').slice(0, 60) + ' hash=' + window.location.hash);
    document.addEventListener('DOMContentLoaded', () => document.body.appendChild(box));
    if (document.body) document.body.appendChild(box);
  }
  const root = document.documentElement;
  const nav = document.getElementById('nav');
  const menu = nav.querySelector('.menu');
  const links = document.getElementById('links');
  const navLinks = Array.from(links.querySelectorAll('a'));
  const langButtons = Array.from(nav.querySelectorAll('.lang button'));
  const scenes = Array.from(document.querySelectorAll('.scene'));
  const chapter = document.querySelector('.chapter');
  const chapterT = chapter.querySelector('.chapter-t');
  const drawing = document.querySelector('.backdrop .diagram');
  const rmQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const shortQuery = window.matchMedia('(max-height: 760px)');
  const EASE = 'cubic-bezier(.16, 1, .3, 1)';
  const GROUP = { w1: 'g-nac', w2: 'g-sbx', w3: 'g-fw', w4: 'g-team' };
  // viewBox crops of the drawing for narrow screens:
  // [viewBox, smallest label size on screen in px, largest label size in drawing units so labels fit their boxes]
  const CROPS = {
    hero: ['-4 8 916 764', 9, 18],     // the whole drawing, both panels and the client the requests come from
    w1: ['-8 40 668 417.5', 12, 17],   // (with the sandboxes faded beside it, as the other chapters show their neighbours)
    w2: ['342 100 468 292', 12, 18],
    w3: ['500 6 556 348', 12, 19],
    w4: ['116 452 744 322.5', 12, 18],   // the whole team panel: entries, pool, control plane, VMs, credentials, compute
  };
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  let reduced = rmQuery.matches;
  let pinned = root.classList.contains('pinned');
  let paged = false;                    // touch screens that flow: one swipe, one scene (see 'One swipe, one page')
  let active = null;

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  const store = {
    get(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } },
  };
  const canAnimate = () => !reduced && typeof Element.prototype.animate === 'function';
  const lang = () => (root.getAttribute('data-lang') === 'zh' ? 'zh' : 'en');

  // seek every loop animation under an svg that belongs to a part of it (sel), in one call (asking each element for
  // its own animations costs about 50 ms for the Agent Team alone: a visible stall on arriving at a chapter)
  function seekLoop(svg, sel, t) {
    svg.getAnimations({ subtree: true }).forEach((a) => {
      const el = a.effect && a.effect.target;
      if (el && el.classList && el.classList.contains('fx') && el.closest(sel)) a.currentTime = typeof t === 'function' ? t(a) : t;
    });
  }

  /* ---------- Narrow screens: the hero and each chapter carry their own crop of the drawing ---------- */
  const minis = [];
  if (drawing) {
    scenes.forEach((s) => {
      const crop = CROPS[s.dataset.scene];
      if (!crop) return;
      const box = document.createElement('div');
      box.className = s.dataset.scene === 'hero' ? 'mini hero-mini' : 'mini r';
      box.dataset.hl = s.dataset.scene;
      box.setAttribute('aria-hidden', 'true');
      const svg = drawing.cloneNode(true);
      svg.setAttribute('viewBox', crop[0]);
      // a crop keeps only its own loop (the others lie outside its view, and each would cost a few hundred animations)
      const hl = s.dataset.scene;
      svg.querySelectorAll('.cl').forEach((g) => { if (!g.classList.contains('cl-' + hl)) g.remove(); });
      if (hl !== 'w4' && hl !== 'hero') svg.querySelectorAll('.g-team .fx').forEach((n) => n.remove());
      box.appendChild(svg);
      const col = s.querySelector('.col');
      // chapters: the drawing sits between the subtitle and the points, so the scene starts at its heading
      const list = col.querySelector('ul');
      if (list) col.insertBefore(box, list);
      else col.insertBefore(box, col.firstChild);
      minis.push({ box, svg, width: parseFloat(crop[0].split(' ')[2]), px: crop[1], cap: crop[2] });
    });
  }
  // the paged layout (phones) shows the work chapters' drawing as one drawing that runs through them, as the wide
  // backdrop does: a camera over the whole drawing that pans and zooms from one chapter's part to the next while
  // the text changes (see 'Paged layout: one drawing through the work chapters')
  let pcam = null;
  if (drawing) {
    const box = document.createElement('div');
    box.className = 'mini pcam';
    box.setAttribute('aria-hidden', 'true');
    box.appendChild(drawing.cloneNode(true));
    document.body.appendChild(box);
    pcam = { box, svg: box.firstChild, vb: null, hl: null, raf: 0, shown: false };
  }
  // the chapter-04 crop runs its loop while most of it is on screen (not while its chapter is current: on phones the
  // chapter changes when its top passes 30% of the screen, so the crop can be in view under another chapter). Each
  // time it comes into view the story opens at its start, as chapter 04 does on wider screens (restartStory).
  const teamMini = minis.find((m) => m.box.dataset.hl === 'w4');
  const FX_ENTRY_MS = drawing ? parseFloat(drawing.getAttribute('data-fx-entry') || '0') * 1000 : 0;
  // a crop runs its loop, from its start, while it is on screen (while it does not run, its moving parts fade out
  // rather than stand frozen mid-message: site.css)
  function runMini(m, on) {
    if (on === m.box.classList.contains('run')) return;
    m.box.classList.toggle('run', on);
    if (on) {
      if (m.box.dataset.hl === 'w4') seekLoop(m.svg, '.g-team', FX_ENTRY_MS);
      else seekLoop(m.svg, '.cl-' + m.box.dataset.hl, 0);
    }
    wakeShakes();
  }
  // (the paged layout runs the crop of the current scene instead: its scenes all lie on the screen, one on top)
  function runMinisOf(scene) {
    minis.forEach((m) => runMini(m, m.box.closest('.scene') === scene && !(paged && pcam && /^w[1-4]$/.test(m.box.dataset.hl))));
  }
  if (teamMini) {
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((es) => es.forEach((e) => {
        if (paged) return;
        runMini(teamMini, e.isIntersecting && e.intersectionRatio >= 0.599);
      }), { threshold: 0.6 })
        .observe(teamMini.box);
    } else teamMini.box.classList.add('run');
  }
  // chapters 01-03 and the hero: each crop runs its own loop the same way, from the loop's start
  minis.filter((m) => /^(w[123]|hero)$/.test(m.box.dataset.hl)).forEach((m) => {
    if (!('IntersectionObserver' in window)) { m.box.classList.add('run'); return; }
    new IntersectionObserver((es) => es.forEach((e) => {
      if (paged) return;
      runMini(m, e.isIntersecting && e.intersectionRatio >= 0.599);
    }), { threshold: 0.6 }).observe(m.box);
  });
  function sizeMiniLabels() {
    minis.forEach((m) => {
      const w = m.svg.getBoundingClientRect().width;
      if (!w) return;
      const scale = w / m.width;
      m.svg.style.setProperty('--lbl', Math.min(m.cap, Math.max(13, m.px / scale)).toFixed(1) + 'px');
    });
  }

  const lines = Array.from(document.querySelectorAll('.scene .r'));
  lines.forEach((el) => { el._scene = el.closest('.scene'); });

  /* ---------- Headings rise letter by letter ---------- */
  // Each display heading is split into letters, each word clipped to its own box: arriving at a scene, its letters
  // rise into place one after another (30 ms apart, on the scene's long settle). Screen readers get the heading's
  // text as its label (the letters are hidden from them: some read separate boxes one letter at a time).
  const heads = [];
  document.querySelectorAll('.work h3, .sec, .contact h2').forEach((h) => {
    const parts = Array.from(h.children).filter((c) => c.matches('.en, .zh'));
    h._label = {};
    (parts.length ? parts : [h]).forEach((el) => {
      if (el.children.length) return;   // (plain text only)
      const text = el.textContent.replace(/\s+/g, ' ').trim();
      const split = document.createElement('span');
      split.className = 'split';
      split.setAttribute('aria-hidden', 'true');
      const letters = [];
      let off = 0;
      let i = 0;
      text.split(' ').forEach((w, k) => {
        if (k) { split.appendChild(document.createTextNode(' ')); off += 1; }
        const sw = document.createElement('span');
        sw.className = 'sw';
        Array.from(w).forEach((c) => {
          const sc = document.createElement('span');
          sc.className = 'sc';
          sc.textContent = c;
          sc.style.setProperty('--i', i++);
          sc._at = off;      // (its offset in the whole text)
          sc._word = k;
          off += c.length;
          sw.appendChild(sc);
          letters.push(sc);
        });
        split.appendChild(sw);
      });
      el.textContent = '';
      el.appendChild(split);
      heads.push({ h, el, text, letters });
      h._label[el.matches('.zh') ? 'zh' : el.matches('.en') ? 'en' : 'all'] = text;
      h.closest('.scene')._heads = true;
    });
  });
  function labelHeads(l) {
    heads.forEach((x) => { const t = x.h._label.all || x.h._label[l]; if (t) x.h.setAttribute('aria-label', t); });
  }
  // Splitting a word into boxes loses the font's kerning between its letters: each letter gets back the space the
  // kerning gave it, measured against the same text set whole (in em, so it holds at every size). Only a shown
  // language can be measured: on load and on each language change.
  function kernHeads() {
    const todo = heads.filter((x) => !x.kerned && x.h.offsetWidth && x.el.getClientRects().length);
    if (!todo.length) return;
    const range = document.createRange();
    const leftOf = (node, a) => { range.setStart(node, a); range.setEnd(node, a + 1); return range.getBoundingClientRect().left; };
    const refs = todo.map((x) => {
      const ref = document.createElement('span');
      ref.style.cssText = 'position:absolute;left:0;top:0;visibility:hidden;white-space:nowrap';
      ref.textContent = x.text;
      x.el.appendChild(ref);
      x.letters.forEach((sc) => { sc.style.marginRight = ''; });
      return ref;
    });
    const set = todo.map((x, n) => {
      const t = refs[n].firstChild;
      const scale = x.h.getBoundingClientRect().width / x.h.offsetWidth || 1;
      const em = parseFloat(getComputedStyle(x.h).fontSize) * scale;
      return x.letters.map((sc, k) => {
        const next = x.letters[k + 1];
        if (!next || next._word !== sc._word) return 0;
        const whole = leftOf(t, next._at) - leftOf(t, sc._at);
        const split = leftOf(next.firstChild, 0) - leftOf(sc.firstChild, 0);
        return (whole - split) / em;
      });
    });
    refs.forEach((r) => r.remove());
    todo.forEach((x, n) => {
      x.kerned = true;
      x.letters.forEach((sc, k) => { if (Math.abs(set[n][k]) > 0.001) sc.style.marginRight = set[n][k].toFixed(4) + 'em'; });
    });
  }
  // Read from the top down: the number above a heading comes with its scene, the heading follows, and the rest
  // below it (line, points, drawing) fades in once the heading is mostly in, one block after another.
  scenes.forEach((sc) => {
    if (!sc._heads) return;
    sc._body = Array.from(sc.querySelectorAll('.r')).filter((el) => !heads.some((x) => x.h === el) && !el.matches('.meta'));
  });
  // delay: when the letters start (after the scene's own delay), null: in place at once; dir: the way the visitor
  // is going (down: the letters come down from above, up: up from below)
  function playHeads(scene, delay, dir) {
    if (!scene._heads) return;
    scene._body.forEach((el) => el.getAnimations().forEach((a) => { if (a.id === 'after') a.cancel(); }));
    scene.classList.remove('split-in');
    if (delay == null || !canAnimate()) { scene.classList.add('split-now', 'split-in'); return; }
    scene.classList.remove('split-now');
    scene.setAttribute('data-from', dir === 'up' ? 'below' : 'above');
    void scene.offsetWidth;   // (back out at once, then in)
    scene.style.setProperty('--sd', Math.round(delay) + 'ms');
    scene.classList.add('split-in');
    const n = Math.max(0, ...heads.filter((x) => x.h.closest('.scene') === scene && x.el.getClientRects().length).map((x) => x.letters.length));
    const after = delay + Math.min(620, 30 * n + 260);
    scene._body.forEach((el, j) => {
      el.animate([{ opacity: 0 }, { opacity: 1 }],
        { duration: 700, delay: after + j * 80, easing: 'cubic-bezier(.25, .1, .25, 1)', fill: 'backwards' }).id = 'after';
    });
  }

  /* ---------- Scene motion: each scene moves as one block, in depth ---------- */
  // scale and opacity only: a blur on two full-screen layers costs about half the frames
  const IN = { down: 0.9, up: 1.1 };    // where the arriving scene comes from
  const OUT = { down: 1.1, up: 0.9 };   // where the leaving scene goes
  const LEAD = 290;                     // how long a fully visible leaving scene has before the next one starts
  const HEAD_LAG = 80;                  // the heading's letters start as the arriving block begins to show
  function layerOf(scene) { return scene.querySelector('.layer'); }
  function zoomIn(scene, from, delay, duration) {
    if (!canAnimate()) return 0;
    const l = layerOf(scene);
    l._exitAt = 0;
    let first = { opacity: 0, transform: 'scale(' + from + ')' };
    const cs = getComputedStyle(l);
    if (l.getAnimations().length && +cs.opacity > 0.02) {
      // coming back to a scene that has not finished leaving: carry on from where it is, no blink
      first = { opacity: cs.opacity, transform: cs.transform === 'none' ? 'scale(1)' : cs.transform };
      delay = 0;
    }
    l.getAnimations().forEach((x) => x.cancel());
    // the depth move keeps its long settle; the fade is its own, shorter and even, so the new block never snaps in
    l.animate([{ transform: first.transform }, { transform: 'scale(1)' }],
      { duration: duration || 1100, delay, easing: EASE, fill: 'backwards' });
    l.animate([{ opacity: first.opacity }, { opacity: 1 }],
      { duration: 600, delay, easing: 'cubic-bezier(.25, .1, .25, 1)', fill: 'backwards' });
    return delay;
  }
  function zoomOut(scene, to) {
    if (!canAnimate()) return;
    const l = layerOf(scene);
    const cs = getComputedStyle(l);
    const o = +cs.opacity;
    const t0 = cs.transform === 'none' ? 'scale(1)' : cs.transform;
    l.getAnimations().forEach((x) => x.cancel());
    l._exitAt = 0;
    if (o < 0.02) return;
    l._exitAt = window.performance.now();
    l._exitLead = LEAD * Math.min(1, o);
    // the block moves in depth, and fades out on its own shorter clock, gone before the next one is readable
    l.animate(
      [
        { transform: t0, offset: 0 },
        { transform: 'scale(' + (1 + (to - 1) * 0.55) + ')', offset: 0.45 },
        { transform: 'scale(' + to + ')', offset: 1 },
      ],
      { duration: Math.round(560 * Math.max(0.4, o)), easing: 'cubic-bezier(.33, 0, .67, 1)' }
    );
    l.animate([{ opacity: o }, { opacity: 0 }],
      { duration: Math.round(460 * Math.max(0.4, o)), easing: 'cubic-bezier(.4, 0, 1, 1)' });   // (with LEAD 290 and
    // the arrival's 600 ms fade: never both readable, never both gone)
  }
  // the arriving scene waits for whichever scenes are still visibly leaving
  function arrivalDelay(scene) {
    const now = window.performance.now();
    let d = 0;
    scenes.forEach((s) => {
      if (s === scene) return;
      const l = layerOf(s);
      if (+getComputedStyle(l).opacity <= 0.3) return;
      d = Math.max(d, l._exitAt ? Math.max(0, l._exitLead - (now - l._exitAt)) : LEAD);
    });
    return Math.round(d);
  }

  function reveal(scene, animate, baseDelay) {
    if (scene.classList.contains('is-in')) return;
    scene.classList.add('is-in');
    // (the flowing layout's blocks rise in as they scroll into view: exitFade; the pinned one zooms the whole scene)
    const dir = root.getAttribute('data-dir');
    if (animate && pinned) playHeads(scene, zoomIn(scene, 0.94, baseDelay == null ? 60 : baseDelay, 1000) + HEAD_LAG, dir);
    else playHeads(scene, animate && !pinned ? (baseDelay || 0) + 60 : null, dir);
    if (!pinned) requestFrame();
  }

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { reveal(entry.target, true); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });
    scenes.forEach((s) => io.observe(s));
  } else {
    scenes.forEach((s) => s.classList.add('is-in'));
  }

  /* ---------- The side bar's slider (pinned desktop): glides to the current scene's word ---------- */
  const thumb = links.querySelector('.thumb');
  let thumbPlaced = false;
  function placeThumb() {
    if (!thumb) return;
    const cur = navLinks.filter((a) => a.getAttribute('aria-current') === 'true');
    const at = cur.find((a) => a.classList.contains('sub')) || cur[0];
    navLinks.forEach((a) => a.classList.toggle('is-thumb', a === at && pinned));
    if (!at || !pinned || !at.offsetHeight) { thumb.classList.remove('on'); return; }
    // the first time (and after the bar was hidden) it appears in place instead of sliding in from the top
    if (!thumbPlaced) thumb.classList.add('jump');
    thumb.style.transform = 'translateY(' + at.offsetTop + 'px)';
    thumb.style.height = at.offsetHeight + 'px';
    thumb.style.left = at.offsetLeft + 'px';
    thumb.classList.add('on');
    if (!thumbPlaced) {
      thumbPlaced = true;
      void thumb.offsetHeight;
      window.requestAnimationFrame(() => thumb.classList.remove('jump'));
    }
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { thumbPlaced = false; placeThumb(); });

  /* ---------- Chapter pill ---------- */
  function labelOf(scene) {
    if (!scene || scene.dataset.scene === 'hero') return null;
    return { part: scene.dataset.num ? (lang() === 'zh' ? '作品' : 'Work') : '', num: scene.dataset.num || '', text: scene.dataset[lang()] || '' };
  }
  function paintChapter() {
    const l = labelOf(active);
    chapter.classList.toggle('show', Boolean(l));
    if (!l) return;
    chapterT.textContent = '';
    if (l.part) {
      const w = document.createElement('span');
      w.className = 'part';
      w.textContent = l.part;
      chapterT.appendChild(w);
    }
    if (l.num) {
      const n = document.createElement('span');
      n.className = 'num';
      n.textContent = l.num;
      chapterT.appendChild(n);
    }
    chapterT.appendChild(document.createTextNode(l.text));
  }
  let swapTimer = 0;
  function swapChapter(prev, instant) {
    window.clearTimeout(swapTimer);
    if (instant || reduced || !labelOf(prev)) {
      chapter.classList.remove('swap');
      paintChapter();
      return;
    }
    chapter.classList.add('swap');
    swapTimer = window.setTimeout(() => { paintChapter(); chapter.classList.remove('swap'); }, 260);
  }

  /* ---------- The highlighted part of the drawing redraws itself once per chapter ---------- */
  function redraw(scene) {
    const g = GROUP[scene.dataset.scene];
    if (!g || !drawing || !canAnimate() || !root.classList.contains('settled')) return;
    drawing.querySelectorAll('.' + g + ' .e.draw:not(.bound)').forEach((p, i) => {
      p.getAnimations().forEach((a) => a.cancel());
      p.animate(
        [
          { strokeDasharray: '1 1', strokeDashoffset: 1 },
          { strokeDasharray: '1 1', strokeDashoffset: 0 },
        ],
        { duration: 700, delay: 1000 + Math.min(i, 6) * 60, easing: EASE, fill: 'backwards' }   // once the camera has landed
      );
    });
  }

  /* ---------- Chapter 04 opens the Agent Team story at its start ---------- */
  // The loop also runs in the hero and is paused in 01-03, so without this chapter 04 would open anywhere in it.
  // The moving parts fade out for 200 ms (the camera is moving), every loop animation jumps to the loop's last
  // breath of rest (data-fx-entry, written by gen.py) and they fade back in: the first message starts about 1 s later.
  const FX_ENTRY = drawing ? parseFloat(drawing.getAttribute('data-fx-entry') || '0') * 1000 : 0;
  let fxTimer = 0;
  function restartStory() {
    if (!drawing || reduced) return;
    root.classList.add('fx-reset');
    window.clearTimeout(fxTimer);
    fxTimer = window.setTimeout(() => {
      if (root.getAttribute('data-scene') === 'w4') {
        seekLoop(drawing, '.g-team', FX_ENTRY);
      }
      root.classList.remove('fx-reset');
      wakeShakes();
    }, 700);   // (the moving parts come back as the longer pan into 04 lands)
  }

  // chapters 01-03 each have a short loop of their own (gen.py). Arriving at one, its loop starts again from its
  // last moments of rest, so its story begins about as the camera settles rather than somewhere in the middle.
  function restartChapter(ch) {
    if (!drawing || reduced) return;
    // the hero's stream starts empty, from its first request; a chapter's loop from its last breath of rest, so its
    // story begins as the camera lands
    seekLoop(drawing, '.cl-' + ch, ch === 'hero' ? 0 : (a) => {
      const L = a.effect ? a.effect.getComputedTiming().duration : 0;
      return L > 1100 ? L - 1100 : a.currentTime;
    });
  }

  /* ---------- The vibration: a card shakes when it sends and the moment the beam reaches it ---------- */
  // Not an animation: each frame, while the loop runs, the loop's own clock (the currentTime of one of its CSS
  // animations) says whether a card is inside one of its vibrations (data-shake, written by gen.py), and the card's
  // group gets that offset as its transform attribute; outside them it has none. So it follows every pause, seek and
  // restart of the loop exactly, never becomes a composited layer (a transform animation would keep one per card for
  // the whole loop and, on 1x screens, rasterise it at the wrong scale after a camera move), and exists only where the
  // loop runs. Its size is set in screen pixels as it starts (data-fx-shake-px), the same on every screen.
  const shakeSets = [];
  let shakeRaf = 0;
  function bezierEase(x1, y1, x2, y2) {
    const f = (t, a, b) => 3 * a * t * (1 - t) * (1 - t) + 3 * b * t * t * (1 - t) + t * t * t;
    return (x) => {
      let lo = 0, hi = 1;
      for (let i = 0; i < 24; i++) { const m = (lo + hi) / 2; if (f(m, x1, x2) < x) lo = m; else hi = m; }
      return f((lo + hi) / 2, y1, y2);
    };
  }
  function shakeSet(svg, live, px) {
    const shape = (svg.getAttribute('data-fx-shake') || '').split(';').filter(Boolean).map((p) => p.split(',').map(Number));
    const swing = bezierEase(...(svg.getAttribute('data-fx-swing') || '.37,0,.63,1').split(',').map(Number));
    const peaks = {};
    (svg.getAttribute('data-fx-shake-px') || '').split(',').forEach((p) => { const [k, v] = p.split(':'); peaks[k] = +v; });
    const groups = Array.from(svg.querySelectorAll('.shake')).map((g) => ({ g, times: g.dataset.shake.split(',').map(Number), start: null, amp: 0, x: 0 }));
    if (!shape.length || !groups.length) return;
    const len = shape[shape.length - 1][0];
    const at = (dt) => {
      for (let i = 1; i < shape.length; i++) {
        if (dt <= shape[i][0]) { const [t0, v0] = shape[i - 1], [t1, v1] = shape[i]; return v0 + (v1 - v0) * swing((dt - t0) / (t1 - t0)); }
      }
      return 0;
    };
    const loop = parseFloat(svg.getAttribute('data-fx-loop') || '18000');
    let ref = null;
    shakeSets.push({ svg, groups, live, len, at, loop, peak: () => peaks[px()] || 2,
      clock() {
        if (!ref || !ref.effect || !svg.contains(ref.effect.target) || ref.playState === 'idle') {
          ref = null;
          for (const el of svg.querySelectorAll('.g-team .fx')) { const a = el.getAnimations()[0]; if (a) { ref = a; break; } }
        }
        return ref && ref.currentTime != null ? ((ref.currentTime % loop) + loop) % loop : null;
      } });
  }
  function shakeTick() {
    shakeRaf = 0;
    let again = false;
    for (const set of shakeSets) {
      const on = !reduced && set.live();
      const T = on ? set.clock() : null;
      if (on) again = true;
      for (const s of set.groups) {
        let x = 0;
        if (T != null) {
          for (const t0 of s.times) {
            const dt = T - t0;
            if (dt < 0 || dt >= set.len) continue;
            if (s.start !== t0) { s.start = t0; s.amp = set.peak() / (set.svg.getScreenCTM() || { a: 1 }).a; }
            x = s.amp * set.at(dt);
            break;
          }
        }
        if (!x) s.start = null;
        if (x !== s.x) {
          s.x = x;
          if (x) s.g.setAttribute('transform', 'translate(' + x.toFixed(3) + ' 0)');
          else s.g.removeAttribute('transform');
        }
      }
    }
    if (again) shakeRaf = window.requestAnimationFrame(shakeTick);
  }
  function wakeShakes() { if (!shakeRaf) shakeRaf = window.requestAnimationFrame(shakeTick); }
  if (drawing) {
    // the backdrop: in the hero and chapter 04, not while restartStory fades the moving parts (the loop is jumping)
    shakeSet(drawing, () => /^(hero|w4)$/.test(root.getAttribute('data-scene') || '') && !root.classList.contains('fx-reset'),
      () => (root.getAttribute('data-scene') === 'w4' ? 'w4' : 'hero'));
  }
  if (teamMini) shakeSet(teamMini.svg, () => teamMini.box.classList.contains('run'), () => 'mini');

  /* ---------- Current scene ---------- */
  const timers = new WeakMap();
  function later(scene, fn, ms) {
    window.clearTimeout(timers.get(scene));
    timers.set(scene, window.setTimeout(fn, ms));
  }

  function setScene(scene, instant) {
    if (scene === active) return;
    const prev = active;
    active = scene;
    const dir = prev && scenes.indexOf(scene) < scenes.indexOf(prev) ? 'up' : 'down';
    root.setAttribute('data-dir', dir);
    // an invisible drawing takes its new framing at once and only fades in
    if (drawing) root.classList.toggle('dg-cut', +getComputedStyle(drawing).opacity < 0.05);
    root.setAttribute('data-scene', scene.dataset.scene);
    wakeShakes();
    const target = scene.dataset.nav || '';
    navLinks.forEach((a) => {
      // a section, and (in the side bar) the chapter itself
      if (a.dataset.go === target || a.dataset.go === scene.id) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
    placeThumb();
    if (pinned || paged) {
      if (paged) {
        // arriving from below, a page opens at its top; going back up, at its bottom (where the visitor left it)
        const l = layerOf(scene);
        l.scrollTop = dir === 'up' ? l.scrollHeight : 0;
        runMinisOf(scene);
        camTo(scene, instant);
      }
      if (prev) {
        if (!instant) zoomOut(prev, OUT[dir]); // before the class change: it must start from what is on screen
        prev.classList.remove('is-active', 'is-live');
      }
      scene.classList.add('is-active');
      if (instant) { scene.classList.add('is-live'); playHeads(scene, null); }
      else {
        // (a scene called back while still leaving carries on from where it is: its letters are already up)
        const l = layerOf(scene);
        const carried = l.getAnimations().length && +getComputedStyle(l).opacity > 0.02;
        const delay = zoomIn(scene, IN[dir], arrivalDelay(scene));
        if (!carried) playHeads(scene, delay + HEAD_LAG, dir);
        // clickable once it is about half visible
        later(scene, () => { if (scene === active) scene.classList.add('is-live'); }, delay + 120);
      }
    }
    if (!instant && prev) redraw(scene);
    if (prev && scene.dataset.scene === 'w4') restartStory();
    if (prev && /^(w[123]|hero)$/.test(scene.dataset.scene)) restartChapter(scene.dataset.scene);
    swapChapter(prev, instant);
  }

  // a scene chosen by a click or a deep link is kept until the visitor scrolls
  let held = null;
  function currentScene() {
    if (held && Math.abs(window.scrollY - held.y) < 4) return held.scene;
    held = null;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (window.scrollY >= max - 2) return scenes[scenes.length - 1];
    const probe = window.innerHeight * (pinned ? 0.5 : 0.3);
    let cur = scenes[0];
    for (const s of scenes) {
      if (s.getBoundingClientRect().top <= probe) cur = s;
    }
    return cur;
  }

  function scrollToScene(scene) {
    window.scrollTo({ top: scene.getBoundingClientRect().top + window.scrollY, behavior: 'instant' });
    held = { scene, y: window.scrollY };
  }

  /* ---------- Flowing layout: text passing under the nav softens and fades ---------- */
  function clearFade(el) {
    if (el._x) { el.style.opacity = ''; el.style.filter = ''; el.style.transform = ''; el._x = false; }
  }
  function exitFade() {
    if (pinned || paged || reduced) { lines.forEach(clearFade); return; }
    const navBottom = nav.getBoundingClientRect().bottom;
    const fadeEnd = navBottom - 4;
    const fadeStart = navBottom + 40;
    for (const el of lines) {
      if (el.offsetParent === null) continue;
      const r = el.getBoundingClientRect();
      if (r.bottom < -40 || r.top > window.innerHeight || !el._scene.classList.contains('is-in')) { clearFade(el); continue; }
      // measured at the block's last line: taller blocks stay sharp while the veil covers their upper lines
      const c = r.bottom - Math.min(r.height, 48) * 0.5;
      let t = (c - fadeEnd) / (fadeStart - fadeEnd);
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      if (t >= 1) { clearFade(el); continue; }
      const e = t * t * (3 - 2 * t);
      el.style.opacity = e.toFixed(3);
      el.style.filter = 'blur(' + ((1 - e) * 5).toFixed(2) + 'px)';
      el._x = true;
    }
  }

  let ticking = false;
  let resizing = false;
  function frame() {
    ticking = false;
    if (resizing) return;
    setScene(currentScene(), false);
    exitFade();
  }
  function requestFrame() {
    if (!ticking) { ticking = true; window.requestAnimationFrame(frame); }
  }
  window.addEventListener('scroll', requestFrame, { passive: true });

  /* ---------- Paged layout: one drawing through the work chapters ---------- */
  // Each work chapter keeps its crop as an invisible placeholder (it holds the space in the text); the camera, one
  // copy of the whole drawing on top, sits over the current chapter's placeholder showing that chapter's part. Moving
  // to another chapter, it pans and zooms across the drawing (its viewBox) and moves to the new placeholder in one
  // 1.1 s ease-in-out while the part in focus cross-fades, so the drawing never leaves the screen; it fades away for
  // a scene without one and fades back in where the next one is.
  const CAM_MS = 1100;
  const camEase = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const cropOf = (hl) => CROPS[hl][0].split(' ').map(Number);
  function camSlot(scene) {
    const m = minis.find((x) => x.box.closest('.scene') === scene && /^w[1-4]$/.test(x.box.dataset.hl));
    if (!m) return null;
    // its place in its layer's own layout (the layer may be mid-zoom: not its transformed box)
    const layer = layerOf(scene);
    let top = 0;
    let left = 0;
    for (let el = m.box; el && el !== layer; el = el.offsetParent) { top += el.offsetTop; left += el.offsetLeft; }
    return { m, top: top - layer.scrollTop, left, width: m.box.offsetWidth, height: m.box.offsetHeight };
  }
  function camApply(vb, r, hl) {
    pcam.vb = vb;
    pcam.svg.setAttribute('viewBox', vb.map((v) => v.toFixed(2)).join(' '));
    const st = pcam.box.style;
    st.transform = 'translate(' + r.left.toFixed(1) + 'px,' + r.top.toFixed(1) + 'px)';
    st.width = r.width.toFixed(1) + 'px';
    st.height = r.height.toFixed(1) + 'px';
    const scale = r.width / vb[2];
    const [, px, cap] = CROPS[hl];
    pcam.svg.style.setProperty('--lbl', Math.min(cap, Math.max(13, px / scale)).toFixed(1) + 'px');
  }
  function camTo(scene, instant) {
    if (!pcam) return;
    const hl = paged ? scene.dataset.scene : '';
    const slot = /^w[1-4]$/.test(hl) ? camSlot(scene) : null;
    window.cancelAnimationFrame(pcam.raf);
    if (!slot) {                                  // a scene without the drawing: it fades away
      pcam.box.classList.remove('on', 'run');
      pcam.shown = false;
      return;
    }
    const to = cropOf(hl);
    const changed = pcam.hl !== hl;
    pcam.hl = hl;
    pcam.box.dataset.hl = hl;
    if (changed) {
      pcam.box.classList.add('run');
      if (hl === 'w4') seekLoop(pcam.svg, '.g-team', FX_ENTRY_MS);
      else seekLoop(pcam.svg, '.cl-' + hl, 0);
      wakeShakes();
    }
    if (instant || !pcam.shown || !pcam.vb || reduced) {
      camApply(to, slot, hl);
      pcam.r = slot;
      pcam.raf = 0;
      pcam.shown = true;
      pcam.box.classList.add('on');
      return;
    }
    const from = pcam.vb.slice();
    const r0 = { top: pcam.r ? pcam.r.top : slot.top, left: pcam.r ? pcam.r.left : slot.left,
      width: pcam.r ? pcam.r.width : slot.width, height: pcam.r ? pcam.r.height : slot.height };
    const t0 = window.performance.now();
    const tick = () => {
      const k = Math.min(1, (window.performance.now() - t0) / CAM_MS);
      const e = camEase(k);
      const r1 = camSlot(scene) || slot;            // (follows the new page if it scrolls meanwhile)
      const r = { top: r0.top + (r1.top - r0.top) * e, left: r0.left + (r1.left - r0.left) * e,
        width: r0.width + (r1.width - r0.width) * e, height: r0.height + (r1.height - r0.height) * e };
      camApply(from.map((v, i) => v + (to[i] - v) * e), r, hl);
      pcam.r = r;
      pcam.raf = k < 1 ? window.requestAnimationFrame(tick) : 0;
    };
    tick();
  }
  // a chapter taller than the screen scrolls inside its layer: the drawing moves with it
  document.addEventListener('scroll', (ev) => {
    if (!paged || !pcam || !pcam.shown || !active || ev.target !== layerOf(active)) return;
    const slot = camSlot(active);
    if (slot && !pcam.raf) { camApply(pcam.vb, slot, pcam.hl); pcam.r = slot; }
  }, { capture: true, passive: true });

  /* ---------- Touch screens: one swipe, one page ---------- */
  // Where the pinned layout cannot be (a phone: narrow, and a scene is often taller than the screen) a touch screen
  // still moves scene by scene, as the pinned layout does with a wheel: the scenes lie on the screen one on top of
  // another (html.paged), a swipe steps to the next or the previous one with the same depth zoom, and a scene taller
  // than the screen is scrolled through first (it scrolls inside its own layer; only a swipe that starts at its end
  // moves on). It does not rely on the browser's scroll snapping, which some phones ignore.
  const coarse = window.matchMedia('(pointer: coarse)');
  let swipe = null;
  window.addEventListener('touchstart', (ev) => {
    swipe = null;
    if (!paged || introOn || ev.touches.length !== 1 || !active) return;
    const l = layerOf(active);
    const t = ev.touches[0];
    swipe = { x: t.clientX, y: t.clientY, t: window.performance.now(), l, top: l.scrollTop,
      atTop: l.scrollTop <= 1, atEnd: l.scrollTop + l.clientHeight >= l.scrollHeight - 1 };
  }, { passive: true });
  window.addEventListener('touchmove', (ev) => {
    if (swipe && ev.touches.length === 1) { swipe.lx = ev.touches[0].clientX; swipe.ly = ev.touches[0].clientY; }
  }, { passive: true });
  // a swipe ends with touchend, or (on iOS, when the browser takes the gesture over to scroll or bounce a scrollable
  // scene) with touchcancel: then its last position decides
  function endSwipe(x, y) {
    const g = swipe;
    swipe = null;
    if (!g || !paged || introOn || x == null) return;
    const dy = g.y - y;
    if (Math.abs(g.x - x) > Math.abs(dy)) return;                // sideways: not a page turn
    // it scrolled the scene's own content (measured within the scrollable range: on iOS a swipe at either end of a
    // scrollable scene bounces it past its ends, which is not scrolling it)
    const max = g.l.scrollHeight - g.l.clientHeight;
    const within = (v) => Math.min(Math.max(v, 0), max);
    if (Math.abs(within(g.l.scrollTop) - within(g.top)) > 2) return;
    const quick = window.performance.now() - g.t < 280;
    if (!(Math.abs(dy) > 48 || (quick && Math.abs(dy) > 22))) return;
    if (dy > 0 && g.atEnd) step(1);
    else if (dy < 0 && g.atTop) step(-1);
  }
  window.addEventListener('touchend', (ev) => {
    const t = ev.changedTouches[0];
    endSwipe(t ? t.clientX : null, t ? t.clientY : null);
  }, { passive: true });
  window.addEventListener('touchcancel', () => { if (swipe) endSwipe(swipe.lx, swipe.ly); }, { passive: true });

  /* ---------- Pinned layout: one gesture or key press moves exactly one scene ---------- */
  let lastKeyStep = 0;
  function step(delta) {
    const i = Math.max(0, Math.min(scenes.length - 1, scenes.indexOf(active) + delta));
    const s = scenes[i];
    if (s === active) return;
    scrollToScene(s);
    setScene(s, false);
    const url = s === scenes[0] ? window.location.pathname + window.location.search : '#' + s.id;
    history.replaceState(null, '', url);
    const f = document.activeElement;
    if (f && f !== document.body && f.closest && f.closest('.scene')) {
      s.setAttribute('tabindex', '-1');
      s.focus({ preventScroll: true });
    }
  }
  let lastWheel = 0;
  let lastStep = 0;
  let prevAbs = 0;
  let peak = 0;
  let ups = 0;
  let bigRise = 0;
  let prevSign = 0;
  let travel = 0;
  let gestureUsed = false;
  window.addEventListener('wheel', (ev) => {
    // sideways swipes stay with the browser (two-finger back/forward)
    if (!pinned || ev.ctrlKey || Math.abs(ev.deltaX) > Math.abs(ev.deltaY)) return;
    ev.preventDefault();
    // the intro owns the wheel while it plays, and the rest of a flick that skipped it is not a new gesture
    if (introOn || window.performance.now() - introWheel < 450) {   // (a flick's tail can pause on a busy frame)
      introWheel = window.performance.now();
      if (introOn && introNext) introNext();
      return;
    }
    const unit = ev.deltaMode === 1 ? 16 : ev.deltaMode === 2 ? window.innerHeight : 1;
    const dy = ev.deltaY * unit;
    const a = Math.abs(dy);
    const sign = Math.sign(dy);
    const now = window.performance.now();
    // a new gesture starts after a pause, or when a fresh flick rises out of a momentum tail:
    // two rises in a row, or one big rise that holds (Chrome merges the first frames of a flick
    // when a frame is dropped); one merged event inside a tail drops straight back and does not count
    ups = a > prevAbs * 1.3 && a > 2 ? ups + 1 : 0;
    const held = bigRise > 0 && a >= bigRise * 0.9;
    bigRise = peak > 0 && a > 8 && a > prevAbs * 2.5 && prevAbs < peak * 0.35 ? a : 0;
    const rising = peak > 0 && ((ups >= 2 && a > 8 && prevAbs < peak * 0.7) || held) && now - lastStep > 300;
    const flip = sign !== 0 && prevSign !== 0 && sign !== prevSign && a > 2; // a momentum tail never turns round
    const notch = a >= 40 && Math.abs(a - prevAbs) < 1 && now - lastStep > 600;  // a mouse wheel rolled steadily
    if (now - lastWheel > 200 || rising || flip || notch) { gestureUsed = false; peak = 0; travel = 0; }
    peak = Math.max(peak, a);
    lastWheel = now;
    prevAbs = a;
    if (sign) prevSign = sign;
    if (gestureUsed) return;
    travel += dy;
    if (Math.abs(travel) < 30) return;
    gestureUsed = true;
    lastStep = now;
    step(travel > 0 ? 1 : -1);
  }, { passive: false });
  // native scrolling (scrollbar drag, Space on a link) settles back onto a scene
  let settleTimer = 0;
  window.addEventListener('scroll', () => {
    if (!pinned) return;
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(() => {
      if (resizing) return;
      const s = currentScene();
      if (Math.abs(s.getBoundingClientRect().top) > 2) { scrollToScene(s); setScene(s, false); }
    }, 160);
  }, { passive: true });
  document.addEventListener('keydown', (ev) => {
    if (!pinned || introOn || ev.defaultPrevented || ev.altKey || ev.ctrlKey || ev.metaKey) return;
    const t = ev.target;
    if (t.closest && t.closest('input, textarea, select, [contenteditable]')) return;
    const onControl = t.closest && t.closest('button, a, summary');
    let d = 0;
    if (ev.repeat && window.performance.now() - lastKeyStep < 700) {
      if (['PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', ' '].includes(ev.key)) ev.preventDefault();
      return;
    }
    if (ev.key === 'PageDown' || ev.key === 'ArrowDown') d = 1;
    else if (ev.key === 'PageUp' || ev.key === 'ArrowUp') d = -1;
    else if (ev.key === ' ' && !onControl) d = ev.shiftKey ? -1 : 1;
    if (!d) return;
    ev.preventDefault();
    lastKeyStep = window.performance.now();
    step(d);
  });

  /* ---------- Layout mode: pin scenes when every scene fits on one screen ---------- */
  function fitsPinned() {
    if (reduced || !finePointer.matches || window.innerWidth < 1024 || window.innerHeight < 560) return false;
    const room = window.innerHeight - (shortQuery.matches ? 136 : 184);
    return scenes.every((s) => {
      let h = 0;
      for (const c of s.querySelector('.layer').children) {
        if (c.classList.contains('foot') || c.offsetParent === null) continue;
        h = Math.max(h, c.getBoundingClientRect().height);
      }
      return h <= room;
    });
  }
  // The four work chapters share one top: each column starts where the tallest of them, centred, would start, so the
  // number and the heading stay in the same place from chapter to chapter. The depth move grows from that corner, so
  // they do not slide in either.
  const workScenes = scenes.filter((s) => s.classList.contains('work'));
  function alignWork() {
    if (!(pinned || paged) || !workScenes.length) { root.style.removeProperty('--work-shift'); root.style.removeProperty('--work-y'); return; }
    const l = layerOf(workScenes[0]);
    const cs = getComputedStyle(l);
    const top = parseFloat(cs.paddingTop);
    const room = l.clientHeight - top - parseFloat(cs.paddingBottom);
    const tallest = Math.max(...workScenes.map((s) => s.querySelector('.col').offsetHeight));
    const shift = Math.max(0, Math.round((room - tallest) / 2));
    root.style.setProperty('--work-shift', shift + 'px');
    root.style.setProperty('--work-y', top + shift + 'px');
  }
  // anchor: put the current scene back in place afterwards (after a resize, or when the layout switches); the first
  // call on load does not (the page is where it should be; on a phone, measuring the hero that early could send the
  // page a screen down: Chrome on iOS, seen with ?debug)
  function setMode(anchor) {
    const want = fitsPinned();
    const wantPaged = !want && !reduced && coarse.matches && window.innerWidth < 1024;
    const switched = want !== pinned || wantPaged !== paged;
    if (switched) {
      landGlide();   // the hero title is about to move
      // switch without animating every layer between the two layouts
      root.classList.add('mode-switch');
      pinned = want;
      paged = wantPaged;
      root.classList.toggle('pinned', pinned);
      root.classList.toggle('paged', paged);
      scenes.forEach((s) => { s.classList.remove('is-active', 'is-live'); layerOf(s).getAnimations().forEach((a) => a.cancel()); });
      if (pinned || paged) scenes.forEach((s) => s.classList.add('is-in'));
      scenes.forEach((s) => { if (s.classList.contains('is-in')) playHeads(s, null); });
      if (active && (pinned || paged)) active.classList.add('is-active', 'is-live');
      if (paged) runMinisOf(active);
      if (pcam) { if (paged && active) camTo(active, true); else { pcam.box.classList.remove('on', 'run'); pcam.shown = false; } }
      void root.offsetHeight;
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => root.classList.remove('mode-switch')));
    }
    sizeMiniLabels();
    alignWork();
    if (active && (anchor || switched)) scrollToScene(active);
    if (paged && pcam && pcam.shown && active && !switched) camTo(active, true);
    thumbPlaced = false;
    placeThumb();
  }
  let resizeTimer = 0;
  let resizeWidth = window.innerWidth;
  window.addEventListener('resize', () => {
    if (window.innerWidth > 720) openMenu(false);
    // mobile browser bars change the height while scrolling; only a real resize re-anchors
    if (window.innerWidth < 1024 && window.innerWidth === resizeWidth) { requestFrame(); return; }
    resizeWidth = window.innerWidth;
    resizing = true;
    window.clearTimeout(settleTimer);
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      setMode(true);
      resizing = false;
      requestFrame();
    }, 150);
  });

  /* ---------- Cross-fade for language changes and flowing-layout jumps ---------- */
  let vt = null;
  let fadeTimer = 0;
  function crossfade(change) {
    if (reduced) { change(); return; }
    if (document.startViewTransition) {
      if (vt) { try { vt.skipTransition(); } catch (e) { /* already done */ } }
      const t = document.startViewTransition(change);
      vt = t;
      t.finished.catch(() => {}).then(() => { if (vt === t) vt = null; });
      return;
    }
    document.body.classList.add('swapping');
    window.clearTimeout(fadeTimer);
    fadeTimer = window.setTimeout(() => {
      change();
      window.requestAnimationFrame(() => document.body.classList.remove('swapping'));
    }, 300);
  }

  function sceneOf(id) {
    const t = id && document.getElementById(id);
    if (!t) return null;
    return t.closest('.scene') || t.querySelector('.scene');
  }
  function hashId() {
    const raw = window.location.hash.slice(1);
    try { return decodeURIComponent(raw); } catch (e) { return raw; }
  }

  function go(id, push) {
    const scene = sceneOf(id);
    if (!scene) return;
    if (push) {
      const url = id === 'top' ? window.location.pathname + window.location.search : '#' + id;
      history.pushState(null, '', url);
    }
    const target = document.getElementById(id);
    const stacked = pinned || paged;
    const jump = () => {
      scrollToScene(scene);
      if (!stacked && target && target !== scene && !target.contains(scene)) {
        window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 110, behavior: 'instant' });
        held = { scene, y: window.scrollY };
      }
      if (!stacked) reveal(scene, false);
      setScene(scene, !stacked);
      exitFade();
    };
    // pinned or paged: the scene change is itself the transition
    if (stacked || scene === active) jump();
    else crossfade(jump);
    scene.setAttribute('tabindex', '-1');
    scene.focus({ preventScroll: true });
  }

  document.addEventListener('click', (ev) => {
    const a = ev.target.closest && ev.target.closest('a[data-go]');
    if (!a || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.button !== 0) return;
    ev.preventDefault();
    openMenu(false);
    go(a.dataset.go, true);
  });
  window.addEventListener('popstate', () => go(hashId() || 'top', false));

  // keyboard focus, find-in-page or a text fragment landing in a hidden scene brings that scene forward
  function bringForward(node) {
    if (!pinned || !node || introOn) return;
    const el = node.nodeType === 1 ? node : node.parentElement;
    const s = el && el.closest && el.closest('.scene');
    if (s && s !== active) {
      scrollToScene(s);
      setScene(s, false);
      history.replaceState(null, '', s === scenes[0] ? window.location.pathname + window.location.search : '#' + s.id);
    }
  }
  document.addEventListener('focusin', (ev) => bringForward(ev.target));
  document.addEventListener('selectionchange', () => {
    const sel = window.getSelection && window.getSelection();
    if (sel && sel.rangeCount && !sel.isCollapsed) bringForward(sel.anchorNode);
  });

  /* ---------- Language ---------- */
  function applyLang(l) {
    root.setAttribute('data-lang', l);
    root.lang = l === 'zh' ? 'zh-CN' : 'en';
    document.title = l === 'zh' ? '郑其昌' : 'Qichang Zheng';
    langButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === l)));
    document.querySelectorAll('img[data-alt-en]').forEach((img) => {
      img.alt = l === 'zh' ? img.dataset.altZh : img.dataset.altEn;
    });
    links.setAttribute('aria-label', l === 'zh' ? '页面章节' : 'Sections');
    document.querySelectorAll('.diagram .lbl[data-zh]').forEach((t) => {
      if (!t.dataset.en) t.dataset.en = t.textContent;
      t.textContent = l === 'zh' ? t.dataset.zh : t.dataset.en;
    });
    paintChapter();
    tick();
    placeThumb();
    labelHeads(l);
    kernHeads();
  }
  let pendingLang = null;
  langButtons.forEach((b) => {
    b.addEventListener('click', () => {
      const l = b.dataset.lang;
      if (l === (pendingLang || lang())) return;
      pendingLang = l;
      store.set('lang', l);
      crossfade(() => {
        if (pendingLang === l) pendingLang = null;
        // keep the reading position: the current scene's heading stays where it was
        const ref = active && active.querySelector('h1, h2:not(.sr), h3, .big');
        const before = ref ? ref.getBoundingClientRect().top : 0;
        applyLang(l);
        setMode(true);
        if (!pinned && ref) window.scrollBy(0, ref.getBoundingClientRect().top - before);
        held = active ? { scene: active, y: window.scrollY } : null;
        frame();
      });
    });
  });

  /* ---------- Small-screen menu ---------- */
  function openMenu(open, focusFirst) {
    if (!open && !nav.classList.contains('open')) return;
    nav.classList.toggle('open', open);
    menu.setAttribute('aria-expanded', String(open));
    if (open && focusFirst) navLinks[0].focus();
  }
  menu.addEventListener('click', (ev) => openMenu(!nav.classList.contains('open'), ev.detail === 0));
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && nav.classList.contains('open')) { openMenu(false); menu.focus(); }
  });
  document.addEventListener('click', (ev) => { if (!nav.contains(ev.target)) openMenu(false); });
  nav.addEventListener('focusout', (ev) => { if (!nav.contains(ev.relatedTarget)) openMenu(false); });

  /* ---------- Shanghai local time ---------- */
  const clock = document.querySelector('.clock');
  const time = clock && clock.querySelector('.time');
  function tick() {
    if (!time) return;
    try {
      time.textContent = new Intl.DateTimeFormat(lang() === 'zh' ? 'zh-CN' : 'en-GB', {
        hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Shanghai',
      }).format(new Date());
      clock.hidden = false;
    } catch (e) { clock.hidden = true; }
  }
  window.setInterval(tick, 30000);

  /* ---------- Reduced motion can change at runtime ---------- */
  const onRm = () => {
    reduced = rmQuery.matches;
    if (reduced) {
      scenes.forEach((s) => s.classList.add('is-in'));
      lines.forEach(clearFade);
      root.classList.add('drawn', 'settled');
    }
    setMode(true);
    requestFrame();
    wakeShakes();
  };
  if (rmQuery.addEventListener) rmQuery.addEventListener('change', onRm);

  /* ---------- Intro: a few greetings, then "我是郑其昌"; the name travels into the hero ---------- */
  const introEl = document.querySelector('.intro');
  let introOn = root.classList.contains('intro-on') && Boolean(introEl) && canAnimate();
  let introNext = null;
  let introWheel = 0;
  // while the intro plays, input does not scroll the page: it moves the intro straight to the name
  function introInput(ev) {
    if (!introOn) {
      // the rest of a flick that skipped the intro is not a new gesture
      if (ev.type === 'wheel' && window.performance.now() - introWheel < 450) {
        introWheel = window.performance.now();
        if (ev.cancelable) ev.preventDefault();
        ev.stopImmediatePropagation();
      }
      return;
    }
    if (ev.type === 'wheel') introWheel = window.performance.now();
    if (ev.type === 'keydown' && ['Tab', 'Shift', 'Alt', 'Control', 'Meta'].includes(ev.key)) return;
    if (ev.cancelable) ev.preventDefault();
    ev.stopImmediatePropagation();
    if (introNext) introNext();
  }
  ['wheel', 'touchmove', 'keydown', 'pointerdown'].forEach((t) => window.addEventListener(t, introInput, { capture: true, passive: false }));

  // each intro word travels in a straight line onto the same word of the hero title,
  // slow at both ends and quicker in the middle (the owner's call: no corner in the path)
  let gliding = false;
  const GLIDE_MS = 1300;
  const textRange = document.createRange();
  function textBox(el) { textRange.selectNodeContents(el); return textRange.getBoundingClientRect(); }
  // an empty inline-block sits with its bottom on the line's baseline
  function baseline(el) {
    const probe = document.createElement('span');
    probe.style.cssText = 'display:inline-block;width:0;height:0;';
    el.appendChild(probe);
    const y = probe.getBoundingClientRect().top;
    probe.remove();
    return y;
  }
  function glide(from, to, delay, onEnd) {
    let last = null;
    // a name that lands on two lines: the second word sets off a little later, so it passes under
    // the first instead of through it; on one line both words travel together
    const tops = to.map((t) => t.getBoundingClientRect().top);
    const stagger = tops.length > 1 && Math.abs(tops[1] - tops[0]) > 4 ? 140 : 0;
    from.forEach((w, i) => {
      const target = to[i];
      if (!target) return;
      // land the letters, not the boxes: the typed line and the hero title have different line heights,
      // so their boxes hold the glyphs at different depths (matching boxes left the name ~8px low,
      // and it jumped up when the real title took over)
      const a = w.getBoundingClientRect();
      const at = textBox(w);
      const bt = textBox(target);
      const k = at.width ? bt.width / at.width : 1;
      const dx = bt.left - a.left - (at.left - a.left) * k;   // the word scales about its top-left corner
      const dy = baseline(target) - a.top - (baseline(w) - a.top) * k;   // baseline onto baseline
      last = w.animate(
        [{ transform: 'translate(0px, 0px) scale(1)' }, { transform: 'translate(' + dx + 'px, ' + dy + 'px) scale(' + k + ')' }],
        { duration: GLIDE_MS, delay: delay + i * stagger, easing: 'cubic-bezier(.65, 0, .35, 1)', fill: 'forwards' }
      );
    });
    gliding = true;
    const end = () => { gliding = false; onEnd(); };
    if (last) last.finished.then(end, end);
    else window.setTimeout(end, GLIDE_MS + 200);
  }
  // the hero title must be on screen for the glide to mean anything (a scroll leak or a text-fragment link)
  function canGlide(targets) {
    if (window.scrollY > 2 || active !== scenes[0] || !targets.length) return false;
    const r = targets[0].getBoundingClientRect();
    return r.bottom > 0 && r.top < window.innerHeight;
  }
  // a layout change mid-glide (a resize, a rotation, the pinned layout switching on or off) would land the name on
  // stale coordinates: land it now. Only the finite animations: the caret blinks forever and finish() throws on it,
  // which used to stop the loop before it reached the glide
  function landGlide() {
    if (!introOn || !gliding) return;
    introEl.getAnimations({ subtree: true }).forEach((a) => {
      if (a.effect && a.effect.getComputedTiming().endTime !== Infinity) a.finish();
    });
  }
  window.addEventListener('resize', landGlide);

  // three lines typed out; then everything but the name leaves and the name travels (and grows)
  // into the hero title
  function playTypeIntro(onMove, onDone) {
    const zh = lang() === 'zh';
    const block = introEl.querySelector('.typer');
    const rows = Array.from(block.querySelectorAll('.ty'));
    // line 1 is split so the name can be handed over word by word
    const first = zh ? [['pre', '你好，我是'], ['w', '郑其昌']] : [['pre', 'Hi, I’m'], ['sp', ' '], ['w', 'Qichang'], ['sp', ' '], ['w', 'Zheng']];
    // lines 2 and 3; 'hl' parts are set in the drawing's blue
    const rest = zh
      ? [[['', '一名 '], ['hl', 'Agent 工程师']], [['', '欢迎来到我的主页']]]
      : [[['', 'An '], ['hl', 'AI agent engineer']], [['', 'Welcome to my homepage']]];
    const perChar = zh ? 80 : 38;
    const chars = [];
    const addChars = (parent, text, r) => Array.from(text).forEach((ch) => {
      const c = document.createElement('span');
      c.className = 'c';
      c.textContent = ch;
      parent.appendChild(c);
      chars.push({ r, el: c });
    });
    // every character is laid out from the start (invisible), so nothing shifts while it types
    rows.forEach((row) => { row.textContent = ''; });
    let nm = null;
    first.forEach(([kind, text]) => {
      if (kind === 'sp') { addChars(nm || rows[0], text, 0); return; }
      if (kind === 'pre') { const pre = document.createElement('span'); pre.className = 'pre'; rows[0].appendChild(pre); addChars(pre, text, 0); return; }
      if (!nm) { nm = document.createElement('span'); nm.className = 'nm'; rows[0].appendChild(nm); }
      const w = document.createElement('span');
      w.className = 'w';
      nm.appendChild(w);
      addChars(w, text, 0);
    });
    rest.forEach((parts, k) => parts.forEach(([kind, text]) => {
      let parent = rows[k + 1];
      if (kind === 'hl') { parent = document.createElement('span'); parent.className = 'hl'; rows[k + 1].appendChild(parent); }
      addChars(parent, text, k + 1);
    }));
    const caret = document.createElement('span');
    caret.className = 'caret';
    rows[0].insertBefore(caret, rows[0].firstChild);
    block.classList.add('typing');
    const timers = [];
    let i = 0;
    let typed = false;
    let moving = false;
    function tick() {
      if (i >= chars.length) { finish(); return; }
      const c = chars[i];
      c.el.classList.add('on');
      c.el.after(caret);
      i += 1;
      const next = chars[i];
      let d = perChar;
      if (next && next.r !== c.r) d = 380;                         // a breath at the end of each line
      else if ('，,'.includes(c.el.textContent)) d = perChar * 3;
      timers.push(window.setTimeout(tick, d));
    }
    function finish(hold) {
      if (typed) return;
      typed = true;
      timers.forEach((x) => window.clearTimeout(x));
      chars.forEach((c) => c.el.classList.add('on'));
      chars[chars.length - 1].el.after(caret);
      block.classList.remove('typing');
      timers.push(window.setTimeout(move, hold == null ? 750 : hold));
    }
    function move() {
      if (moving) return;
      moving = true;
      timers.forEach((x) => window.clearTimeout(x));
      onMove();
      // everything but the name fades away, slowly enough to be seen leaving (at 420 ms, mostly gone in the first
      // 200, it read as a blink): the caret goes first, then the lines, softening as they go; the name sets off
      // once they are half gone
      caret.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, easing: 'ease-out', fill: 'forwards' });
      [rows[0].querySelector('.pre'), rows[1], rows[2]].forEach((el) => el.animate(
        [{ opacity: 1, filter: 'blur(0px)' }, { opacity: 0, filter: 'blur(3px)' }],
        { duration: 820, easing: 'cubic-bezier(.4, 0, .25, 1)', fill: 'forwards' }
      ));
      const from = Array.from(rows[0].querySelectorAll('.w'));
      const to = Array.from(document.querySelectorAll('#name > ' + (zh ? '.zh' : '.en') + ' .w'));
      // a page that moved behind the curtain anyway (a phone's touch scroll that could not be stopped) goes back to
      // the hero first, so the name still lands on it
      toTop();
      if (!canGlide(to)) {
        introEl.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 700, easing: 'cubic-bezier(.4, 0, .25, 1)', fill: 'forwards' }).finished.then(onDone, onDone);
        return;
      }
      introEl.querySelector('.curtain').animate([{ opacity: 1 }, { opacity: 0 }], { duration: 900, delay: 460, easing: 'ease', fill: 'forwards' });
      glide(from, to, 380, onDone);
    }
    timers.push(window.setTimeout(tick, 350));
    introNext = () => { if (!typed) finish(300); else move(); };  // input completes the lines and moves on
  }

  /* ---------- First paint ---------- */
  root.setAttribute('data-dir', 'down');
  applyLang(lang());
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { heads.forEach((x) => { x.kerned = false; }); kernHeads(); });
  }
  if (pinned) scenes.forEach((s) => s.classList.add('is-in'));
  const start = sceneOf(hashId());
  function land() {
    if (!start) return;
    scrollToScene(start);
    const t = document.getElementById(hashId());
    if (!pinned && t && t !== start && !t.contains(start)) {
      window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 110, behavior: 'instant' });
      held = { scene: start, y: window.scrollY };
    }
  }
  if (start) land();
  else window.scrollTo(0, 0);
  // the browser's own jump to #fragment can arrive after this script; land again unless the visitor has moved
  let touched = false;
  ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach((t) => window.addEventListener(t, () => { touched = true; }, { once: true, passive: true }));
  window.addEventListener('load', () => { if (start && !touched) { land(); frame(); exitFade(); } });
  const first = start || currentScene();
  setScene(first, true);
  setMode();
  if (!(introOn && first === scenes[0])) {
    introOn = false;
    root.classList.remove('intro-on');
  }
  // while the intro runs, the page behind the curtain can be neither clicked nor tabbed into
  const behind = [nav, document.getElementById('main'), document.querySelector('.skip')].filter(Boolean);
  const setBehind = (on) => behind.forEach((el) => { el.inert = on; });
  /* ---------- First paint: the drawing is sketched in, as if drawn live ---------- */
  // Every part of the drawing is drawn at the same time, the platform and the Agent Team alike (owner: not left to
  // right, no order between the two panels, many parts at once, and slowly): each line and box is traced by its own
  // pen (a bright dot at its tip on the longer strokes), the frames and boxes first, what sits inside them a moment
  // later, the connecting lines last; each start is nudged a little, like more than one hand. A box's label and fill
  // arrive once it is closed. Returns when the last stroke ends (s after the drawing starts); the page settles only
  // after that (settleLater).
  const PEN_SPEED = 240;        // drawing units per second along a stroke
  const PEN_EASE = 'cubic-bezier(.4, .1, .35, 1)';
  function sketch(svg, t0) {
    if (!svg || !svg.getBoundingClientRect().width) return 0;
    // (the product panels' frames are .draw too, from gen.py, so they are hidden from the very first paint)
    const items = Array.from(svg.querySelectorAll('.draw')).map((el, i) => {
      const b = el.getBBox();
      const grp = el.closest('.grp');
      const inner = el.classList.contains('slot') || el.classList.contains('agent') ||
        (!el.classList.contains('tint') && Boolean(grp && grp.querySelector('.tint')) && !grp.classList.contains('g-team'));
      const tier = el.classList.contains('bound') ? 0 : el.classList.contains('e') ? 1.0 : inner ? 0.6 : 0.15;
      return { el, b, len: el.getTotalLength(), tier, jitter: ((i * 37) % 11) / 11 * 0.22 };
    });
    let end = t0;
    items.forEach((it) => {
      const bound = it.el.classList.contains('bound');
      const dur = bound ? 3.2 : Math.min(2.2, Math.max(1.2, it.len / PEN_SPEED));
      const t = t0 + it.tier + it.jitter;
      it.end = t + dur;
      it.el.style.setProperty('--dd', t.toFixed(3) + 's');
      it.el.style.setProperty('--dur', dur.toFixed(3) + 's');
      it.el.style.setProperty('--pen', PEN_EASE);
      it.el.style.setProperty('--fd', (t + dur * 0.8).toFixed(3) + 's');
      if (bound) it.el.style.setProperty('--ld', t.toFixed(3) + 's');
      if (it.len >= 300) {
        const pen = document.createElementNS(it.el.namespaceURI, 'path');
        pen.setAttribute('d', it.el.getAttribute('d'));
        pen.setAttribute('pathLength', '1');
        pen.setAttribute('class', 'pen');
        pen.style.animationDelay = t.toFixed(3) + 's';
        pen.style.animationDuration = dur.toFixed(3) + 's';
        pen.style.animationTimingFunction = PEN_EASE;
        it.el.after(pen);
      }
      end = Math.max(end, it.end);
    });
    // labels, the Tracing bars and the pool's lights: when the box they sit in is closed (the smallest one around
    // them); dashed lines with the connecting lines
    const boxes = items.filter((it) => !it.el.classList.contains('e') || it.el.classList.contains('bound'));
    svg.querySelectorAll('.lbl, .dash:not(.bound), .span, .leds, .acct-name').forEach((el) => {
      let when = t0 + 1.8;
      if (!el.classList.contains('e')) {
        const b = el.getBBox();
        const cx = b.x + b.width / 2;
        const cy = b.y + b.height / 2;
        let best = null;
        boxes.forEach((it) => {
          const r = it.b;
          if (cx < r.x || cx > r.x + r.width || cy < r.y || cy > r.y + r.height) return;
          if (!best || r.width * r.height < best.b.width * best.b.height) best = it;
        });
        if (best) when = best.el.classList.contains('bound') ? t0 + 1.5 : best.end;
      }
      el.style.setProperty('--ld', (when + 0.05).toFixed(3) + 's');
    });
    return end;
  }
  let penEnd = 0;
  let drawnAt = 0;
  function markDrawn() {
    drawnAt = window.performance.now();
    root.classList.add('drawn');
  }
  // the loops start (settled) only once the last stroke is down
  function settleLater(ms) {
    const wait = Math.max(ms, drawnAt + penEnd * 1000 + 400 - window.performance.now());
    window.setTimeout(() => {
      root.classList.add('settled');
      document.querySelectorAll('.diagram .pen').forEach((p) => p.remove());
    }, wait);
  }
  function sketchAll(t0) {
    if (!canAnimate()) return;
    const heroMini = minis.find((m) => m.box.dataset.hl === 'hero');
    penEnd = Math.max(sketch(drawing, t0), heroMini ? sketch(heroMini.svg, t0) : 0);
  }
  function toTop() {
    if (window.scrollY <= 2 && active === scenes[0]) return;
    window.scrollTo(0, 0);
    setScene(scenes[0], true);
  }
  function introDone() {
    // the intro always hands over to the hero: if anything moved the page while it played, it goes back to the top
    toTop();
    introOn = false;
    setBehind(false);
    root.classList.remove('intro-on', 'intro-out', 'intro-run');
    introEl.remove();
    const alt = document.querySelector('#name .alt');
    if (alt && canAnimate()) alt.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 700, easing: EASE });
    settleLater(2600);
  }
  if (reduced) {
    scenes.forEach((s) => s.classList.add('is-in'));
    root.classList.add('drawn', 'settled');
  } else if (introOn) {
    root.classList.add('intro-run');
    setBehind(true);
    first.classList.add('is-in');
    // the drawing and the rest of the hero arrive while the name moves; the pen starts as the curtain lifts
    sketchAll(1.3);
    const onMove = () => { markDrawn(); root.classList.add('intro-out'); };
    playTypeIntro(onMove, introDone);
  } else {
    if (pinned) zoomIn(first, 0.96, 150, 1200);
    else reveal(first, true, 150);
    sketchAll(0.15);
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => { markDrawn(); settleLater(3600); }));
  }
  exitFade();
})();
