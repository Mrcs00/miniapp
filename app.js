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

// Saqlangan rejimni yuklash
(function() {
  var isDark = localStorage.getItem('darkMode') === '1';
  if (isDark) {
    document.body.classList.add('dark');
    var btn = document.getElementById('dark-toggle');
    if (btn) btn.textContent = '☀️';
  }
  updateBannerImg(isDark);
})();

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
    { id:'1A', name:'SNU 1A', level:"Boshlang'ich daraja", color:'#42A5F5', bolimlar:8, dars:20, soat:10, img:'https://raw.githubusercontent.com/Mrcs00/miniapp/main/1a.jpg' },
    { id:'1B', name:'SNU 1B', level:"Boshlang'ich daraja", color:'#4CAF50', bolimlar:8, dars:25, soat:12, img:'https://raw.githubusercontent.com/Mrcs00/miniapp/main/1b.jpg' },
    { id:'2A', name:'SNU 2A', level:"Boshlang'ich daraja", color:'#2196F3', bolimlar:8, dars:24, soat:11, img:'https://raw.githubusercontent.com/Mrcs00/miniapp/main/2a.jpg' },
    { id:'2B', name:'SNU 2B', level:"Boshlang'ich daraja", color:'#00BCD4', bolimlar:8, dars:24, soat:11, img:'https://raw.githubusercontent.com/Mrcs00/miniapp/main/2b.jpg' },
  ],
  orta: [
    { id:'3A', name:'SNU 3A', level:"O'rta daraja",        color:'#9C27B0', bolimlar:8, dars:20, soat:10, img:'https://raw.githubusercontent.com/Mrcs00/miniapp/main/3a.jpg' },
    { id:'3B', name:'SNU 3B', level:"O'rta daraja",        color:'#E91E63', bolimlar:8, dars:20, soat:10, img:'https://raw.githubusercontent.com/Mrcs00/miniapp/main/3b.jpg' },
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
let detailFromPage = 'home'; // qaysi sahifadan keldi

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

function showPage(pageId) {
  var pages = document.querySelectorAll('.page');
  for (var i = 0; i < pages.length; i++) {
    pages[i].classList.remove('active');
  }
  var page = document.getElementById('page-' + pageId);
  if (page) {
    page.classList.add('active');
    page.scrollTop = 0;
  }
}

function goBackFromDetail() {
  showPage(detailFromPage);
}

function setLevel(level, el) {
  currentLevel = level;
  var tabs = document.querySelectorAll('.lv-tab');
  for (var i = 0; i < tabs.length; i++) tabs[i].classList.remove('active');
  el.classList.add('active');
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
    html += '<div class="course-card alifbo-card" onclick="openAlifboBolim('' + b.id + '')">' +
      '<div class="cc-book" style="background:' + ALIFBO.color + ';display:flex;align-items:center;justify-content:center;font-size:24px">' +
      b.icon +
      '</div>' +
      '<div class="cc-body">' +
      '<div class="cc-name">' + b.name + '</div>' +
      '<div class="cc-meta">📚 ' + b.dars + ' dars</div>' +
      '<div class="cc-price" style="color:#27AE60;font-size:13px">✅ Bepul</div>' +
      '</div>' +
      '<button class="cc-btn" style="background:' + ALIFBO.color + '" onclick="event.stopPropagation();openAlifboBolim('' + b.id + '')">Ko'rish</button>' +
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

  // Bo'lim sahifasini ochamiz
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
    list.innerHTML = '<div class="bl-dars-item" onclick="openAlifboDars('' + bolimId + '')" >' +
      '<div class="bl-dars-left">' +
      '<div class="bl-dars-play" style="background:rgba(155,89,182,0.15);color:' + ALIFBO.color + '">&#9654;</div>' +
      '<div>' +
      '<div class="bl-dars-name">1-dars</div>' +
      '<div class="bl-dars-meta">~10 daqiqa • Bepul</div>' +
      '</div></div>' +
      '<div class="bl-dars-arrow">›</div>' +
      '</div>';
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
  if (tavsif) tavsif.textContent = bolim.name + ' haqida to'liq ma'lumot va mashqlar.';

  var placeholder = document.getElementById('dars-video-placeholder');
  var iframe = document.getElementById('dars-iframe');
  if (placeholder) placeholder.style.display = 'flex';
  if (iframe) { iframe.style.display = 'none'; iframe.src = ''; }

  var prevBtn = document.getElementById('dars-prev-btn');
  var nextBtn = document.getElementById('dars-next-btn');
  if (prevBtn) { prevBtn.style.opacity = '0.4'; prevBtn.style.borderColor = ALIFBO.color; prevBtn.style.color = ALIFBO.color; }
  if (nextBtn) { nextBtn.textContent = 'Tugatish ✓'; nextBtn.style.background = ALIFBO.color; nextBtn.style.color = '#fff'; }

  var firstTab = document.querySelector('.dars-tab');
  setDarsTab('tavsif', firstTab);

  showPage('dars');
}

function courseCardHTML(course) {
  return '<div class="course-card" onclick="openCourse(\'' + course.id + '\',\'home\')">' +
    '<div class="cc-book">' +
    '<img src="' + course.img + '" alt="' + course.name + '" onerror="this.parentElement.style.background=\'' + course.color + '\';this.style.display=\'none\'">' +
    '</div>' +
    '<div class="cc-body">' +
    '<div class="cc-name">' + course.name + '</div>' +
    '<div class="cc-meta">📚 ' + course.dars + ' dars · ⏰ ' + course.soat + ' soat</div>' +
    '<div class="cc-price">* * * so\'m</div>' +
    '</div>' +
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
    for (var c = 0; c < COURSES[level].length; c++) {
      cards += courseCardHTML(COURSES[level][c]);
    }
    html += '<div class="level-group">' +
      '<div class="lg-hero" style="background:#1a1a2e">' +
      '<img src="' + LEVEL_IMAGES[level] + '" alt="' + LEVEL_NAMES[level] + '">' +
      '<div class="lg-hero-content">' +
      '<div class="lg-title">' + LEVEL_NAMES[level].toUpperCase() + '</div>' +
      '<div class="lg-sub-books">' + miniBooks + '</div>' +
      '</div></div>' + cards + '</div>';
  }
  list.innerHTML = html;
}

