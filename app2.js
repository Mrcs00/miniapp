// ── TUNGI REJIM ──
var DAY_IMG = 'https://raw.githubusercontent.com/Mrcs00/miniapp/main/banner-day.jpg';
var NIGHT_IMG = 'https://raw.githubusercontent.com/Mrcs00/miniapp/main/banner-night.jpg';

function updateBannerImg(isDark) {
  var img = document.getElementById('banner-img');
  if (img) img.src = isDark ? NIGHT_IMG : DAY_IMG;
}

function toggleDarkMode() {
  var body = document.body;
  body.classList.toggle('dark');
  var isDark = body.classList.contains('dark');
  localStorage.setItem('darkMode', isDark ? '1' : '0');
  var btn = document.getElementById('dark-toggle');
  if (btn) btn.textContent = isDark ? '☀️' : '🌙';
  updateBannerImg(isDark);
}

const ALIFBO = {
  id: 'alifbo',
  name: "Alifbo va o'qish qoidalari",
  color: '#9B59B6',
  bepul: true,
  bolimlar: [
    { id: 'harflar', name: 'Harflar', icon: '🔤', dars: 1 },
    { id: 'oqish',   name: "O'qish qoidalari", icon: '📖', dars: 1 },
    { id: 'yozish',  name: 'Yozish qoidalari', icon: '✍️', dars: 1 },
  ]
};

const COURSES = {
  boshlangich: [
    { id:'1A', name:'SNU 1A', level:"Boshlang'ich daraja", color:'#F5A623', bolimlar:8, dars:20, soat:10, img:'https://raw.githubusercontent.com/Mrcs00/miniapp/main/1a.jpg' },
    { id:'1B', name:'SNU 1B', level:"Boshlang'ich daraja", color:'#4CAF50', bolimlar:8, dars:25, soat:12, img:'https://raw.githubusercontent.com/Mrcs00/miniapp/main/1b.jpg' },
    { id:'2A', name:'SNU 2A', level:"Boshlang'ich daraja", color:'#2196F3', bolimlar:9, dars:24, soat:11, img:'https://raw.githubusercontent.com/Mrcs00/miniapp/main/2a.jpg' },
    { id:'2B', name:'SNU 2B', level:"Boshlang'ich daraja", color:'#00BCD4', bolimlar:9, dars:24, soat:11, img:'https://raw.githubusercontent.com/Mrcs00/miniapp/main/2b.jpg' },
  ],
  orta: [
    { id:'3A', name:'SNU 3A', level:"O'rta daraja",        color:'#9C27B0', bolimlar:9, dars:20, soat:10, img:'https://raw.githubusercontent.com/Mrcs00/miniapp/main/3a.jpg' },
    { id:'3B', name:'SNU 3B', level:"O'rta daraja",        color:'#E91E63', bolimlar:9, dars:20, soat:10, img:'https://raw.githubusercontent.com/Mrcs00/miniapp/main/3b.jpg' },
    { id:'4A', name:'SNU 4A', level:"O'rta daraja",        color:'#FF5722', bolimlar:8, dars:24, soat:12, img:'https://raw.githubusercontent.com/Mrcs00/miniapp/main/4a.jpg' },
    { id:'4B', name:'SNU 4B', level:"O'rta daraja",        color:'#1565C0', bolimlar:8, dars:24, soat:12, img:'https://raw.githubusercontent.com/Mrcs00/miniapp/main/4b.jpg' },
  ],
  yuqori: [
    { id:'5A', name:'SNU 5A', level:"Yuqori daraja",       color:'#1A237E', bolimlar:8, dars:20, soat:10, img:'https://raw.githubusercontent.com/Mrcs00/miniapp/main/5a.jpg' },
    { id:'5B', name:'SNU 5B', level:"Yuqori daraja",       color:'#1B5E20', bolimlar:8, dars:20, soat:10, img:'https://raw.githubusercontent.com/Mrcs00/miniapp/main/5b.jpg' },
    { id:'6A', name:'SNU 6A', level:"Yuqori daraja",       color:'#880E4F', bolimlar:8, dars:24, soat:12, img:'https://raw.githubusercontent.com/Mrcs00/miniapp/main/6a.jpg' },
    { id:'6B', name:'SNU 6B', level:"Yuqori daraja",       color:'#4E342E', bolimlar:8, dars:24, soat:12, img:'https://raw.githubusercontent.com/Mrcs00/miniapp/main/6b.jpg' },
  ],
};

const LEVEL_NAMES = {
  boshlangich: "Boshlang'ich daraja",
  orta: "O'rta daraja",
  yuqori: "Yuqori daraja",
};

const LEVEL_IMAGES = {
  boshlangich: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?w=600&q=80',
  orta: 'https://images.unsplash.com/photo-1601621915196-2621bfb0cd6e?w=600&q=80',
  yuqori: 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=600&q=80',
};

let currentLevel = 'boshlangich';
let selectedCourse = null;
let detailFromPage = 'home';
let bolimFromPage = 'course-detail';

var BACKEND_URL = 'https://miniapp-production-012c.up.railway.app';

const tg = window.Telegram && window.Telegram.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
  var user = tg.initDataUnsafe && tg.initDataUnsafe.user;
  if (user) {
    var el = document.getElementById('prof-name');
    if (el) el.textContent = user.first_name + (user.last_name ? ' ' + user.last_name : '');
    var av = document.getElementById('prof-av');
    if (av) av.textContent = user.first_name[0].toUpperCase();
  }
}

// ══════════════════════════════════════════
// 🔐 VIDEO HIMOYA TIZIMI
// ══════════════════════════════════════════

