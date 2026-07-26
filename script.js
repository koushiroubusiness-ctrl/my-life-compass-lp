/* =========================================================
   My Life Compass — Landing Page scripts
   - スクロールで要素をふわっと表示（IntersectionObserver）
   - ヘッダーのスクロール状態
   - モバイルナビの開閉
   - 画面画像が無いときのフォールバック
   すべて依存ライブラリなしのバニラJS。
   ========================================================= */
(function () {
  "use strict";

  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

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
     1. スクロールで reveal（控えめなフェード + 浮き上がり）
  -------------------------------------------------------- */
  const revealEls = Array.from(document.querySelectorAll(".reveal"));

  if (prefersReduced || !("IntersectionObserver" in window)) {
    // 動きを減らす設定 / 非対応ブラウザでは即表示
    revealEls.forEach((el) => el.classList.add("in"));
  } else {
    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          // 同じ行内の要素を少しずつ遅らせて、上品な連鎖に
          const siblings = Array.from(
            el.parentElement ? el.parentElement.children : [el]
          ).filter((c) => c.classList.contains("reveal"));
          const idx = Math.max(0, siblings.indexOf(el));
          el.style.transitionDelay = Math.min(idx * 80, 320) + "ms";
          el.classList.add("in");
          obs.unobserve(el);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  }

  /* -------------------------------------------------------
     2. ヘッダー：スクロールで背景をつける
  -------------------------------------------------------- */
  const header = document.getElementById("siteHeader");
  const onScroll = () => {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 12);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* -------------------------------------------------------
     3. モバイルナビの開閉
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
      toggle.setAttribute("aria-label", open ? "メニューを閉じる" : "メニューを開く");
    });
    // ナビ内リンクを押したら閉じる
    nav.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", closeNav)
    );
    // Escで閉じる
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeNav();
    });
  }

  /* -------------------------------------------------------
     4. 画像フォールバック
        画像が読み込めない場合は枠に is-missing を付け、
        下地のラベル（.shot-fallback）を見せる。レイアウトは
        aspect-ratio で確保済みなので崩れない。
  -------------------------------------------------------- */
  document.querySelectorAll("img.lp-shot").forEach((img) => {
    const markMissing = () => {
      const shot = img.closest(".shot");
      if (shot) shot.classList.add("is-missing");
    };
    // すでに失敗している場合（キャッシュ済みの壊れ画像など）
    if (img.complete && img.naturalWidth === 0) {
      markMissing();
    }
    img.addEventListener("error", markMissing);
  });
})();