// ── Kurs detail ochish (yangi dizayn) ──
function openCourse(courseId, fromPage) {
  var course = null;
  var levels = Object.keys(COURSES);
  for (var l = 0; l < levels.length; l++) {
    var arr = COURSES[levels[l]];
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].id === courseId) { course = arr[i]; break; }
    }
    if (course) break;
  }
  if (!course) return;

  selectedCourse = course;
  detailFromPage = fromPage || 'home';

  // Topbar rangi
  var topbar = document.getElementById('cd-topbar');
  if (topbar) topbar.style.background = course.color;

  // Title
  var dt = document.getElementById('detail-title');
  if (dt) dt.textContent = course.name;

  // Hero banner
  var hero = document.getElementById('cd-hero');
  if (hero) hero.style.background = course.color;

  var heroImg = document.getElementById('cd-hero-img');
  if (heroImg) {
    heroImg.src = course.img;
    heroImg.alt = course.name;
    heroImg.onerror = function() { this.style.display = 'none'; };
  }

  var heroName = document.getElementById('cd-hero-name');
  if (heroName) heroName.textContent = course.name;

  var heroLevel = document.getElementById('cd-hero-level');
  if (heroLevel) heroLevel.textContent = course.level;

  var heroDars = document.getElementById('cd-hero-dars');
  if (heroDars) heroDars.textContent = course.dars;

  var heroSoat = document.getElementById('cd-hero-soat');
  if (heroSoat) heroSoat.textContent = course.soat;

  // Bo'limlar soni
  var bolimCount = document.getElementById('cd-bolim-count');
  if (bolimCount) bolimCount.textContent = course.bolimlar + " ta bo'lim";

  // Bo'limlar ro'yxati
  var bolimList = document.getElementById('cd-bolim-list');
  if (bolimList) bolimList.innerHTML = renderBolimlar(course);

  // Narx
  var dp = document.getElementById('detail-price');
  if (dp) dp.textContent = "* * * so'm";

  // Payment sahifasi uchun
  var pn = document.getElementById('pay-name');
  if (pn) pn.textContent = course.name;
  var pm = document.getElementById('pay-meta');
  if (pm) pm.textContent = course.dars + ' dars';
  var pp = document.getElementById('pay-price');
  if (pp) pp.textContent = "* * * so'm";

  // Bo'lim raqamlari rangi = kurs rangi
  setTimeout(function() {
    var nums = document.querySelectorAll('.cd-bolim-num');
    for (var i = 0; i < nums.length; i++) {
      nums[i].style.color = course.color;
      nums[i].style.background = hexToRgba(course.color, 0.12);
    }
  }, 50);

  showPage('course-detail');
}