function createWatermark(userId) {
  var existing = document.getElementById('video-watermark');
  if (existing) existing.remove();

  var watermark = document.createElement('div');
  watermark.id = 'video-watermark';
  watermark.style.cssText = [
    'position:absolute','top:0','left:0','width:100%','height:100%',
    'pointer-events:none','z-index:10','overflow:hidden','border-radius:inherit'
  ].join(';');

  var text = 'ID:' + userId;
  var html = '';
  for (var row = 0; row < 4; row++) {
    for (var col = 0; col < 3; col++) {
      html += '<div style="position:absolute;left:' + (col * 38 + 5) + '%;top:' + (row * 28 + 8) + '%;' +
        'color:rgba(255,255,255,0.18);font-size:11px;font-weight:600;transform:rotate(-30deg);' +
        'white-space:nowrap;user-select:none;letter-spacing:1px;font-family:monospace">' + text + '</div>';
    }
  }
  watermark.innerHTML = html;

  var videoWrap = document.getElementById('dars-video-wrap');
  if (videoWrap) videoWrap.appendChild(watermark);
}

function removeWatermark() {
  var w = document.getElementById('video-watermark');
  if (w) w.remove();
}

var _screenProtectionActive = false;
var _videoBlocked = false;

function startScreenProtection() {
  if (_screenProtectionActive) return;
  _screenProtectionActive = true;
  document.addEventListener('visibilitychange', _onVisibilityChange);
  if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
    var origGetDisplayMedia = navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getDisplayMedia = function(constraints) {
      _blockVideoOnCapture();
      return origGetDisplayMedia(constraints);
    };
  }
  document.addEventListener('keydown', _onKeyDown);
  window.addEventListener('blur', _onWindowBlur);
}

function stopScreenProtection() {
  if (!_screenProtectionActive) return;
  _screenProtectionActive = false;
  document.removeEventListener('visibilitychange', _onVisibilityChange);
  document.removeEventListener('keydown', _onKeyDown);
  window.removeEventListener('blur', _onWindowBlur);
  _videoBlocked = false;
  _restoreVideo();
}

function _onVisibilityChange() {
  if (document.hidden) _pauseVideo();
}

function _onWindowBlur() {
  var darsPage = document.getElementById('page-dars');
  if (darsPage && darsPage.classList.contains('active')) {
    setTimeout(function() { if (!document.hasFocus()) _pauseVideo(); }, 200);
  }
}

function _onKeyDown(e) {
  if (e.key === 'PrintScreen' || e.keyCode === 44) { _blockVideoOnCapture(); e.preventDefault(); }
  if (e.shiftKey && e.metaKey && e.key === 's') _blockVideoOnCapture();
}

function _blockVideoOnCapture() {
  var darsPage = document.getElementById('page-dars');
  if (!darsPage || !darsPage.classList.contains('active')) return;
  _videoBlocked = true;
  _pauseVideo();

  var overlay = document.getElementById('capture-warning');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'capture-warning';
    overlay.style.cssText = [
      'position:absolute','top:0','left:0','width:100%','height:100%',
      'background:rgba(0,0,0,0.92)','z-index:100','display:flex','flex-direction:column',
      'align-items:center','justify-content:center','border-radius:inherit',
      'text-align:center','padding:20px','box-sizing:border-box'
    ].join(';');
    overlay.innerHTML =
      '<div style="font-size:40px;margin-bottom:12px">🚫</div>' +
      '<div style="color:#fff;font-size:15px;font-weight:700;margin-bottom:8px">Video to\'xtatildi</div>' +
      '<div style="color:#aaa;font-size:13px;line-height:1.5;margin-bottom:20px">' +
        'Ekranni yozib olish taqiqlangan.<br>Materiallar mualliflik huquqi bilan himoyalangan.' +
      '</div>' +
      '<button onclick="dismissCaptureWarning()" style="background:#42A5F5;color:#fff;border:none;padding:10px 24px;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer">Tushundim</button>';
    var videoWrap = document.getElementById('dars-video-wrap');
    if (videoWrap) videoWrap.appendChild(overlay);
  } else {
    overlay.style.display = 'flex';
  }
}

function dismissCaptureWarning() {
  var overlay = document.getElementById('capture-warning');
  if (overlay) overlay.style.display = 'none';
  _videoBlocked = false;
}

function _pauseVideo() {
  // HTML5 video
  var video = document.getElementById('dars-video');
  if (video) { try { video.pause(); } catch(e) {} }
  // YouTube iframe (eski)
  var iframe = document.getElementById('dars-iframe');
  if (iframe && iframe.style.display !== 'none') {
    try { iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*'); } catch(e) {}
  }
}

function _restoreVideo() {
  var overlay = document.getElementById('capture-warning');
  if (overlay) overlay.style.display = 'none';
}

// ══════════════════════════════════════════
// 🎬 BACKBLAZE VIDEO PLAYER
// ══════════════════════════════════════════

// Video signed URL olish va o'ynатish
function playVideo() {
  var placeholder = document.getElementById('dars-video-placeholder');
  if (!placeholder) return;

  // Yuklanmoqda ko'rsatish
  placeholder.innerHTML =
    '<div style="text-align:center;color:#fff">' +
    '<div style="font-size:32px;margin-bottom:8px">⏳</div>' +
    '<div style="font-size:14px">Video yuklanmoqda...</div>' +
    '</div>';

  var userId = tg && tg.initDataUnsafe && tg.initDataUnsafe.user ? tg.initDataUnsafe.user.id : null;
  var courseId = currentDars.courseId;
  var bolim = currentDars.bolim;
  var dars = currentDars.dars;

  // Agar alifbo kursi bo'lsa — demo video
  if (!userId || !courseId || courseId.startsWith('alifbo')) {
    _playDemoVideo();
    return;
  }

  // Backend dan signed URL olish
  fetch(BACKEND_URL + '/video-url?userId=' + userId +
    '&courseId=' + courseId +
    '&bolim=' + bolim +
    '&dars=' + dars)
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (data.success && data.url) {
        _playB2Video(data.url);
      } else {
        // Video hali yuklanmagan — demo ko'rsat
        _playDemoVideo();
      }
    })
    .catch(function() {
      _playDemoVideo();
    });
}

