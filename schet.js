/* Учёт посещений: свой счётчик на сервере оплаты, Яндекс Метрика и плашка о cookie.
   Подключается на всех страницах сайта. Политика (politika.txt, п. 2.4) описывает ровно это. */
(function () {
  // 1. Свой счётчик без cookie: серверу оплаты уходят метка источника и сайт, с которого пришли.
  //    Метка - ?src=vk или, для рекламы, utm_campaign. Те же данные получают кнопки «Купить»,
  //    чтобы было видно, из какого источника доходят до оплаты.
  var params = new URLSearchParams(location.search);
  var label = params.get("src") || params.get("utm_campaign") || "";
  var host = "";
  try { host = document.referrer ? new URL(document.referrer).hostname : ""; } catch (e) {}
  var q = "s=" + encodeURIComponent(label) + "&r=" + encodeURIComponent(host);
  new Image().src = "https://pay.ai-toolbox.ru/c.gif?p=home&" + q;
  document.querySelectorAll('a[href="https://pay.ai-toolbox.ru"]').forEach(function (a) {
    a.href = "https://pay.ai-toolbox.ru/?" + q;
  });

  // 2. Яндекс Метрика (счётчик 114093764), цель «buy» - нажатие любой кнопки покупки
  var ID = 114093764;
  window.ym = window.ym || function () { (window.ym.a = window.ym.a || []).push(arguments); };
  window.ym.l = Date.now();
  var s = document.createElement("script");
  s.async = true;
  s.src = "https://mc.yandex.ru/metrika/tag.js?id=" + ID;
  document.head.appendChild(s);
  ym(ID, "init", { ssr: true, webvisor: true, clickmap: true, referrer: document.referrer, url: location.href,
                   accurateTrackBounce: true, trackLinks: true });
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="https://pay.ai-toolbox.ru"]');
    if (a) ym(ID, "reachGoal", "buy");
  });

  // 3. Плашка о cookie: один раз, до нажатия «Понятно»
  var KEY = "cookie-ok";
  try { if (localStorage.getItem(KEY)) return; } catch (e) {}
  var bar = document.createElement("div");
  bar.setAttribute("role", "region");
  bar.setAttribute("aria-label", "Файлы cookie");
  bar.style.cssText = "position:fixed;left:16px;right:16px;bottom:16px;z-index:50;max-width:560px;margin:0 auto;" +
    "display:flex;gap:12px;align-items:center;padding:12px 16px;background:#152d4a;color:#fff;" +
    "border-radius:12px;box-shadow:0 8px 24px rgba(21,45,74,.25);font:14px/1.5 inherit";
  var text = document.createElement("span");
  text.style.flex = "1";
  text.append("Сайт использует cookie Яндекс Метрики, чтобы считать посещения. Подробнее - в ");
  var link = document.createElement("a");
  link.href = "/politika.html";
  link.textContent = "политике";
  link.style.color = "#fb923c";
  text.append(link, ".");
  var ok = document.createElement("button");
  ok.type = "button";
  ok.textContent = "Понятно";
  ok.style.cssText = "flex:none;padding:8px 14px;border:0;border-radius:8px;background:#f97316;color:#fff;" +
    "font:600 14px/1 inherit;cursor:pointer";
  ok.addEventListener("click", function () {
    try { localStorage.setItem(KEY, "1"); } catch (e) {}
    bar.remove();
  });
  bar.append(text, ok);
  document.body.appendChild(bar);
})();
