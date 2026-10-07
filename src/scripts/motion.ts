import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const settle = (targets: gsap.TweenTarget) => {
  gsap.set(targets, { clearProps: "transform" });
};

const reveal = (targets: gsap.TweenTarget, trigger: Element | string, stagger = 0) => {
  gsap.fromTo(
    targets,
    { opacity: 0, y: 32 },
    {
      opacity: 1,
      y: 0,
      duration: 1.05,
      ease: "power3.out",
      stagger,
      scrollTrigger: {
        trigger,
        start: "top 86%",
      },
      onComplete: () => settle(targets),
    },
  );
};

export function initMotion() {
  const header = document.querySelector<HTMLElement>("[data-header]");
  const toggle = document.querySelector<HTMLButtonElement>("[data-nav-toggle]");
  const nav = document.querySelector<HTMLElement>("[data-nav]");
  let lenis: Lenis | null = null;

  const setScrolled = (y: number) => {
    header?.classList.toggle("is-scrolled", y > 8);
  };

  const closeNav = () => {
    nav?.classList.remove("is-open");
    toggle?.setAttribute("aria-expanded", "false");
    document.body.classList.remove("nav-open");
    lenis?.start();
  };

  const openNav = () => {
    nav?.classList.add("is-open");
    toggle?.setAttribute("aria-expanded", "true");
    document.body.classList.add("nav-open");
    lenis?.stop();
    nav?.querySelector<HTMLElement>("a")?.focus();
  };

  toggle?.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") === "true";
    if (open) {
      closeNav();
      toggle.focus();
    } else {
      openNav();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav?.classList.contains("is-open")) {
      closeNav();
      toggle?.focus();
    }
  });

  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      const hash = anchor.getAttribute("href");
      if (!hash || hash === "#") return;
      const target = document.querySelector(hash);
      if (!(target instanceof HTMLElement)) return;
      event.preventDefault();
      const menuWasOpen = nav?.classList.contains("is-open") ?? false;
      closeNav();
      if (lenis) {
        lenis.scrollTo(target, { force: menuWasOpen });
      } else {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  const mm = gsap.matchMedia();

  mm.add("(prefers-reduced-motion: reduce)", () => {
    const onScroll = () => setScrolled(window.scrollY);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  });

  mm.add("(prefers-reduced-motion: no-preference)", () => {
    lenis = new Lenis({
      duration: 1.05,
      smoothWheel: true,
      touchMultiplier: 1.05,
    });

    lenis.on("scroll", (current) => {
      ScrollTrigger.update();
      setScrolled(current.scroll);
    });

    const ticker = (time: number) => {
      lenis?.raf(time * 1000);
    };
    gsap.ticker.add(ticker);
    gsap.ticker.lagSmoothing(0);

    gsap.fromTo(
      ".hero-in",
      { opacity: 0, y: 28 },
      { opacity: 1, y: 0, duration: 1.15, ease: "power3.out", stagger: 0.07, delay: 0.12 },
    );

    const heroImage = document.querySelector(".hero__photo img");
    if (heroImage) {
      gsap.fromTo(heroImage, { scale: 1.08 }, { scale: 1, duration: 1.7, ease: "power2.out" });
    }

    const heroZoom = document.querySelector(".hero__zoom");
    if (heroZoom) {
      gsap.to(heroZoom, {
        yPercent: 7,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    }

    document.querySelectorAll(".reveal").forEach((el) => {
      reveal(el, el);
    });

    const menu = document.querySelector(".menu");
    if (menu) reveal(".menu__item", menu, 0.07);

    ScrollTrigger.batch(".pillar", {
      start: "top 88%",
      once: true,
      onEnter: (batch) => {
        gsap.fromTo(
          batch,
          { opacity: 0, y: 28 },
          {
            opacity: 1,
            y: 0,
            duration: 0.95,
            stagger: 0.08,
            ease: "power3.out",
            overwrite: true,
            onComplete: () => settle(batch),
          },
        );
      },
    });

    ScrollTrigger.batch(".gallery__item, .scene", {
      start: "top 88%",
      once: true,
      onEnter: (batch) => {
        gsap.fromTo(
          batch,
          { opacity: 0, y: 36 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            stagger: 0.08,
            ease: "power3.out",
            overwrite: true,
            onComplete: () => settle(batch),
          },
        );
      },
    });

    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);

    return () => {
      window.removeEventListener("load", refresh);
      gsap.ticker.remove(ticker);
      lenis?.destroy();
      lenis = null;
    };
  });
}
