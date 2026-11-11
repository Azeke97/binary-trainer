'use strict';

/*
 * Локализация RU / EN.
 * Строка в словаре — обычный текст, функция — шаблон с параметрами.
 * Статические тексты в HTML помечены атрибутами data-i18n / data-i18n-aria.
 */

const I18N = (() => {
  const LANG_KEY = 'binary-trainer:lang';
  const LANGS = ['ru', 'en'];

  const dict = {
    ru: {
      meta: {
        title: 'Двоичный тренажёр',
        description: 'Тренажёр двоичной системы счисления: квиз, карточки и переключатель битов',
      },
      app: { title: 'Двоичный тренажёр', modes: 'Режимы', language: 'Язык' },
      tab: { quiz: 'Квиз', cards: 'Карточки', bits: 'Биты' },
      bits: (n) => `${n} ${n >= 2 && n <= 4 ? 'бита' : 'бит'}`,
      quiz: {
        round: (r, total, bits) => `Раунд ${r} / ${total} · ${bits}`,
        score: (n) => `Очки: ${n}`,
        reset: 'Сбросить прогресс',
        resetConfirm: 'Сбросить прогресс и начать с первого раунда?',
        next: 'Дальше',
        toSummary: 'Итоги раунда',
        hint: 'Подсказка',
        correct: 'Верно!',
        wrong: 'Неверно.',
        summaryTitle: 'Итоги раунда',
        finishTitle: 'Финиш',
        summaryText: (r, total, nextBits) => `Раунд ${r} из ${total}. Дальше — ${nextBits}.`,
        finishText: (rounds, total, max, best) =>
          `Все ${rounds} раундов пройдены. Итого: ${total} из ${max}. Лучший результат: ${best}.`,
        nextRound: 'Следующий раунд',
        restart: 'Начать заново',
      },
      cards: {
        flipHint: 'Нажмите на карточку, чтобы перевернуть',
        stats: (known, again) => `Знаю: ${known} · Повторить: ${again}`,
        answer: 'Ответ',
        again: 'Ещё раз',
        known: 'Знаю',
      },
      board: {
        size: 'Разрядность',
        binary: 'Двоичное',
        decimal: 'Десятичное',
        breakdown: 'Как сложилось',
        clear: 'Сбросить',
        random: 'Случайное',
        target: 'Задание: собери число',
        task: (n) => `Соберите число ${n}`,
        done: (n, sum) => `Готово! ${n} = ${sum}. Нажмите «Задание», чтобы получить новое число.`,
        bitLabel: (w) => `Разряд ${w}`,
      },
      q: {
        bin2dec: {
          kind: 'Двоичное → десятичное',
          prompt: () => 'Переведите в десятичное:',
          hint: (p) => `Веса разрядов слева направо: ${p.weights}. Сложите веса тех разрядов, где стоит 1.`,
        },
        dec2bin: {
          kind: 'Десятичное → двоичное',
          prompt: () => 'Переведите в двоичное:',
          hint: () => 'Найдите наибольшую степень двойки, не превышающую число, вычтите её и повторите с остатком.',
        },
        bitWeight: {
          kind: 'Вес разряда',
          prompt: (p) => `Чему равен вес разряда №${p.k}, если считать справа и с нуля?`,
          hint: () => 'Самый правый разряд — №0, его вес 2⁰ = 1. Каждый следующий разряд весит вдвое больше.',
        },
        maxValue: {
          kind: 'Диапазон',
          prompt: (p) => `Какое наибольшее число можно записать в ${p.n} битах (без знака)?`,
          hint: (p) => `Наибольшее число — когда все ${p.n} битов равны 1.`,
        },
        addition: {
          kind: 'Сложение',
          prompt: () => 'Сложите в двоичной системе:',
          hint: () => '0 + 0 = 0, 0 + 1 = 1, 1 + 1 = 10: пишем 0 и переносим 1 в следующий разряд.',
        },
      },
    },

    en: {
      meta: {
        title: 'Binary Trainer',
        description: 'Practice the binary number system: quiz, flashcards and a bit toggler',
      },
      app: { title: 'Binary Trainer', modes: 'Modes', language: 'Language' },
      tab: { quiz: 'Quiz', cards: 'Flashcards', bits: 'Bits' },
      bits: (n) => `${n} ${n === 1 ? 'bit' : 'bits'}`,
      quiz: {
        round: (r, total, bits) => `Round ${r} / ${total} · ${bits}`,
        score: (n) => `Score: ${n}`,
        reset: 'Reset progress',
        resetConfirm: 'Reset progress and start from round 1?',
        next: 'Next',
        toSummary: 'Round results',
        hint: 'Show hint',
        correct: 'Correct!',
        wrong: 'Wrong.',
        summaryTitle: 'Round results',
        finishTitle: 'Finished',
        summaryText: (r, total, nextBits) => `Round ${r} of ${total}. Next up: ${nextBits}.`,
        finishText: (rounds, total, max, best) =>
          `All ${rounds} rounds done. Total: ${total} of ${max}. Best score: ${best}.`,
        nextRound: 'Next round',
        restart: 'Start over',
      },
      cards: {
        flipHint: 'Click the card to flip it',
        stats: (known, again) => `Known: ${known} · Review: ${again}`,
        answer: 'Answer',
        again: 'Again',
        known: 'Got it',
      },
      board: {
        size: 'Bit width',
        binary: 'Binary',
        decimal: 'Decimal',
        breakdown: 'Breakdown',
        clear: 'Clear',
        random: 'Random',
        target: 'Challenge: build a number',
        task: (n) => `Build the number ${n}`,
        done: (n, sum) => `Done! ${n} = ${sum}. Press “Challenge” for a new number.`,
        bitLabel: (w) => `Bit ${w}`,
      },
      q: {
        bin2dec: {
          kind: 'Binary → decimal',
          prompt: () => 'Convert to decimal:',
          hint: (p) => `Place values from left to right: ${p.weights}. Add up the values of the places that hold a 1.`,
        },
        dec2bin: {
          kind: 'Decimal → binary',
          prompt: () => 'Convert to binary:',
          hint: () => 'Find the largest power of two that fits, subtract it, and repeat with the remainder.',
        },
        bitWeight: {
          kind: 'Place value',
          prompt: (p) => `What is the value of bit #${p.k}, counting from the right and starting at zero?`,
          hint: () => 'The rightmost bit is #0 and is worth 2⁰ = 1. Each next bit is worth twice as much.',
        },
        maxValue: {
          kind: 'Range',
          prompt: (p) => `What is the largest unsigned number that fits in ${p.n} bits?`,
          hint: (p) => `The largest number has all ${p.n} bits set to 1.`,
        },
        addition: {
          kind: 'Addition',
          prompt: () => 'Add in binary:',
          hint: () => '0 + 0 = 0, 0 + 1 = 1, 1 + 1 = 10: write 0 and carry 1 to the next place.',
        },
      },
    },
  };

  function readLang() {
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (LANGS.includes(saved)) return saved;
    } catch {
      /* нет доступа к хранилищу */
    }
    return (navigator.language || '').toLowerCase().startsWith('ru') ? 'ru' : 'en';
  }

  let lang = readLang();
  const listeners = [];

  /** t('quiz.score', 5) → «Очки: 5» */
  function t(key, ...args) {
    const value = key.split('.').reduce((node, part) => (node ? node[part] : undefined), dict[lang]);
    if (typeof value === 'function') return value(...args);
    return value ?? key;
  }

  /** Тексты вопроса: kind, prompt, hint — по типу и параметрам */
  function question(q) {
    return {
      kind: t(`q.${q.type}.kind`),
      prompt: t(`q.${q.type}.prompt`, q.params),
      hint: t(`q.${q.type}.hint`, q.params),
    };
  }

  /** Обновляет статические тексты, помеченные в HTML */
  function applyStatic() {
    document.documentElement.lang = lang;
    document.title = t('meta.title');
    document.querySelector('meta[name="description"]')?.setAttribute('content', t('meta.description'));
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
      el.setAttribute('aria-label', t(el.dataset.i18nAria));
    });
    document.querySelectorAll('[data-lang]').forEach((el) => {
      const active = el.dataset.lang === lang;
      el.classList.toggle('is-active', active);
      el.setAttribute('aria-pressed', String(active));
    });
  }

  function setLang(next) {
    if (!LANGS.includes(next) || next === lang) return;
    lang = next;
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      /* без сохранения тоже работает */
    }
    applyStatic();
    listeners.forEach((fn) => fn(lang));
  }

  const onChange = (fn) => listeners.push(fn);

  return { t, question, setLang, onChange, applyStatic, get lang() { return lang; } };
})();
