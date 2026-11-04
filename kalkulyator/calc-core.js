/* Расчёт калькулятора ai-toolbox.ru/kalkulyator/.
   Формулы те же, что в принятом тексте (trafik/статьи/work/kalkulyator/final.md):
   цена часа = (доход + расходы) / (1 - налог) / оплачиваемые часы в месяц;
   цена услуги = цена часа × длительность + материалы / (1 - налог).
   Данные никуда не отправляются. */
(function (root) {
  // Готовые примеры: условные значения для старта, не «средние по рынку». Подпись об этом - на странице.
  var PRESETS = {
    manikyur: { label: "Маникюр", income: 80000, costs: 12000, hours: 30, share: 70, rest: 4, tax: 4, dur: 2, mat: 180 },
    repetitor: { label: "Репетитор", income: 70000, costs: 3000, hours: 25, share: 80, rest: 6, tax: 4, dur: 1, mat: 0 },
    massazh: { label: "Массаж", income: 90000, costs: 15000, hours: 30, share: 65, rest: 4, tax: 4, dur: 1.25, mat: 100 }
  };

  function clamp(x, lo, hi) { x = Number(x); if (isNaN(x)) x = 0; return Math.min(hi, Math.max(lo, x)); }

  function compute(v) {
    var income = clamp(v.income, 0, 1e7), costs = clamp(v.costs, 0, 1e7);
    var hours = clamp(v.hours, 0, 100), share = clamp(v.share, 0, 100) / 100;
    var rest = clamp(v.rest, 0, 20), tax = clamp(v.tax, 0, 6) / 100;
    var dur = clamp(v.dur, 0, 24), mat = clamp(v.mat, 0, 1e6);
    var weeksMonth = (52 - rest) / 12;
    var allHours = hours * weeksMonth;
    var billable = allHours * share;
    var gross = (income + costs) / (1 - tax);
    if (billable < 1) return { ok: false };
    var hour = gross / billable;
    var money = income + costs || 1;
    // Доли цены часа: если делить на все часы, цена была бы hour × share; остальное - оплата неоплачиваемого времени
    var parts = {
      you: share * (1 - tax) * income / money,
      costs: share * (1 - tax) * costs / money,
      tax: share * tax,
      unpaid: 1 - share
    };
    return {
      ok: true, hour: hour, service: dur > 0 ? hour * dur + mat / (1 - tax) : 0,
      gross: gross, billable: billable, allHours: allHours, weeksMonth: weeksMonth,
      paidPerWeek: Math.round(hours * share), hoursPerWeek: Math.round(hours),
      parts: parts, input: { income: income, costs: costs, hours: hours, share: share, rest: rest, tax: tax, dur: dur, mat: mat }
    };
  }

  // Сколько клиентов можно потерять без потери выручки при повышении на p %
  function loss(p) { return 1 - 1 / (1 + p / 100); }

  function rub(n) { return Math.round(n).toLocaleString("ru-RU") + " ₽"; }
  function num(n, d) { return Number(n).toLocaleString("ru-RU", { maximumFractionDigits: d || 0 }); }

  function steps(r) {
    var i = r.input, d = function (x) { return num(x, 2); };
    return [
      "Нужно выручить: (" + num(i.income) + " + " + num(i.costs) + ")" + (i.tax ? " / " + d(1 - i.tax) : "") + " = " + rub(r.gross),
      "Оплачиваемые часы: " + num(i.hours) + " ч × " + num(r.weeksMonth, 1) + " нед. × " + Math.round(i.share * 100) + " % = " + num(r.billable) + " ч в месяц",
      "Цена часа: " + rub(r.gross) + " / " + num(r.billable) + " ч = " + rub(r.hour),
      i.dur > 0 ? "Цена услуги: " + rub(r.hour) + " × " + num(i.dur, 2) + " ч + " + num(i.mat) + (i.tax ? " / " + d(1 - i.tax) : "") + " = " + rub(r.service) : ""
    ].filter(Boolean);
  }

  root.Calc = { PRESETS: PRESETS, compute: compute, loss: loss, rub: rub, num: num, steps: steps };
})(window);
