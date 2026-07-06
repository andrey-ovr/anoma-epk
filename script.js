const LINKS = {
  listen: "https://open.spotify.com/artist/1gPJcWCciqQGwted73xmvp?si=6xhFDr3IQeWgQK_qeZCsWw",
  downloadEpk: "https://drive.google.com/file/d/1TZ1EjDIZ5XhWIJdO9axD7v3sxo77t3wY/view?usp=drive_link",
  contact: "mailto:anoma.muz@gmail.com",
  latestSpotify: "https://open.spotify.com/album/53VRMJdb4RkmeisdxeU6ws",
  pressAssets: "https://drive.google.com/drive/folders/1zV7ONfSa4_PV7yY_xpLGfzqxyznOT_AJ?usp=drive_link",
  oneSheet: "https://drive.google.com/file/d/1TZ1EjDIZ5XhWIJdO9axD7v3sxo77t3wY/view?usp=drive_link",
  instagram: "https://www.instagram.com/anoma.muz/",
  tiktok: "https://www.tiktok.com/@anoma_music",
  facebook: "https://www.facebook.com/anoma.muz/"
};

const TRACK_LINKS = {
  lullaby: {
    spotify: "https://open.spotify.com/album/0vpatIdFdPbJAIGQvgQExA",
    apple: "https://geo.music.apple.com/album/lullaby-feat-valeriia-vovk-single/1734297127",
    youtube: "https://music.youtube.com/playlist?list=OLAK5uy_nmOTsIS_GkbzEq9zhhV18oxev5tu9ED0w",
    deezer: "https://link.deezer.com/s/33JKLZFoQnCTcfjGmz3Nc"
  },
  rememberMe: {
    spotify: "https://open.spotify.com/album/3ueGCapF5VwPM6U0Ucfn3b",
    apple: "https://geo.music.apple.com/album/remember-me-single/1847443483",
    youtube: "https://music.youtube.com/playlist?list=OLAK5uy_k5-gbRpVrMZTBb1AQLHD2Z5rtP2TjzRoo",
    deezer: "https://link.deezer.com/s/33JKLvwvzE4HMIbeMchwL"
  },
  ashesOfUs: {
    spotify: "https://open.spotify.com/album/72O8BEpMqMt5AuxqaxKNbM",
    apple: "https://geo.music.apple.com/album/ashes-of-us-single/1836797517",
    youtube: "https://music.youtube.com/playlist?list=OLAK5uy_nrIkU1T0aL_Ggt9EgeSELfjk1lx7JwBbg",
    deezer: "https://link.deezer.com/s/33JKJZCO0eccwKK0XRMds"
  },
  letYouDown: {
    spotify: "https://open.spotify.com/album/648xXKfPAsah1Li8keXDpj",
    apple: "https://geo.music.apple.com/album/let-you-down-single/1796699773",
    youtube: "https://music.youtube.com/playlist?list=OLAK5uy_lj0fT6nUyiKatxXo4w9LZo-7MVwyawRtE",
    deezer: "https://link.deezer.com/s/33JKICDUremrZcxDGsEOF"
  },
  letsGoOut: {
    apple: "https://geo.music.apple.com/album/lets-go-out-feat-hope-single/1882442462",
    youtube: "https://music.youtube.com/playlist?list=OLAK5uy_nZj3gzHjpLlkDRJVP1RhUtB4tdkgV_NMM",
    deezer: "https://www.deezer.com/album/932532071"
  }
};

const PLATFORM_LINKS = {
  spotify: "https://open.spotify.com/artist/1gPJcWCciqQGwted73xmvp?si=0Wm0_nLySaSGiF6-N0ycxA",
  apple: "https://music.apple.com/us/artist/anoma/1722349699",
  youtubeMusic: "https://music.youtube.com/@anoma-music?si=7aMD4mL2ukPQZQSN",
  deezer: "https://www.deezer.com/ru/album/932532071?host=0&utm_campaign=clipboard-generic&utm_source=user_sharing&utm_content=album-932532071&deferredFl=1"
};

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

document.querySelectorAll("[data-link]").forEach((node) => {
  const href = LINKS[node.dataset.link];
  if (!href) return;
  node.setAttribute("href", href);
});

document.querySelectorAll("[data-track][data-platform]").forEach((node) => {
  const href = TRACK_LINKS[node.dataset.track]?.[node.dataset.platform];
  if (!href) return;
  node.setAttribute("href", href);
});

document.querySelectorAll("[data-platform]:not([data-track])").forEach((node) => {
  const href = PLATFORM_LINKS[node.dataset.platform];
  if (!href) return;
  node.setAttribute("href", href);
});

document.querySelectorAll("a[href^='http']").forEach((link) => {
  link.setAttribute("target", "_blank");
  link.setAttribute("rel", "noopener noreferrer");
});

document.querySelectorAll("a[href^='#']").forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
  });
});

const revealNodes = document.querySelectorAll(".reveal-media");
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.15 }
  );
  revealNodes.forEach((node) => observer.observe(node));
} else {
  revealNodes.forEach((node) => node.classList.add("is-visible"));
}

if (!prefersReducedMotion) {
  const parallaxNodes = [...document.querySelectorAll("[data-parallax]")];
  let ticking = false;

  const updateParallax = () => {
    const scrollY = window.scrollY || window.pageYOffset;
    parallaxNodes.forEach((node) => {
      const rect = node.parentElement.getBoundingClientRect();
      const speed = Number(node.dataset.parallax || 0);
      const scale = Number(node.dataset.parallaxScale || 1.04);
      const rawOffset = rect.top * speed;
      const min = Number(node.dataset.parallaxMin);
      const max = Number(node.dataset.parallaxMax);
      const clamp = Number(node.dataset.parallaxClamp || 0);
      const hasRange = Number.isFinite(min) && Number.isFinite(max);
      const offset = hasRange
        ? Math.max(min, Math.min(max, rawOffset))
        : clamp > 0
          ? Math.max(-clamp, Math.min(clamp, rawOffset))
          : rawOffset;
      node.style.transform = `translate3d(0, ${offset}px, 0) scale(${scale})`;
    });

    ticking = false;
  };

  const requestTick = () => {
    if (ticking) return;
    window.requestAnimationFrame(updateParallax);
    ticking = true;
  };

  window.addEventListener("scroll", requestTick, { passive: true });
  window.addEventListener("resize", requestTick);
  updateParallax();
}
