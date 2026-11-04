/* Сайт ai-toolbox.ru: плавное появление при прокрутке.
   Разметку не меняет: классы расставляет сам. Без JS и при «уменьшить движение» всё видно сразу.
   Приёмы: заголовки поднимаются по словам из-под «шторки», блоки проявляются каскадом,
   ключевая фраза раздела загорается по словам вместе с прокруткой, крупные числа отсчитываются,
   сетка кальки в первом экране уходит медленнее страницы (параллакс). */
(function () {
  if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var root = document.documentElement;
  root.classList.add("mo");
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };

  // 1. Заголовки - по словам. Текстовые узлы режутся на слова, вложенные теги (em, span) сохраняются.
  function split(el) {
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 1) return walk(n);
        if (n.nodeType !== 3 || !n.textContent.trim()) return;
        var frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) return frag.appendChild(document.createTextNode(part));
          var w = document.createElement("m-w"), inner = document.createElement("m-w");
          w.className = "mw"; inner.className = "mwi"; inner.textContent = part;
          inner.style.transitionDelay = (i++ * 55) + "ms";
          w.appendChild(inner); frag.appendChild(w);
        });
        n.parentNode.replaceChild(frag, n);
      });
    })(el);
    el.classList.add("m-words");
  }
  $$("h1, h2").forEach(split);

  // 2. Блоки: всё содержимое разделов, кроме заголовков. Соседи в сетках и списках - с задержкой каскадом.
  var blocks = $$("main p, main ul, main ol, main figure, main details, main .btn, section p, section ul, section ol, " +
                  "section figure, section details, section .btn, section [class*='card'], section .callout")
    .filter(function (el) {
      return !el.closest("h1, h2, header.top, .m-up") && !(el.parentElement && el.parentElement.closest("details")) && !el.closest("[data-no-motion]") && el.offsetParent !== null;
    });
  blocks.forEach(function (el) {
    el.classList.add("m-up");
    var sib = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
    el.style.transitionDelay = Math.min(sib, 6) * 70 + "ms";
  });
  $$("li").forEach(function (li) {
    if (li.closest(".m-up") && li.parentElement.children.length > 1) {
      li.classList.add("m-li");
      li.style.transitionDelay = Array.prototype.indexOf.call(li.parentElement.children, li) * 80 + 120 + "ms";
    }
  });

  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      if (e.target.hasAttribute("data-count")) count(e.target);
      io.unobserve(e.target);
    });
  }, { rootMargin: "0px 0px -12% 0px" });
  $$(".m-words, .m-up, .reveal").forEach(function (el) { io.observe(el); });

  // 3. Крупные числа отсчитываются от нуля до своего значения (текст на странице - настоящее число).
  function count(el) {
    var text = el.textContent, m = text.match(/\d[\d\s  ]*/);
    if (!m) return;
    var target = parseInt(m[0].replace(/\D/g, ""), 10), t0 = performance.now(), dur = 1200;
    (function tick(t) {
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 4);
      el.textContent = text.replace(m[0], Math.round(target * e).toLocaleString("ru-RU").replace(/\s/g, " ") + (/\s$/.test(m[0]) ? " " : ""));
      if (k < 1) requestAnimationFrame(tick); else el.textContent = text;
    })(t0);
  }
  $$(".eq-big, .price, [class*='price-big'], [class*='num-big']").forEach(function (el) {
    if (/\d/.test(el.textContent) && !el.closest("[data-no-motion]")) { el.setAttribute("data-count", ""); io.observe(el); }
  });

  // 4. Фраза, которая загорается вместе с прокруткой: первый абзац после h2 в разделах с data-scrub
  //    или, если пометок нет, - вводный абзац второго раздела главной.
  var scrub = $$("[data-scrub]");
  if (!scrub.length) { var first = $$("section.section h2 + p")[0]; if (first) scrub = [first]; }
  scrub.forEach(function (p) {
    p.classList.remove("m-up"); p.style.transitionDelay = "";
    p.innerHTML = p.textContent.split(/(\s+)/).map(function (w) { return /^\s+$/.test(w) ? w : "<m-w class='ms'>" + w + "</m-w>"; }).join("");
    p.classList.add("m-scrub");
  });

  // 5. Параллакс сетки кальки в первом экране
  var hero = document.querySelector(".hero");
  var ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var y = window.scrollY, vh = window.innerHeight;
      // страховка при быстрой прокрутке: что уже выше низа экрана - показать
      $$(".m-up:not(.in), .m-words:not(.in)").forEach(function (el) {
        if (el.getBoundingClientRect().top < vh) { el.classList.add("in"); io.unobserve(el); }
      });
      if (hero && y < vh * 1.5) hero.style.backgroundPosition = "0 " + (y * 0.35) + "px";
      scrub.forEach(function (p) {
        var r = p.getBoundingClientRect();
        // от низа экрана до его середины слова загораются по очереди
        var k = Math.min(1, Math.max(0, (vh * 0.9 - r.top) / (vh * 0.5 + r.height * 0.5)));
        var words = p.querySelectorAll(".ms"), lit = Math.round(k * words.length);
        for (var i = 0; i < words.length; i++) words[i].classList.toggle("on", i < lit);
      });
    });
  }
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);
  onScroll();

  // 6. Первый экран: заголовок, лид и карточка примера проявляются при загрузке, не дожидаясь прокрутки
  requestAnimationFrame(function () { $$(".hero .m-words, .hero .m-up").forEach(function (el) { el.classList.add("in"); }); });
})();