// Backblaze video o'ynatish — HTML5 video player
function _playB2Video(videoUrl) {
  var placeholder = document.getElementById('dars-video-placeholder');
  var videoWrap = document.getElementById('dars-video-wrap');
  if (!videoWrap) return;

  // Eski video elementini o'chirish
  var oldVideo = document.getElementById('dars-video');
  if (oldVideo) oldVideo.remove();

  // Yangi HTML5 video element yaratish
  var video = document.createElement('video');
  video.id = 'dars-video';
  video.controls = true;
  video.autoplay = true;
  video.playsinline = true;
  video.controlsList = 'nodownload'; // Yuklab olish tugmasini yashirish
  video.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:#000;border-radius:inherit;';

  video.src = videoUrl;

  // Placeholder yashirish
  if (placeholder) placeholder.style.display = 'none';

  // Watermark oldida video turishi uchun z-index
  video.style.zIndex = '1';

  videoWrap.appendChild(video);

  // Kontekst menyu (o'ng tugma) o'chirish
  video.addEventListener('contextmenu', function(e) { e.preventDefault(); });
}

// Demo YouTube video (videolar hali yuklanmagan bo'lsa)
function _playDemoVideo() {
  var placeholder = document.getElementById('dars-video-placeholder');
  var iframe = document.getElementById('dars-iframe');
  if (!placeholder || !iframe) return;

  var demoVideoId = 'yWKe1Ml3ZlI';
  iframe.src = 'https://www.youtube.com/embed/' + demoVideoId + '?autoplay=1&enablejsapi=1';
  placeholder.style.display = 'none';
  iframe.style.display = 'block';
}

// ══════════════════════════════════════════

function showPage(pageId) {
  var pages = document.querySelectorAll('.page');
  for (var i = 0; i < pages.length; i++) pages[i].classList.remove('active');
  var page = document.getElementById('page-' + pageId);
  if (page) { page.classList.add('active'); page.scrollTop = 0; }
  if (pageId === 'my-courses') loadMyCourses();
  if (pageId !== 'dars') {
    stopScreenProtection();
    removeWatermark();
    // Video to'xtatish
    var video = document.getElementById('dars-video');
    if (video) { video.pause(); video.remove(); }
    var iframe = document.getElementById('dars-iframe');
    if (iframe) { iframe.style.display = 'none'; iframe.src = ''; }
    var placeholder = document.getElementById('dars-video-placeholder');
    if (placeholder) placeholder.style.display = 'flex';
  }
}

function goBackFromDetail() { showPage(detailFromPage); }
function goBackFromBolim() { showPage(bolimFromPage); }

function setLevel(level, el) {
  currentLevel = level;
  var tabs = document.querySelectorAll('.lv-tab');
  for (var i = 0; i < tabs.length; i++) tabs[i].classList.remove('active');
  if (el) el.classList.add('active');
  var title = document.getElementById('level-title');
  if (level === 'alifbo') {
    if (title) title.textContent = "Alifbo va o'qish qoidalari";
    renderAlifbo();
  } else {
    if (title) title.textContent = LEVEL_NAMES[level] + ' kurslari';
    renderHomeCourses(level);
  }
}

function renderAlifbo() {
  var list = document.getElementById('home-course-list');
  if (!list) return;
  var html = '';
  for (var i = 0; i < ALIFBO.bolimlar.length; i++) {
    var b = ALIFBO.bolimlar[i];
    html += '<div class="course-card alifbo-card" onclick="openAlifboBolim(\'' + b.id + '\')">' +
      '<div class="cc-book" style="background:' + ALIFBO.color + ';display:flex;align-items:center;justify-content:center;font-size:24px">' + b.icon + '</div>' +
      '<div class="cc-body"><div class="cc-name">' + b.name + '</div>' +
      '<div class="cc-meta">📚 ' + b.dars + ' dars</div>' +
      '<div class="cc-price" style="color:#27AE60;font-size:13px">✅ Bepul</div></div>' +
      '<button class="cc-btn" style="background:' + ALIFBO.color + '" onclick="event.stopPropagation();openAlifboBolim(\'' + b.id + '\')">Ko\'rish</button>' +
      '</div>';
  }
  list.innerHTML = html;
}

function openAlifboBolim(bolimId) {
  var bolim = null;
  for (var i = 0; i < ALIFBO.bolimlar.length; i++) {
    if (ALIFBO.bolimlar[i].id === bolimId) { bolim = ALIFBO.bolimlar[i]; break; }
  }
  if (!bolim) return;
  bolimFromPage = 'home';
  var topbar = document.getElementById('bolim-topbar');
  if (topbar) topbar.style.background = ALIFBO.color;
  var title = document.getElementById('bolim-page-title');
  if (title) title.textContent = bolim.name;
  var heroNum = document.getElementById('bl-hero-num');
  if (heroNum) { heroNum.textContent = bolim.icon; heroNum.style.background = 'rgba(255,255,255,0.25)'; heroNum.style.color = '#fff'; }
  var heroName = document.getElementById('bl-hero-name');
  if (heroName) heroName.textContent = bolim.name;
  var heroCourse = document.getElementById('bl-hero-course');
  if (heroCourse) heroCourse.textContent = "Alifbo va o'qish qoidalari";
  var hero = document.getElementById('bl-hero');
  if (hero) hero.style.background = ALIFBO.color;
  var list = document.getElementById('bl-darslar-list');
  if (list) {
    list.innerHTML = '<div class="bl-dars-item" onclick="openAlifboDars(\'' + bolimId + '\')">' +
      '<div class="bl-dars-left"><div class="bl-dars-play" style="background:rgba(155,89,182,0.15);color:' + ALIFBO.color + '">&#9654;</div>' +
      '<div><div class="bl-dars-name">1-dars</div><div class="bl-dars-meta">~10 daqiqa • Bepul</div></div></div>' +
      '<div class="bl-dars-arrow">›</div></div>';
  }
  showPage('bolim');
}

