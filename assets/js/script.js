"use strict";

/* ─────────────────────────────────────────
   Scroll-reveal motion class
───────────────────────────────────────── */
document.body.classList.add("js-motion");

/* ─────────────────────────────────────────
   Year auto-update
───────────────────────────────────────── */
const yearEl = document.querySelector("#year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ─────────────────────────────────────────
   Mobile navigation
───────────────────────────────────────── */
const menuButton = document.querySelector(".menu-toggle");
const siteNav    = document.querySelector(".site-nav");

if (menuButton && siteNav) {
  menuButton.addEventListener("click", () => {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!isOpen));
    menuButton.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
    siteNav.classList.toggle("is-open", !isOpen);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || menuButton.getAttribute("aria-expanded") !== "true") return;
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open navigation");
    siteNav.classList.remove("is-open");
    menuButton.focus();
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.setAttribute("aria-label", "Open navigation");
      siteNav.classList.remove("is-open");
    });
  });
}

/* ─────────────────────────────────────────
   Sticky header scroll class
───────────────────────────────────────── */
const header = document.querySelector(".site-header");
if (header) {
  window.addEventListener("scroll", () => {
    header.classList.toggle("scrolled", window.scrollY > 30);
  }, { passive: true });
}

/* ─────────────────────────────────────────
   IntersectionObserver: nav highlighting + reveal
───────────────────────────────────────── */
if ("IntersectionObserver" in window) {

  /* Active nav link */
  const navLinks   = [...document.querySelectorAll(".nav-link")];
  const navSections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => {
        link.classList.toggle(
          "active",
          link.getAttribute("href") === `#${entry.target.id}`
        );
      });
    });
  }, { rootMargin: "-25% 0px -60% 0px" });

  navSections.forEach((section) => navObserver.observe(section));

  /* Scroll-reveal */
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.1 });

  document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

} else {
  /* Fallback: show everything immediately */
  document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-visible"));
}

/* ─────────────────────────────────────────
   Custom cursor (desktop only)
───────────────────────────────────────── */
const cursor = document.getElementById("cursor");

if (cursor && window.matchMedia("(pointer: fine)").matches) {
  let mouseX = 0, mouseY = 0;
  let curX = 0, curY = 0;
  let rafId = null;

  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursor.classList.add("is-visible");
    if (!rafId) rafId = requestAnimationFrame(animateCursor);
  }, { passive: true });

  document.addEventListener("mouseleave", () => {
    cursor.classList.remove("is-visible");
  });

  function animateCursor() {
    const ease = 0.18;
    curX += (mouseX - curX) * ease;
    curY += (mouseY - curY) * ease;
    cursor.style.left = curX + "px";
    cursor.style.top  = curY + "px";
    rafId = requestAnimationFrame(animateCursor);
  }

  /* Grow cursor on interactive elements */
  const interactiveTargets = "a, button, .project-card, .stack-pills span, .tag-list span";
  document.querySelectorAll(interactiveTargets).forEach((el) => {
    el.addEventListener("mouseenter", () => cursor.classList.add("is-hovering"));
    el.addEventListener("mouseleave", () => cursor.classList.remove("is-hovering"));
  });
}
