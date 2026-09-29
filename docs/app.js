const menuButton = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('#mobile-menu');
menuButton?.addEventListener('click', () => {
  const next = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(next));
  menuButton.setAttribute('aria-label', next ? 'Fechar menu' : 'Abrir menu');
  mobileMenu.hidden = !next;
});
mobileMenu?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  mobileMenu.hidden = true;
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Abrir menu');
}));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && mobileMenu && !mobileMenu.hidden) {
    mobileMenu.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.focus();
  }
});
document.querySelector('#year').textContent = new Date().getFullYear();

const heroMedia = document.querySelector('.hero-media');
const heroSlides = [...document.querySelectorAll('.hero-slide')];
const heroDots = [...document.querySelectorAll('.hero-dots button')];
const heroCaption = document.querySelector('#hero-caption');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let activeSlide = 0;
let heroTimer;

function showHeroSlide(index) {
  activeSlide = index;
  heroSlides.forEach((slide, position) => {
    const active = position === index;
    slide.classList.toggle('is-active', active);
    slide.setAttribute('aria-hidden', String(!active));
    heroDots[position].classList.toggle('is-active', active);
    heroDots[position].setAttribute('aria-current', String(active));
  });
  heroCaption.textContent = heroSlides[index].dataset.caption;
}

function stopHeroSlider() { window.clearInterval(heroTimer); }
function startHeroSlider() {
  stopHeroSlider();
  if (reducedMotion.matches || document.hidden || heroSlides.length < 2) return;
  heroTimer = window.setInterval(() => showHeroSlide((activeSlide + 1) % heroSlides.length), 5200);
}

heroDots.forEach((dot, index) => dot.addEventListener('click', () => {
  showHeroSlide(index);
  startHeroSlider();
}));
heroMedia?.addEventListener('mouseenter', stopHeroSlider);
heroMedia?.addEventListener('mouseleave', startHeroSlider);
heroMedia?.addEventListener('focusin', stopHeroSlider);
heroMedia?.addEventListener('focusout', startHeroSlider);
document.addEventListener('visibilitychange', startHeroSlider);
reducedMotion.addEventListener('change', startHeroSlider);
startHeroSlider();