function openAlifboDars(bolimId) {
  var bolim = null;
  for (var i = 0; i < ALIFBO.bolimlar.length; i++) {
    if (ALIFBO.bolimlar[i].id === bolimId) { bolim = ALIFBO.bolimlar[i]; break; }
  }
  if (!bolim) return;
  currentDars = { courseId: 'alifbo_' + bolimId, bolim: 1, dars: 1 };
  var topbar = document.getElementById('dars-topbar');
  if (topbar) topbar.style.background = ALIFBO.color;
  var title = document.getElementById('dars-title');
  if (title) title.textContent = bolim.name + ' — 1-dars';
  var counter = document.getElementById('dars-counter');
  if (counter) counter.textContent = '1/1';
  var darsName = document.getElementById('dars-name');
  if (darsName) darsName.textContent = '1-dars: ' + bolim.name;
  var darsMeta = document.getElementById('dars-meta');
  if (darsMeta) darsMeta.textContent = '~10 daqiqa • Bepul';
  var tavsif = document.getElementById('dars-tavsif-text');
  if (tavsif) tavsif.textContent = bolim.name + " haqida to'liq ma'lumot va mashqlar.";
  var placeholder = document.getElementById('dars-video-placeholder');
  if (placeholder) { placeholder.style.display = 'flex'; placeholder.innerHTML = '<div class="dars-play-btn"><div class="dars-play-icon"></div></div><span class="dars-play-hint">Videoni bosing</span>'; }
  var iframe = document.getElementById('dars-iframe');
  if (iframe) { iframe.style.display = 'none'; iframe.src = ''; }
  var prevBtn = document.getElementById('dars-prev-btn');
  var nextBtn = document.getElementById('dars-next-btn');
  if (prevBtn) { prevBtn.style.opacity = '0.4'; prevBtn.style.borderColor = ALIFBO.color; prevBtn.style.color = ALIFBO.color; }
  if (nextBtn) { nextBtn.textContent = 'Tugatish ✓'; nextBtn.style.background = ALIFBO.color; nextBtn.style.color = '#fff'; }
  var firstTab = document.querySelector('.dars-tab');
  setDarsTab('tavsif', firstTab);
  var userId = tg && tg.initDataUnsafe && tg.initDataUnsafe.user ? tg.initDataUnsafe.user.id : 'unknown';
  createWatermark(userId);
  startScreenProtection();
  showPage('dars');
}

function courseCardHTML(course) {
  return '<div class="course-card" onclick="openCourse(\'' + course.id + '\',\'home\')">' +
    '<div class="cc-book"><img src="' + course.img + '" alt="' + course.name + '" onerror="this.parentElement.style.background=\'' + course.color + '\';this.style.display=\'none\'"></div>' +
    '<div class="cc-body"><div class="cc-name">' + course.name + '</div>' +
    '<div class="cc-meta">📚 ' + course.dars + ' dars · ⏰ ' + course.soat + ' soat</div>' +
    '<div class="cc-price">* * * so\'m</div></div>' +
    '<button class="cc-btn" onclick="event.stopPropagation();openCourse(\'' + course.id + '\',\'home\')">Ko\'rish</button>' +
    '</div>';
}

function renderHomeCourses(level) {
  var list = document.getElementById('home-course-list');
  if (!list) return;
  var html = '';
  var courses = COURSES[level];
  for (var i = 0; i < courses.length; i++) html += courseCardHTML(courses[i]);
  list.innerHTML = html;
}

function renderAllCourses() {
  var list = document.getElementById('all-course-list');
  if (!list) return;
  var html = '';
  var levels = Object.keys(COURSES);
  for (var l = 0; l < levels.length; l++) {
    var level = levels[l];
    var miniBooks = '';
    for (var m = 0; m < COURSES[level].length; m++) {
      miniBooks += '<div class="mini-book" style="background:' + COURSES[level][m].color + '">' + COURSES[level][m].id + '</div>';
    }
    var cards = '';
    for (var c = 0; c < COURSES[level].length; c++) cards += courseCardHTML(COURSES[level][c]);
    html += '<div class="level-group"><div class="lg-hero" style="background:#1a1a2e">' +
      '<img src="' + LEVEL_IMAGES[level] + '" alt="' + LEVEL_NAMES[level] + '">' +
      '<div class="lg-hero-content"><div class="lg-title">' + LEVEL_NAMES[level].toUpperCase() + '</div>' +
      '<div class="lg-sub-books">' + miniBooks + '</div></div></div>' + cards + '</div>';
  }
  list.innerHTML = html;
}

function openCourse(courseId, fromPage) {
  var course = null;
  var levels = Object.keys(COURSES);
  for (var l = 0; l < levels.length; l++) {
    var arr = COURSES[levels[l]];
    for (var i = 0; i < arr.length; i++) { if (arr[i].id === courseId) { course = arr[i]; break; } }
    if (course) break;
  }
  if (!course) return;
  selectedCourse = course;
  detailFromPage = fromPage || 'home';
  var topbar = document.getElementById('cd-topbar');
  if (topbar) topbar.style.background = course.color;
  var dt = document.getElementById('detail-title');
  if (dt) dt.textContent = course.name;
  var hero = document.getElementById('cd-hero');
  if (hero) hero.style.background = course.color;
  var heroImg = document.getElementById('cd-hero-img');
  if (heroImg) { heroImg.src = course.img; heroImg.alt = course.name; heroImg.onerror = function() { this.style.display = 'none'; }; }
  var heroName = document.getElementById('cd-hero-name');
  if (heroName) heroName.textContent = course.name;
  var heroLevel = document.getElementById('cd-hero-level');
  if (heroLevel) heroLevel.textContent = course.level;
  var heroDars = document.getElementById('cd-hero-dars');
  if (heroDars) heroDars.textContent = course.dars;
  var heroSoat = document.getElementById('cd-hero-soat');
  if (heroSoat) heroSoat.textContent = course.soat;
  var bolimCount = document.getElementById('cd-bolim-count');
  if (bolimCount) bolimCount.textContent = course.bolimlar + " ta bo'lim";
  var bolimList = document.getElementById('cd-bolim-list');
  if (bolimList) bolimList.innerHTML = renderBolimlar(course);
  var dp = document.getElementById('detail-price');
  if (dp) dp.textContent = "* * * so'm";
  var pn = document.getElementById('pay-name');
  if (pn) pn.textContent = course.name;
  var pm = document.getElementById('pay-meta');
  if (pm) pm.textContent = course.dars + ' dars';
  var pp = document.getElementById('pay-price');
  if (pp) pp.textContent = "* * * so'm";
  setTimeout(function() {
    var nums = document.querySelectorAll('.cd-bolim-num');
    for (var i = 0; i < nums.length; i++) { nums[i].style.color = course.color; nums[i].style.background = hexToRgba(course.color, 0.12); }
  }, 50);
  checkUserCourse(course.id);
  showPage('course-detail');
}

