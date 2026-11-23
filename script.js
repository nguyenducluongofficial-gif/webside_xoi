/* ===== Trà Hiếu — script.js ===== */
(() => {
  'use strict';

  /* ---------- CẤU HÌNH (chỉnh ở đây) ---------- */
  const CONFIG = {
    showCorn: true,             // true = hiện món Ngô luộc trong thực đơn
    phone: '0900000000',        // số dùng cho nút gọi
    ratingNote: 'Đánh giá mẫu', // nhãn nhắc rating chỉ là dữ liệu minh họa
    introMs: 6800               // intro: "Trà Hiếu" 0–3.5s, slogan từ 3.5s, vào web ~6.8s
  };

  /* ---------- DỮ LIỆU THỰC ĐƠN ---------- */
  const photo = n => `images/anh-${n}.jpg`;
  const MENU = [
    { id: 'xoi-xeo', name: 'Xôi xéo ruốc hành', price: 20000, rating: 5, ratingCount: 0, available: true,
      description: 'Xôi nếp trộn đậu xanh xéo vàng ươm, bùi và dẻo, phủ ruốc hành thơm phức.',
      images: [2, 3, 4].map(photo) },
    { id: 'xoi-trang', name: 'Xôi trắng ruốc hành', price: 20000, rating: 5, ratingCount: 0, available: true,
      description: 'Hạt nếp trắng dẻo thơm, ăn kèm ruốc hành mặn nhẹ — đơn giản mà đậm vị quê.',
      images: [5, 6, 7].map(photo) },
    { id: 'xoi-gac', name: 'Xôi gấc ruốc hành', price: 20000, rating: 5, ratingCount: 0, available: true,
      description: 'Xôi gấc đỏ au, bóng mượt, thơm mùi gấc chín, ăn cùng ruốc hành.',
      images: [8, 9, 10].map(photo) },
    { id: 'xoi-lac', name: 'Xôi lạc', price: 20000, rating: 5, ratingCount: 0, available: true,
      description: 'Nếp dẻo trộn lạc bùi béo, rắc thêm chút muối vừng cho bữa sáng no lâu.',
      images: [11, 12, 13].map(photo) },
    { id: 'ngo-luoc', name: 'Ngô luộc', price: 20000, rating: 5, ratingCount: 0, available: CONFIG.showCorn,
      description: 'Ngô nếp luộc nóng, ngọt dẻo, ăn kèm xôi hay ăn riêng đều hợp.',
      images: [14, 15, 16].map(photo) }
  ];

  /* ---------- TIỆN ÍCH ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const money = p => p.toLocaleString('vi-VN') + '₫';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- ẢNH THAY THẾ khi chưa có file ---------- */
  const PLACEHOLDER = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="800" height="600" fill="#e6d3a9"/>' +
    '<text x="400" y="300" text-anchor="middle" font-family="Georgia,serif" font-size="40" font-weight="700" fill="#75533A">Trà Hiếu</text>' +
    '<text x="400" y="345" text-anchor="middle" font-family="Georgia,serif" font-size="22" fill="#75533A">Ảnh đang được cập nhật</text></svg>');
  const useFallback = im => { if (!im.dataset.fb) { im.dataset.fb = '1'; im.src = PLACEHOLDER; } };
  document.addEventListener('error', e => { if (e.target.tagName === 'IMG') useFallback(e.target); }, true);
  const checkBroken = () => document.querySelectorAll('img').forEach(im => { if (im.complete && im.naturalWidth === 0) useFallback(im); });

  /* ---------- TÁCH CHỮ để hiện từng ký tự ---------- */
  document.querySelectorAll('[data-split]').forEach(el => {
    const text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.innerHTML = [...text].map((c, i) => `<span aria-hidden="true" style="--i:${i}">${c === ' ' ? '&nbsp;' : c}</span>`).join('');
  });

  /* ---------- INTRO ---------- */
  const intro = $('#intro');
  let introDone = false;
  function endIntro() {
    if (introDone) return;
    introDone = true;
    intro.classList.add('is-hidden');
    document.body.classList.remove('is-loading');
    $('.hero').classList.add('is-in');
    setTimeout(() => intro.remove(), 800);
  }
  setTimeout(endIntro, reduce ? 800 : CONFIG.introMs);
  $('#introSkip').addEventListener('click', endIntro);

  /* ---------- HEADER + MENU MOBILE ---------- */
  const header = $('#header'), toggle = $('#navToggle');
  const heroImg = $('.hero__img'), fab = $('.fab');
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('scrolled', y > 40);
    fab.classList.toggle('show', y > 600);
    if (!reduce && y < innerHeight) heroImg.style.setProperty('--py', (y * 0.1) + 'px'); // parallax nhẹ
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  function setNav(open) {
    header.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open);
    toggle.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu');
  }
  toggle.addEventListener('click', () => setNav(!header.classList.contains('is-open')));
  $('#nav').addEventListener('click', e => { if (e.target.closest('a')) setNav(false); });
  addEventListener('resize', () => { if (innerWidth > 860) setNav(false); });

  /* ---------- LIGHTBOX ---------- */
  const lb = $('#lightbox'), lbImg = $('#lbImg'), lbCap = $('#lbCap'), lbCount = $('#lbCount');
  let current = null, lastFocus = null;

  function renderLightbox() {
    const g = current;
    lbImg.dataset.fb = ''; lbImg.src = g.images[g.i];
    const cap = g.caps ? g.caps[g.i] : g.name;
    lbImg.alt = `${cap} - ảnh ${g.i + 1}`;
    lbCap.textContent = cap;
    lbCount.textContent = `${g.i + 1}/${g.images.length}`;
  }
  function openLightbox(g) {
    current = g; lastFocus = document.activeElement;
    renderLightbox(); lb.hidden = false;
    document.body.classList.add('no-scroll'); $('#lbClose').focus();
  }
  function closeLightbox() {
    lb.hidden = true; current = null;
    document.body.classList.remove('no-scroll');
    if (lastFocus) lastFocus.focus();
  }
  $('#lbClose').addEventListener('click', closeLightbox);
  $('#lbPrev').addEventListener('click', () => current.set(current.i - 1));
  $('#lbNext').addEventListener('click', () => current.set(current.i + 1));
  lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && header.classList.contains('is-open')) setNav(false);
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowLeft') current.set(current.i - 1);
    else if (e.key === 'ArrowRight') current.set(current.i + 1);
    else if (e.key === 'Tab') { // giữ focus trong lightbox
      const f = [...lb.querySelectorAll('button')], i = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  });

  /* ---------- GALLERY (mỗi món có trạng thái riêng) ---------- */
  function initGallery(root, dish) {
    const img = $('.gallery__img', root), count = $('.gallery__count', root);
    const thumbs = [...root.querySelectorAll('.gallery__thumbs button')];
    const g = {
      name: dish.name, images: dish.images, i: 0,
      set(n) {
        g.i = (n + g.images.length) % g.images.length;
        img.dataset.fb = ''; img.src = g.images[g.i];
        img.alt = `${g.name} - ảnh ${g.i + 1}`;
        count.textContent = `${g.i + 1}/${g.images.length}`;
        thumbs.forEach((t, k) => { t.classList.toggle('is-active', k === g.i); t.setAttribute('aria-current', k === g.i); });
        if (!reduce) img.animate([{ opacity: 0.2 }, { opacity: 1 }], { duration: 400, easing: 'ease-out' });
        if (current === g && !lb.hidden) renderLightbox();
      }
    };
    $('.gallery__nav--prev', root).addEventListener('click', () => g.set(g.i - 1));
    $('.gallery__nav--next', root).addEventListener('click', () => g.set(g.i + 1));
    thumbs.forEach((t, k) => t.addEventListener('click', () => g.set(k)));
    $('.gallery__open', root).addEventListener('click', () => openLightbox(g));
    root.querySelector('.js-view').addEventListener('click', () => openLightbox(g));
    return g;
  }

  /* ---------- RENDER THỰC ĐƠN ---------- */
  const list = $('#menuList');
  MENU.filter(m => m.available).forEach((m, k) => {
    const n = m.images.length, name = esc(m.name);
    const rate = `${m.rating.toFixed(1)}/5` + (m.ratingCount ? ` (${m.ratingCount})` : '');
    const art = document.createElement('article');
    art.className = 'dish reveal' + (k % 2 ? ' dish--flip' : '');
    art.innerHTML = `
      <div class="gallery" role="group" aria-label="Ảnh món ${name}">
        <div class="gallery__stage">
          <button class="gallery__open" type="button" aria-label="Phóng to ảnh ${name}">
            <img class="gallery__img" src="${m.images[0]}" alt="${name} - ảnh 1" width="800" height="600" loading="lazy">
          </button>
          <button class="gallery__nav gallery__nav--prev" type="button" aria-label="Ảnh trước">‹</button>
          <button class="gallery__nav gallery__nav--next" type="button" aria-label="Ảnh sau">›</button>
          <span class="gallery__count" aria-live="polite">1/${n}</span>
        </div>
        <p class="gallery__cap">${name}</p>
        <div class="gallery__thumbs">
          ${m.images.map((src, i) => `<button type="button" class="${i ? '' : 'is-active'}" aria-label="Xem ảnh ${i + 1} của ${name}"><img src="${src}" alt="" width="200" height="150" loading="lazy"></button>`).join('')}
        </div>
      </div>
      <div class="dish__info">
        <h3 class="dish__name">${name}</h3>
        <div class="dish__meta">
          <span class="dish__price">${money(m.price)}</span>
          <span class="dish__rating"><b aria-hidden="true">${'★'.repeat(Math.round(m.rating))}</b> ${rate} · ${esc(CONFIG.ratingNote)}</span>
        </div>
        <p class="dish__desc">${esc(m.description)}</p>
        <div class="dish__actions">
          <button class="btn btn--ghost js-view" type="button">Xem ảnh</button>
          <a class="btn btn--brick" href="tel:${CONFIG.phone}">Đặt món</a>
        </div>
      </div>`;
    list.append(art);
    initGallery(art, m);
  });

  /* ---------- ALBUM: tất cả ảnh (anh-1 + ảnh các món) ---------- */
  const ALBUM = [{ src: photo(1), cap: 'Mẹt xôi Trà Hiếu' }];
  MENU.filter(m => m.available).forEach(m => m.images.forEach((src, i) => ALBUM.push({ src, cap: `${m.name} (${i + 1}/${m.images.length})` })));
  const albumG = {
    name: 'Trà Hiếu', images: ALBUM.map(a => a.src), caps: ALBUM.map(a => a.cap), i: 0,
    set(n) { albumG.i = (n + albumG.images.length) % albumG.images.length; if (current === albumG && !lb.hidden) renderLightbox(); }
  };
  const albumGrid = $('#albumGrid');
  albumGrid.innerHTML = ALBUM.map((a, k) => `<button type="button" class="album__item reveal" data-k="${k}" aria-label="Xem ảnh: ${esc(a.cap)}"><span class="album__pic"><img src="${a.src}" alt="${esc(a.cap)}" width="600" height="600" loading="lazy"></span><span class="album__cap">${esc(a.cap)}</span></button>`).join('');
  albumGrid.addEventListener('click', e => {
    const b = e.target.closest('.album__item');
    if (b) { albumG.i = +b.dataset.k; openLightbox(albumG); }
  });

  /* ---------- SCROLL REVEAL ---------- */
  const targets = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries, o) => entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('is-visible'); o.unobserve(en.target); }
    }), { threshold: 0.12 });
    targets.forEach(t => io.observe(t));
  } else targets.forEach(t => t.classList.add('is-visible'));

  $('#year').textContent = new Date().getFullYear();
  checkBroken();
})();