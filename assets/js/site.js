/* Publication filters and copy buttons. Without this file every publication
   still shows, and only these conveniences are missing. */
(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  /* Publication filters. A link such as research.html?topic=comparison opens filtered. */
  const list = $("[data-pub-list]");

  if (list) {
    const items = $$(".pub", list);
    const count = $("[data-pub-count]");
    const empty = $("[data-pub-empty]");
    const topicButtons = $$("[data-filter-topic]");
    const typeButtons = $$("[data-filter-type]");
    const validTopics = topicButtons.map((button) => button.dataset.filterTopic);
    const requested = new URLSearchParams(location.search).get("topic");
    const state = { topic: validTopics.includes(requested) ? requested : "all", type: "all" };

    function render() {
      let shown = 0;
      for (const item of items) {
        const matches = (state.topic === "all" || item.dataset.topics.split(" ").includes(state.topic))
          && (state.type === "all" || item.dataset.type === state.type);
        item.hidden = !matches;
        if (matches) shown++;
      }
      count.textContent = shown === 1 ? "Showing 1 publication" : `Showing ${shown} publications`;
      empty.hidden = shown > 0;
      topicButtons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.filterTopic === state.topic)));
      typeButtons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.filterType === state.type)));
    }

    function update(change) {
      Object.assign(state, change);
      const url = new URL(location.href);
      if (state.topic === "all") url.searchParams.delete("topic");
      else url.searchParams.set("topic", state.topic);
      history.replaceState(null, "", url);
      render();
    }

    topicButtons.forEach((b) => b.addEventListener("click", () => update({ topic: b.dataset.filterTopic })));
    typeButtons.forEach((b) => b.addEventListener("click", () => update({ type: b.dataset.filterType })));
    $("[data-pub-reset]").addEventListener("click", () => update({ topic: "all", type: "all" }));
    render();
  }

  /* Copy buttons */
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
})();