function isLightColor(hex) {
  var r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return (r*299 + g*587 + b*114) / 1000 > 128;
}

function hexToRgba(hex, alpha) {
  var r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
}

function renderBolimlar(course) {
  var html = '';
  for (var b = 1; b <= course.bolimlar; b++) {
    var unlocked = isBolimUnlocked(course.id, b);
    var completed = isBolimCompleted(course.id, b);
    if (unlocked) {
      html += '<div class="cd-bolim-item" onclick="openBolim(\'' + course.id + '\',' + b + ')">' +
        '<div class="cd-bolim-row"><div class="cd-bolim-num">' + b + '</div>' +
        '<div class="cd-bolim-name">' + b + "-bo'lim" + (completed ? ' <span style="color:#27AE60;font-size:12px">✅</span>' : '') + '</div>' +
        '<div class="cd-bolim-arrow">›</div></div>';
      if (!completed) {
        html += '<div style="padding:0 16px 12px" onclick="event.stopPropagation()">' +
          '<button onclick="openLugat(\'' + course.id + '\',' + b + ')" style="width:100%;padding:10px;background:rgba(66,165,245,0.1);color:#42A5F5;border:1.5px solid #42A5F5;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer">📖 Lug\'at topshirish</button></div>';
      }
      html += '</div>';
    } else {
      html += '<div class="cd-bolim-item" style="opacity:0.5"><div class="cd-bolim-row">' +
        '<div class="cd-bolim-num" style="background:#f0f0f0;color:#aaa">' + b + '</div>' +
        '<div class="cd-bolim-name">' + b + "-bo'lim</div><div style='font-size:18px'>🔒</div></div>" +
        '<div style="padding:0 16px 12px;font-size:12px;color:#aaa">' + (b-1) + "-bo'lim lug'atini topshiring</div></div>";
    }
  }
  return html;
}

function renderDarslar(bolimNum, courseId) {
  var html = '';
  for (var d = 1; d <= 4; d++) {
    var darsNum = (bolimNum - 1) * 4 + d;
    html += '<div class="cd-dars-item" onclick="openDars(\'' + courseId + '\',' + bolimNum + ',' + d + ')" style="cursor:pointer">' +
      '<div class="cd-dars-play">&#9654;</div><div class="cd-dars-name">' + darsNum + '-dars</div><div class="cd-dars-time">~10 min</div></div>';
  }
  return html;
}

function toggleBolim(el, id) {
  var darslar = document.getElementById('bolim-' + id);
  var arrow = el.querySelector('.cd-bolim-arrow');
  if (darslar.style.display === 'none') { darslar.style.display = 'block'; if (arrow) arrow.style.transform = 'rotate(90deg)'; }
  else { darslar.style.display = 'none'; if (arrow) arrow.style.transform = 'rotate(0)'; }
}

function openBolim(courseId, bolimNum) {
  var course = findCourse(courseId);
  if (!course) return;
  bolimFromPage = 'course-detail';
  var topbar = document.getElementById('bolim-topbar');
  if (topbar) topbar.style.background = course.color;
  var title = document.getElementById('bolim-page-title');
  if (title) title.textContent = bolimNum + "-bo'lim";
  var heroNum = document.getElementById('bl-hero-num');
  if (heroNum) heroNum.textContent = bolimNum;
  var heroName = document.getElementById('bl-hero-name');
  if (heroName) heroName.textContent = bolimNum + "-bo'lim";
  var heroCourse = document.getElementById('bl-hero-course');
  if (heroCourse) heroCourse.textContent = course.name;
  var hero = document.getElementById('bl-hero');
  if (hero) hero.style.background = course.color;
  var heroNumEl = document.getElementById('bl-hero-num');
  if (heroNumEl) { heroNumEl.style.background = 'rgba(255,255,255,0.25)'; heroNumEl.style.color = '#fff'; }
  var list = document.getElementById('bl-darslar-list');
  if (list) list.innerHTML = renderBolimDarslar(course, bolimNum);
  setTimeout(function() {
    var plays = document.querySelectorAll('.bl-dars-play');
    for (var i = 0; i < plays.length; i++) { plays[i].style.background = hexToRgba(course.color, 0.12); plays[i].style.color = course.color; }
  }, 30);
  showPage('bolim');
}

function renderBolimDarslar(course, bolimNum) {
  var html = '';
  for (var d = 1; d <= 4; d++) {
    var darsIndex = (bolimNum - 1) * 4 + d;
    html += '<div class="bl-dars-item" onclick="openDars(\'' + course.id + '\',' + bolimNum + ',' + d + ')">' +
      '<div class="bl-dars-left"><div class="bl-dars-play">&#9654;</div>' +
      '<div class="bl-dars-info"><div class="bl-dars-name">' + darsIndex + '-dars</div><div class="bl-dars-meta">~10 daqiqa</div></div></div>' +
      '<div class="bl-dars-arrow">›</div></div>';
  }
  return html;
}

let currentDars = { courseId: null, bolim: 1, dars: 1 };

