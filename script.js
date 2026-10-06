(() => {
  const root = document.documentElement;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  const replayButton = document.querySelector('.replay-intro');
  const motionButton = document.querySelector('.motion-toggle');
  let motionOff = reducedMotion.matches;
  let introTimer = setTimeout(() => root.classList.remove('intro-playing'), 2400);
  replayButton.addEventListener('click', () => {
    if (motionOff) return;
    clearTimeout(introTimer);
    root.classList.remove('intro-playing');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      root.classList.add('intro-playing');
      introTimer = setTimeout(() => root.classList.remove('intro-playing'), 2400);
    }));
  });
  const closeMenu = () => {
    nav.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', '打开导航');
  };
  menuButton.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? '关闭导航' : '打开导航');
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) { closeMenu(); menuButton.focus(); }
  });
  document.addEventListener('click', event => { if (!event.target.closest('.site-header')) closeMenu(); });

  if ('IntersectionObserver' in window && !motionOff) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -25px 0px' });
    document.querySelectorAll('.reveal').forEach(element => {
      if (element.getBoundingClientRect().top > innerHeight) { element.classList.add('will-reveal'); observer.observe(element); }
    });
  }

  const cards = [...document.querySelectorAll('.life-card')];
  const inners = cards.map(card => card.querySelector('.life-card-inner'));
  const links = [...document.querySelectorAll('.life-index a')];
  const count = document.querySelector('#life-count');
  let framePending = false;
  let active = -1;
  const updateCards = () => {
    framePending = false;
    const rects = cards.map(card => card.getBoundingClientRect());
    let current = 0;
    rects.forEach((rect, index) => {
      if (rect.top < innerHeight * 0.47) current = index;
      const next = rects[index + 1];
      const overlap = next && !motionOff ? Math.max(0, Math.min(1, (rect.bottom - next.top) / Math.max(rect.height, 1))) : 0;
      inners[index].style.setProperty('--card-scale', (1 - overlap * 0.045).toFixed(4));
      inners[index].style.setProperty('--card-brightness', (1 - overlap * 0.09).toFixed(4));
    });
    if (current !== active) {
      active = current;
      count.textContent = String(current + 1).padStart(2, '0');
      links.forEach((link, index) => {
        link.classList.toggle('is-active', index === current);
        if (index === current) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
      });
    }
  };
  const scheduleCards = () => { if (!framePending) { framePending = true; requestAnimationFrame(updateCards); } };
  const sizeCards = () => {
    cards.forEach((card, index) => {
      const preferred = (innerWidth <= 580 ? 78 : innerWidth <= 800 ? 90 : 110) + index * 10;
      card.style.setProperty('--sticky-top', `${Math.min(preferred, innerHeight - card.offsetHeight - 28)}px`);
    });
    scheduleCards();
  };
  window.addEventListener('scroll', scheduleCards, { passive: true });
  window.addEventListener('resize', sizeCards, { passive: true });
  window.addEventListener('load', sizeCards, { once: true });
  if ('ResizeObserver' in window) {
    const resizeObserver = new ResizeObserver(sizeCards);
    cards.forEach(card => resizeObserver.observe(card));
  }
  sizeCards();
  const setMotion = value => {
    motionOff = value;
    root.classList.toggle('reduce-motion', value);
    motionButton.setAttribute('aria-pressed', String(value));
    motionButton.textContent = value ? '动效已减弱' : '减弱动效';
    replayButton.disabled = value;
    if (value) root.classList.remove('intro-playing');
    scheduleCards();
  };
  motionButton.addEventListener('click', () => setMotion(!motionOff));
  reducedMotion.addEventListener('change', event => setMotion(event.matches));
  setMotion(motionOff);

  const dialog = document.querySelector('.photo-dialog');
  const dialogImage = dialog.querySelector('img');
  const caption = dialog.querySelector('figcaption');
  let photoTrigger;
  document.querySelectorAll('.photo-link').forEach(link => link.addEventListener('click', event => {
    if (typeof dialog.showModal !== 'function') return;
    event.preventDefault(); photoTrigger = link;
    dialogImage.src = link.href; dialogImage.alt = link.dataset.caption; caption.textContent = link.dataset.caption;
    dialog.showModal(); document.body.style.overflow = 'hidden';
  }));
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target === dialog) {
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    }
  });
  dialog.addEventListener('close', () => { document.body.style.overflow = ''; photoTrigger?.focus({ preventScroll: true }); });
  document.querySelector('#year').textContent = new Date().getFullYear();
})();
