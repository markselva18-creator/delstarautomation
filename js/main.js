/* DELSTAR AUTOMATION SOLUTIONS — Main JavaScript */

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initMobileNav();
  initHeroSlider();
  initScrollReveal();
  initCounters();
  initProjectFilters();
  initContactForm();
  initProjectTabSelector();
});

/* ── Hero Slider ── */
function initHeroSlider() {
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.hero-dot');
  if (!slides.length) return;

  let current = 0;
  let interval;

  const goTo = (index) => {
    slides[current].classList.remove('active');
    if (dots[current]) dots[current].classList.remove('active');
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('active');
    if (dots[current]) dots[current].classList.add('active');
  };

  const next = () => goTo(current + 1);

  const startAutoplay = () => {
    interval = setInterval(next, 6000);
  };

  const resetAutoplay = () => {
    clearInterval(interval);
    startAutoplay();
  };

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      goTo(i);
      resetAutoplay();
    });
  });

  startAutoplay();
}

/* ── Sticky Header ── */
function initHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 50);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ── Mobile Navigation ── */
function initMobileNav() {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.main-nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    toggle.classList.toggle('active');
    nav.classList.toggle('open');
    document.body.style.overflow = nav.classList.contains('open') ? 'hidden' : '';
  });

  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      toggle.classList.remove('active');
      nav.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

/* ── Scroll Reveal Animations ── */
function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .stagger-children');
  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  elements.forEach(el => observer.observe(el));
}

/* ── Animated Counters ── */
function initCounters() {
  const counters = document.querySelectorAll('.counter[data-target]');
  if (!counters.length) return;

  const animateCounter = (el) => {
    const target = parseInt(el.dataset.target, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 2000;
    const start = performance.now();

    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach(c => observer.observe(c));
}

/* ── Project Filter Tabs ── */
function initProjectFilters() {
  const tabs = document.querySelectorAll('.filter-tab');
  const cards = document.querySelectorAll('.project-card[data-category]');
  if (!tabs.length || !cards.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const filter = tab.dataset.filter;

      cards.forEach(card => {
        const show = filter === 'all' || card.dataset.category === filter;
        card.style.display = show ? '' : 'none';
        if (show) {
          card.style.opacity = '0';
          card.style.transform = 'translateY(20px)';
          requestAnimationFrame(() => {
            card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          });
        }
      });
    });
  });
}

/* ── Contact Form ── */
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = 'Sending...';
    btn.disabled = true;

    setTimeout(() => {
      form.reset();
      btn.textContent = 'Message Sent!';
      btn.style.background = '#16a34a';

      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
        btn.disabled = false;
      }, 3000);
    }, 1200);
  });
}
/*
function projectTabSelector() {
      // 1. Get the 'tab' parameter from the URL (e.g., ?tab=automotive)
      const urlParams = new URLSearchParams(window.location.search);
      // Fallback to 'all' if no parameter is provided in the URL
      const activeFilter = urlParams.get('tab') || 'all'; 
      
      // 2. Find the matching button
      const targetTab = document.querySelector(`.filter-tab[data-filter="${activeFilter}"]`);
      
      if (targetTab) {
          // Remove 'active' class from any pre-existing active tabs
          document.querySelectorAll('.filter-tab').forEach(tab => tab.classList.remove('active'));
          
          // Add active class to the target tab
          targetTab.classList.add('active');
          
          // Run your filter logic
          filterProjects(activeFilter);
      }
}*/

function initProjectTabSelector() {

  // 1. Get the 'tab' parameter from the URL (?tab=automotive)
      const urlParams = new URLSearchParams(window.location.search);
      // Fallback to 'all' if no parameter is provided
      const activeFilter = urlParams.get('tab') || 'all'; 
      
      // 2. Update the Tab Button UI
      const targetTab = document.querySelector(`.filter-tab[data-filter="${activeFilter}"]`);
      if (targetTab) {
          // Remove 'active' from all tabs, then add to the current one
          document.querySelectorAll('.filter-tab').forEach(tab => tab.classList.remove('active'));
          targetTab.classList.add('active');
      }

      // 3. FORCE THE FILTER LOGIC ON THE CARDS IMMEDIATELY
      // Change '.project-card' to match whatever class name your project item containers use
      const projectCards = document.querySelectorAll('.project-card'); 
      
      projectCards.forEach(card => {
          // Grab the category attribute from the card (adjust 'data-category' to your actual attribute)
          const cardCategory = card.getAttribute('data-category'); 
          
          if (activeFilter === 'all' || cardCategory === activeFilter) {
              card.style.display = 'block'; // Or 'flex', 'grid' depending on your layout
          } else {
              card.style.display = 'none'; // Hide non-matching items
          }
      });
  };

