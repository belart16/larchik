/* Larchik site: a Windows 11 desktop with Larchik in the tray (wide screen with a mouse),
   or a page tried with a finger (phone). Plain script, no build: GitHub Pages serves docs/ as is.
   What the demo does by itself is honest: the calculator, rates of the CBR, notes, snippets and
   the translator (MyMemory, after a yes) work for real; the AI answers from prepared texts. */
(function () {
  "use strict";

  var DL = "https://github.com/belart16/larchik/releases/latest/download/Larchik-Setup.exe";
  var root = document.documentElement;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem("larchik-site-" + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem("larchik-site-" + k, JSON.stringify(v)); } catch (e) {} }
  };
  function copy(text) { try { navigator.clipboard.writeText(text).catch(function () {}); } catch (e) {} }

  // ------------------------------------------------------------------ shared data
  var SAMPLE_RU = "Привет, Ольга! Высылаю отчёт за октябрь, посмотри пожалуйста когда будет время. Если есть вопросы по цыфрам пиши, я на связи до пятници.";
  var SAMPLE_EN = "Hello team, the release is moving to Friday. Please check your tasks and update the board before the meeting.";
  var DOC = "Попробуй Larchik прямо здесь.\n\n" +
    "1. Выдели мышью абзац про отчёт.\n" +
    "2. Нажми Ctrl + Alt + A и выбери «Исправить ошибки».\n" +
    "3. Нажми «Вставить в программу» - текст заменится на месте.\n\n" +
    SAMPLE_RU + "\n\n" + SAMPLE_EN + "\n\n" +
    "Ещё: выдели английский абзац и нажми Ctrl + Alt + Z - он переведётся без ИИ.\n" +
    "А если напечатать 1д - заготовка подставит сегодняшнее число.\n";

  var ACTIONS = [
    { id: "improve", label: "Улучшить" },
    { id: "short", label: "Короче" },
    { id: "fix", label: "Исправить ошибки" },
    { id: "business", label: "Деловой стиль" }
  ];
  var RESULTS = {};
  RESULTS[SAMPLE_RU] = {
    fix: "Привет, Ольга! Высылаю отчёт за октябрь, посмотри, пожалуйста, когда будет время. Если есть вопросы по цифрам, пиши, я на связи до пятницы.",
    improve: "Ольга, привет! Отправляю отчёт за октябрь. Посмотри, пожалуйста, когда будет минутка. Если появятся вопросы по цифрам, пиши: до пятницы я на связи.",
    short: "Ольга, привет! Отчёт за октябрь - во вложении. Вопросы по цифрам - пиши до пятницы.",
    business: "Добрый день, Ольга! Направляю отчёт за октябрь. Прошу ознакомиться с ним, когда будет удобно. Если возникнут вопросы по показателям, я на связи до пятницы.",
    lang: "Hi Olga! I'm sending the October report, please take a look when you have time. If you have any questions about the numbers, let me know, I'm available until Friday."
  };
  RESULTS[SAMPLE_EN] = {
    fix: SAMPLE_EN,
    improve: "Hi team, the release has moved to Friday. Please review your tasks and update the board before the meeting.",
    short: "Release moves to Friday. Update the board before the meeting.",
    business: "Dear team, please note that the release has been rescheduled to Friday. Kindly review your tasks and update the board ahead of the meeting.",
    lang: "Привет, команда! Релиз переносится на пятницу. Проверьте свои задачи и обновите доску до встречи."
  };
  RESULTS[RESULTS[SAMPLE_RU].fix] = RESULTS[SAMPLE_RU];   // the paragraph once fixed still knows its other versions
  var TR_CACHE = {};
  TR_CACHE[SAMPLE_EN] = RESULTS[SAMPLE_EN].lang;
  TR_CACHE[SAMPLE_RU] = RESULTS[SAMPLE_RU].lang;
  TR_CACHE[RESULTS[SAMPLE_RU].fix] = RESULTS[SAMPLE_RU].lang;

  var FAQ = [
    ["Это бесплатно?", "Да. Сам Larchik бесплатный. За ИИ платишь сервису напрямую и только за то, чем пользуешься: на cloud.ru 100 ₽ на GigaChat хватает на тысячи запросов, у Яндекса есть стартовый грант, а модель на своём компьютере бесплатна совсем. Цены - в <a href=\"ai.html#price\" data-open=\"ai\">инструкции</a>."],
    ["Нужен ли VPN?", "Нет. cloud.ru и Алиса AI работают в России. Переводчик и текст с экрана тоже работают без VPN. DeepSeek - зарубежный: ему нужен VPN и оплата долларами."],
    ["На каких компьютерах работает?", "На Windows 10 (1809 и новее) и Windows 11, 64 бит. Для текста с экрана нужен компонент Windows «Распознавание текста» - обычно он уже установлен."],
    ["Это настоящий Larchik?", "Это демо в браузере: оно показывает, как устроена программа. Калькулятор, заметки, заготовки и переводчик здесь работают по-настоящему, а ИИ отвечает заготовленными текстами. Установленный Larchik работает в любой программе Windows с твоим ИИ."],
    ["Почему Windows предупреждает при установке?", "У Larchik пока нет платной цифровой подписи, а Windows осторожна с новыми программами. Нажми «Подробнее» → «Выполнить в любом случае». Это предупреждение о незнакомом издателе, а не об угрозе."],
    ["Как удалить?", "«Параметры → Приложения → Larchik → Удалить». В конце программа спросит, стирать ли заметки и пароли; по умолчанию они остаются."],
    ["Нашёл ошибку или есть идея", "Расскажи через <a href=\"feedback.html\" data-open=\"feedback\">форму обратной связи</a> - пара минут и без регистрации. Из самой программы: Настройки → «Сообщить о проблеме или предложить идею»."]
  ];

  var ANSWERS = [
    [/бесплат|цен|стоит|сколько|плат/i, "Сам Larchik бесплатный. Платишь только сервису ИИ и только за то, чем пользуешься: на cloud.ru 100 ₽ на GigaChat хватает надолго, у Яндекса есть стартовый грант, а модель на своём компьютере бесплатна совсем."],
    [/vpn|впн/i, "VPN не нужен: cloud.ru и Алиса AI работают в России. Переводчик и текст с экрана тоже работают без VPN. Только DeepSeek зарубежный: ему нужен VPN и оплата в долларах."],
    [/установ|скача|загруз/i, "Скачай Larchik-Setup.exe и запусти, права администратора не нужны. Если Windows покажет «Система Windows защитила ваш компьютер», нажми «Подробнее» → «Выполнить в любом случае». Мастер первого запуска покажет сочетания клавиш и поможет подключить ИИ."],
    [/данн|приват|безопас|парол|шифр/i, "Заметки и настройки - обычные файлы на твоём компьютере. Пароли и ключи ИИ зашифрованы Windows и на другом ПК бесполезны. В интернет уходит только то, чем ты пользуешься: текст для ИИ - в выбранный сервис, текст для перевода - после твоего разрешения. Рекламы и аналитики нет."],
    [/mac|линукс|linux|телефон|android|iphone|айфон/i, "Larchik - программа для Windows 10 и 11. На Mac, Linux и телефонах её нет: она встраивается в Windows, чтобы работать в любой программе."],
    [/ключ|gigachat|гигачат|алис|яндекс|deepseek|ollama|cloud/i, "Подойдёт cloud.ru (GigaChat и другие модели), Алиса AI от Яндекса, DeepSeek или своя модель через Ollama и LM Studio. Где взять ключ - в пошаговой инструкции: Настройки → «Подключить ИИ»."],
    [/что ты|кто ты|умеешь|что так|ларчик|larchik/i, "Я - Larchik, панель для Windows. Выдели текст в любой программе и нажми Ctrl + Alt + A: исправлю, сокращу или переведу его на месте. Ещё есть переводчик без ИИ, текст с экрана, заметки, заготовки, калькулятор с курсами ЦБ и хранилище паролей."],
    [/привет|здравств|добрый/i, "Привет! Спроси меня о Larchik - или посчитай что-нибудь: 15% от 84 000, 100 $ в ₽, 5 миль в км."]
  ];
  var DEMO_ANSWER = "Это демо на сайте, поэтому здесь я отвечаю заготовками и знаю только про Larchik. В программе на этот вопрос ответит твой ИИ: GigaChat, Алиса AI, DeepSeek или модель на компьютере.\n\nПопробуй спросить «Это бесплатно?» или «Нужен ли VPN?» - или посчитать: 15% от 84 000.";

  // ------------------------------------------------------------------ text tools (the AI buttons without an AI)
  var TYPOS = [[/цыфр/g, "цифр"], [/пятници/g, "пятницы"], [/извените/g, "извините"], [/сдесь/g, "здесь"], [/в течении/g, "в течение"],
    [/что-бы/g, "чтобы"], [/по моему/g, "по-моему"], [/вообщем/g, "в общем"], [/зделать/g, "сделать"], [/жолт/g, "жёлт"], [/ихний/g, "их"],
    [/(^|\s)щас(?=\s|[.,!?]|$)/g, "$1сейчас"], [/скока/g, "сколько"], [/придти/g, "прийти"], [/вкраце/g, "вкратце"], [/agian/g, "again"], [/teh /g, "the "]];
  function fixText(t) {
    var s = t;
    TYPOS.forEach(function (p) { s = s.replace(p[0], p[1]); });
    s = s.replace(/[ \t]+/g, " ").replace(/ +([,.!?;:])/g, "$1").replace(/([,.!?;:])(?=[A-Za-zА-Яа-яЁё])/g, "$1 ");
    s = s.replace(/(^|[.!?]\s+)([a-zа-яё])/g, function (m, a, b) { return a + b.toUpperCase(); });
    return s.trim();
  }
  function shorten(t) {
    var parts = t.match(/[^.!?]+[.!?]*\s*/g) || [t];
    if (parts.length > 1) return parts.slice(0, Math.ceil(parts.length / 2)).join("").trim();
    return t.replace(/\s*(пожалуйста|просто|очень|вообще|как бы|в принципе|на самом деле),?\s*/gi, " ").replace(/\s+/g, " ").trim();
  }
  var norm = function (s) { return s.replace(/\s+/g, " ").trim(); };
  var SPOKEN = [[/(^|[\s,])(норм)(?=[\s,.!?]|$)/gi, "$1нормально"], [/(^|[\s,])(ок|окей)(?=[\s,.!?]|$)/gi, "$1хорошо"], [/(^|[\s,])(спс|пасиб\S*)(?=[\s,.!?]|$)/gi, "$1спасибо"],
    [/(^|[\s,])(щас)(?=[\s,.!?]|$)/gi, "$1сейчас"], [/(^|[\s,])(чё|че)(?=[\s,.!?]|$)/gi, "$1что"], [/\){2,}|\({2,}/g, ""], [/!{2,}/g, "!"], [/\?{2,}/g, "?"]];
  function improve(t) { SPOKEN.forEach(function (p) { t = t.replace(p[0], p[1]); }); return t.replace(/\s+([,.!?])/g, "$1").trim(); }
  // a regex word boundary does not see Cyrillic letters, so a word is bounded by hand
  var word = function (w) { return new RegExp("(^|[^а-яёa-z])(" + w + ")(?=[^а-яёa-z]|$)", "gi"); };
  var FORMAL = [[/^(привет|здравствуй|хай)[,!]?/i, "Добрый день!"], [word("посмотри"), "$1посмотрите"], [word("пиши"), "$1пишите"], [word("скажи"), "$1сообщите"],
    [word("можешь"), "$1можете"], [word("тебе"), "$1вам"], [word("ты"), "$1вы"], [word("твой|твоя|твоё|твои"), "$1ваш"], [/(^|\s)(пока|бб)[.!]?\s*$/i, "$1С уважением."]];  function business(t) { t = improve(t); FORMAL.forEach(function (p) { t = t.replace(p[0], p[1]); }); return t.replace(/(^|[.!?]\s+)([a-zа-яё])/g, function (m, a, b) { return a + b.toUpperCase(); }); }
  // -> { text, demo, insertable }
  function transform(act, text) {
    var out = text, hit = false;
    Object.keys(RESULTS).forEach(function (sample) {
      if (out.indexOf(sample) >= 0) { out = out.split(sample).join(RESULTS[sample][act]); hit = true; }
    });
    if (!hit && RESULTS[norm(text)]) { out = RESULTS[norm(text)][act]; hit = true; }
    if (hit) return { text: out, insertable: true };
    // not one of the examples: simple rules instead of an AI, and said so under the answer
    var rules = "На сайте ИИ не подключён, поэтому здесь работают простые правила. В программе этот текст перепишет твой ИИ.";
    if (act === "fix") return { text: fixText(text), insertable: true, demo: rules };
    if (act === "short") return { text: shorten(fixText(text)), insertable: true, demo: rules };
    if (act === "business") return { text: business(fixText(text)), insertable: true, demo: rules };
    return { text: improve(fixText(text)), insertable: true, demo: rules };
  }
  function answerFor(q) {
    for (var i = 0; i < ANSWERS.length; i++) if (ANSWERS[i][0].test(q)) return ANSWERS[i][1];
    return DEMO_ANSWER;
  }

  // ------------------------------------------------------------------ calculator (the AI line counts by itself)
  var nf = function (v, max) { return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: max == null ? 4 : max }).format(v); };
  var num = function (s) { return parseFloat(String(s).replace(/\s+/g, "").replace(",", ".")); };
  var CUR = { usd: /^(\$|usd|доллар\w*|бакс\w*)$/i, eur: /^(€|eur|евро)$/i, cny: /^(¥|cny|юан\w*)$/i, rub: /^(₽|руб\w*|rub|р\.?)$/i };
  var SYM = { usd: "$", eur: "€", cny: "¥", rub: "₽" };
  // shortcut: rough rates only until cbr-xml-daily.ru answers; the caption says so
  var rates = { usd: 81, eur: 94, cny: 11.3, rub: 1 }, ratesDate = null, ratesAsked = false;
  var UNITS = {
    "миля": ["len", 1609.344], "мили": ["len", 1609.344], "миль": ["len", 1609.344], "mi": ["len", 1609.344],
    "км": ["len", 1000], "km": ["len", 1000], "м": ["len", 1], "метр": ["len", 1], "метров": ["len", 1], "см": ["len", .01], "cm": ["len", .01],
    "фут": ["len", .3048], "футов": ["len", .3048], "ft": ["len", .3048], "дюйм": ["len", .0254], "дюймов": ["len", .0254], "in": ["len", .0254],
    "кг": ["mass", 1], "kg": ["mass", 1], "г": ["mass", .001], "фунт": ["mass", .45359237], "фунтов": ["mass", .45359237], "lb": ["mass", .45359237]
  };
  function curCode(w) { for (var k in CUR) if (CUR[k].test(w)) return k; return null; }
  function askRates(after) {
    if (ratesAsked) return; ratesAsked = true;
    fetch("https://www.cbr-xml-daily.ru/daily_json.js").then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (!d || !d.Valute) return;
      ["usd", "eur", "cny"].forEach(function (c) { var v = d.Valute[c.toUpperCase()]; if (v) rates[c] = v.Value / v.Nominal; });
      ratesDate = new Date(d.Date);
      if (after) after();
    }).catch(function () {});
  }
  function calc(raw, onRates) {
    var s = String(raw).trim().toLowerCase().replace(/[×х]/g, "*").replace(/÷/g, "/").replace(/−/g, "-");
    if (!s || s.length > 80) return null;
    var m = s.match(/^([\d\s.,]+)\s*%\s*(?:от|of)\s*([\d\s.,]+)$/);
    if (m) return { value: nf(num(m[2]) * num(m[1]) / 100), cap: nf(num(m[1])) + "% от " + nf(num(m[2])) };
    m = s.match(/^([\d\s.,]+?)\s*([^\d\s.,]+)\s+(?:в|во|to|in)\s+(\S+)$/);
    if (m) {
      var a = num(m[1]), cf = curCode(m[2]), ct = curCode(m[3]);
      if (cf && ct && cf !== ct) {
        askRates(onRates);
        return { value: nf(a * rates[cf] / rates[ct], 2) + " " + SYM[ct], cap: ratesDate ? "по курсу ЦБ на " + ratesDate.toLocaleDateString("ru-RU") : "примерный курс: ЦБ ещё не ответил" };
      }
      var uf = UNITS[m[2]], ut = UNITS[m[3]];
      if (uf && ut && uf[0] === ut[0]) return { value: nf(a * uf[1] / ut[1], 3) + " " + m[3], cap: nf(a) + " " + m[2] + " в " + m[3] };
      return null;
    }
    var e = s.replace(/(\d)\s+(?=\d)/g, "$1").replace(/,/g, ".");
    if (!/^[\d.+\-*/()%^\s]+$/.test(e) || !/\d/.test(e) || !/[+\-*/%^]/.test(e)) return null;
    m = e.match(/^(.+?)\s*([+\-])\s*([\d.]+)\s*%$/);   // 1000 - 15% means 15% of 1000
    if (m) e = "(" + m[1] + ")*(1" + m[2] + m[3] + "/100)";
    e = e.replace(/([\d.]+)\s*%/g, "($1/100)").replace(/\^/g, "**");
    try {
      // safe: e is only digits, dots, brackets and + - * / (checked above)
      var v = Function('"use strict";return (' + e + ")")();
      if (typeof v !== "number" || !isFinite(v)) return null;
      return { value: nf(v), cap: raw.trim() + " =" };
    } catch (err) { return null; }
  }

  // ------------------------------------------------------------------ theme
  var darkQ = matchMedia("(prefers-color-scheme: dark)");
  function isDark() { var t = root.getAttribute("data-theme"); return t ? t === "dark" : darkQ.matches; }
  function themeChanged() {
    var src = isDark() ? "img/larchik-dark.svg" : "img/larchik-light.svg";
    $$('img[src^="img/larchik-"]').forEach(function (i) { i.src = src; });
    var t = root.getAttribute("data-theme") || "system";
    $$(".js-theme").forEach(function (s) { s.value = t; });
    var ic = $("#is-theme i"); if (ic) ic.className = "ph " + (isDark() ? "ph-moon" : "ph-sun");
    var tt = $("#is-theme"); if (tt) tt.dataset.tip = isDark() ? "Тема: тёмная - сделать светлой" : "Тема: светлая - сделать тёмной";
  }
  function setTheme(t) {
    if (t === "light" || t === "dark") root.setAttribute("data-theme", t); else root.removeAttribute("data-theme");
    try { localStorage.setItem("larchik-site-theme", t); } catch (e) {}   // nothing stored means dark (see index.html)
    themeChanged();
  }
  darkQ.addEventListener("change", themeChanged);

  // ------------------------------------------------------------------ figures (Hairline)
  var figObs = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.target._fig) en.target._fig.update({ play: en.isIntersecting }); });
  }, { threshold: .3 }) : null;
  function figs(scope) {
    if (!window.Hairline) return;
    $$("[data-fig]", scope).forEach(function (el) {
      if (el._fig) return;
      var make = window.Hairline[el.dataset.fig];
      if (!make) return;
      el.classList.add("fig");
      try { el._fig = make(el, { intensity: .5, label: el.dataset.label || undefined }); } catch (e) { return; }
      if (el.dataset.play && figObs) figObs.observe(el);
    });
  }

  // latest version number; if GitHub doesn't answer, the generic text stays
  fetch("https://api.github.com/repos/belart16/larchik/releases/latest").then(function (r) { return r.ok ? r.json() : null; }).then(function (rel) {
    var n = rel && rel.tag_name && (rel.tag_name.match(/\d+(?:\.\d+)+/) || [])[0];
    if (n) $$(".version").forEach(function (el) { el.textContent = "Версия " + n; });
  }).catch(function () {});

  var today = function () { return new Date().toLocaleDateString("ru-RU"); };
  var longDate = function () { var s = new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" }); return s.charAt(0).toUpperCase() + s.slice(1); };

  // ==================================================================
  // DESKTOP
  // ==================================================================
  function initDesk() {
    var desk = $("#desk"), winsEl = $("#windows"), tbApps = $("#tb-apps");
    // The desktop is laid out for a screen 864 px tall (1920x1080 at 125%, the usual laptop), where the
    // panel stands as in the app. A browser window is lower (its own bars), so the whole desktop is drawn
    // smaller, the way Windows does at another scale. K: drawn size / layout size; VW, VH: layout size.
    var K = 1, VW = innerWidth, VH = innerHeight;
    function fit() {
      K = Math.min(1, innerHeight / 864);
      VW = innerWidth / K; VH = innerHeight / K;
      desk.style.zoom = K === 1 ? "" : String(K);
      desk.style.width = VW + "px"; desk.style.height = VH + "px";
      window.__deskZoom = K;   // embed.js reads it to size the documents
    }
    fit();
    addEventListener("resize", fit);
    var TB = 48;

    // ---------------- tooltips: after a short wait, at once for the next one
    var tip = document.createElement("div"); tip.className = "tip"; document.body.appendChild(tip);   // outside the zoom: placed by screen coordinates
    var tipTimer = 0, tipHideAt = 0;
    desk.addEventListener("pointerover", function (e) {
      var t = e.target.closest("[data-tip]");
      if (!t || !t.dataset.tip) return;
      clearTimeout(tipTimer);
      var quick = Date.now() - tipHideAt < 400;
      tipTimer = setTimeout(function () {
        tip.textContent = t.dataset.tip;
        tip.classList.toggle("instant", quick);
        var r = t.getBoundingClientRect(), w = Math.min(320, tip.offsetWidth || 200);
        var x = Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2));
        var below = r.top < innerHeight / 2;
        tip.style.left = x + "px";
        tip.style.top = (below ? r.bottom + 8 : r.top - tip.offsetHeight - 8) + "px";
        tip.classList.add("on");
      }, quick ? 0 : 550);
    });
    desk.addEventListener("pointerout", function (e) {
      var t = e.target.closest("[data-tip]");
      if (!t || (e.relatedTarget && t.contains(e.relatedTarget))) return;
      clearTimeout(tipTimer);
      if (tip.classList.contains("on")) tipHideAt = Date.now();
      tip.classList.remove("on");
    });
    desk.addEventListener("pointerdown", function () { clearTimeout(tipTimer); tip.classList.remove("on"); }, true);

    // ---------------- toasts (CaptureToast: a bubble, a title, a line)
    function toast(icon, color, title, text) {
      var t = document.createElement("div");
      t.className = "toast lk enter";
      t.innerHTML = '<span class="bubble bub c-' + color + '"><i class="' + icon + '"></i></span><div><b>' + esc(title) + "</b>" + (text ? "<span>" + esc(text) + "</span>" : "") + "</div>";
      $("#toasts").appendChild(t);
      requestAnimationFrame(function () { requestAnimationFrame(function () { t.classList.remove("enter"); }); });
      setTimeout(function () { t.classList.add("leave"); setTimeout(function () { t.remove(); }, 200); }, 4200);
    }

    // ---------------- hint: what to do next, always in one place above the taskbar
    var hintEl = document.createElement("div"); hintEl.className = "hint"; hintEl.setAttribute("role", "status"); desk.appendChild(hintEl);
    var hintTimer = 0;
    function coach(html) {
      clearTimeout(hintTimer);
      hintEl.innerHTML = '<span class="hi"><i class="ph ph-hand-pointing"></i></span><span class="ht">' + html + '</span><button type="button" aria-label="Скрыть подсказку"><i class="ph ph-x"></i></button>';
      $("button", hintEl).addEventListener("click", uncoach);
      hintEl.classList.add("on");
      hintTimer = setTimeout(uncoach, 9000);
    }
    function uncoach() { clearTimeout(hintTimer); hintEl.classList.remove("on"); }
    var KEYS = function (list) { return '<span class="kp">' + list.join(" + ") + "</span>"; };

    // ---------------- apps
    var ICON = function (src) { return '<img src="' + src + '" alt="">'; };
    var LOGO = function () { return ICON(isDark() ? "img/larchik-dark.svg" : "img/larchik-light.svg"); };
    var APPS = {
      welcome: { title: "Larchik - знакомство", small: LOGO, big: LOGO, w: 500, h: 680, dialog: true, render: renderWelcome },
      settings: { title: "Настройки - Larchik", small: LOGO, big: LOGO, w: 880, h: 660, center: true, render: renderSettings },
      note: { title: "Заметка - Larchik", small: function () { return '<i class="ph-fill ph-note" style="color:#ff9f0a"></i>'; }, w: 720, h: 560, render: renderBigNote },
      notepad: { title: "Попробуй Larchik.txt - Блокнот", short: "Попробуй Larchik.txt", small: function () { return '<i class="ph-fill ph-notepad" style="color:#2f7cf6"></i>'; },
                 big: function () { return '<span class="g-txt blue"></span>'; }, w: 780, h: 540, render: renderNotepad },
      photo: { title: "Фото доски.jpg - Фотографии", short: "Фото доски.jpg", small: function () { return '<i class="ph-fill ph-image" style="color:#0a84ff"></i>'; },
               big: function () { return '<span class="g-jpg"></span>'; }, w: 660, h: 560, render: renderPhoto },
      docs: { title: "Документы", small: function () { return '<i class="ph-fill ph-folder" style="color:#f2b52a"></i>'; }, big: function () { return '<span class="g-folder"></span>'; }, w: 720, h: 460, render: renderDocs },
      faq: { title: "Вопросы и ответы", small: function () { return '<i class="ph-fill ph-question" style="color:#5e5ce6"></i>'; }, big: function () { return '<span class="g-txt" style="--b:#5e5ce6"></span>'; }, w: 640, h: 560, max: true, render: renderFaq },
      ai: { title: "Как подключить ИИ", page: "ai.html", small: function () { return '<i class="ph-fill ph-key" style="color:#bf5af2"></i>'; }, big: function () { return '<span class="g-txt blue" style="--b:#bf5af2"></span>'; }, w: 980, h: 680, max: true },
      feedback: { title: "Обратная связь", page: "feedback.html", small: function () { return '<i class="ph-fill ph-chat-circle-dots" style="color:#ff9f0a"></i>'; }, big: function () { return '<span class="g-web"><i class="ph-fill ph-chat-circle-dots"></i></span>'; }, w: 900, h: 680, max: true },
      license: { title: "Лицензионное соглашение", page: "license.html", small: function () { return '<i class="ph-fill ph-scroll" style="color:#0a84ff"></i>'; }, big: function () { return '<span class="g-txt blue"></span>'; }, w: 900, h: 680, max: true },
      privacy: { title: "Политика конфиденциальности", page: "privacy.html", small: function () { return '<i class="ph-fill ph-shield-check" style="color:#30d158"></i>'; }, big: function () { return '<span class="g-txt blue" style="--b:#30a14e"></span>'; }, w: 900, h: 680, max: true },
      bin: { title: "Корзина", small: function () { return '<i class="ph-fill ph-trash" style="color:#8e8e93"></i>'; }, big: function () { return '<span class="g-bin"></span>'; }, w: 560, h: 420, render: renderBin }
    };
    var EXTRA = {
      setup: { title: "Larchik-Setup.exe", big: function () { return '<span class="g-exe"><i class="ph-fill ph-download-simple"></i></span>'; }, run: function () { location.href = DL; toast("ph ph-download-simple", "accent", "Загрузка Larchik-Setup.exe", "Запусти файл, когда скачается. Права администратора не нужны"); } },
      tg: { title: "Larchik в Telegram", big: function () { return '<span class="g-web g-tg"><i class="ph-fill ph-telegram-logo"></i></span>'; }, run: function () { window.open("https://t.me/belartproduct", "_blank", "noopener"); } },
      releases: { title: "Все версии", big: function () { return '<span class="g-web"><i class="ph-fill ph-globe"></i></span>'; }, run: function () { window.open("https://github.com/belart16/larchik/releases", "_blank", "noopener"); } }
    };
    function launch(id) { if (EXTRA[id]) EXTRA[id].run(); else openApp(id); }

    // ---------------- window manager
    var wins = {}, z = 10, cascade = 0;
    function front() { var best = null; Object.keys(wins).forEach(function (k) { var w = wins[k]; if (!w.min && (!best || +w.el.style.zIndex > +best.el.style.zIndex)) best = w; }); return best; }
    function syncTaskbar() {
      var f = front();
      Object.keys(wins).forEach(function (k) { wins[k].el.classList.toggle("front", wins[k] === f); });
      $$(".tb-app[data-app]").forEach(function (b) {
        var w = wins[b.dataset.app];
        b.classList.toggle("running", !!w);
        b.classList.toggle("active", !!w && w === f);
      });
    }
    function tbButton(id) {
      var b = $('.tb-app[data-app="' + id + '"]');
      if (b) return b;
      b = document.createElement("button");
      b.type = "button"; b.className = "tb-app"; b.dataset.app = id; b.dataset.tip = APPS[id].title;
      b.innerHTML = '<span class="tb-ic">' + APPS[id].small() + "</span>";
      b.addEventListener("click", function () {
        var w = wins[id];
        if (!w) return openApp(id);
        if (w.min) { restore(w); focus(w); } else if (w === front()) minimize(w); else focus(w);
      });
      tbApps.appendChild(b);
      return b;
    }
    function focus(w) { w.el.style.zIndex = ++z; syncTaskbar(); }
    function minimize(w) { w.min = true; w.el.classList.add("min"); syncTaskbar(); }
    function restore(w) { w.min = false; w.el.classList.remove("min"); }
    function closeWin(w) {
      uncoach();   // a hint belongs to what was open
      delete wins[w.id];
      w.el.classList.add("leave");
      setTimeout(function () { w.el.remove(); }, 130);
      var b = $('.tb-app[data-app="' + w.id + '"]');
      if (b && !b.dataset.pinned) b.remove();
      if (w.onClose) w.onClose();
      syncTaskbar();
    }
    function openApp(id, after) {
      var app = APPS[id];
      uncoach();   // a new window: the old hint no longer fits (a guide shows its own right after)
      if (!app) return null;
      if (wins[id]) { var o = wins[id]; if (o.min) restore(o); focus(o); if (after) after(o); return o; }
      var el = document.createElement("div");
      el.className = "win enter";
      el.setAttribute("role", "dialog");
      el.setAttribute("aria-label", app.title);
      var W = Math.min(app.w, VW - 120), H = Math.min(app.h, VH - TB - 40);
      var mid = app.dialog || app.center;   // the app opens its own dialogs in the middle of the screen
      var x = Math.round((VW - W) / 2 + (mid ? 0 : -120 + (cascade % 5) * 28)), y = Math.round(Math.max(12, (VH - TB - H) / 2 + (mid ? 0 : -30 + (cascade % 5) * 26)));
      if (!mid) cascade++;
      if (app.dialog) el.classList.add("dialog");
      if (app.max) el.classList.add("max");
      el.style.cssText = "left:" + Math.max(mid ? 12 : 110, x) + "px;top:" + y + "px;width:" + W + "px;height:" + H + "px;z-index:" + (++z);
      el.innerHTML = '<div class="tbar"><span class="ticon">' + app.small() + '</span><span class="ttl">' + esc(app.title) + "</span>" +
        (app.dialog ? "" : '<button class="tbtn" type="button" data-a="min" aria-label="Свернуть"><i class="ph ph-minus"></i></button>' +
        '<button class="tbtn" type="button" data-a="max" aria-label="Развернуть"><i class="ph ph-square"></i></button>') +
        '<button class="tbtn close" type="button" data-a="close" aria-label="Закрыть"><i class="ph ph-x"></i></button></div><div class="wbody"></div>';
      winsEl.appendChild(el);
      var w = { id: id, el: el, min: false };
      wins[id] = w;
      var body = $(".wbody", el);
      if (app.page) body.innerHTML = '<iframe src="' + app.page + '" title="' + esc(app.title) + '" loading="lazy"></iframe>';
      else app.render(body, w);
      figs(el);
      tbButton(id);
      el.addEventListener("pointerdown", function () { if (wins[id]) focus(w); });
      $$(".tbtn", el).forEach(function (b) {
        b.addEventListener("click", function (e) {
          e.stopPropagation();
          var a = b.dataset.a;
          if (a === "close") closeWin(w); else if (a === "min") minimize(w); else el.classList.toggle("max");
        });
      });
      drag(w);
      requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.remove("enter"); }); });
      focus(w);
      if (after) after(w);
      return w;
    }
    function drag(w) {
      var bar = $(".tbar", w.el), sx, sy, ox, oy, on = false;
      bar.addEventListener("dblclick", function (e) { if (!e.target.closest(".tbtn") && !w.el.classList.contains("dialog")) w.el.classList.toggle("max"); });
      bar.addEventListener("pointerdown", function (e) {
        if (e.button !== 0 || e.target.closest(".tbtn")) return;
        on = true; sx = (e.clientX / K); sy = (e.clientY / K);
        if (w.el.classList.contains("max")) {   // pull a maximised window down: it comes back to its size under the mouse
          w.el.classList.remove("max");
          w.el.style.left = Math.max(0, (e.clientX / K) - w.el.offsetWidth / 2) + "px"; w.el.style.top = "0px";
        }
        ox = w.el.offsetLeft; oy = w.el.offsetTop;
        bar.setPointerCapture(e.pointerId);
        w.el.style.transition = "none";
      });
      bar.addEventListener("pointermove", function (e) {
        if (!on) return;
        var nx = ox + (e.clientX / K) - sx, ny = oy + (e.clientY / K) - sy;
        nx = Math.max(60 - w.el.offsetWidth, Math.min(VW - 80, nx));
        ny = Math.max(0, Math.min(VH - TB - 40, ny));
        w.el.style.left = nx + "px"; w.el.style.top = ny + "px";
      });
      var end = function () { if (!on) return; on = false; w.el.style.transition = ""; };
      bar.addEventListener("pointerup", end); bar.addEventListener("pointercancel", end);
    }
    window.addEventListener("message", function (e) {
      if (e.origin !== location.origin || !e.data || e.data.larchik !== "open") return;
      if (APPS[e.data.id]) openApp(e.data.id);
    });

    // ---------------- desktop icons
    function iconButton(id, inFolder) {
      var a = APPS[id] || EXTRA[id];
      var b = document.createElement("button");
      b.type = "button"; b.className = "dicon"; b.setAttribute("role", "option"); b.setAttribute("aria-selected", "false"); b.dataset.id = id;
      var label = a.short || a.title;
      b.innerHTML = '<span class="glyph">' + a.big() + "</span><span>" + esc(label) + "</span>";
      b.addEventListener("click", function () {
        $$(".dicon", b.parentNode).forEach(function (x) { x.setAttribute("aria-selected", String(x === b)); });
      });
      b.addEventListener("dblclick", function () { launch(id); });
      b.addEventListener("keydown", function (e) { if (e.key === "Enter") launch(id); });
      return b;
    }
    var iconsEl = $("#icons");
    ["welcome", "notepad", "photo", "docs", "ai", "feedback", "tg", "setup", "bin"].forEach(function (id) {
      var b = iconButton(id);
      if (id === "welcome") b.querySelector("span:last-child").textContent = "Larchik";
      iconsEl.appendChild(b);
    });
    desk.addEventListener("pointerdown", function (e) {
      if (!e.target.closest(".dicon")) $$(".dicon").forEach(function (x) { x.setAttribute("aria-selected", "false"); });
    });

    // pinned to the taskbar like in Windows: Explorer, Notepad, Photos
    ["docs", "notepad", "photo"].forEach(function (id) { tbButton(id).dataset.pinned = "1"; });

    // ---------------- app bodies
    var notepad = null;   // { ta } of the open Notepad
    function renderNotepad(body, w) {
      body.innerHTML = '<div class="np"><div class="np-menu"><span>Файл</span><span>Правка</span><span>Просмотр</span>' +
        '<span class="np-hint"><i class="ph ph-cursor-text"></i>Выдели абзац → ' + KEYS(["Ctrl", "Alt", "A"]) + '</span></div>' +
        '<textarea spellcheck="false" aria-label="Текст документа"></textarea>' +
        '<div class="np-status"><span class="np-pos">Стр 1, стлб 1</span><span class="np-len"></span><span class="grow"></span><span>100%</span><span>Windows (CRLF)</span><span>UTF-8</span></div></div>';
      var ta = $("textarea", body);
      ta.value = DOC;   // always the fresh example: the tries below rely on its paragraphs
      var pos = $(".np-pos", body), len = $(".np-len", body);
      function status() {
        var before = ta.value.slice(0, ta.selectionStart).split("\n");
        var sel = ta.selectionEnd - ta.selectionStart;
        pos.textContent = "Стр " + before.length + ", стлб " + (before[before.length - 1].length + 1);
        len.textContent = sel ? "Выделено: " + sel : ta.value.length + " символов";
      }
      ["keyup", "pointerup", "select", "input", "focus"].forEach(function (ev) { ta.addEventListener(ev, status); });
      ta.addEventListener("input", function () {  expandSnippet(ta); });
      status();
      notepad = { ta: ta, status: status };
      w.onClose = function () { notepad = null; };
      setTimeout(function () { ta.focus(); ta.setSelectionRange(0, 0); }, 60);
    }
    function renderPhoto(body) {
      body.innerHTML = '<div class="photo"><div class="board" role="img" aria-label="Фото доски с планом на неделю">' +
        '<span class="mag"></span><span class="h" data-ocr>План на неделю</span>' +
        '<span data-ocr>1. Отчёт для Ольги - до пятницы</span>' +
        '<span data-ocr>2. Созвон с подрядчиком, вт 11:00</span>' +
        '<span data-ocr>3. Купить картриджи в офис</span>' +
        '<span data-ocr>Wi-Fi гостей: Larchik-Guest</span></div></div>';
    }
    function renderDocs(body) {
      var items = ["license", "privacy", "faq", "ai", "feedback", "releases"];
      body.innerHTML = '<div class="ex"><div class="ex-bar"><i class="ph ph-arrow-left"></i><i class="ph ph-arrow-right"></i><i class="ph ph-arrow-up"></i>' +
        '<span class="crumbs"><i class="ph-fill ph-folder" style="color:#f2b52a"></i>Этот компьютер › Документы › Larchik</span></div>' +
        '<div class="ex-list" role="listbox" aria-label="Файлы"></div><div class="ex-foot">Элементов: ' + items.length + "</div></div>";
      var list = $(".ex-list", body);
      items.forEach(function (id) { list.appendChild(iconButton(id, true)); });
    }
    function renderFaq(body) {
      body.innerHTML = '<div class="faq-doc">' + FAQ.map(function (f, i) {
        return "<details" + (i === 0 ? " open" : "") + "><summary>" + esc(f[0]) + '<i class="ph ph-caret-down"></i></summary><p>' + f[1] + "</p></details>";
      }).join("") + "</div>";
    }
    function renderBin(body) {
      body.innerHTML = '<div class="plain lk c-accent"><div class="fig" data-fig="basket" data-label="Пустая корзина"></div><b>Корзина пуста</b>' +
        "<span>Larchik тоже ничего не удаляет без спроса: удалённую заметку можно вернуть кнопкой «Вернуть».</span></div>";
    }
    // ---------------- welcome (WelcomeWindow.cs): three steps in a narrow dialog
    var wlPage = 0;
    function renderWelcome(body, w) {
      body.innerHTML = '<div class="welcome lk"><div class="wl-page"></div><div class="wl-foot"><span class="muted"></span>' +
        '<button class="btn" type="button" data-wl="back">Назад</button><button class="btn primary" type="button" data-wl="next">Далее</button></div></div>';
      var page = $(".wl-page", body);
      var opts = store.get("wl-opts", { auto: true, upd: true });
      function sc(keys, title, sub, act) {
        return '<button class="sc" type="button" data-act="' + act + '"><span><b>' + title + "</b><small>" + sub + "</small></span>" + KEYS(keys) + "</button>";
      }
      function prov(name, badge, text) {
        return '<button class="prov" type="button" data-act="aiguide"><b>' + name + (badge ? ' <span class="badge">' + badge + "</span>" : "") + "</b><p>" + text + '</p><i class="ph ph-caret-right"></i></button>';
      }
      function opt(key, title, sub) {
        return '<div class="opt"><div><b>' + title + "</b><small>" + sub + '</small></div><button class="sw" type="button" role="switch" data-opt="' + key + '" aria-checked="' + opts[key] + '" aria-label="' + title + '"></button></div>';
      }
      function show() {
        var html;
        if (wlPage === 0) html = '<div class="wl-hero c-accent"><div class="fig" data-fig="casket" data-label="Ларчик: шкатулка, крышка открывается навстречу"></div>' +
          '<div><h1>Привет! Это Larchik</h1><p class="lead">Панель быстрого доступа для Windows: ИИ для текста, переводчик, текст с экрана, заметки и пароли. Всё открывается сочетаниями клавиш из любой программы.</p></div></div>' +
          '<div class="group">' + sc(["Ctrl", "Shift", "Space"], "Открыть панель", "Заметки, заготовки, хранилище, калькулятор", "panel") +
          sc(["Ctrl", "Alt", "A"], "ИИ для выделенного текста", "Улучшить, сократить, исправить - и вставить обратно", "ai") +
          sc(["Ctrl", "Alt", "Z"], "Перевести выделенное", "Без ИИ и бесплатно", "tr") +
          sc(["Ctrl", "Alt", "S"], "Текст с экрана", "С картинки, скана или видео - без интернета", "ocr") + "</div>" +
          '<p class="wl-note">Значок Larchik живёт в трее, рядом с часами. Здесь, на сайте, сочетания работают так же - нажми любое или кликни строку.</p>';
        else if (wlPage === 1) html = "<h2>Подключи ИИ</h2><p class=\"lead\">Переводчик, текст с экрана, калькулятор, заметки и хранилище работают и без него. ИИ нужен, чтобы улучшать текст и задавать вопросы. Для этого нужен API-ключ одного из сервисов - Larchik хранит его только на этом компьютере, в зашифрованном виде.</p>" +
          '<div class="caps wl-caps">Российские сервисы</div><div class="group">' +
          prov("cloud.ru - много моделей", "Рекомендуем", "Платный, оплата в рублях: пополни баланс - 100 ₽ на GigaChat хватает надолго. Там же есть Claude и GPT - дороже, текст уходит за рубеж.") +
          prov("Алиса AI - Яндекс", "", "Сильный русский язык, оплата в рублях; новым аккаунтам Yandex Cloud даёт стартовый грант. Кроме ключа нужен ID каталога.") + "</div>" +
          '<div class="caps wl-caps">Зарубежные и на компьютере</div><div class="group">' +
          prov("DeepSeek", "", "Логика и код. Нужен VPN и оплата в долларах.") +
          prov("Ollama, LM Studio", "", "Модель на твоём компьютере - бесплатно, текст никуда не уходит.") + "</div>" +
          '<button class="wl-link" type="button" data-act="aiguide">Где взять ключ - пошаговая инструкция →</button>';
        else html = '<h2>Попробуй прямо сейчас</h2><p class="lead">Самое полезное - исправить текст, не копируя его в чат:</p>' +
          '<ol class="group wl-steps"><li>Выдели абзац в Word, браузере или почте. Здесь - в «Попробуй Larchik.txt».</li><li>Нажми Ctrl + Alt + A.</li>' +
          "<li>Выбери «Исправить ошибки», затем «Вставить» - текст заменится прямо в программе.</li></ol>" +
          '<div style="margin-top:14px">' + opt("auto", "Запускать вместе с Windows", "Иначе сочетания клавиш работают, только пока Larchik открыт") +
          opt("upd", "Проверять обновления", "Раз в день Larchik узнаёт у GitHub номер новой версии") + "</div>";
        page.innerHTML = html;
        page.scrollTop = 0;
        figs(page);
        $(".wl-foot .muted", body).textContent = "Шаг " + (wlPage + 1) + " из 3";
        w.el.style.top = Math.max(12, Math.round((VH - TB - w.el.offsetHeight) / 2)) + "px";
        $('[data-wl="back"]', body).hidden = wlPage === 0;
        $('[data-wl="next"]', body).textContent = wlPage === 2 ? "Попробовать" : "Далее";
      }
      body.addEventListener("click", function (e) {
        var b = e.target.closest("[data-wl],[data-act],[data-opt]");
        if (!b) return;
        if (b.dataset.opt) { opts[b.dataset.opt] = !opts[b.dataset.opt]; store.set("wl-opts", opts); b.setAttribute("aria-checked", String(opts[b.dataset.opt])); return; }
        if (b.dataset.wl === "back") { wlPage = Math.max(0, wlPage - 1); show(); }
        else if (b.dataset.wl === "next") { if (wlPage === 2) { store.set("welcomed", true); closeWin(w); guide("ai"); } else { wlPage++; show(); } }
        else if (b.dataset.act === "aiguide") openApp("ai");
        else guide(b.dataset.act);
      });
      w.onClose = function () { store.set("welcomed", true); };
      show();
    }

    // ---------------- settings (SettingsWindow.cs): the same pages; what makes sense on a site works
    var prefs = store.get("prefs", { glass: true, anim: true, dense: false, outside: true, tabs: { tr: true, snip: true, vault: true, pick: true }, pick: true });
    function applyPrefs() {
      desk.classList.toggle("glass", prefs.glass);
      root.classList.toggle("no-anim", !prefs.anim);
      $("#panel").classList.toggle("dense", prefs.dense);
      ["tr", "snip", "vault", "pick"].forEach(function (t) { $('.tab[data-tab="' + t + '"]').hidden = !prefs.tabs[t] || (t === "pick" && !prefs.pick); });
      $("#p-pick-btn").hidden = !prefs.pick;
      if (typeof moveThumb === "function") moveThumb();
    }
    function setPref(path, v) {
      var p = path.split("."); if (p.length === 2) prefs[p[0]][p[1]] = v; else prefs[path] = v;
      store.set("prefs", prefs); applyPrefs();
    }
    var getPref = function (path) { var p = path.split("."); return p.length === 2 ? prefs[p[0]][p[1]] : prefs[path]; };
    var SW = function (pref, on, dis) { return { sw: pref, on: on, dis: dis }; };
    var ST = [
      ["look", "Внешний вид", null, [
        ["ph-sun", "accent", "Тема", "«Как панель задач» - по режиму Windows", { theme: 1 }],
        ["ph-squares-four", "indigo", "Плотность", "Компактная - всё чуть мельше, в панель помещается больше", { dense: 1 }],
        ["ph-lightning", "purple", "Анимации", "Плавное появление и движение. Выключатся сами, если они выключены в Windows", SW("anim")],
        ["ph-drop", "teal", "Стекло", "Панель, островок и пилюля - как матовое стекло: сквозь них размыто видно то, что на экране. Выключено - ровный фон", SW("glass")]]],
      ["panel", "Панель и запуск", null, [
        ["ph-keyboard", "accent", "Открыть панель", "Можно поменять на своё сочетание", { keys: "Ctrl + Shift + Space" }],
        ["ph-cursor-click", "accent", "Прятать, когда кликаешь мимо", "Как будто панель потеряла фокус", SW("outside")],
        ["ph-power", "success", "Запускать вместе с Windows", "Иначе сочетания клавиш работают, только пока Larchik открыт", SW("x-auto", true, true)],
        ["ph-pill", "warning", "Островок", "Сверху в центре: музыка, таймер, микрофон, тема. Перетащи его куда удобно", { text: "Вместе с панелью" }]]],
      ["sections", "Разделы панели", null, [
        ["ph-translate", "accent", "Переводчик", "Своя вкладка в панели", SW("tabs.tr")],
        ["ph-article", "indigo", "Заготовки", "Тексты, которые вставляются сами", SW("tabs.snip")],
        ["ph-lock-simple", "success", "Хранилище", "Пароли под Windows Hello", SW("tabs.vault")],
        ["ph-eyedropper", "pink", "Пипетка", "Цвет с экрана: HEX, RGB, HSL", SW("tabs.pick")]]],
      ["ai", "Спросить ИИ", "purple", [
        ["ph-sparkle", "purple", "Сервис и модель", "Алиса AI · aliceai-llm-flash. На сайте ИИ отвечает заготовками", { btn: "Где взять ключ", open: "ai" }],
        ["ph-keyboard", "purple", "ИИ для выделенного", "Улучшить, сократить, исправить - и вставить обратно", { keys: "Ctrl + Alt + A" }],
        ["ph-list-plus", "purple", "Кнопки для текста", "Улучшить, Короче, Исправить ошибки, Деловой стиль - и свои с любым заданием", { text: "5 кнопок" }]]],
      ["notes", "Заметки", "warning", [
        ["ph-folder-simple", "warning", "Папка с заметками", "Обычные файлы .md - их можно открыть любой программой", { text: "Документы\\Larchik" }],
        ["ph-keyboard", "warning", "Выделенное → в заметку", "Со списками и абзацами. Ctrl + Alt + X - дописать в последнюю", { keys: "Ctrl + Alt + D" }]]],
      ["tr", "Переводчик", "accent", [
        ["ph-keyboard", "accent", "Перевести выделенное", "Без ИИ и токенов", { keys: "Ctrl + Alt + Z" }],
        ["ph-globe-simple", "accent", "Внешний сервис", "Разрешить отправлять текст в Google Translate (резерв - MyMemory)", { trok: 1 }]]],
      ["vault", "Хранилище", "success", [
        ["ph-timer", "success", "Закрывать само", "Через столько минут без дела", { text: "2:30" }],
        ["ph-lock-key", "success", "Закрывать при блокировке ПК", "Win + L - и хранилище закрыто", SW("x-lock", true, true)]]],
      ["ocr", "Текст с экрана", "teal", [
        ["ph-keyboard", "teal", "Текст с экрана", "Распознаёт сама Windows, без интернета", { keys: "Ctrl + Alt + S" }],
        ["ph-translate", "teal", "Язык распознавания", "Языки, установленные в Windows", { text: "Русский + English" }]]],
      ["tools", "Инструменты", "pink", [
        ["ph-eyedropper", "pink", "Пипетка", "Кнопка в шапке панели: цвет с экрана в HEX, RGB и HSL", SW("pick")],
        ["ph-microphone", "pink", "Голосовые команды", "«Ларчик, открой заметки». В демо на сайте не работают", SW("x-voice", false, true)]]],
      ["about", "О программе", null, [
        ["ph-info", "accent", "Larchik", '<span class="version">Последняя версия</span> · бесплатно · Windows 10 и 11', { btn: "Скачать", href: DL }],
        ["ph-scroll", "accent", "Лицензионное соглашение", "Что можно и чего нельзя", { btn: "Открыть", open: "license" }],
        ["ph-shield-check", "success", "Политика конфиденциальности", "Что хранится и что уходит в сеть", { btn: "Открыть", open: "privacy" }],
        ["ph-chat-circle-dots", "warning", "Сообщить о проблеме или предложить идею", "Без регистрации", { btn: "Написать", open: "feedback" }],
        ["ph-telegram-logo", "accent", "Канал Larchik в Telegram", "Новости и новые версии", { btn: "Открыть", href: "https://t.me/belartproduct" }],
        ["ph-arrow-counter-clockwise", "danger", "Сбросить демо", "Заметки, заготовки и настройки этой страницы хранятся только в этом браузере", { btn: "Сбросить", reset: 1 }]]]
    ];
    function control(c) {
      if (c.theme) return '<select class="select js-theme" aria-label="Тема"><option value="dark">Тёмная</option><option value="light">Светлая</option><option value="system">Как в Windows</option></select>';
      if (c.dense) return '<select class="select js-dense" aria-label="Плотность"><option value="0">Обычная</option><option value="1">Компактная</option></select>';
      if (c.keys) return '<span class="kp">' + c.keys + "</span>";
      if (c.text) return '<span class="muted">' + esc(c.text) + "</span>";
      if (c.trok) return '<button class="sw" type="button" role="switch" data-trok aria-checked="' + !!store.get("tr-ok", false) + '" aria-label="Внешний сервис перевода"></button>';
      if (c.btn) return c.href ? '<a class="btn" href="' + c.href + '"' + (c.href.indexOf("t.me") > 0 ? ' target="_blank" rel="noopener"' : "") + '>' + c.btn + "</a>" : '<button class="btn" type="button"' + (c.open ? ' data-open="' + c.open + '"' : "") + (c.reset ? " data-reset" : "") + ">" + c.btn + "</button>";
      var on = c.sw.indexOf("x-") === 0 ? c.on : getPref(c.sw);
      return '<button class="sw" type="button" role="switch" data-pref="' + c.sw + '" aria-checked="' + !!on + '"' + (c.dis ? " disabled" : "") + "></button>";
    }
    function row(r) {
      return '<div class="st-row"><span class="bubble c-' + r[1] + '"><i class="ph ' + r[0] + '"></i></span><div><b>' + r[2] + "</b><small>" + r[3] + "</small></div>" + control(r[4]) + "</div>";
    }
    function renderSettings(body) {
      var cur = "look";
      body.innerHTML = '<div class="settings lk"><nav class="st-nav" aria-label="Разделы настроек"><div class="brand">' + LOGO() + 'Настройки</div>' +
        '<label class="st-search"><i class="ph ph-magnifying-glass"></i><input type="search" placeholder="Поиск настроек" aria-label="Поиск настроек"></label>' +
        ST.map(function (p, i) {
          return (i === 3 ? '<div class="caps st-caps">Функции</div>' : "") + '<button class="st-item' + (p[2] ? " c-" + p[2] : "") + '" type="button" data-page="' + p[0] + '">' + (p[2] ? '<span class="dot"></span>' : "") + p[1] + "</button>";
        }).join("") +
        '<button class="st-back" type="button" data-back><i class="ph ph-house"></i>Вернуться в панель</button></nav><main class="st-main"></main></div>';
      var main = $(".st-main", body), q = $(".st-search input", body);
      function show() {
        var text = q.value.trim().toLowerCase(), html = "";
        if (text) {
          ST.forEach(function (p) {
            var rows = p[3].filter(function (r) { return (r[2] + " " + r[3]).toLowerCase().indexOf(text) >= 0; });
            if (rows.length) html += '<div class="caps" style="margin:18px 4px 8px">' + p[1] + '</div><div class="group">' + rows.map(row).join("") + "</div>";
          });
          main.innerHTML = "<h2>Поиск</h2>" + (html || '<p class="st-empty">Ничего не нашлось. Попробуй другое слово - например «тема», «пароль» или «сочетание».</p>');
        } else {
          var p = ST.filter(function (x) { return x[0] === cur; })[0];
          main.innerHTML = "<h2>" + p[1] + '</h2><div class="group">' + p[3].map(row).join("") + "</div>";
        }
        $$(".st-item", body).forEach(function (b) { b.setAttribute("aria-current", String(!text && b.dataset.page === cur)); });
        themeChanged();
        $$(".js-dense", main).forEach(function (s) { s.value = prefs.dense ? "1" : "0"; });
        $$(".version", main).forEach(function (v) { var src = $(".version"); if (src) v.textContent = src.textContent; });
      }
      body.addEventListener("click", function (e) {
        var b = e.target.closest("[data-page],[data-pref],[data-trok],[data-reset],[data-back]");
        if (!b) return;
        if (b.dataset.page) { cur = b.dataset.page; q.value = ""; show(); }
        else if (b.dataset.pref) { setPref(b.dataset.pref, b.getAttribute("aria-checked") !== "true"); b.setAttribute("aria-checked", String(getPref(b.dataset.pref))); }
        else if (b.hasAttribute("data-trok")) { var ok = !store.get("tr-ok", false); store.set("tr-ok", ok); b.setAttribute("aria-checked", String(ok)); }
        else if (b.hasAttribute("data-back")) { closeWin(wins.settings); openPanel(); }
        else {
          ["doc", "notes", "snips2", "quest", "welcomed", "tr-ok", "prefs", "panel-pos", "island-pos", "colors", "wl-opts", "fold"].forEach(function (k) { try { localStorage.removeItem("larchik-site-" + k); } catch (err) {} });
          try { localStorage.removeItem("larchik-site-theme"); } catch (err) {}
          location.reload();
        }
      });
      body.addEventListener("change", function (e) {
        if (e.target.classList.contains("js-theme")) setTheme(e.target.value);
        if (e.target.classList.contains("js-dense")) setPref("dense", e.target.value === "1");
      });
      q.addEventListener("input", show);
      show();
    }

    // ---------------- the big note window (NoteWindow.cs): the same note as in the panel, with room
    function renderBigNote(body) {
      body.innerHTML = '<div class="bignote lk c-warning"><div class="bignote-bar"><span class="bubble"><i class="ph ph-note"></i></span><b>Заметка</b>' +
        '<button class="btn" type="button" data-back><i class="ph ph-arrow-left"></i>В панель</button></div>' +
        '<textarea aria-label="Текст заметки" placeholder="Пиши - заметка сохраняется сама"></textarea><div class="bignote-foot"><span class="cnt"></span><span class="st"></span></div></div>';
      var ta = $("textarea", body), cnt = $(".cnt", body), st = $(".st", body);
      ta.value = ntInput.value;
      function count() {
        var t = ta.value.trim(), words = t ? t.split(/\s+/).length : 0;
        cnt.textContent = words + " " + plural(words, "слово", "слова", "слов") + " · " + ta.value.length + " " + plural(ta.value.length, "знак", "знака", "знаков");
      }
      ta.addEventListener("input", function () { ntInput.value = ta.value; ntInput.dispatchEvent(new Event("input")); count(); st.textContent = "Сохранено"; });
      $("[data-back]", body).addEventListener("click", function () { closeWin(wins.note); openPanel("home"); });
      count();
      setTimeout(function () { ta.focus(); }, 60);
    }
    function plural(n, a, b, c) { var m = n % 10, h = n % 100; return m === 1 && h !== 11 ? a : m >= 2 && m <= 4 && (h < 12 || h > 14) ? b : c; }


    // ---------------- notepad helpers: selection, snapping to a sample paragraph, replacing
    function grabSelection() {
      var ta = notepad && notepad.ta;
      if (ta && wins.notepad && !wins.notepad.min && ta.selectionEnd > ta.selectionStart) {
        var s = ta.selectionStart, e = ta.selectionEnd, v = ta.value;
        // a part of one paragraph -> the whole paragraph (the way you'd want the AI to see it)
        var ls = v.lastIndexOf("\n", s - 1) + 1, le = v.indexOf("\n", e); if (le < 0) le = v.length;
        if (v.slice(s, e).indexOf("\n") < 0 && (e - s) > (le - ls) * .4) { s = ls; e = le; ta.setSelectionRange(s, e); }
        var text = v.slice(s, e);
        if (text.trim()) return { text: text, ta: ta, s: s, e: e };
      }
      var sel = String(getSelection() || "").trim();
      return sel ? { text: sel } : null;
    }
    function replaceIn(src, text) {
      var ta = src.ta;
      if (!ta || !document.body.contains(ta)) { copy(text); toast("ph ph-copy", "accent", "Скопировано", "Вставить можно только в Блокнот, остальное - через буфер"); return false; }
      var s = src.s, e = src.e;
      if (ta.value.slice(s, e) !== src.text) { var i = ta.value.indexOf(src.text); if (i >= 0) { s = i; e = i + src.text.length; } else { s = e = ta.selectionStart; } }
      if (wins.notepad) { restore(wins.notepad); focus(wins.notepad); }
      ta.focus();
      ta.setRangeText(text, s, e, "select");   // the new text stays selected: you see what changed
      
      notepad.status();
      return true;
    }

    // ---------------- snippets
    var DEFAULT_SNIPS = [
      { trig: "1д", name: "Сегодняшняя дата", text: "{дата}" },
      { trig: "1спс", name: "Спасибо, получил", text: "Спасибо, получил! Посмотрю и вернусь с ответом до конца дня." },
      { trig: "1адр", name: "Адрес офиса", text: "г. Москва, ул. Примерная, д. 1, офис 15" },
      { trig: "1подп", name: "Подпись в письме", text: "С уважением,\nкоманда Larchik" }
    ];
    var snips = store.get("snips2", DEFAULT_SNIPS);
    var snipText = function (s) { return s.text.replace(/\{дата\}/g, today()); };
    function expandSnippet(ta) {
      var c = ta.selectionStart;
      for (var i = 0; i < snips.length; i++) {
        var t = snips[i].trig;
        if (t && ta.value.slice(c - t.length, c) === t) {
          var text = snipText(snips[i]);
          ta.setRangeText(text, c - t.length, c, "end");
          
          toast("ph ph-lightning", "indigo", "Заготовка «" + t + "»", "Текст вставлен на место набранного");
          done("snip");
          return;
        }
      }
    }
    function renderSnips() {
      var list = $("#sn-list");
      if (!snips.length) {
        list.innerHTML = '<div class="empty c-indigo"><div class="fig" data-fig="drawer" data-label="Картотека, ящик выдвинут и пуст"></div><b>Заготовок пока нет</b><span>Текст, который часто вставляешь, - в одно нажатие</span></div>';
        figs(list); return;
      }
      list.innerHTML = snips.map(function (s, i) {
        return '<div class="snip"><b>' + esc(s.name || s.trig) + '</b><span class="row" style="gap:4px"><span class="trig">' + esc(s.trig) +
          '</span><button class="ibtn sm" type="button" data-del="' + i + '" aria-label="Удалить заготовку"><i class="ph ph-trash"></i></button></span><p>' + esc(snipText(s)) + "</p></div>";
      }).join("");
    }
    $("#sn-list").addEventListener("click", function (e) {
      var b = e.target.closest("[data-del]"); if (!b) return;
      snips.splice(+b.dataset.del, 1); store.set("snips2", snips); renderSnips();
    });
    $("#sn-add").addEventListener("click", function () { $("#sn-form").hidden = false; $("#sn-trig").focus(); });
    $("#sn-cancel").addEventListener("click", function () { $("#sn-form").hidden = true; });
    $("#sn-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var trig = $("#sn-trig").value.trim(), text = $("#sn-text").value;
      if (trig.length < 2 || /\s/.test(trig) || !text.trim()) { $("#sn-trig").focus(); return; }
      snips = snips.filter(function (s) { return s.trig !== trig; });
      snips.unshift({ trig: trig, name: text.split("\n")[0].slice(0, 40), text: text });
      store.set("snips2", snips);
      $("#sn-form").reset(); $("#sn-form").hidden = true; renderSnips();
      toast("ph ph-lightning", "indigo", "Заготовка сохранена", "Напечатай " + trig + " в Блокноте");
    });

    // ---------------- panel
    var panel = $("#panel"), island = $("#island"), pill = $("#pill");
    var pane = "home", searching = false;
    function panelOpen() { return !panel.classList.contains("closed"); }
    function openPanel(tab) {
      $("#p-date").textContent = longDate();
      panel.classList.remove("closed");
      island.classList.remove("closed");
      pill.classList.add("closed");
      $("#tray-larchik").classList.add("seen");
      if (tab) showPane(tab);
      done("panel");
      uncoach();
    }
    function closePanel() {
      panel.classList.add("closed");
      island.classList.add("closed");
      $("#is-timer-row").hidden = true;
      syncPill();
      if (searching) closeSearch();
    }
    function togglePanel() { if (panelOpen()) closePanel(); else openPanel(); }
    function moveThumb() {
      var on = $('.tab[aria-selected="true"]'), th = $("#tab-thumb");
      if (!on) { th.style.opacity = "0"; return; }
      th.style.opacity = "1";
      th.style.width = on.offsetWidth + "px";
      th.style.transform = "translateX(" + on.offsetLeft + "px)";
    }
    function showPane(p) {
      if (p !== "search" && searching) closeSearch(true);
      pane = p;
      $$(".tab").forEach(function (t) { t.setAttribute("aria-selected", String(t.dataset.tab === p)); });
      $$("#p-body > section").forEach(function (s) {
        var on = s.dataset.pane === p;
        if (on && s.hidden) { s.hidden = false; s.classList.remove("enter"); void s.offsetWidth; s.classList.add("enter"); }
        else if (!on) s.hidden = true;
      });
      $("#p-body").scrollTop = 0;
      moveThumb();
      if (p === "vault") renderVault();
      if (p === "snip") renderSnips();
    }
    $$(".tab").forEach(function (t) { t.addEventListener("click", function () { showPane(t.dataset.tab); }); });
    $("#p-close").addEventListener("click", closePanel);
    $("#tray-larchik").addEventListener("click", togglePanel);
    // the settings take the panel's place, as in the app
    $("#p-set-btn").addEventListener("click", function () { closePanel(); openApp("settings"); });
    $("#p-pick-btn").addEventListener("click", function () { showPane("pick"); pickColor(); });
    $("#p-ocr-btn").addEventListener("click", function () { startSnip(); });
    $$(".qa button").forEach(function (b) { b.addEventListener("click", function () { guide(b.dataset.do); }); });
    desk.addEventListener("click", function (e) {
      var a = e.target.closest("[data-open]");
      if (!a) return;
      e.preventDefault();
      openApp(a.dataset.open);
    });

    // ---------------- search over the whole panel (Ctrl+K)
    function openSearch() {
      searching = true;
      $("#tabs").hidden = true; $("#p-search").hidden = false;
      showPane("search");
      $$(".tab").forEach(function (t) { t.setAttribute("aria-selected", "false"); });
      var inp = $("#p-search-input"); inp.value = ""; renderSearch(""); inp.focus();
    }
    function closeSearch(keepPane) {
      searching = false;
      $("#tabs").hidden = false; $("#p-search").hidden = true;
      if (!keepPane) showPane("home");
    }
    $("#p-search-btn").addEventListener("click", function () { if (searching) closeSearch(); else openSearch(); });
    $("#p-search-close").addEventListener("click", function () { closeSearch(); });
    $("#p-search-input").addEventListener("input", function (e) { renderSearch(e.target.value); });
    function mark(text, q) {
      var i = text.toLowerCase().indexOf(q.toLowerCase());
      var start = Math.max(0, i - 24), part = text.slice(start, i + q.length + 60);
      var j = i - start;
      return (start ? "…" : "") + esc(part.slice(0, j)) + "<mark>" + esc(part.slice(j, j + q.length)) + "</mark>" + esc(part.slice(j + q.length));
    }
    function renderSearch(q) {
      var out = $("#s-results");
      q = q.trim();
      if (!q) { out.innerHTML = '<p class="muted" style="margin:4px 2px">Ищет сразу в заметках, заготовках, хранилище и вопросах. В программе - ещё и в файлах заметок.</p>'; return; }
      var groups = [];
      var hit = function (t) { return t.toLowerCase().indexOf(q.toLowerCase()) >= 0; };
      var n = notes.filter(function (x) { return hit(x.text); });
      if (n.length) groups.push(["Заметки", "ph ph-note-pencil", "warning", "home", n.map(function (x) { return x.text; })]);
      var s = snips.filter(function (x) { return hit(x.trig + " " + x.name + " " + x.text); });
      if (s.length) groups.push(["Заготовки", "ph ph-lightning", "indigo", "snip", s.map(function (x) { return x.trig + "  " + snipText(x); })]);
      if (vaultOpen) { var v = VAULT.filter(function (x) { return hit(x.s + " " + x.l); }); if (v.length) groups.push(["Хранилище", "ph ph-lock-simple-open", "success", "vault", v.map(function (x) { return x.s + " · " + x.l; })]); }
      var f = FAQ.filter(function (x) { return hit(x[0] + " " + x[1].replace(/<[^>]+>/g, "")); });
      if (f.length) groups.push(["Вопросы", "ph ph-question", "accent", "faq", f.map(function (x) { return x[0]; })]);
      if (!groups.length) {
        out.innerHTML = '<div class="card"><div class="empty c-accent"><div class="fig" data-fig="loupe" data-label="Лупа над пустым листом"></div><b>Ничего не нашлось</b><span>Ни в заметках, ни в заготовках' + (vaultOpen ? ", ни в хранилище" : "") + ". Попробуй другое слово" + (vaultOpen ? "" : " - или открой хранилище, чтобы искать и в нём") + "</span></div></div>";
        figs(out); return;
      }
      out.innerHTML = groups.map(function (g) {
        return '<div class="s-group"><span class="caps">' + g[0] + "</span>" + g[4].map(function (t) {
          return '<button class="s-hit" type="button" data-go="' + g[3] + '"><span class="bubble c-' + g[2] + '"><i class="' + g[1] + '"></i></span><p>' + mark(t, q) + "</p></button>";
        }).join("") + "</div>";
      }).join("");
    }
    $("#s-results").addEventListener("click", function (e) {
      var b = e.target.closest("[data-go]"); if (!b) return;
      if (b.dataset.go === "faq") { openApp("faq"); return; }
      closeSearch(true); showPane(b.dataset.go);
      if (b.dataset.go === "home") { setNotesView("all"); }
    });

    // ---------------- AI card
    var aiSrc = null, streamTimer = 0, lastAct = null, lastAnswer = "";
    var aiInput = $("#ai-input");
    function setSource(src) {
      aiSrc = src;
      $("#ai-src").hidden = !src;
      $("#ai-acts").hidden = !src;
      if (src) {
        $("#ai-src-text").textContent = src.text;
        $("#ai-acts").innerHTML = ACTIONS.map(function (a) { return '<button class="chip" type="button" data-act="' + a.id + '">' + a.label + "</button>"; }).join("") +
          '<button class="chip" type="button" data-tip="В программе свои кнопки с любым заданием добавляются здесь"><i class="ph ph-plus"></i>Своя</button>';
      }
      $("#answer").hidden = true;
      $("#ai-new").hidden = !src;
      aiInput.placeholder = src ? "Или напиши, что сделать с текстом" : "Спроси ИИ или посчитай: 15% от 84 000, 100 $ в ₽";
    }
    $("#ai-src-x").addEventListener("click", function () { setSource(null); });
    $("#ai-new").addEventListener("click", function () { setSource(null); aiInput.value = ""; $("#calc").hidden = true; aiInput.focus(); });
    $("#ai-clip").addEventListener("click", function () { toast("ph ph-paperclip", "purple", "Файл для ИИ", "В программе сюда прикладывают PDF, Word, Excel, картинку - или перетаскивают их на карточку"); });
    var tokens = 0;
    $("#ai-acts").addEventListener("click", function (e) {
      var b = e.target.closest("[data-act]"); if (!b || !aiSrc) return;
      runAction(b.dataset.act);
    });
    function stream(label, text, ok, demo) {
      clearTimeout(streamTimer);
      lastAnswer = text;
      $("#answer").hidden = false;
      $("#q-bubble").textContent = label;
      $("#a-foot").hidden = true;
      $("#a-demo").hidden = true;
      var mark = $("#a-mark"), st = $("#a-status"), out = $("#a-text");
      mark.innerHTML = '<span class="orb" aria-hidden="true"><i></i><i></i><i></i></span>';
      st.textContent = "ИИ думает…";
      out.textContent = "";
      var t0 = Date.now(), i = 0;
      streamTimer = setTimeout(function step() {
        if (i === 0) { st.textContent = "Алиса AI пишет…"; mark.innerHTML = '<i class="ph-fill ph-sparkle"></i>'; }
        i = Math.min(text.length, i + 2 + Math.floor(Math.random() * 3));
        out.innerHTML = esc(text.slice(0, i)) + (i < text.length ? '<span class="caret"></span>' : "");
        if (i < text.length) { streamTimer = setTimeout(step, 18); return; }
        st.textContent = "Готово · " + nf((Date.now() - t0) / 1000, 1) + " с";
        tokens += Math.round((label.length + text.length) / 3);
        $("#ai-usage").textContent = "сегодня " + nf(tokens) + " " + plural(tokens, "токен", "токена", "токенов");
        $("#ai-new").hidden = false;
        $("#a-foot").hidden = false;
        $("#a-insert").hidden = !ok;
        // the last step is not obvious: say it, and make the button breathe until it is pressed
        $("#a-insert").classList.toggle("call", ok);
        if (ok && aiSrc && aiSrc.ta) coach("Готово. Нажми <b>«Вставить в программу»</b> - новый текст встанет в Блокнот вместо выделенного");
        $("#a-retry").hidden = !lastAct;
        if (demo) { $("#a-demo").hidden = false; $("#a-demo span").textContent = demo; }
      }, 650 + Math.random() * 350);
    }
    function runAction(act) {
      lastAct = act;
      var label = ACTIONS.filter(function (a) { return a.id === act; })[0].label;
      $$("#ai-acts .chip").forEach(function (c) { c.classList.toggle("on", c.dataset.act === act); });
      var r = transform(act, aiSrc.text);
      stream(label, r.text, r.insertable, r.demo);   // without Notepad behind it, «Вставить» copies
    }
    $("#a-retry").addEventListener("click", function () { if (lastAct && aiSrc) runAction(lastAct); });
    $("#a-insert").addEventListener("click", function () {
      if (!aiSrc) return;
      if (replaceIn(aiSrc, lastAnswer)) {
        closePanel();
        toast("ph-fill ph-sparkle", "purple", "Вставлено в Блокнот", "Новый текст выделен - видно, что поменялось");
        done("ai");
        aiSrc = null; setSource(null);
      }
    });
    $("#a-copy").addEventListener("click", function () { copy(lastAnswer); toast("ph ph-copy", "accent", "Ответ скопирован", ""); });
    $("#a-note").addEventListener("click", function () { addNote(lastAnswer); toast("ph ph-note-pencil", "warning", "Сохранено в заметки", ""); });
    function showCalc() {
      var r = calc(aiInput.value, showCalc);
      $("#calc").hidden = !r;
      if (r) { $("#calc-value").textContent = r.value; $("#calc-cap").textContent = r.cap; }
    }
    aiInput.addEventListener("input", showCalc);
    aiInput.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" || e.shiftKey) return;
      e.preventDefault();
      var q = aiInput.value.trim(); if (!q) return;
      if (calc(q)) return;
      lastAct = null;
      if (aiSrc) stream(q, "На сайте ИИ не подключён, поэтому свои задания здесь не выполняются. Выбери кнопку выше - «Исправить ошибки» или «Короче». В программе твоё задание выполнит твой ИИ.", false);
      else stream(q, answerFor(q), false);
      aiInput.value = ""; $("#calc").hidden = true;
    });
    $("#calc-copy").addEventListener("click", function () { copy($("#calc-value").textContent.replace(/\s/g, " ")); toast("ph ph-copy", "accent", "Скопировано", $("#calc-value").textContent); });

    function aiForSelection() {
      var src = grabSelection();
      openPanel("home");
      setSource(src);
      if (!src) {
        aiInput.focus();
        if (notepad) coach("Сначала выдели абзац в Блокноте, потом нажми " + KEYS(["Ctrl", "Alt", "A"]));
        else toast("ph ph-cursor-text", "purple", "Сначала выдели текст", "Например, абзац в «Попробуй Larchik.txt»");
        return;
      }
      var first = $("#ai-acts .chip");
      if (first) first.focus();
      coach("Выбери в панели, что сделать с текстом, - например, <b>«Исправить ошибки»</b>");
    }

    // ---------------- notes
    var notes = store.get("notes", []), curNote = null, saveTimer = 0;
    var ntInput = $("#nt-input");
    function addNote(text) { notes.unshift({ id: Date.now(), text: text, ts: Date.now() }); store.set("notes", notes); if (!$("#nt-all-pane").hidden) renderNotes(); }
    ntInput.addEventListener("input", function () {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(function () {
        var t = ntInput.value;
        if (!t.trim()) return;
        if (curNote) { curNote.text = t; curNote.ts = Date.now(); } else { curNote = { id: Date.now(), text: t, ts: Date.now() }; notes.unshift(curNote); }
        store.set("notes", notes);
        noteState("ok", "Сохранено · " + new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }));
      }, 400);
    });
    function noteState(cls, text) { var el = $("#nt-saved"); el.className = "state " + cls; $("span", el).textContent = text; }
    $("#nt-new").addEventListener("click", function () { curNote = null; ntInput.value = ""; noteState("", "Новая заметка"); setNotesView("write"); ntInput.focus(); });
    $("#nt-big").addEventListener("click", function () { closePanel(); openApp("note"); });
    $("#nt-folder").addEventListener("click", function () { toast("ph ph-folder-simple", "warning", "Папка с заметками", "В программе откроется Проводник: заметки - обычные файлы .md"); });
    function setNotesView(v) {
      $("#nt-write").setAttribute("aria-pressed", String(v === "write"));
      $("#nt-all").setAttribute("aria-pressed", String(v === "all"));
      $("#nt-write-pane").hidden = v !== "write";
      $("#nt-all-pane").hidden = v !== "all";
      if (v === "all") renderNotes();
    }
    $("#nt-write").addEventListener("click", function () { setNotesView("write"); });
    $("#nt-all").addEventListener("click", function () { setNotesView("all"); });
    var lastDeleted = null;
    function renderNotes() {
      var p = $("#nt-all-pane");
      if (!notes.length) {
        p.innerHTML = '<div class="empty c-warning" style="--plate:var(--card)"><div class="fig" data-fig="notepad" data-label="Тетрадь на спирали, чистые листы"></div><b>Заметок пока нет</b><span>Напиши первую - она сохранится сама</span><button class="btn primary" type="button" id="nt-first">Новая заметка</button></div>';
        figs(p);
        $("#nt-first").addEventListener("click", function () { $("#nt-new").click(); });
        return;
      }
      p.innerHTML = '<div class="notes-list">' + notes.map(function (n, i) {
        return '<div class="note-row"><div><p>' + esc(n.text) + "</p><small>" + new Date(n.ts).toLocaleString("ru-RU", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }) +
          '</small></div><span class="row" style="gap:2px"><button class="ibtn sm" type="button" data-copy="' + i + '" aria-label="Скопировать заметку"><i class="ph ph-copy"></i></button>' +
          '<button class="ibtn sm" type="button" data-del="' + i + '" aria-label="Удалить заметку"><i class="ph ph-trash"></i></button></span></div>';
      }).join("") + "</div>" + (lastDeleted ? '<div class="row" style="margin-top:8px"><span class="muted grow">Заметка удалена</span><button class="btn" type="button" id="nt-undo">Вернуть</button></div>' : "");
      var u = $("#nt-undo"); if (u) u.addEventListener("click", function () { notes.splice(lastDeleted.i, 0, lastDeleted.n); lastDeleted = null; store.set("notes", notes); renderNotes(); });
    }
    $("#nt-all-pane").addEventListener("click", function (e) {
      var c = e.target.closest("[data-copy]"), d = e.target.closest("[data-del]");
      if (c) { copy(notes[+c.dataset.copy].text); toast("ph ph-copy", "warning", "Заметка скопирована", ""); }
      if (d) { var i = +d.dataset.del; lastDeleted = { i: i, n: notes[i] }; if (curNote === notes[i]) curNote = null; notes.splice(i, 1); store.set("notes", notes); renderNotes(); }
    });

    // ---------------- translator
    var trFrom = "ru", trTo = "en", trTimer = 0, trSrc = null, trResult = "";
    var trInput = $("#tr-input"), trOut = $("#tr-out");
    function setLangs(from) { trFrom = from; trTo = from === "ru" ? "en" : "ru"; $("#tr-from").textContent = trFrom.toUpperCase(); $("#tr-to").textContent = trTo.toUpperCase(); }
    $("#tr-swap").addEventListener("click", function () { setLangs(trTo); if (trResult) { trInput.value = trResult; } translate(); });
    trInput.addEventListener("input", function () { trSrc = null; clearTimeout(trTimer); trTimer = setTimeout(translate, 450); });
    function translate() {
      var t = trInput.value;
      $("#tr-count").textContent = t.length + " симв.";
      $("#tr-insert").disabled = true;
      trResult = "";
      if (!t.trim()) { trOut.innerHTML = '<span class="muted">Жду текст</span>'; return; }
      setLangs(/[а-яё]/i.test(t) ? "ru" : "en");
      var cached = TR_CACHE[norm(t)];
      if (cached) return showTr(cached, "из кэша - без запроса в сеть");
      if (!store.get("tr-ok", false)) { $("#tr-consent").hidden = false; trOut.innerHTML = '<span class="muted">Жду разрешения</span>'; return; }
      trOut.innerHTML = '<span class="muted">Перевожу…</span>';
      var q = t.slice(0, 480);
      fetch("https://api.mymemory.translated.net/get?q=" + encodeURIComponent(q) + "&langpair=" + trFrom + "|" + trTo)
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) {
          if (trInput.value !== t) return;
          var out = d && d.responseData && d.responseData.translatedText;
          if (!out || d.responseStatus !== 200) throw new Error("no");
          showTr(out, "MyMemory" + (t.length > 480 ? " · здесь переводятся первые 480 символов" : ""));
        })
        .catch(function () { if (trInput.value === t) trOut.innerHTML = '<span class="muted">Сервис перевода не ответил. В программе Larchik попробует резервный - или твой ИИ.</span>'; });
    }
    function showTr(text, via) {
      trResult = text;
      trOut.innerHTML = esc(text) + '<br><span class="muted">' + esc(via) + "</span>";
      $("#tr-insert").disabled = !(trSrc && trSrc.ta);
    }
    $("#tr-allow").addEventListener("click", function () { store.set("tr-ok", true); $("#tr-consent").hidden = true; translate(); });
    $("#tr-viaai").addEventListener("click", function () { $("#tr-consent").hidden = true; trOut.innerHTML = '<span class="muted">В программе перевод пойдёт через твой ИИ. Здесь ИИ не подключён - нажми «Разрешить», чтобы попробовать внешний сервис.</span>'; });
    $("#tr-copy").addEventListener("click", function () { if (trResult) { copy(trResult); toast("ph ph-copy", "accent", "Перевод скопирован", ""); } });
    $("#tr-insert").addEventListener("click", function () {
      if (!trSrc || !trResult) return;
      if (replaceIn(trSrc, trResult)) { closePanel(); toast("ph ph-translate", "accent", "Перевод вставлен", "Без ИИ и без токенов"); done("tr"); trSrc = null; }
    });
    function translateSelection() {
      var src = grabSelection();
      openPanel("tr");
      if (!src) {
        trInput.focus();
        if (notepad) coach("Сначала выдели абзац в Блокноте, потом нажми " + KEYS(["Ctrl", "Alt", "Z"]));
        return;
      }
      trInput.value = src.text;
      translate();
      trSrc = src;
      $("#tr-insert").disabled = !(src.ta && trResult);
      if (trResult) coach("Перевод готов. <b>«Вставить в программу»</b> заменит выделенный текст");
      if (!src.ta && trResult) done("tr");
    }

    // ---------------- vault (Windows Hello)
    var VAULT = [
      { s: "Госуслуги", l: "+7 900 000-00-00", p: "Демо-пароль-1", c: "#0d4cd3" },
      { s: "Почта", l: "demo@example.com", p: "Ларчик-открывался", c: "#ff9f0a" },
      { s: "Wi-Fi дома", l: "Larchik-Home", p: "openthebox42", c: "#30d158" },
      { s: "Ключ cloud.ru", l: "API-ключ ИИ", p: "демо-ключ-не-настоящий", c: "#bf5af2" }
    ];
    var vaultOpen = false, vaultLeft = 0, vaultTimer = 0, shown = {};
    var clock = function (s) { return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
    function renderVault() {
      var c = $("#vault-card");
      if (!vaultOpen) {
        c.innerHTML = '<div class="card-h"><span class="bubble"><i class="ph ph-lock-simple"></i></span><b>Хранилище</b></div>' +
          '<div class="empty"><div class="fig" data-fig="vault" data-label="Дверь сейфа с наборным диском"></div><b>Хранилище закрыто</b>' +
          "<span>Откроется по Windows Hello - отпечатком, лицом или ПИН-кодом, как вход в Windows.</span>" +
          '<button class="btn primary" type="button" id="v-open"><i class="ph ph-fingerprint"></i>Открыть</button></div>' +
          '<p class="muted" style="text-align:center;margin:10px 0 0">Шифрование Windows DPAPI · закроется при блокировке ПК</p>';
        figs(c);
        $("#v-open").addEventListener("click", hello);
        return;
      }
      c.innerHTML = '<div class="card-h"><span class="bubble"><i class="ph ph-lock-simple-open"></i></span><b>Хранилище</b><button class="ibtn sm" type="button" id="v-close" data-tip="Закрыть сейчас"><i class="ph ph-lock-simple"></i></button></div>' +
        '<div class="vault-open-bar"><i class="ph-fill ph-check-circle"></i><span class="grow">Открыто · закроется через <b id="v-left">' + clock(vaultLeft) + "</b></span></div>" +
        VAULT.map(function (v, i) {
          return '<div class="vrow"><span class="av" style="background:' + v.c + '">' + esc(v.s[0]) + "</span><div><b>" + esc(v.s) + "</b><small>" + esc(v.l) + " · " + (shown[i] ? esc(v.p) : "••••••••••") + "</small></div>" +
            '<span class="row" style="gap:2px"><button class="ibtn sm" type="button" data-eye="' + i + '" aria-label="Показать пароль"><i class="ph ph-eye' + (shown[i] ? "-slash" : "") + '"></i></button>' +
            '<button class="ibtn sm" type="button" data-pw="' + i + '" aria-label="Скопировать пароль"><i class="ph ph-copy"></i></button></span></div>';
        }).join("") + '<p class="muted" style="margin:10px 0 0">Это демо-записи. Настоящие пароли хранятся только на твоём компьютере.</p>';
      $("#v-close").addEventListener("click", lockVault);
    }
    $("#vault-card").addEventListener("click", function (e) {
      var eye = e.target.closest("[data-eye]"), pw = e.target.closest("[data-pw]");
      if (eye) { shown[eye.dataset.eye] = !shown[eye.dataset.eye]; renderVault(); }
      if (pw) { copy(VAULT[+pw.dataset.pw].p); toast("ph ph-key", "success", "Пароль скопирован", VAULT[+pw.dataset.pw].s); }
    });
    function lockVault() { vaultOpen = false; shown = {}; clearInterval(vaultTimer); if (pane === "vault") renderVault(); }
    var scrim = $("#hello-scrim"), pin = $("#hello-pin");
    function hello() {
      scrim.classList.remove("closed");
      pin.value = ""; $("#hello-err").textContent = "";
      setTimeout(function () { pin.focus(); }, 50);
    }
    function helloClose() { scrim.classList.add("closed"); }
    function helloOk() {
      if (!/^\d{4,6}$/.test(pin.value)) { $("#hello-err").textContent = "ПИН-код - это 4-6 цифр. Здесь подойдут любые."; pin.focus(); return; }
      var face = $("#hello-face");
      face.classList.remove("go"); void face.offsetWidth; face.classList.add("go");
      setTimeout(function () {
        helloClose();
        vaultOpen = true; vaultLeft = 150;
        clearInterval(vaultTimer);
        vaultTimer = setInterval(function () {
          vaultLeft--;
          var l = $("#v-left"); if (l) l.textContent = clock(vaultLeft);
          if (vaultLeft <= 0) { lockVault(); toast("ph ph-lock-simple", "success", "Хранилище закрылось само", "Через 2:30 без дела - как в программе"); }
        }, 1000);
        openPanel("vault");
        done("vault");
      }, 650);
    }
    $("#hello-ok").addEventListener("click", helloOk);
    $("#hello-cancel").addEventListener("click", helloClose);
    $("#hello-face").addEventListener("click", function () { pin.value = "0000"; helloOk(); });
    pin.addEventListener("keydown", function (e) { if (e.key === "Enter") helloOk(); });

    // ---------------- text from screen (Ctrl+Alt+S)
    var snipper = null;
    function startSnip() {
      if (snipper) return;
      closePanel();
      if (!wins.photo || wins.photo.min) { openApp("photo"); setTimeout(startSnip, 260); return; }
      snipper = document.createElement("div");
      snipper.className = "snipper";
      snipper.innerHTML = '<div class="hint lk"><i class="ph ph-text-aa"></i>Обведи текст мышью · Esc - отмена</div>';
      desk.appendChild(snipper);
      var frame = null, sx, sy;
      snipper.addEventListener("pointerdown", function (e) {
        sx = (e.clientX / K); sy = (e.clientY / K);
        frame = document.createElement("div"); frame.className = "frame"; snipper.appendChild(frame);
        snipper.style.background = "transparent";
        snipper.setPointerCapture(e.pointerId);
        place(e);
      });
      function place(e) {
        var x = Math.min(sx, (e.clientX / K)), y = Math.min(sy, (e.clientY / K));
        frame.style.cssText = "left:" + x + "px;top:" + y + "px;width:" + Math.abs((e.clientX / K) - sx) + "px;height:" + Math.abs((e.clientY / K) - sy) + "px";
      }
      snipper.addEventListener("pointermove", function (e) { if (frame) place(e); });
      snipper.addEventListener("pointerup", function () {
        if (!frame) return;
        var r = frame.getBoundingClientRect();
        endSnip();
        if (r.width < 6 || r.height < 6) return;
        var lines = $$("[data-ocr]").filter(function (el) {
          if (el.closest(".win.min")) return false;
          var b = el.getBoundingClientRect(), cx = b.left + b.width / 2, cy = b.top + b.height / 2;
          // the frame has to take in the middle of the line, and the line has to be on top there
          if (!(cx > r.left - b.width * .3 && cx < r.right + b.width * .3 && cy > r.top && cy < r.bottom)) return false;
          var topEl = document.elementFromPoint(Math.min(Math.max(cx, r.left + 1), r.right - 1), cy);
          return topEl && (topEl === el || el.contains(topEl) || topEl.closest(".board") === el.closest(".board"));
        });
        if (!lines.length) { toast("ph ph-text-aa", "teal", "Текста не нашлось", "Обведи надписи на «Фото доски.jpg»"); return; }
        lines.forEach(function (l) { l.classList.add("ocr-hit"); setTimeout(function () { l.classList.remove("ocr-hit"); }, 900); });
        var text = lines.map(function (l) { return l.textContent; }).join("\n");
        copy(text);
        $("#ocr-text").textContent = text;
        $("#ocr-card").hidden = false;
        setTimeout(function () {
          openPanel("home");
          var card = $("#ocr-card"); card.classList.remove("flash"); void card.offsetWidth; card.classList.add("flash");
        }, 200);
        toast("ph ph-text-aa", "teal", "Текст скопирован", lines.length + " " + (lines.length === 1 ? "строка" : lines.length < 5 ? "строки" : "строк") + " · распознано без интернета");
        done("ocr");
      });
    }
    function endSnip() { if (snipper) { snipper.remove(); snipper = null; } }
    $("#ocr-hide").addEventListener("click", function () { $("#ocr-card").hidden = true; });
    $("#ocr-copy").addEventListener("click", function () { copy($("#ocr-text").textContent); toast("ph ph-copy", "teal", "Скопировано", ""); });
    $("#ocr-note").addEventListener("click", function () { addNote($("#ocr-text").textContent); toast("ph ph-note-pencil", "warning", "Сохранено в заметки", ""); });
    $("#ocr-tr").addEventListener("click", function () { trSrc = null; showPane("tr"); trInput.value = $("#ocr-text").textContent; translate(); });
    $("#ocr-ai").addEventListener("click", function () { setSource({ text: $("#ocr-text").textContent }); $("#p-body").scrollTop = 0; });

    // ---------------- island: timer, mic, theme; and the pill while the timer runs
    var tmMin = 5, tmLeft = 0, tmRun = false, tmTimer = 0;
    function tmUi() {
      var idle = !tmLeft;
      $("#tm-value").textContent = idle ? tmMin + " мин" : clock(tmLeft);
      $("#is-timer-text").textContent = idle ? "Таймер" : clock(tmLeft);
      $("#is-timer").classList.toggle("on", !idle);
      $("#tm-go").textContent = idle ? "Старт" : tmRun ? "Пауза" : "Дальше";
      $("#pill-time").textContent = clock(tmLeft);
      $("#pill-text").textContent = tmRun ? "Таймер" : "Таймер на паузе";
    }
    function syncPill() { pill.classList.toggle("closed", !(tmLeft && panelOpen() === false)); }
    $("#is-timer").addEventListener("click", function () { var r = $("#is-timer-row"); r.hidden = !r.hidden; });
    $("#tm-minus").addEventListener("click", function () { if (tmLeft) tmLeft = Math.max(1, tmLeft - 60); else tmMin = Math.max(1, tmMin - 1); tmUi(); });
    $("#tm-plus").addEventListener("click", function () { if (tmLeft) tmLeft += 60; else tmMin = Math.min(180, tmMin + 1); tmUi(); });
    $("#tm-reset").addEventListener("click", function () { tmLeft = 0; tmRun = false; clearInterval(tmTimer); tmUi(); syncPill(); });
    $("#tm-go").addEventListener("click", function () {
      if (!tmLeft) tmLeft = tmMin * 60;
      tmRun = !tmRun;
      clearInterval(tmTimer);
      if (tmRun) tmTimer = setInterval(function () {
        tmLeft--;
        if (tmLeft <= 0) { tmLeft = 0; tmRun = false; clearInterval(tmTimer); toast("ph-fill ph-timer", "warning", "Таймер: время вышло", tmMin + " мин"); syncPill(); }
        tmUi();
      }, 1000);
      tmUi();
    });
    pill.addEventListener("click", function () { openPanel(); $("#is-timer-row").hidden = false; });
    $("#is-theme").addEventListener("click", function () { setTheme(isDark() ? "light" : "dark"); });
    $("#is-mic").addEventListener("click", function () { toast("ph ph-microphone", "accent", "Голосовые команды", "В программе они включаются: Настройки → Инструменты. В демо микрофон не нужен"); });
    tmUi();

    // ---------------- pipette (EyeDropper in Chromium; elsewhere the system colour picker)
    var colors = store.get("colors", ["#0A84FF", "#FF9F0A", "#30D158"]);
    function rgbOf(hex) { var n = parseInt(hex.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
    function hslOf(rgb) {
      var r = rgb[0] / 255, g = rgb[1] / 255, b = rgb[2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, h = 0, sat = 0, d = mx - mn;
      if (d) { sat = d / (1 - Math.abs(2 * l - 1)); h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h = Math.round(h * 60); if (h < 0) h += 360; }
      return [h, Math.round(sat * 100), Math.round(l * 100)];
    }
    function fmtColor(hex, f) { var c = rgbOf(hex), l = hslOf(c); return f === "rgb" ? "rgb(" + c.join(", ") + ")" : f === "hsl" ? "hsl(" + l[0] + ", " + l[1] + "%, " + l[2] + "%)" : hex; }
    function showColor() {
      var hex = colors[0] || "#0A84FF";
      $("#pk-sw").style.background = hex;
      $("#pk-hex").textContent = hex;
      $("#pk-more").textContent = fmtColor(hex, "rgb") + " · " + fmtColor(hex, "hsl");
      $("#pk-recent").innerHTML = colors.map(function (c) { return '<button type="button" style="background:' + c + '" data-c="' + c + '" data-tip="' + c + '" aria-label="Цвет ' + c + '"></button>'; }).join("");
    }
    function gotColor(hex) {
      hex = hex.toUpperCase();
      colors = [hex].concat(colors.filter(function (c) { return c !== hex; })).slice(0, 12);
      store.set("colors", colors); showColor(); copy(hex);
      toast("ph ph-eyedropper", "pink", "Цвет скопирован", hex + " · " + fmtColor(hex, "rgb"));
    }
    function pickColor() {
      if (window.EyeDropper) new EyeDropper().open().then(function (r) { gotColor(r.sRGBHex); }).catch(function () {});
      else $("#pk-input").click();
    }
    $("#pk-go").addEventListener("click", pickColor);
    $("#pk-input").addEventListener("input", function (e) { gotColor(e.target.value); });
    $("#pk-copy").addEventListener("click", function (e) { var b = e.target.closest("[data-f]"); if (b) { var t = fmtColor(colors[0], b.dataset.f); copy(t); toast("ph ph-copy", "pink", "Скопировано", t); } });
    $("#pk-recent").addEventListener("click", function (e) { var b = e.target.closest("[data-c]"); if (b) { colors = [b.dataset.c].concat(colors.filter(function (c) { return c !== b.dataset.c; })); store.set("colors", colors); showColor(); } });
    $("#pk-clear").addEventListener("click", function () { colors = []; store.set("colors", colors); showColor(); });
    showColor();

    // ---------------- the panel (by its header) and the island move anywhere; the place is remembered
    function draggable(el, handle, key, place) {
      var saved = store.get(key, null), sx, sy, ox, oy, on = false;
      if (saved) place(saved.x, saved.y);
      handle.addEventListener("pointerdown", function (e) {
        if (e.button !== 0 || e.target.closest("button,input,textarea,select,a")) return;
        var r = el.getBoundingClientRect();
        on = true; sx = (e.clientX / K); sy = (e.clientY / K); ox = r.left / K; oy = r.top / K;
        handle.setPointerCapture(e.pointerId);
      });
      handle.addEventListener("pointermove", function (e) {
        if (!on) return;
        var r = el.getBoundingClientRect();
        var x = Math.max(4, Math.min(VW - r.width / K - 4, ox + (e.clientX / K) - sx));
        var y = Math.max(4, Math.min(VH - TB - 40, oy + (e.clientY / K) - sy));
        place(x, y);
      });
      var end = function () { if (!on) return; on = false; var r = el.getBoundingClientRect(); store.set(key, { x: r.left / K, y: r.top / K }); };
      handle.addEventListener("pointerup", end); handle.addEventListener("pointercancel", end);
    }
    // the panel keeps its bottom edge where it was dropped: it grows upwards, as in the app
    draggable(panel, $("#p-head"), "panel-pos", function (x, y) {
      panel.style.left = x + "px";
      panel.style.bottom = Math.max(4, VH - y - panel.offsetHeight) + "px";
    });
    draggable(island, island, "island-pos", function (x, y) {
      island.style.left = x + "px"; island.style.top = y + "px"; island.style.marginLeft = "0";
      pill.style.left = (x + island.offsetWidth / 2 - 110) + "px"; pill.style.top = y + "px"; pill.style.marginLeft = "0";
    });

    // ---------------- start menu
    var start = $("#start"), PINS = ["welcome", "notepad", "photo", "docs", "faq", "ai", "feedback", "settings", "license", "privacy", "setup", "releases"];
    function renderPins(q) {
      var list = PINS.filter(function (id) { var a = APPS[id] || EXTRA[id]; return !q || a.title.toLowerCase().indexOf(q.toLowerCase()) >= 0; });
      $("#pins").innerHTML = list.length ? list.map(function (id) {
        var a = APPS[id] || EXTRA[id];
        var icon = a.small ? a.small() : '<i class="ph-fill ph-download-simple" style="color:#2f7cf6"></i>';
        if (id === "releases") icon = '<i class="ph-fill ph-globe" style="color:#30d158"></i>';
        return '<button class="pin" type="button" data-id="' + id + '"><span class="tb-ic">' + icon + "</span><span>" + esc(id === "welcome" ? "Larchik" : id === "settings" ? "Настройки" : (a.short || a.title)) + "</span></button>";
      }).join("") : '<p class="start-empty">Ничего не нашлось. Попробуй «блокнот», «ИИ» или «вопросы».</p>';
    }
    $("#recs").innerHTML = [
      ["setup", "ph ph-download-simple", "Larchik-Setup.exe", '<span class="version">Последняя версия</span>'],
      ["notepad", "ph ph-notepad", "Попробуй Larchik.txt", "Недавно открытые"],
      ["photo", "ph ph-image", "Фото доски.jpg", "Для текста с экрана"],
      ["releases", "ph ph-clock-counter-clockwise", "Все версии и что нового", "GitHub"],
      ["tg", "ph ph-telegram-logo", "Канал Larchik", "Новости в Telegram"]
    ].map(function (r) { return '<button class="rec" type="button" data-id="' + r[0] + '"><span class="tb-ic"><i class="' + r[1] + '"></i></span><span><b>' + r[2] + "</b><small>" + r[3] + "</small></span></button>"; }).join("");
    renderPins("");
    function startOpen(focusSearch) {
      start.classList.remove("closed");
      $("#start-q").value = ""; renderPins("");
      if (focusSearch) setTimeout(function () { $("#start-q").focus(); }, 30);
    }
    function startClose() { start.classList.add("closed"); }
    $("#tb-start").addEventListener("click", function () { if (start.classList.contains("closed")) startOpen(false); else startClose(); });
    $("#tb-search").addEventListener("click", function () { startOpen(true); });
    $("#start-q").addEventListener("input", function (e) { renderPins(e.target.value.trim()); });
    $("#start-q").addEventListener("keydown", function (e) { if (e.key === "Enter") { var f = $("#pins .pin"); if (f) f.click(); } });
    start.addEventListener("click", function (e) { var b = e.target.closest("[data-id]"); if (b) { startClose(); launch(b.dataset.id); } });
    document.addEventListener("pointerdown", function (e) {
      if (!start.contains(e.target) && !e.target.closest("#tb-start,#tb-search")) startClose();
    });

    // ---------------- «Попробуй сам»
    var QUEST = [
      ["panel", "Открой панель Larchik", ["Ctrl", "Shift", "Space"]],
      ["ai", "Исправь текст с ИИ", ["Ctrl", "Alt", "A"]],
      ["tr", "Переведи", ["Ctrl", "Alt", "Z"]],
      ["ocr", "Скопируй текст с картинки", ["Ctrl", "Alt", "S"]],
      ["snip", "Вставь заготовку", ["1д"]],
      ["vault", "Открой хранилище паролей", ["Windows Hello"]]
    ];
    var questDone = {};   // not kept: each visit shows the whole way again
    function renderQuest() {
      $("#quest-list").innerHTML = QUEST.map(function (q) {
        return '<li class="' + (questDone[q[0]] ? "done" : "") + '"><button type="button" data-q="' + q[0] + '"><span class="chk"><i class="ph-fill ph-check"></i></span><span class="what">' + q[1] +
          '</span>' + KEYS(q[2]) + "</button></li>";
      }).join("");
      var n = QUEST.filter(function (q) { return questDone[q[0]]; }).length;
      if (n === QUEST.length) $("#quest-list").insertAdjacentHTML("beforeend", '<li class="again"><button type="button" data-again><i class="ph ph-arrow-counter-clockwise"></i>Пройти ещё раз</button></li>');
      $("#quest-progress").style.width = (n / QUEST.length * 100) + "%";
      $("#quest-count").textContent = n + "/" + QUEST.length;
    }
    function done(id) {
      if (questDone[id]) return;
      uncoach();
      questDone[id] = true; renderQuest();
      if (QUEST.every(function (q) { return questDone[q[0]]; }))
        setTimeout(function () { toast("ph-fill ph-confetti", "success", "Ты попробовал всё!", "В программе это работает в любом окне Windows. Скачай - это бесплатно"); }, 900);
    }
    $("#quest-list").addEventListener("click", function (e) {
      var b = e.target.closest("[data-q]");
      if (b) guide(b.dataset.q);
      if (e.target.closest("[data-again]")) { questDone = {}; renderQuest(); if (notepad) notepad.ta.value = DOC; guide("panel"); }
    });
    $("#quest-fold").addEventListener("click", function () { $("#quest").classList.add("folded"); $("#quest-reopen").hidden = false; store.set("fold", true); });
    $("#quest-reopen").addEventListener("click", function () { $("#quest").classList.remove("folded"); $("#quest-reopen").hidden = true; store.set("fold", false); });
    if (store.get("fold", false)) { $("#quest").classList.add("folded"); $("#quest-reopen").hidden = false; }
    renderQuest();

    // a guided start for each: open what is needed and point at the next step
    function selectLine(ta, text) {
      var i = ta.value.indexOf(text);
      if (i < 0) { var lines = ta.value.split("\n"), best = lines.reduce(function (a, b) { return b.length > a.length ? b : a; }, ""); i = ta.value.indexOf(best); text = best; }
      ta.focus(); ta.setSelectionRange(i, i + text.length); notepad.status();
    }
    function guide(id) {
      startClose();
      if (id === "panel") { closePanel(); coach("Нажми " + KEYS(["Ctrl", "Shift", "Space"]) + " или кликни значок Larchik в трее, рядом с часами"); }
      else if (id === "ai" || id === "tr") {
        closePanel();
        openApp("notepad", function () {
          setTimeout(function () {
            if (!notepad) return;
            selectLine(notepad.ta, id === "ai" ? SAMPLE_RU : SAMPLE_EN);
            coach("Абзац выделен. Теперь нажми " + KEYS(["Ctrl", "Alt", id === "ai" ? "A" : "Z"]));
          }, 120);
        });
      }
      else if (id === "ocr") { closePanel(); openApp("photo", function () { setTimeout(function () { coach("Нажми " + KEYS(["Ctrl", "Alt", "S"]) + " и обведи мышью надписи на фото доски"); }, 200); }); }
      else if (id === "snip") {
        closePanel();
        openApp("notepad", function () {
          setTimeout(function () {
            if (!notepad) return;
            var ta = notepad.ta; ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); notepad.status();
            coach("Напечатай в Блокноте <b>1д</b> - заготовка сама подставит сегодняшнее число");
          }, 120);
        });
      }
      else if (id === "vault") { openPanel("vault"); setTimeout(function () { var b = $("#v-open"); if (b) coach("Нажми <b>«Открыть»</b> - Windows Hello спросит ПИН. Здесь подойдёт любой из 4 цифр"); }, 120); }
    }

    // ---------------- keyboard: the app's own shortcuts
    function pressKeys(keys) {
      var items = $$(".kp").filter(function (k) { return k.textContent === keys.join(" + "); });
      items.forEach(function (k) { k.classList.add("down"); });
      setTimeout(function () { items.forEach(function (k) { k.classList.remove("down"); }); }, 260);
    }
    document.addEventListener("keydown", function (e) {
      if (!root.classList.contains("is-desk")) return;
      var c = e.code;
      if (e.ctrlKey && e.shiftKey && !e.altKey && c === "Space") { e.preventDefault(); pressKeys(["Ctrl", "Shift", "Space"]); togglePanel(); return; }
      if (e.ctrlKey && e.altKey && !e.shiftKey && (c === "KeyA" || c === "KeyZ" || c === "KeyS")) {
        e.preventDefault(); uncoach();
        if (c === "KeyA") { pressKeys(["Ctrl", "Alt", "A"]); aiForSelection(); }
        else if (c === "KeyZ") { pressKeys(["Ctrl", "Alt", "Z"]); translateSelection(); }
        else { pressKeys(["Ctrl", "Alt", "S"]); startSnip(); }
        return;
      }
      if (e.ctrlKey && !e.altKey && !e.shiftKey && c === "KeyK") { e.preventDefault(); if (!panelOpen()) openPanel(); openSearch(); return; }
      if (e.key === "Escape") {
        if (snipper) endSnip();
        else if (!scrim.classList.contains("closed")) helloClose();
        else if (!start.classList.contains("closed")) startClose();
        else if (searching) closeSearch();
        else if (panelOpen()) closePanel();
        uncoach();
      }
    });
    // clicking outside the panel hides it, like the app does when it loses focus
    document.addEventListener("pointerdown", function (e) {
      if (!prefs.outside || !panelOpen() || snipper || !scrim.classList.contains("closed")) return;
      if (e.target.closest("#panel,#island,#tray-larchik,#pill,.toast,.quest,.sc,.qa,.hint")) return;
      closePanel();
    });

    // ---------------- clock
    function tick() {
      var d = new Date();
      $("#clock-t").textContent = d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
      $("#clock-d").textContent = d.toLocaleDateString("ru-RU");
      $("#clock").dataset.tip = longDate() + " " + d.getFullYear() + " г.";
    }
    tick(); setInterval(tick, 15000);
    addEventListener("resize", moveThumb);

    applyPrefs();
    themeChanged();
    renderSnips();
    if (!store.get("welcomed", false)) setTimeout(function () { openApp("welcome"); }, 350);
    else setTimeout(function () { if (!Object.keys(wins).length) coach("Справа - всё, что можно попробовать. Кликни любой пункт, и Larchik покажет, что делать"); }, 900);
  }

  // ==================================================================
  // PHONE
  // ==================================================================
  function initPhone() {
    var toastEl = $("#ph-toast"), tt = 0;
    function say(t) { toastEl.textContent = t; toastEl.classList.add("on"); clearTimeout(tt); tt = setTimeout(function () { toastEl.classList.remove("on"); }, 2600); }
    var url = location.origin + location.pathname;
    $$("[data-share]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (navigator.share) navigator.share({ title: "Larchik - ИИ в любой программе Windows", text: "Открыть на компьютере:", url: url }).catch(function () {});
        else { copy(url); say("Ссылка скопирована - открой её на компьютере"); }
      });
    });

    $("#faq-list").innerHTML = FAQ.map(function (f) {
      return "<details><summary>" + esc(f[0]) + '<i class="ph ph-caret-down"></i></summary><p>' + f[1].replace(/ data-open="[^"]*"/g, "") + "</p></details>";
    }).join("");

    var mc = $("#m-calc");
    function showCalc() { var r = calc(mc.value, showCalc); $("#m-calc-out").textContent = r ? r.value : "…"; $("#m-calc-cap").textContent = r ? r.cap : "Например: 100 $ в ₽, 5 миль в км, 1200 - 15%"; }
    mc.addEventListener("input", showCalc); showCalc();

    // the demo: select, press, choose, insert
    var para = $("#demo-para"), step = $("#demo-step"), sheet = $("#demo-sheet"), text = SAMPLE_RU, stage = 0, timer = 0;
    function setStep(n, html) { step.innerHTML = (n ? '<span class="n">' + n + "</span>" : '<span class="n" style="background:var(--success)"><i class="ph-fill ph-check"></i></span>') + html; }
    function reset() {
      stage = 0; text = SAMPLE_RU; para.textContent = text; para.classList.remove("sel", "new"); sheet.classList.remove("on");
      setStep(1, '<span class="grow">Коснись абзаца, чтобы выделить его</span>');
    }
    para.addEventListener("click", function () {
      if (stage !== 0) return;
      stage = 1; para.classList.add("sel");
      setStep(2, '<span class="grow">Теперь «нажми» сочетание</span><button class="keybtn" type="button" id="demo-keys"><span class="kc">Ctrl</span><span class="kc">Alt</span><span class="kc">A</span></button>');
      $("#demo-keys").addEventListener("click", openSheet);
    });
    function openSheet() {
      stage = 2;
      sheet.innerHTML = '<div class="grab"></div><div class="card-h c-purple"><span class="bubble"><i class="ph-fill ph-sparkle"></i></span><b>Спросить ИИ</b><button class="ibtn" type="button" id="demo-x" aria-label="Закрыть"><i class="ph ph-x"></i></button></div>' +
        '<div class="well src"><div class="grow"><span class="muted">Выделенный текст</span><p>' + esc(text) + '</p></div></div><div class="ai-acts" style="margin-top:4px">' +
        ACTIONS.map(function (a) { return '<button class="chip" type="button" data-act="' + a.id + '">' + a.label + "</button>"; }).join("") + '</div><div id="demo-ans"></div>';
      sheet.classList.add("on");
      setStep(3, '<span class="grow">Выбери, что сделать с текстом</span>');
      $("#demo-x").addEventListener("click", reset);
    }
    sheet.addEventListener("click", function (e) {
      var b = e.target.closest("[data-act]");
      if (b) {
        $$(".chip", sheet).forEach(function (c) { c.classList.toggle("on", c === b); });
        var out = RESULTS[SAMPLE_RU][b.dataset.act], ans = $("#demo-ans"), i = 0;
        clearTimeout(timer);
        ans.innerHTML = '<div class="answer"><div class="a-row"><div class="a-mark"><span class="orb"><i></i><i></i><i></i></span></div><div><div class="a-status">ИИ думает…</div><div class="a-text"></div></div></div></div>';
        timer = setTimeout(function run() {
          if (i === 0) { $(".a-mark", ans).innerHTML = '<i class="ph-fill ph-sparkle"></i>'; $(".a-status", ans).textContent = "Алиса AI пишет…"; }
          i = Math.min(out.length, i + 3);
          $(".a-text", ans).textContent = out.slice(0, i);
          if (i < out.length) { timer = setTimeout(run, 18); return; }
          $(".a-status", ans).textContent = "Готово";
          ans.insertAdjacentHTML("beforeend", '<div class="a-foot"><button class="btn primary" type="button" id="demo-ins" style="height:40px;flex:1">Вставить в программу</button></div>');
          $("#demo-ins").addEventListener("click", function () {
            text = out; para.textContent = out; para.classList.remove("sel"); void para.offsetWidth; para.classList.add("new");
            sheet.classList.remove("on"); stage = 3;
            setStep(0, '<span class="grow">Текст заменился прямо в письме. В Word, браузере и почте - так же.</span><button class="btn" type="button" id="demo-again">Ещё раз</button>');
            $("#demo-again").addEventListener("click", reset);
          });
        }, 700);
      }
    });
    reset();
    figs($("#phone"));
  }

  // ------------------------------------------------------------------ which site: desktop or phone
  var deskQ = matchMedia("(min-width: 900px) and (min-height: 560px) and (hover: hover) and (pointer: fine)");
  var inited = {};
  function pick() {
    var mode = deskQ.matches ? "desk" : "phone";
    root.classList.toggle("is-desk", mode === "desk");
    root.classList.toggle("is-phone", mode === "phone");
    if (!inited[mode]) { inited[mode] = true; (mode === "desk" ? initDesk : initPhone)(); }
    themeChanged();
  }
  deskQ.addEventListener("change", pick);
  pick();
})();
