/* Interface behaviour, hand-written with no libraries. Every page reads properly
   without this file: it adds filtering, animation, dark mode and copy buttons. */
(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const root = document.documentElement;
  const motion = matchMedia("(prefers-reduced-motion: no-preference)");
  const EASE = "cubic-bezier(0.2, 0.7, 0.2, 1)";

  /* ---------- Dark mode, remembered between visits ---------- */

  const themeButton = $("[data-theme-toggle]");
  const themeMeta = $('meta[name="theme-color"]');

  function showTheme(dark) {
    if (themeButton) themeButton.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    if (themeMeta) themeMeta.content = dark ? "#211a2e" : "#ffffff";
  }

  showTheme(root.dataset.theme === "dark");

  if (themeButton) {
    themeButton.addEventListener("click", () => {
      const dark = root.dataset.theme !== "dark";
      root.classList.add("theme-changing");
      if (dark) root.dataset.theme = "dark";
      else delete root.dataset.theme;
      showTheme(dark);
      try { localStorage.setItem("theme", dark ? "dark" : "light"); } catch { /* Private browsing: the choice lasts for this page only. */ }
      setTimeout(() => root.classList.remove("theme-changing"), 350);
    });
  }

  /* ---------- Header shadow once the page has scrolled ---------- */

  const header = $("[data-header]");
  if (header) {
    const update = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
    addEventListener("scroll", update, { passive: true });
    update();
  }

  /* ---------- Animated filtering ----------
     FLIP: record where each card is (First), change the page, measure where it
     ended up (Last), then animate from the old position to the new one. */

  function animateChange(list, items, change) {
    if (!motion.matches) {
      change();
      return;
    }

    $$(".exit-clone", list).forEach((clone) => clone.remove());
    list.getAnimations({ subtree: true }).forEach((animation) => animation.cancel());

    const listBox = list.getBoundingClientRect();
    const oldHeight = listBox.height;
    const first = new Map();
    for (const item of items) {
      if (!item.hidden) first.set(item, item.getBoundingClientRect());
    }

    change();

    const newHeight = list.getBoundingClientRect().height;

    for (const item of items) {
      if (item.hidden) continue;
      const old = first.get(item);
      if (old) {
        const box = item.getBoundingClientRect();
        const dx = old.left - box.left;
        const dy = old.top - box.top;
        if (dx || dy) {
          item.animate(
            [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }],
            { duration: 420, easing: EASE }
          );
        }
      } else {
        item.animate(
          [{ opacity: 0, transform: "scale(0.96)" }, { opacity: 1, transform: "none" }],
          { duration: 340, delay: 100, easing: EASE, fill: "backwards" }
        );
      }
    }

    // Cards that are leaving fade out from where they stood, as temporary copies.
    for (const [item, box] of first) {
      if (!item.hidden) continue;
      const clone = item.cloneNode(true);
      clone.hidden = false;
      clone.classList.add("exit-clone");
      clone.setAttribute("aria-hidden", "true");
      clone.inert = true;
      $$("[id]", clone).forEach((element) => element.removeAttribute("id"));
      Object.assign(clone.style, {
        position: "absolute",
        margin: "0",
        left: `${box.left - listBox.left}px`,
        top: `${box.top - listBox.top}px`,
        width: `${box.width}px`,
        height: `${box.height}px`,
        zIndex: "0",
        pointerEvents: "none",
      });
      list.append(clone);
      clone.animate(
        [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "scale(0.96)" }],
        { duration: 220, easing: "ease-out", fill: "forwards" }
      ).onfinish = () => clone.remove();
    }

    // The list's own height eases too, so the content below it does not jump.
    if (oldHeight !== newHeight) {
      list.animate(
        [{ height: `${oldHeight}px` }, { height: `${newHeight}px` }],
        { duration: 420, easing: EASE }
      );
    }
  }

  function setUpFilters(filterRoot) {
    const list = $("[data-filter-list]", filterRoot);
    const items = [...list.children];
    const buttons = $$("[data-filter]", filterRoot);
    const search = $("[data-filter-search]", filterRoot);
    const sort = $("[data-filter-sort]", filterRoot);
    const count = $("[data-filter-count]", filterRoot);
    const empty = $("[data-filter-empty]", filterRoot);
    const reset = $("[data-filter-reset]", filterRoot);
    const noun = filterRoot.dataset.noun;

    const keys = [...new Set(buttons.map((button) => button.dataset.filter))];
    const state = { query: "", order: "new" };
    const params = new URLSearchParams(location.search);

    for (const key of keys) {
      const valid = buttons.filter((b) => b.dataset.filter === key).map((b) => b.dataset.value);
      state[key] = valid.includes(params.get(key)) ? params.get(key) : "all";
    }

    // Text to search: the visible title, authors and abstract, not the button labels.
    const searchText = new Map(items.map((item) => [
      item,
      $$(".pub-title, .pub-meta, .abstract", item).map((part) => part.textContent).join(" ").toLowerCase(),
    ]));

    function matches(item, values) {
      const words = values.query.toLowerCase().split(/\s+/).filter(Boolean);
      const text = searchText.get(item);
      return words.every((word) => text.includes(word))
        && keys.every((key) => values[key] === "all" || item.dataset[key].split(" ").includes(values[key]));
    }

    // Each button shows how many cards it would leave, given the other filters.
    buttons.forEach((button) => {
      const number = document.createElement("span");
      number.className = "pill-count";
      number.setAttribute("aria-hidden", "true");
      button.append(number);
    });

    function render() {
      let shown = 0;
      const ordered = [...items].sort((a, b) => {
        const difference = Number(a.dataset.order) - Number(b.dataset.order);
        return state.order === "new" ? difference : -difference;
      });
      for (const item of ordered) {
        item.hidden = !matches(item, state);
        if (!item.hidden) shown++;
        list.append(item);
      }

      if (count) {
        count.textContent = shown === items.length
          ? `Showing all ${items.length} ${noun}s`
          : `Showing ${shown} of ${items.length} ${noun}s`;
      }
      if (empty) empty.hidden = shown > 0;

      for (const button of buttons) {
        const { filter: key, value } = button.dataset;
        const number = items.filter((item) => matches(item, { ...state, [key]: value })).length;
        button.querySelector(".pill-count").textContent = number;
        button.classList.toggle("is-empty", number === 0);
        button.setAttribute("aria-pressed", String(state[key] === value));
      }
    }

    function update(change) {
      Object.assign(state, change);
      const url = new URL(location.href);
      for (const key of keys) {
        if (state[key] === "all") url.searchParams.delete(key);
        else url.searchParams.set(key, state[key]);
      }
      history.replaceState(null, "", url);
      animateChange(list, items, render);
    }

    buttons.forEach((button) => {
      button.addEventListener("click", () => update({ [button.dataset.filter]: button.dataset.value }));
    });
    if (search) search.addEventListener("input", () => update({ query: search.value.trim() }));
    if (sort) sort.addEventListener("change", () => update({ order: sort.value }));
    if (reset) {
      reset.addEventListener("click", () => {
        if (search) search.value = "";
        const cleared = { query: "" };
        keys.forEach((key) => { cleared[key] = "all"; });
        update(cleared);
      });
    }

    render();
  }

  $$("[data-filter-root]").forEach(setUpFilters);

  /* ---------- Abstracts ---------- */

  $$("[data-abstract]").forEach((button) => {
    const panel = document.getElementById(button.getAttribute("aria-controls"));
    button.addEventListener("click", () => {
      const open = button.getAttribute("aria-expanded") !== "true";
      button.setAttribute("aria-expanded", String(open));
      button.textContent = open ? "Hide abstract" : "Show abstract";
      panel.classList.toggle("is-open", open);
    });
  });

  /* ---------- Copy buttons ---------- */

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const field = document.createElement("textarea");
    field.value = text;
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.append(field);
    field.select();
    const copied = document.execCommand("copy");
    field.remove();
    if (!copied) throw new Error("Copy was blocked");
  }

  $$("[data-copy]").forEach((button) => {
    const label = button.textContent;
    button.addEventListener("click", async () => {
      try {
        await copyText(button.dataset.copy);
        button.textContent = "Copied";
      } catch {
        button.textContent = "Copy failed";
      }
      clearTimeout(button.resetTimer);
      button.resetTimer = setTimeout(() => { button.textContent = label; }, 1800);
    });
  });

  /* ---------- Figure viewer, using the browser's own modal dialog ---------- */

  $$("[data-viewer]").forEach((link) => {
    const image = $("img", link);
    const caption = link.closest("figure")?.querySelector("figcaption");

    link.addEventListener("click", (event) => {
      event.preventDefault();

      const dialog = document.createElement("dialog");
      dialog.className = "viewer";
      dialog.setAttribute("aria-label", "Enlarged figure");

      const large = document.createElement("img");
      large.src = link.href;
      large.alt = image.alt;

      const foot = document.createElement("div");
      foot.className = "viewer-foot";
      const text = document.createElement("p");
      text.textContent = caption ? caption.textContent : "";
      const close = document.createElement("button");
      close.className = "button";
      close.type = "button";
      close.textContent = "Close";
      close.addEventListener("click", () => dialog.close());
      foot.append(text, close);

      dialog.append(large, foot);
      dialog.addEventListener("click", (click) => { if (click.target === dialog) dialog.close(); });
      dialog.addEventListener("close", () => { dialog.remove(); link.focus(); });
      document.body.append(dialog);
      dialog.showModal();
    });
  });

  /* ---------- Home page sections rise into place once ---------- */

  const revealTargets = $$("[data-reveal]");
  if (revealTargets.length && motion.matches && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
        // Hand the element back, so its hover transitions run without the reveal delay.
        setTimeout(() => {
          entry.target.classList.remove("reveal", "is-visible");
          entry.target.style.removeProperty("--delay");
        }, 900);
      }
    }, { rootMargin: "0px 0px -8% 0px" });

    revealTargets.forEach((element) => {
      const siblings = [...element.parentElement.children].filter((child) => child.hasAttribute("data-reveal"));
      element.style.setProperty("--delay", `${siblings.indexOf(element) * 70}ms`);
      element.classList.add("reveal");
      observer.observe(element);
    });
  }
})();