/***************************************************************************/

/* ── Project image gallery: independent galleries for each tile ── */
(function () {
  let images = [];
  let index = 0;
  let title = '';
  let lastFocused = null;
  let touchStartX = null;

  document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('projectLightbox');
    if (!modal) return;
    const photo = document.getElementById('lightboxImg');
    const caption = document.getElementById('lightboxCaption');
    const heading = document.getElementById('lightboxTitle');
    const thumbs = document.getElementById('lightboxThumbnails');
    const close = document.getElementById('lightboxClose');
    const prev = document.getElementById('lightboxPrev');
    const next = document.getElementById('lightboxNext');
    const stage = modal.querySelector('.lightbox-stage');

    function render() {
      if (!images.length) return;
      photo.src = images[index];
      photo.alt = `${title} — photo ${index + 1} of ${images.length}`;
      caption.textContent = `${index + 1} / ${images.length}`;
      heading.textContent = title;
      prev.disabled = next.disabled = images.length < 2;
      thumbs.replaceChildren();
      images.forEach((src, i) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'lightbox-thumbnail' + (i === index ? ' active' : '');
        button.setAttribute('aria-label', `Show photo ${i + 1} of ${images.length}`);
        button.setAttribute('aria-pressed', String(i === index));
        const img = document.createElement('img');
        img.src = src;
        img.alt = '';
        img.loading = 'lazy';
        button.appendChild(img);
        button.addEventListener('click', () => { index = i; render(); });
        thumbs.appendChild(button);
      });
      thumbs.children[index]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }

    function move(delta) {
      if (images.length < 2) return;
      index = (index + delta + images.length) % images.length;
      render();
    }

    function hide() {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('lightbox-open');
      photo.removeAttribute('src');
      lastFocused?.focus();
    }

    document.querySelectorAll('.project-card').forEach(card => {
      const fallback = card.querySelector('.project-thumb img');
      let gallery = [];
      try {
        const parsed = JSON.parse(card.dataset.images || '[]');
        if (Array.isArray(parsed)) gallery = parsed.filter(x => typeof x === 'string' && x.trim());
      } catch (error) {
        console.warn('Invalid project data-images:', card, error);
      }
      if (!gallery.length && fallback) gallery = [fallback.getAttribute('src')];
      if (!gallery.length) return; // No image: don't open an empty popup
      card.classList.add('has-gallery');
      card.tabIndex = 0;
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', `View photos of ${card.querySelector('h3')?.textContent?.trim() || 'project'}`);
      function open() {
        lastFocused = document.activeElement;
        images = gallery;
        title = card.querySelector('h3')?.textContent?.trim() || 'Project photos';
        index = 0;
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('lightbox-open');
        render();
        close.focus();
      }
      card.addEventListener('click', open);
      card.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); }
      });
    });

    close.addEventListener('click', hide);
    prev.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(1));
    modal.addEventListener('click', event => { if (event.target === modal) hide(); });
    document.addEventListener('keydown', event => {
      if (!modal.classList.contains('is-open')) return;
      if (event.key === 'Escape') { event.preventDefault(); hide(); }
      else if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
      else if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
      else if (event.key === 'Tab') {
        const focusable = [...modal.querySelectorAll('button:not(:disabled)')];
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    });
    stage.addEventListener('touchstart', event => { touchStartX = event.changedTouches[0].screenX; }, { passive: true });
    stage.addEventListener('touchend', event => {
      if (touchStartX === null) return;
      const dx = event.changedTouches[0].screenX - touchStartX;
      if (Math.abs(dx) > 50) move(dx < 0 ? 1 : -1);
      touchStartX = null;
    }, { passive: true });
  });
})();
