'use strict';

/*
 * Генератор заданий. Каждый генератор принимает разрядность (bits)
 * и возвращает вопрос без текста на конкретном языке:
 * { type, params, value, answer, options[4], explain }
 * Формулировку, тип и подсказку по type + params берёт i18n.js.
 * explain — формула, одинаковая для всех языков.
 * Все варианты ответа — строки; правильный всегда среди них.
 */

const Q = (() => {
  const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = (arr) => arr[rnd(0, arr.length - 1)];

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = rnd(0, i);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  const toBin = (n, width = 1) => n.toString(2).padStart(width, '0');
  const maxFor = (bits) => 2 ** bits - 1;
  const weights = (bits) => Array.from({ length: bits }, (_, i) => 2 ** (bits - 1 - i)).join(' ');

  /** 11 → «8 + 2 + 1» */
  function breakdown(n) {
    if (n === 0) return '0';
    const parts = [];
    for (let w = 2 ** 15; w >= 1; w /= 2) {
      if (n & w) parts.push(w);
    }
    return parts.join(' + ');
  }

  /** Все числа с одним инвертированным битом — самые правдоподобные ошибки */
  const flips = (n, bits) => Array.from({ length: bits }, (_, i) => n ^ (1 << i));
  const reverseBits = (n, bits) => parseInt(toBin(n, bits).split('').reverse().join(''), 2);

  /**
   * Собирает 4 уникальных варианта: правильный + 3 дистрактора.
   * candidates — правдоподобные ошибки, fallback — запасной генератор.
   */
  function makeOptions(answer, candidates, fallback, { numeric = false } = {}) {
    const set = new Set([answer]);
    for (const c of shuffle([...candidates])) {
      if (set.size === 4) break;
      set.add(c);
    }
    let guard = 0;
    while (set.size < 4 && guard < 200) {
      set.add(fallback());
      guard += 1;
    }
    const list = [...set];
    return numeric ? list.sort((a, b) => Number(a) - Number(b)) : shuffle(list);
  }

  const inRange = (bits) => (x) => Number.isInteger(x) && x >= 0 && x <= maxFor(bits);

  // ---- Генераторы ------------------------------------------------------

  function bin2dec(bits) {
    const max = maxFor(bits);
    const n = rnd(Math.max(2, 2 ** (bits - 2)), max);
    const candidates = [...flips(n, bits), reverseBits(n, bits), n + 1, n - 1, n + 2, n - 2]
      .filter((x) => x !== n && x >= 0)
      .map(String);

    return {
      type: 'bin2dec',
      params: { bits, weights: weights(bits) },
      value: toBin(n, bits),
      answer: String(n),
      options: makeOptions(String(n), candidates, () => String(rnd(0, max)), { numeric: true }),
      explain: `${toBin(n, bits)} = ${breakdown(n)} = ${n}`,
    };
  }

  function dec2bin(bits) {
    const max = maxFor(bits);
    const n = rnd(Math.max(2, 2 ** (bits - 2)), max);
    const answer = toBin(n, bits);
    const candidates = [...flips(n, bits), reverseBits(n, bits), n + 1, n - 1]
      .filter((x) => x !== n && inRange(bits)(x))
      .map((x) => toBin(x, bits));

    return {
      type: 'dec2bin',
      params: { bits },
      value: String(n),
      answer,
      options: makeOptions(answer, candidates, () => toBin(rnd(0, max), bits)),
      explain: `${n} = ${breakdown(n)} → ${answer}`,
    };
  }

  function bitWeight(bits) {
    const k = rnd(1, bits - 1);
    const answer = String(2 ** k);
    const candidates = [2 ** (k + 1), 2 ** (k - 1), k, k * 2, k + 1, 2 ** k - 1]
      .filter((x) => x !== 2 ** k && x > 0)
      .map(String);

    return {
      type: 'bitWeight',
      params: { k },
      value: '',
      answer,
      options: makeOptions(answer, candidates, () => String(2 ** rnd(0, bits)), { numeric: true }),
      explain: `2^${k} = ${answer}`,
    };
  }

  function maxValue(bits) {
    const n = rnd(Math.max(3, bits - 2), bits);
    const right = 2 ** n - 1;
    const candidates = [2 ** n, 2 ** (n - 1), 2 ** (n - 1) - 1, 2 ** n + 1, n * 2]
      .filter((x) => x !== right)
      .map(String);

    return {
      type: 'maxValue',
      params: { n },
      value: '',
      answer: String(right),
      options: makeOptions(String(right), candidates, () => String(rnd(1, 2 ** (n + 1))), { numeric: true }),
      explain: `${'1'.repeat(n)} = 2^${n} − 1 = ${right}`,
    };
  }

  function addition(bits) {
    const max = maxFor(bits);
    const a = rnd(1, max - 1);
    const b = rnd(1, max - a);
    const sum = a + b;
    const answer = toBin(sum, bits);
    const candidates = [a | b, a ^ b, sum + 1, sum - 1, ...flips(sum, bits)]
      .filter((x) => x !== sum && inRange(bits)(x))
      .map((x) => toBin(x, bits));

    return {
      type: 'addition',
      params: { bits },
      value: `${toBin(a, bits)} + ${toBin(b, bits)}`,
      answer,
      options: makeOptions(answer, candidates, () => toBin(rnd(0, max), bits)),
      explain: `${a} + ${b} = ${sum} → ${answer}`,
    };
  }

  /** Разрядность растёт каждые 4 раунда: 4 → 5 → 6 → 7 → 8 бит */
  const bitsForRound = (round) => Math.min(8, 4 + Math.floor((round - 1) / 4));

  /** Раунд из 5 вопросов разных типов в случайном порядке */
  function buildRound(bits) {
    const generators = [bin2dec, dec2bin, addition, pick([bitWeight, maxValue]), pick([bin2dec, dec2bin])];
    return shuffle(generators).map((gen) => gen(bits));
  }

  /** Случайная карточка для режима «Карточки» */
  function randomCard() {
    return pick([bin2dec, dec2bin])(pick([4, 5, 6, 8]));
  }

  return { rnd, toBin, breakdown, maxFor, bitsForRound, buildRound, randomCard };
})();
