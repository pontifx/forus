/* app.js — Forus Landing Page */

(function () {
  'use strict';

  const toggle = document.querySelector('[data-theme-toggle]');
  const root = document.documentElement;
  const iconSun = toggle ? toggle.querySelector('.icon-sun') : null;
  const iconMoon = toggle ? toggle.querySelector('.icon-moon') : null;

  let theme = 'dark';
  root.setAttribute('data-theme', theme);

  function updateToggleIcon() {
    if (!iconSun || !iconMoon) return;
    if (theme === 'dark') {
      iconSun.style.display = '';
      iconMoon.style.display = 'none';
    } else {
      iconSun.style.display = 'none';
      iconMoon.style.display = '';
    }
  }
  updateToggleIcon();

  if (toggle) {
    toggle.addEventListener('click', () => {
      theme = theme === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', theme);
      toggle.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
      updateToggleIcon();
    });
  }

  function initLenis() {
    if (typeof Lenis === 'undefined') { setTimeout(initLenis, 100); return; }
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: true,
    });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
  }
  initLenis();

  if (!CSS.supports('animation-timeline: scroll()')) {
    const fadeEls = document.querySelectorAll('.fade-in');
    fadeEls.forEach(el => {
      el.style.opacity = '0';
      el.style.transition = 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
    });
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) { entry.target.style.opacity = '1'; observer.unobserve(entry.target); }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px -20px 0px' }
    );
    fadeEls.forEach((el, i) => {
      el.style.transitionDelay = `${(i % 5) * 50}ms`;
      observer.observe(el);
    });
    setTimeout(() => { fadeEls.forEach(el => { el.style.opacity = '1'; }); }, 3000);
  }

  const canvas = document.getElementById('hero-waveform');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let w, h, animFrame, time = 0;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.parentElement.getBoundingClientRect();
      w = rect.width; h = 120;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      ctx.scale(dpr, dpr);
    }

    function getColor() {
      return getComputedStyle(root).getPropertyValue('--color-primary').trim() || '#3b9ea5';
    }

    function draw() {
      time += 0.008;
      ctx.clearRect(0, 0, w, h);
      const color = getColor();
      ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.globalAlpha = 0.6;
      ctx.beginPath();
      const mid = h * 0.5;
      for (let x = 0; x <= w; x++) {
        const p = x / w;
        const ef = Math.sin(p * Math.PI);
        const y = mid + Math.sin(p * 6 + time * 2) * 8 * ef + Math.sin(p * 14 + time * 3.5) * 3 * ef + Math.sin(p * 22 + time * 1.2) * 2 * ef;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      for (let x = 0; x <= w; x++) {
        const p = x / w;
        const ef = Math.sin(p * Math.PI);
        const y = mid + Math.sin(p * 8 + time * 1.5 + 1) * 6 * ef + Math.sin(p * 18 + time * 2.8 + 2) * 3 * ef;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
      animFrame = requestAnimationFrame(draw);
    }

    resize(); draw();
    window.addEventListener('resize', () => { cancelAnimationFrame(animFrame); resize(); draw(); });

    const heroSection = document.getElementById('hero');
    if (heroSection) {
      new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) { if (!animFrame) draw(); }
        else { cancelAnimationFrame(animFrame); animFrame = null; }
      }, { threshold: 0 }).observe(heroSection);
    }
  }

  const nav = document.querySelector('.nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.style.borderBottomColor = window.scrollY > 80 ? '' : 'transparent';
    }, { passive: true });
    if (window.scrollY <= 80) nav.style.borderBottomColor = 'transparent';
  }

})();
