export function initRevealAnimations(root = document) {
  const items = Array.from(root.querySelectorAll("[data-reveal]"));
  if (!items.length) return () => {};

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  items.forEach((element) => {
    const delay = Number(element.dataset.revealDelay || 0);
    element.style.setProperty("--reveal-delay", `${Math.max(0, delay)}ms`);
  });

  if (prefersReducedMotion || typeof IntersectionObserver === "undefined") {
    items.forEach((element) => {
      element.classList.add("reveal-ready", "is-visible");
    });
    return () => {};
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.16,
      rootMargin: "0px 0px -8% 0px",
    }
  );

  items.forEach((element) => {
    element.classList.add("reveal-ready");
    observer.observe(element);
  });

  return () => observer.disconnect();
}
