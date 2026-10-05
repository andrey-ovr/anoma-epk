(() => {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;
  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));

  document.querySelectorAll('a[href^="http"]').forEach(link => {
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  });

  // Split only explicit editorial lines; natural wrapping stays responsive.
  document.querySelectorAll('[data-lines]').forEach(heading => {
    heading.setAttribute('aria-label', heading.innerText.replace(/\s+/g, ' ').trim());
    const lines = [[]];
    [...heading.childNodes].forEach(node => {
      if (node.nodeName === 'BR') lines.push([]);
      else lines[lines.length - 1].push(node);
    });
    heading.replaceChildren(...lines.map((nodes, index) => {
      const mask = document.createElement('span');
      mask.className = 'line-mask';
      mask.setAttribute('aria-hidden', 'true');
      const line = document.createElement('span');
      line.className = 'line-inner';
      line.style.setProperty('--delay', `${index * 110}ms`);
      line.append(...nodes);
      mask.append(line);
      return mask;
    }));
  });

  const statement = document.querySelector('[data-words]');
  if (statement) {
    statement.setAttribute('aria-label', statement.textContent);
    const walker = document.createTreeWalker(statement, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      const fragment = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(token => {
        if (!token.trim()) fragment.append(document.createTextNode(token));
        else {
          const word = document.createElement('span');
          word.className = 'word';
          word.setAttribute('aria-hidden', 'true');
          word.textContent = token;
          fragment.append(word);
        }
      });
      node.replaceWith(fragment);
    });
  }
  const words = statement ? [...statement.querySelectorAll('.word')] : [];
  document.querySelectorAll('.track-card picture, .asset-grid picture, .asset-gallery picture, .statement-block picture, .split--release > picture').forEach(node => node.setAttribute('data-image', ''));
  document.querySelectorAll('.eyebrow, .section-title__label, .track-card__copy, .track-card .mini-links, .fact-table > div, .contact-links > div, .hero__bottom').forEach(node => node.setAttribute('data-reveal', ''));
  const reveals = [...document.querySelectorAll('[data-reveal], [data-lines], [data-image]')];
  let observer;
  let preloadObserver;
  let motionGeneration = 0;
  const visibleTargets = new Set();
  const imageReadiness = new WeakMap();
  let frame = 0;
  const progressBar = document.querySelector('.reading-progress');
  const backgrounds = [...document.querySelectorAll('.hero__bg, .music__bg, .contact__bg, .poster__bg')];

  function prepareImage(image) {
    if (!imageReadiness.has(image)) {
      const loaded = new Promise(resolve => {
        const finish = () => {
          image.removeEventListener('load', finish);
          image.removeEventListener('error', finish);
          resolve();
        };
        image.addEventListener('load', finish);
        image.addEventListener('error', finish);
        image.loading = 'eager';
        if (image.complete) finish();
      });
      imageReadiness.set(image, loaded.then(async () => {
        if (image.naturalWidth && image.decode) {
          try { await image.decode(); } catch { /* Failed images still expose their alt text. */ }
        }
      }));
    }
    return imageReadiness.get(image);
  }

  async function revealWhenReady(node, generation) {
    const image = node.querySelector('img');
    if (image) {
      await prepareImage(image);
      // Paint the hidden, decoded image before starting its entrance transition.
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    }
    if (generation !== motionGeneration || !visibleTargets.has(node)) return;
    node.classList.add('has-entered');
    observer?.unobserve(node);
    visibleTargets.delete(node);
  }

  function render() {
    frame = 0;
    if (preference.matches) return;
    const height = innerHeight;
    const pageRange = Math.max(1, root.scrollHeight - height);
    progressBar.style.transform = `scaleX(${clamp(scrollY / pageRange)})`;
    backgrounds.forEach(node => {
      const box = (node.closest('.poster') || node.parentElement).getBoundingClientRect();
      if (box.bottom < -100 || box.top > height + 100) return;
      if (node.classList.contains('hero__bg')) {
        // Preserve the Figma crop at the top; use the photo's overscan on scroll.
        node.style.transform = `translate3d(0, ${clamp(-box.top * .08, 0, 60)}px, 0)`;
        return;
      }
      // Each photograph has 60px overscan; movement cannot expose its edge.
      const progress = clamp((height - box.top) / (height + box.height));
      const travel = node.classList.contains('poster__bg') ? 48 : 88;
      node.style.transform = `translate3d(0, ${(progress - .5) * travel}px, 0)`;
    });
    if (statement) {
      const box = statement.getBoundingClientRect();
      const progress = clamp((height * .88 - box.top) / (height * .5 + box.height * .25));
      words.forEach((word, index) => word.classList.toggle('is-read', progress >= index / Math.max(1, words.length - 1)));
    }
  }
  function schedule() {
    if (!frame && !preference.matches) frame = requestAnimationFrame(render);
  }
  function configure() {
    observer?.disconnect();
    preloadObserver?.disconnect();
    const generation = ++motionGeneration;
    visibleTargets.clear();
    cancelAnimationFrame(frame);
    frame = 0;
    if (preference.matches || !('IntersectionObserver' in window)) {
      root.classList.remove('motion-ready');
      backgrounds.forEach(node => node.style.removeProperty('transform'));
      return;
    }
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) {
          visibleTargets.delete(entry.target);
          return;
        }
        visibleTargets.add(entry.target);
        revealWhenReady(entry.target, generation);
      });
    }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });
    preloadObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const images = entry.target.matches('img') ? [entry.target] : entry.target.querySelectorAll('img');
        images.forEach(prepareImage);
        preloadObserver.unobserve(entry.target);
      });
    }, { rootMargin: '600px 0px' });
    document.querySelectorAll('img[loading="lazy"], .asset-gallery__track').forEach(node => preloadObserver.observe(node));
    reveals.forEach(node => observer.observe(node));
    root.classList.add('motion-ready');
    schedule();
  }
  const gallery = document.querySelector('.asset-gallery__track');
  if (gallery) {
    const controls = document.querySelector('.asset-gallery__controls');
    const previous = controls.querySelector('.asset-gallery__arrow--previous');
    const next = controls.querySelector('.asset-gallery__arrow--next');
    const updateControls = () => {
      previous.disabled = gallery.scrollLeft <= 1;
      next.disabled = gallery.scrollLeft >= gallery.scrollWidth - gallery.clientWidth - 1;
    };
    const move = direction => {
      const step = gallery.querySelector('picture').getBoundingClientRect().width + parseFloat(getComputedStyle(gallery).columnGap);
      gallery.scrollBy({ left: direction * step, behavior: preference.matches ? 'instant' : 'smooth' });
    };
    previous.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(1));
    gallery.addEventListener('keydown', event => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      move(event.key === 'ArrowRight' ? 1 : -1);
    });
    gallery.addEventListener('scroll', updateControls, { passive: true });
    addEventListener('resize', updateControls, { passive: true });
    controls.hidden = false;
    updateControls();
  }
  // Keyboard navigation must never focus an invisible animated link.
  document.addEventListener('focusin', event => {
    let node = event.target;
    while (node instanceof Element) {
      if (node.matches('[data-reveal], [data-lines], [data-image]')) node.classList.add('has-entered');
      node = node.parentElement;
    }
  });
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule, { passive: true });
  addEventListener('pageshow', schedule);
  document.fonts?.ready.then(schedule);
  if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(document.body);
  preference.addEventListener('change', configure);
  configure();
})();
