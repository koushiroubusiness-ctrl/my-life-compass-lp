/* =========================================================
   My Life Compass — Landing Page scripts
   - 公式LINEのURLを一箇所で管理
   - スクロールで静かに現れる reveal（IntersectionObserver）
   - ファーストビューの順次登場
   - ヘッダーの状態 / 現在セクションの表示
   - スクロール進行ライン / ごく弱いparallax
   - モバイルナビの開閉
   - 画面画像が無いときのフォールバック
   依存ライブラリなしのバニラJS。
   ========================================================= */
(function () {
  "use strict";

  const root = document.documentElement;
  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  const hasIO = "IntersectionObserver" in window;

  /* -------------------------------------------------------
     0. 公式LINE への導線
        URL は一箇所（この定数）だけで管理する。
        data-line-cta を付けた要素すべてに、新規タブ用の
        リンク先とセキュリティ属性をまとめて設定する。
        JS 無効時は元の href（ページ内アンカー）へ緩やかに遷移。
  -------------------------------------------------------- */
  const LINE_URL =
    "https://line.me/R/ti/p/@074vgaqi?ts=04111850&oat_content=url";
  document.querySelectorAll("[data-line-cta]").forEach((el) => {
    el.setAttribute("href", LINE_URL);
    el.setAttribute("target", "_blank");
    el.setAttribute("rel", "noopener noreferrer");
  });

  /* -------------------------------------------------------
     1. ファーストビューの順次登場
        ブランド名 → メインコピー → サブコピー → CTA
        の順に、CSS側の --i で少しずつ遅らせて現れる。
  -------------------------------------------------------- */
  const startHero = () => root.classList.add("hero-ready");
  if (prefersReduced) {
    startHero();
  } else {
    requestAnimationFrame(() => requestAnimationFrame(startHero));
  }

  /* -------------------------------------------------------
     2. スクロールで reveal
        同時に視界へ入った要素は、DOM順（＝左から）に
        ほんの少しだけ遅らせて表示する（最大 3 段）。
  -------------------------------------------------------- */
  const revealEls = Array.from(document.querySelectorAll(".reveal"));

  if (prefersReduced || !hasIO) {
    revealEls.forEach((el) => el.classList.add("in"));
  } else {
    const STEP = 70; // 1要素あたりの遅延（ms）
    const MAX_STEPS = 3; // 待たされている感じを出さない
    const io = new IntersectionObserver(
      (entries, obs) => {
        const shown = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => {
            const ra = a.boundingClientRect;
            const rb = b.boundingClientRect;
            return ra.top - rb.top || ra.left - rb.left;
          });

        shown.forEach((entry, i) => {
          const el = entry.target;
          obs.unobserve(el);
          const delay = Math.min(i, MAX_STEPS) * STEP;
          if (delay === 0) {
            el.classList.add("in");
          } else {
            window.setTimeout(() => el.classList.add("in"), delay);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  }

  /* -------------------------------------------------------
     3. ヘッダーの状態 / スクロール進行ライン / parallax
        scroll イベントは requestAnimationFrame で間引く。
  -------------------------------------------------------- */
  const header = document.getElementById("siteHeader");
  const progressBar = document.getElementById("progressBar");
  const parallaxEls = prefersReduced
    ? []
    : Array.from(document.querySelectorAll("[data-parallax]"));

  let ticking = false;
  let vh = window.innerHeight;

  const useParallax = () => parallaxEls.length > 0 && window.innerWidth > 780;

  const render = () => {
    ticking = false;
    const y = window.scrollY || window.pageYOffset || 0;

    if (header) header.classList.toggle("scrolled", y > 12);

    if (progressBar) {
      const max = document.documentElement.scrollHeight - vh;
      const ratio = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
      progressBar.style.transform = "scaleY(" + ratio.toFixed(4) + ")";
    }

    if (useParallax()) {
      parallaxEls.forEach((el) => {
        const factor = parseFloat(el.getAttribute("data-parallax")) || 0;
        const rect = el.getBoundingClientRect();
        const offset = (vh / 2 - (rect.top + rect.height / 2)) * factor;
        el.style.transform = "translate3d(0," + offset.toFixed(1) + "px,0)";
      });
    }
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(render);
  };

  render();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener(
    "resize",
    () => {
      vh = window.innerHeight;
      if (!useParallax()) {
        parallaxEls.forEach((el) => (el.style.transform = ""));
      }
      onScroll();
    },
    { passive: true }
  );

  /* -------------------------------------------------------
     4. 現在いるセクションをナビに静かに示す
  -------------------------------------------------------- */
  const navLinks = Array.from(document.querySelectorAll("[data-nav-link]"));
  if (navLinks.length && hasIO) {
    const map = new Map();
    navLinks.forEach((link) => {
      const id = (link.getAttribute("href") || "").replace("#", "");
      const section = id && document.getElementById(id);
      if (section) map.set(section, link);
    });

    const setActive = (link) => {
      navLinks.forEach((l) => l.classList.toggle("is-active", l === link));
    };

    const navIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(map.get(entry.target));
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    map.forEach((_link, section) => navIO.observe(section));
  }

  /* -------------------------------------------------------
     5. モバイルナビの開閉
  -------------------------------------------------------- */
  const toggle = document.getElementById("navToggle");
  const nav = document.getElementById("siteNav");
  if (toggle && nav) {
    const closeNav = () => {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "メニューを開く");
    };
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute(
        "aria-label",
        open ? "メニューを閉じる" : "メニューを開く"
      );
    });
    nav.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", closeNav)
    );
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeNav();
    });
  }

  /* -------------------------------------------------------
     6. 画像フォールバック
        Webツールの画面画像が読み込めない場合は、その小さな
        枠自体を取り下げる（人物写真のレイアウトは崩さない）。
  -------------------------------------------------------- */
  document.querySelectorAll("img.lp-shot").forEach((img) => {
    const markMissing = () => {
      const frame = img.closest(".tool-ui");
      if (frame) frame.style.display = "none";
    };
    if (img.complete && img.naturalWidth === 0) markMissing();
    img.addEventListener("error", markMissing);
  });
})();