function openDars(courseId, bolimNum, darsNum) {
  var course = findCourse(courseId);
  if (!course) return;
  currentDars = { courseId: courseId, bolim: bolimNum, dars: darsNum };
  var totalDars = course.bolimlar * 4;
  var darsIndex = (bolimNum - 1) * 4 + darsNum;

  var topbar = document.getElementById('dars-topbar');
  if (topbar) topbar.style.background = course.color;
  var title = document.getElementById('dars-title');
  if (title) title.textContent = course.name + ' — ' + darsIndex + '-dars';
  var counter = document.getElementById('dars-counter');
  if (counter) counter.textContent = darsIndex + '/' + totalDars;
  var darsName = document.getElementById('dars-name');
  if (darsName) darsName.textContent = darsIndex + '-dars: ' + bolimNum + "-bo'lim, " + darsNum + '-qism';
  var darsMeta = document.getElementById('dars-meta');
  if (darsMeta) darsMeta.textContent = bolimNum + "-bo'lim · ~10 daqiqa";
  var tavsif = document.getElementById('dars-tavsif-text');
  if (tavsif) tavsif.textContent = course.name + ' kitobining ' + bolimNum + "-bo'lim, " + darsNum + "-darsida yangi so'zlar va grammatika o'rganiladi.";

  // Placeholder qayta tiklash
  var placeholder = document.getElementById('dars-video-placeholder');
  if (placeholder) {
    placeholder.style.display = 'flex';
    placeholder.innerHTML = '<div class="dars-play-btn"><div class="dars-play-icon"></div></div><span class="dars-play-hint">Videoni bosing</span>';
  }
  // Eski videoni o'chirish
  var oldVideo = document.getElementById('dars-video');
  if (oldVideo) oldVideo.remove();
  var iframe = document.getElementById('dars-iframe');
  if (iframe) { iframe.style.display = 'none'; iframe.src = ''; }

  var fill = document.getElementById('dars-progress-fill');
  if (fill) fill.style.width = '0%';

  var prevBtn = document.getElementById('dars-prev-btn');
  var nextBtn = document.getElementById('dars-next-btn');
  if (prevBtn) { prevBtn.style.opacity = darsIndex <= 1 ? '0.4' : '1'; prevBtn.style.borderColor = course.color; prevBtn.style.color = course.color; }
  if (nextBtn) { nextBtn.textContent = darsIndex >= totalDars ? 'Tugatish ✓' : 'Keyingi dars ›'; nextBtn.style.background = course.color; nextBtn.style.color = isLightColor(course.color) ? '#1a1a2e' : '#fff'; }

  setTimeout(function() {
    var activeTabs = document.querySelectorAll('.dars-tab.active');
    for (var i = 0; i < activeTabs.length; i++) { activeTabs[i].style.color = course.color; activeTabs[i].style.borderBottomColor = course.color; }
    var playBtn = document.querySelector('.dars-play-btn');
    if (playBtn) playBtn.style.background = course.color;
    var fill2 = document.getElementById('dars-progress-fill');
    if (fill2) fill2.style.background = course.color;
  }, 50);

  var firstTab = document.querySelector('.dars-tab');
  setDarsTab('tavsif', firstTab);

  // 🔐 Watermark va himoya
  var userId = tg && tg.initDataUnsafe && tg.initDataUnsafe.user ? tg.initDataUnsafe.user.id : 'unknown';
  createWatermark(userId);
  startScreenProtection();

  showPage('dars');
}

function findCourse(courseId) {
  var levels = Object.keys(COURSES);
  for (var l = 0; l < levels.length; l++) {
    var arr = COURSES[levels[l]];
    for (var i = 0; i < arr.length; i++) { if (arr[i].id === courseId) return arr[i]; }
  }
  return null;
}

function setDarsTab(tab, el) {
  var tabs = ['tavsif', 'material', 'test'];
  for (var i = 0; i < tabs.length; i++) { var cnt = document.getElementById('dars-tab-' + tabs[i]); if (cnt) cnt.style.display = 'none'; }
  var allTabs = document.querySelectorAll('.dars-tab');
  for (var j = 0; j < allTabs.length; j++) { allTabs[j].classList.remove('active'); allTabs[j].style.color = ''; allTabs[j].style.borderBottomColor = ''; }
  var activeContent = document.getElementById('dars-tab-' + tab);
  if (activeContent) activeContent.style.display = 'block';
  if (el) {
    el.classList.add('active');
    var course = findCourse(currentDars.courseId);
    if (course) { el.style.color = course.color; el.style.borderBottomColor = course.color; }
  }
}

function prevDars() {
  var course = findCourse(currentDars.courseId);
  if (!course) return;
  var darsIndex = (currentDars.bolim - 1) * 4 + currentDars.dars;
  if (darsIndex <= 1) return;
  darsIndex--;
  var newBolim = Math.ceil(darsIndex / 4);
  var newDars = darsIndex - (newBolim - 1) * 4;
  openDars(currentDars.courseId, newBolim, newDars);
}

function nextDars() {
  var course = findCourse(currentDars.courseId);
  if (!course) return;
  var totalDars = course.bolimlar * 4;
  var darsIndex = (currentDars.bolim - 1) * 4 + currentDars.dars;
  if (darsIndex >= totalDars) { showPage('bolim'); return; }
  darsIndex++;
  var newBolim = Math.ceil(darsIndex / 4);
  var newDars = darsIndex - (newBolim - 1) * 4;
  openDars(currentDars.courseId, newBolim, newDars);
}

function selectPay(el) {
  var opts = document.querySelectorAll('.pay-opt');
  for (var i = 0; i < opts.length; i++) opts[i].querySelector('.radio').classList.remove('on');
  el.querySelector('.radio').classList.add('on');
}