function isLightColor(hex) {
  var r = parseInt(hex.slice(1,3),16);
  var g = parseInt(hex.slice(3,5),16);
  var b = parseInt(hex.slice(5,7),16);
  return (r*299 + g*587 + b*114) / 1000 > 128;
}

function hexToRgba(hex, alpha) {
  var r = parseInt(hex.slice(1,3),16);
  var g = parseInt(hex.slice(3,5),16);
  var b = parseInt(hex.slice(5,7),16);
  return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
}

function renderBolimlar(course) {
  var html = '';
  for (var b = 1; b <= course.bolimlar; b++) {
    html += '<div class="cd-bolim-item" onclick="openBolim(\'' + course.id + '\',' + b + ')">' +
      '<div class="cd-bolim-row">' +
      '<div class="cd-bolim-num">' + b + '</div>' +
      '<div class="cd-bolim-name">' + b + "-bo'lim</div>" +
      '<div class="cd-bolim-arrow">›</div>' +
      '</div>' +
      '</div>';
  }
  return html;
}

function renderDarslar(bolimNum, courseId) {
  var html = '';
  for (var d = 1; d <= 4; d++) {
    var darsNum = (bolimNum - 1) * 4 + d;
    html += '<div class="cd-dars-item" onclick="openDars(\'' + courseId + '\',' + bolimNum + ',' + d + ')" style="cursor:pointer">' +
      '<div class="cd-dars-play">&#9654;</div>' +
      '<div class="cd-dars-name">' + darsNum + '-dars</div>' +
      '<div class="cd-dars-time">~10 min</div>' +
      '</div>';
  }
  return html;
}

function toggleBolim(el, id) {
  var darslar = document.getElementById('bolim-' + id);
  var arrow = el.querySelector('.cd-bolim-arrow');
  if (darslar.style.display === 'none') {
    darslar.style.display = 'block';
    if (arrow) arrow.style.transform = 'rotate(90deg)';
  } else {
    darslar.style.display = 'none';
    if (arrow) arrow.style.transform = 'rotate(0)';
  }
}

// ── BO'LIM SAHIFASI ──
function openBolim(courseId, bolimNum) {
  var course = findCourse(courseId);
  if (!course) return;

  // Topbar rangi
  var topbar = document.getElementById('bolim-topbar');
  if (topbar) topbar.style.background = course.color;

  // Sarlavha
  var title = document.getElementById('bolim-page-title');
  if (title) title.textContent = bolimNum + "-bo'lim";

  // Hero
  var heroNum = document.getElementById('bl-hero-num');
  if (heroNum) heroNum.textContent = bolimNum;

  var heroName = document.getElementById('bl-hero-name');
  if (heroName) heroName.textContent = bolimNum + "-bo'lim";

  var heroCourse = document.getElementById('bl-hero-course');
  if (heroCourse) heroCourse.textContent = course.name;

  // Hero rang
  var hero = document.getElementById('bl-hero');
  if (hero) hero.style.background = course.color;

  // Raqam rangi
  var heroNumEl = document.getElementById('bl-hero-num');
  if (heroNumEl) {
    heroNumEl.style.background = 'rgba(255,255,255,0.25)';
    heroNumEl.style.color = '#fff';
  }

  // Darslar ro'yxati
  var list = document.getElementById('bl-darslar-list');
  if (list) list.innerHTML = renderBolimDarslar(course, bolimNum);

  // Dars raqamlari rangi
  setTimeout(function() {
    var plays = document.querySelectorAll('.bl-dars-play');
    for (var i = 0; i < plays.length; i++) {
      plays[i].style.background = hexToRgba(course.color, 0.12);
      plays[i].style.color = course.color;
    }
  }, 30);

  showPage('bolim');
}

