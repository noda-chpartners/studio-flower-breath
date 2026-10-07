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

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const whenReady = () =>
  new Promise<void>((resolve) => {
    const fonts = document.fonts?.ready.then(() => undefined) ?? Promise.resolve();
    const loaded = new Promise<void>((done) => {
      if (document.readyState === "complete") done();
      else window.addEventListener("load", () => done(), { once: true });
    });
    void Promise.race([Promise.all([loaded, fonts]), sleep(2400)]).then(() => resolve());
  });

export function initMotion() {
  const header = document.querySelector<HTMLElement>("[data-header]");
  const toggle = document.querySelector<HTMLButtonElement>("[data-nav-toggle]");
  const nav = document.querySelector<HTMLElement>("[data-nav]");
  const loader = document.querySelector<HTMLElement>("[data-loader]");
  let lenis: Lenis | null = null;
  let loaderDone = false;

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
    document.documentElement.classList.remove("is-loading");
    loader?.remove();
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

    const playHero = () => {
      gsap.fromTo(
        ".hero-in",
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 1.15, ease: "power3.out", stagger: 0.07, delay: 0.08 },
      );

      const heroImage = document.querySelector(".hero__photo img");
      if (heroImage) {
        gsap.fromTo(heroImage, { scale: 1.08 }, { scale: 1, duration: 1.7, ease: "power2.out" });
      }
    };

    const finishLoader = () => {
      document.documentElement.classList.remove("is-loading");
      loader?.remove();
      lenis?.start();
      ScrollTrigger.refresh();
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") exit();
    };

    const exit = () => {
      if (loaderDone || !loader?.isConnected) return;
      loaderDone = true;
      intro.kill();
      window.removeEventListener("keydown", onKey);
      playHero();
      gsap.to(loader, {
        yPercent: -100,
        duration: 1.15,
        ease: "power4.inOut",
        onComplete: finishLoader,
      });
    };

    let intro = gsap.timeline();

    if (loader) {
      lenis.stop();
      const started = performance.now();
      intro = gsap.timeline({ defaults: { ease: "power3.out" } });

      intro
        .fromTo(".loader__stem", { strokeDashoffset: 16 }, { strokeDashoffset: 0, duration: 0.9, ease: "power2.out" }, 0)
        .from(".loader__leaf, .loader__bud", { opacity: 0, duration: 0.55, stagger: 0.1 }, 0.35)
        .from(".loader__name span", { opacity: 0, y: 22, duration: 0.85, stagger: 0.08 }, 0.15)
        .from(".loader__kana", { opacity: 0, y: 10, duration: 0.7 }, 0.55)
        .fromTo(".loader__line", { scaleX: 0 }, { scaleX: 1, duration: 0.95, ease: "power2.inOut" }, 0.5);

      const hold = async () => {
        await whenReady();
        const remain = 1700 - (performance.now() - started);
        if (remain > 0) await sleep(remain);
        exit();
      };
      void hold();

      loader.addEventListener("click", exit);
      window.addEventListener("keydown", onKey);
      document.querySelector(".skip")?.addEventListener("click", exit);
    } else {
      playHero();
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
      window.removeEventListener("keydown", onKey);
      gsap.ticker.remove(ticker);
      lenis?.destroy();
      lenis = null;
    };
  });
}