function loadMyCourses() {
  var userId = tg && tg.initDataUnsafe && tg.initDataUnsafe.user ? tg.initDataUnsafe.user.id : null;
  var list = document.getElementById('my-courses-list');
  if (!list) return;
  if (!userId) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">📚</div><div class="empty-title">Sizda hali kurslar yo\'q</div><div class="empty-sub">Kurs sotib olib o\'qishni boshlang.</div><button class="empty-btn" onclick="showPage(\'courses\')">Kurslarni ko\'rish</button></div>';
    return;
  }
  fetch(BACKEND_URL + '/my-courses?userId=' + userId)
    .then(function(res) { return res.json(); })
    .then(function(data) {
      var courses = data.courses || [];
      var coursesWithInfo = data.coursesWithInfo || [];
      if (courses.length === 0) {
        list.innerHTML = '<div class="empty-state"><div class="empty-icon">📚</div><div class="empty-title">Sizda hali kurslar yo\'q</div><div class="empty-sub">Kurs sotib olib o\'qishni boshlang.</div><button class="empty-btn" onclick="showPage(\'courses\')">Kurslarni ko\'rish</button></div>';
        return;
      }
      var html = '<div style="padding:14px 12px 0"><div style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:12px">✅ Sizning kurslaringiz</div>';
      for (var i = 0; i < courses.length; i++) {
        var courseId = courses[i];
        var course = findCourse(courseId);
        if (!course) continue;
        var endDate = '';
        for (var j = 0; j < coursesWithInfo.length; j++) {
          if (coursesWithInfo[j].courseId === courseId && coursesWithInfo[j].endDate) {
            var d = new Date(coursesWithInfo[j].endDate);
            endDate = d.getDate() + '.' + (d.getMonth()+1) + '.' + d.getFullYear();
            break;
          }
        }
        html += '<div class="big-course-card" onclick="openCourse(\'' + courseId + '\',\'my-courses\')">' +
          '<div class="bcc-img"><img src="' + course.img + '" alt="' + course.name + '" onerror="this.style.display=\'none\'"></div>' +
          '<div class="bcc-body"><div class="bcc-name">' + course.name + '</div>' +
          '<div class="bcc-meta">📚 ' + course.dars + ' dars · ' + course.soat + ' soat</div>' +
          '<div style="color:#27AE60;font-size:13px;font-weight:600;margin-top:4px">✅ Sotib olingan</div>' +
          (endDate ? '<div style="color:#888;font-size:12px;margin-top:2px">⏰ ' + endDate + ' gacha</div>' : '') +
          '<button class="bcc-btn" style="background:' + course.color + ';color:#fff;margin-top:6px" onclick="event.stopPropagation();openCourse(\'' + courseId + '\',\'my-courses\')">Davom etish ›</button>' +
          '</div></div>';
      }
      html += '</div>';
      list.innerHTML = html;
    })
    .catch(function() {
      list.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-title">Xatolik yuz berdi</div><div class="empty-sub">Qayta urinib ko\'ring.</div></div>';
    });
}

function checkUserCourse(courseId) {
  var userId = tg && tg.initDataUnsafe && tg.initDataUnsafe.user ? tg.initDataUnsafe.user.id : null;
  var buyBtn = document.getElementById('buy-btn');
  var buyPrice = document.getElementById('detail-price');
  if (!userId) return;
  fetch(BACKEND_URL + '/my-courses?userId=' + userId)
    .then(function(res) { return res.json(); })
    .then(function(data) {
      var courses = data.courses || [];
      var coursesWithInfo = data.coursesWithInfo || [];
      if (courses.indexOf(courseId) !== -1) {
        var endDate = '';
        for (var i = 0; i < coursesWithInfo.length; i++) {
          if (coursesWithInfo[i].courseId === courseId && coursesWithInfo[i].endDate) {
            var d = new Date(coursesWithInfo[i].endDate);
            endDate = d.getDate() + '.' + (d.getMonth()+1) + '.' + d.getFullYear();
            break;
          }
        }
        if (buyBtn) { buyBtn.textContent = '✅ Davom etish'; buyBtn.style.background = '#27AE60'; buyBtn.onclick = null; }
        if (buyPrice) { buyPrice.innerHTML = '✅ Sotib olingan' + (endDate ? '<br><span style="font-size:11px;color:#888">' + endDate + ' gacha</span>' : ''); buyPrice.style.color = '#27AE60'; buyPrice.style.fontSize = '13px'; }
      } else {
        if (buyBtn) { buyBtn.textContent = 'Sotib olish'; buyBtn.style.background = '#42A5F5'; buyBtn.onclick = function() { showPage('payment'); }; }
        if (buyPrice) { buyPrice.textContent = "* * * so'm"; buyPrice.style.color = ''; buyPrice.style.fontSize = ''; }
      }
    })
    .catch(function() {});
}

function copyCard() {
  var cardNumber = '9860120173642691';
  if (navigator.clipboard) {
    navigator.clipboard.writeText(cardNumber).then(function() {
      var btn = document.getElementById('copy-btn');
      if (btn) { btn.textContent = '✅ Nusxalandi'; setTimeout(function() { btn.textContent = 'Nusxa'; }, 2000); }
    });
  } else {
    var el = document.createElement('textarea'); el.value = cardNumber; document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el);
    var btn = document.getElementById('copy-btn');
    if (btn) { btn.textContent = '✅ Nusxalandi'; setTimeout(function() { btn.textContent = 'Nusxa'; }, 2000); }
  }
}