function renderBolimDarslar(course, bolimNum) {
  var html = '';
  for (var d = 1; d <= 4; d++) {
    var darsIndex = (bolimNum - 1) * 4 + d;
    html += '<div class="bl-dars-item" onclick="openDars(\'' + course.id + '\',' + bolimNum + ',' + d + ')">' +
      '<div class="bl-dars-left">' +
      '<div class="bl-dars-play">&#9654;</div>' +
      '<div class="bl-dars-info">' +
      '<div class="bl-dars-name">' + darsIndex + '-dars</div>' +
      '<div class="bl-dars-meta">~10 daqiqa</div>' +
      '</div>' +
      '</div>' +
      '<div class="bl-dars-arrow">›</div>' +
      '</div>';
  }
  return html;
}

// ── DARS SAHIFASI ──
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

  var placeholder = document.getElementById('dars-video-placeholder');
  var iframe = document.getElementById('dars-iframe');
  if (placeholder) placeholder.style.display = 'flex';
  if (iframe) { iframe.style.display = 'none'; iframe.src = ''; }

  var fill = document.getElementById('dars-progress-fill');
  if (fill) fill.style.width = '0%';

  var prevBtn = document.getElementById('dars-prev-btn');
  var nextBtn = document.getElementById('dars-next-btn');
  if (prevBtn) {
    prevBtn.style.opacity = darsIndex <= 1 ? '0.4' : '1';
    prevBtn.style.borderColor = course.color;
    prevBtn.style.color = course.color;
  }
  if (nextBtn) {
    nextBtn.textContent = darsIndex >= totalDars ? 'Tugatish ✓' : 'Keyingi dars ›';
    nextBtn.style.background = course.color;
    nextBtn.style.color = isLightColor(course.color) ? '#1a1a2e' : '#fff';
  }

  // Tab active rang
  setTimeout(function() {
    var activeTabs = document.querySelectorAll('.dars-tab.active');
    for (var i = 0; i < activeTabs.length; i++) {
      activeTabs[i].style.color = course.color;
      activeTabs[i].style.borderBottomColor = course.color;
    }
    // Play button rang
    var playBtn = document.querySelector('.dars-play-btn');
    if (playBtn) playBtn.style.background = course.color;
    // Progress rang
    var fill = document.getElementById('dars-progress-fill');
    if (fill) fill.style.background = course.color;
  }, 50);

  var firstTab = document.querySelector('.dars-tab');
  setDarsTab('tavsif', firstTab);

  showPage('dars');
}

function findCourse(courseId) {
  var levels = Object.keys(COURSES);
  for (var l = 0; l < levels.length; l++) {
    var arr = COURSES[levels[l]];
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].id === courseId) return arr[i];
    }
  }
  return null;
}

function playVideo() {
  var placeholder = document.getElementById('dars-video-placeholder');
  var iframe = document.getElementById('dars-iframe');
  if (!placeholder || !iframe) return;
  var demoVideoId = 'yWKe1Ml3ZlI';
  iframe.src = 'https://www.youtube.com/embed/' + demoVideoId + '?autoplay=1';
  placeholder.style.display = 'none';
  iframe.style.display = 'block';
}

function setDarsTab(tab, el) {
  var tabs = ['tavsif', 'material', 'test'];
  for (var i = 0; i < tabs.length; i++) {
    var cnt = document.getElementById('dars-tab-' + tabs[i]);
    if (cnt) cnt.style.display = 'none';
  }
  var allTabs = document.querySelectorAll('.dars-tab');
  for (var j = 0; j < allTabs.length; j++) {
    allTabs[j].classList.remove('active');
    allTabs[j].style.color = '';
    allTabs[j].style.borderBottomColor = '';
  }
  var activeContent = document.getElementById('dars-tab-' + tab);
  if (activeContent) activeContent.style.display = 'block';
  if (el) {
    el.classList.add('active');
    var course = findCourse(currentDars.courseId);
    if (course) {
      el.style.color = course.color;
      el.style.borderBottomColor = course.color;
    }
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
  for (var i = 0; i < opts.length; i++) {
    opts[i].querySelector('.radio').classList.remove('on');
  }
  el.querySelector('.radio').classList.add('on');
}

var contBtn = document.getElementById('cont-btn');
if (contBtn) {
  contBtn.addEventListener('click', function() {
    if (tg) {
      tg.sendData(JSON.stringify({ action: 'payment', course: selectedCourse ? selectedCourse.id : '' }));
    } else {
      alert("To'lov amalga oshirildi!\nAdmin tez orada tasdiqlaydi.");
    }
  });
}

// Render
renderHomeCourses('boshlangich');
renderAllCourses();
