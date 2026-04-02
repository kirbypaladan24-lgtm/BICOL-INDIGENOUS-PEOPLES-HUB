export function initRevealAnimations(root = document) {
  const items = Array.from(root.querySelectorAll("[data-reveal]"));
  if (!items.length) return () => {};

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobileLikeViewport =
    typeof window !== "undefined" &&
    window.matchMedia &&
    (window.matchMedia("(max-width: 820px)").matches ||
      window.matchMedia("(pointer: coarse)").matches);

  const revealElement = (element) => {
    element.classList.add("reveal-ready", "is-visible");
  };

  const isLikelyAlreadyVisible = (element) => {
    if (typeof window === "undefined" || typeof element?.getBoundingClientRect !== "function") {
      return true;
    }

    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    if (!viewportHeight) return true;
    return rect.bottom > 0 && rect.top < viewportHeight * 0.96;
  };

  items.forEach((element) => {
    const delay = Number(element.dataset.revealDelay || 0);
    element.style.setProperty("--reveal-delay", `${Math.max(0, delay)}ms`);
  });

  if (prefersReducedMotion || isMobileLikeViewport || typeof IntersectionObserver === "undefined") {
    items.forEach(revealElement);
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

  let observedCount = 0;
  items.forEach((element) => {
    if (isLikelyAlreadyVisible(element)) {
      revealElement(element);
      return;
    }

    element.classList.add("reveal-ready");
    observer.observe(element);
    observedCount += 1;
  });

  if (!observedCount) {
    return () => {};
  }

  const fallbackTimer = window.setTimeout(() => {
    items.forEach((element) => {
      if (!element.classList.contains("is-visible")) {
        revealElement(element);
      }
    });
    observer.disconnect();
  }, 1800);

  return () => {
    window.clearTimeout(fallbackTimer);
    observer.disconnect();
  };
}