function uploadChek(input) {
  var file = input.files[0];
  if (!file) return;
  var status = document.getElementById('chek-status');
  if (status) { status.style.display = 'block'; status.style.background = '#fff3cd'; status.style.color = '#856404'; status.textContent = '⏳ Yuklanmoqda...'; }
  var userId = tg && tg.initDataUnsafe && tg.initDataUnsafe.user ? tg.initDataUnsafe.user.id : null;
  var username = tg && tg.initDataUnsafe && tg.initDataUnsafe.user ? tg.initDataUnsafe.user.username || '' : '';
  var firstName = tg && tg.initDataUnsafe && tg.initDataUnsafe.user ? tg.initDataUnsafe.user.first_name || '' : '';
  var courseId = selectedCourse ? selectedCourse.id : '';
  var formData = new FormData();
  formData.append('photo', file); formData.append('userId', userId); formData.append('username', username); formData.append('firstName', firstName); formData.append('courseId', courseId);
  fetch(BACKEND_URL + '/upload-chek', { method: 'POST', body: formData })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (data.success) { if (status) { status.style.background = '#d4edda'; status.style.color = '#155724'; status.textContent = '✅ Chek yuborildi! Admin tez orada tasdiqlaydi.'; } }
      else { if (status) { status.style.background = '#f8d7da'; status.style.color = '#721c24'; status.textContent = '❌ Xatolik! Qayta urinib ko\'ring.'; } }
    })
    .catch(function() { if (status) { status.style.background = '#f8d7da'; status.style.color = '#721c24'; status.textContent = '❌ Internet xatosi! Qayta urinib ko\'ring.'; } });
}

function openBotChat() {
  if (tg) tg.openTelegramLink('https://t.me/KCstudy_bot');
  else window.open('https://t.me/KCstudy_bot', '_blank');
}

var contBtn = document.getElementById('cont-btn');
if (contBtn) {
  contBtn.addEventListener('click', function() {
    var courseId = selectedCourse ? selectedCourse.id : '';
    if (!courseId) return;
    var userId = tg && tg.initDataUnsafe && tg.initDataUnsafe.user ? tg.initDataUnsafe.user.id : null;
    var username = tg && tg.initDataUnsafe && tg.initDataUnsafe.user ? tg.initDataUnsafe.user.username || '' : '';
    var firstName = tg && tg.initDataUnsafe && tg.initDataUnsafe.user ? tg.initDataUnsafe.user.first_name || '' : '';
    var btn = document.getElementById('cont-btn');
    if (btn) { btn.textContent = "Yuborilmoqda..."; btn.disabled = true; }
    fetch(BACKEND_URL + '/payment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: userId, courseId: courseId, username: username, firstName: firstName }) })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (btn) { btn.textContent = "To'lovni davom ettirish"; btn.disabled = false; }
        if (data.success) { showPage('home'); alert("✅ So'rovingiz qabul qilindi!\n\nKarta raqami va miqdorni botga yuboring.\nAdmin 24 soat ichida tasdiqlaydi."); }
        else { alert("Xatolik yuz berdi. Qayta urinib ko'ring."); }
      })
      .catch(function() { if (btn) { btn.textContent = "To'lovni davom ettirish"; btn.disabled = false; } alert("Xatolik! Internet aloqasini tekshiring."); });
  });
}

// Dark mode init
var isDark = localStorage.getItem('darkMode') === '1';
if (isDark) { document.body.classList.add('dark'); var btn = document.getElementById('dark-toggle'); if (btn) btn.textContent = '☀️'; }
updateBannerImg(isDark);

renderHomeCourses('boshlangich');
renderAllCourses2('all');

function bigCourseCardHTML(course) {
  var progress = 0;
  var textColor = isLightColor(course.color) ? '#1a1a2e' : '#fff';
  return ['<div class="big-course-card" onclick="openCourse(\'' + course.id + '\',\'courses\')">',
    '<div class="bcc-img"><img src="' + course.img + '" alt="' + course.name + '" onerror="this.style.display=\'none\'"></div>',
    '<div class="bcc-body"><div class="bcc-name">' + course.name + '</div>',
    '<div class="bcc-meta">\uD83D\uDCDA ' + course.dars + ' dars \u00B7 ' + course.soat + ' soat</div>',
    '<div class="bcc-price">* * * so\'m</div>',
    '<div class="bcc-progress-wrap"><div class="bcc-progress-bar"><div class="bcc-progress-fill" style="width:' + progress + '%;background:' + course.color + '"></div></div><span class="bcc-percent">' + progress + '%</span></div>',
    '<button class="bcc-btn" style="background:' + course.color + ';color:' + textColor + '" onclick="event.stopPropagation();openCourse(\'' + course.id + '\',\'courses\')">Ko\'rish</button>',
    '</div></div>'].join('');
}

function renderAllCourses2(filterLevel) {
  var list = document.getElementById('all-course-list');
  if (!list) return;
  var html = '';
  var levels = Object.keys(COURSES);
  for (var l = 0; l < levels.length; l++) {
    var level = levels[l];
    if (filterLevel && filterLevel !== 'all' && filterLevel !== level) continue;
    for (var c = 0; c < COURSES[level].length; c++) html += bigCourseCardHTML(COURSES[level][c]);
  }
  list.innerHTML = html || '<div style="text-align:center;padding:40px;color:#888">Kurs topilmadi</div>';
}

function filterCourses(level, el) {
  var tabs = document.querySelectorAll('.cf-tab');
  for (var i = 0; i < tabs.length; i++) tabs[i].classList.remove('active');
  if (el) el.classList.add('active');
  renderAllCourses2(level);
}

function toggleSearch() {
  var bar = document.getElementById('search-bar');
  if (!bar) return;
  if (bar.style.display === 'none') { bar.style.display = 'block'; var inp = document.getElementById('search-input'); if (inp) inp.focus(); }
  else { bar.style.display = 'none'; renderAllCourses2('all'); }
}

function searchCourses(query) {
  var list = document.getElementById('all-course-list');
  if (!list) return;
  query = query.toLowerCase();
  var html = '';
  var levels = Object.keys(COURSES);
  for (var l = 0; l < levels.length; l++) {
    for (var c = 0; c < COURSES[levels[l]].length; c++) {
      var course = COURSES[levels[l]][c];
      if (course.name.toLowerCase().indexOf(query) !== -1) html += bigCourseCardHTML(course);
    }
  }
  list.innerHTML = html || '<div style="text-align:center;padding:40px;color:#888">Kurs topilmadi</div>';
}
