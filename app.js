'use strict';

const ROUNDS = 20;
const PER_ROUND = 5;
const STORAGE_KEY = 'binary-trainer:v1';

const $ = (selector) => document.querySelector(selector);
const { t } = I18N;

// ---- Хранилище (может быть недоступно в приватном режиме) -------------

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveState(patch) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...loadState(), ...patch }));
  } catch {
    /* без сохранения тоже работает */
  }
}

// ---- Вкладки и язык -------------------------------------------------------

document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((item) => {
      const active = item === tab;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-selected', String(active));
      $(`#tab-${item.dataset.tab}`).hidden = !active;
    });
  });
});

$('#lang-switch').addEventListener('click', (event) => {
  const btn = event.target.closest('[data-lang]');
  if (btn) I18N.setLang(btn.dataset.lang);
});

// ---- Квиз -----------------------------------------------------------------

const saved = loadState();
const quiz = {
  round: Math.min(Math.max(saved.round || 1, 1), ROUNDS),
  total: saved.total || 0,
  best: saved.best || 0,
  index: 0,
  view: 'question', // 'question' | 'summary'
  questions: [],
  picked: [],
};

const isCorrect = (i) => quiz.picked[i] !== null && quiz.questions[i].options[quiz.picked[i]] === quiz.questions[i].answer;
const roundScore = () => quiz.questions.filter((_, i) => isCorrect(i)).length;

function startRound() {
  quiz.questions = Q.buildRound(Q.bitsForRound(quiz.round));
  quiz.picked = Array(PER_ROUND).fill(null);
  quiz.index = 0;
  quiz.view = 'question';
  saveState({ round: quiz.round, total: quiz.total });
  renderQuiz();
}

function renderQuestion() {
  const q = quiz.questions[quiz.index];
  const text = I18N.question(q);
  const picked = quiz.picked[quiz.index];
  const answered = picked !== null;

  const options = q.options.map((opt, i) => {
    let cls = '';
    if (answered && opt === q.answer) cls = 'is-correct';
    else if (answered && i === picked) cls = 'is-wrong';
    return `
      <li>
        <button class="option ${cls}" type="button" data-option="${i}" ${answered ? 'disabled' : ''}>
          <span class="option__radio" aria-hidden="true"></span>
          <span>${opt}</span>
        </button>
      </li>`;
  }).join('');

  const feedback = answered
    ? `<p class="feedback ${isCorrect(quiz.index) ? 'is-ok' : 'is-bad'}">
         ${isCorrect(quiz.index) ? t('quiz.correct') : t('quiz.wrong')} <code>${q.explain}</code>
       </p>`
    : '';

  // Сохраняем раскрытость подсказки при смене языка
  const hintOpen = $('#quiz-body .hint')?.open && $('#quiz-body').dataset.q === String(quiz.index);
  $('#quiz-body').dataset.q = String(quiz.index);

  $('#quiz-body').innerHTML = `
    <p class="q-kind">${text.kind}</p>
    <h2 class="q-title">${text.prompt} ${q.value ? `<code class="q-value">${q.value}</code>` : ''}</h2>
    <ul class="options">${options}</ul>
    <details class="hint" ${hintOpen ? 'open' : ''}><summary>${t('quiz.hint')}</summary><p>${text.hint}</p></details>
    ${feedback}`;
}

function renderSummary() {
  const score = roundScore();
  const last = quiz.round === ROUNDS;
  const text = last
    ? t('quiz.finishText', ROUNDS, quiz.total, ROUNDS * PER_ROUND, quiz.best)
    : t('quiz.summaryText', quiz.round, ROUNDS, t('bits', Q.bitsForRound(quiz.round + 1)));

  $('#quiz-body').dataset.q = '';
  $('#quiz-body').innerHTML = `
    <div class="summary">
      <p class="q-kind">${last ? t('quiz.finishTitle') : t('quiz.summaryTitle')}</p>
      <p class="summary__score">${score} / ${PER_ROUND}</p>
      <p class="summary__text">${text}</p>
      <button class="btn btn--primary" type="button" id="quiz-continue">
        ${last ? t('quiz.restart') : t('quiz.nextRound')}
      </button>
    </div>`;
}

function renderDots() {
  const firstOpen = quiz.picked.indexOf(null);
  $('#quiz-dots').innerHTML = quiz.questions.map((_, i) => {
    const answered = quiz.picked[i] !== null;
    const classes = ['dot'];
    if (answered) classes.push(isCorrect(i) ? 'is-ok' : 'is-bad');
    if (quiz.view === 'question' && i === quiz.index) classes.push('is-current');
    const reachable = answered || i === firstOpen;
    return `<button class="${classes.join(' ')}" type="button" data-dot="${i}" ${reachable ? '' : 'disabled'}>${i + 1}</button>`;
  }).join('');
}

function renderQuiz() {
  $('#quiz-round').textContent = t('quiz.round', quiz.round, ROUNDS, t('bits', Q.bitsForRound(quiz.round)));
  $('#quiz-score').textContent = t('quiz.score', quiz.total);

  if (quiz.view === 'summary') renderSummary();
  else renderQuestion();

  renderDots();
  const next = $('#quiz-next');
  next.hidden = quiz.view === 'summary';
  next.disabled = quiz.picked[quiz.index] === null;
  const toSummary = quiz.picked.every((p) => p !== null) || quiz.index === PER_ROUND - 1;
  next.textContent = toSummary ? t('quiz.toSummary') : t('quiz.next');
}

$('#quiz-body').addEventListener('click', (event) => {
  const option = event.target.closest('[data-option]');
  if (option && quiz.picked[quiz.index] === null) {
    quiz.picked[quiz.index] = Number(option.dataset.option);
    if (isCorrect(quiz.index)) quiz.total += 1;
    renderQuiz();
    return;
  }

  if (event.target.closest('#quiz-continue')) {
    if (quiz.round === ROUNDS) {
      quiz.round = 1;
      quiz.total = 0;
    } else {
      quiz.round += 1;
    }
    startRound();
  }
});

$('#quiz-next').addEventListener('click', () => {
  const firstOpen = quiz.picked.indexOf(null);
  if (firstOpen === -1) {
    quiz.view = 'summary';
    if (quiz.round === ROUNDS) {
      quiz.best = Math.max(quiz.best, quiz.total);
      saveState({ best: quiz.best });
    }
    saveState({ total: quiz.total });
  } else {
    quiz.index = firstOpen > quiz.index ? firstOpen : quiz.index + 1;
  }
  renderQuiz();
});

$('#quiz-dots').addEventListener('click', (event) => {
  const dot = event.target.closest('[data-dot]');
  if (!dot) return;
  quiz.index = Number(dot.dataset.dot);
  quiz.view = 'question';
  renderQuiz();
});

$('#quiz-reset').addEventListener('click', () => {
  if (!confirm(t('quiz.resetConfirm'))) return;
  quiz.round = 1;
  quiz.total = 0;
  startRound();
});

// Выбор ответа с клавиатуры: 1–4, Enter — дальше
document.addEventListener('keydown', (event) => {
  if ($('#tab-quiz').hidden || quiz.view !== 'question') return;
  if (event.target.closest('input, textarea')) return;
  const n = Number(event.key);
  if (n >= 1 && n <= 4) {
    $(`[data-option="${n - 1}"]`)?.click();
  } else if (event.key === 'Enter' && !$('#quiz-next').disabled && !event.target.closest('button')) {
    $('#quiz-next').click();
  }
});

// ---- Карточки ---------------------------------------------------------

const cards = { card: null, known: 0, again: 0 };

function renderCard() {
  const c = cards.card;
  $('#card-front').innerHTML = `
    <span class="card-label">${I18N.question(c).prompt}</span>
    <span class="card-value">${c.value}</span>`;
  $('#card-back').innerHTML = `
    <span class="card-label">${t('cards.answer')}</span>
    <span class="card-value">${c.answer}</span>
    <span class="card-explain">${c.explain}</span>`;
  $('#cards-stats').textContent = t('cards.stats', cards.known, cards.again);
}

function nextCard() {
  cards.card = Q.randomCard();
  $('#card').classList.remove('is-flipped');
  renderCard();
}

$('#card').addEventListener('click', () => $('#card').classList.toggle('is-flipped'));
$('#card-known').addEventListener('click', () => { cards.known += 1; nextCard(); });
$('#card-again').addEventListener('click', () => { cards.again += 1; nextCard(); });

// ---- Биты ---------------------------------------------------------------

const board = { bits: 8, value: 0, target: null };

function renderBoard() {
  const { bits, value, target } = board;
  const el = $('#board');
  el.style.setProperty('--cols', bits);
  el.innerHTML = Array.from({ length: bits }, (_, idx) => {
    const pos = bits - 1 - idx;
    const on = (value >> pos) & 1;
    return `
      <div class="bit">
        <span class="bit__weight">${2 ** pos}</span>
        <button class="bit__cell ${on ? 'is-on' : ''}" type="button" data-pos="${pos}"
          aria-pressed="${Boolean(on)}" aria-label="${t('board.bitLabel', 2 ** pos)}">${on}</button>
      </div>`;
  }).join('');

  $('#out-bin').textContent = Q.toBin(value, bits);
  $('#out-dec').textContent = String(value);
  $('#out-sum').textContent = Q.breakdown(value);

  const feedback = $('#bits-feedback');
  $('#bits-task').textContent = target === null ? '' : t('board.task', target);
  if (target !== null && value === target) {
    feedback.hidden = false;
    feedback.className = 'feedback is-ok';
    feedback.textContent = t('board.done', target, Q.breakdown(target));
  } else {
    feedback.hidden = true;
  }

  document.querySelectorAll('[data-bits]').forEach((b) => {
    const n = Number(b.dataset.bits);
    b.classList.toggle('is-active', n === bits);
    b.textContent = t('bits', n);
  });
}

$('#board').addEventListener('click', (event) => {
  const cell = event.target.closest('[data-pos]');
  if (!cell) return;
  board.value ^= 1 << Number(cell.dataset.pos);
  renderBoard();
});

$('#bits-size').addEventListener('click', (event) => {
  const btn = event.target.closest('[data-bits]');
  if (!btn) return;
  board.bits = Number(btn.dataset.bits);
  board.value = 0;
  board.target = null;
  renderBoard();
});

$('#bits-clear').addEventListener('click', () => { board.value = 0; renderBoard(); });

$('#bits-random').addEventListener('click', () => {
  board.target = null;
  board.value = Q.rnd(1, Q.maxFor(board.bits));
  renderBoard();
});

$('#bits-target').addEventListener('click', () => {
  board.value = 0;
  board.target = Q.rnd(1, Q.maxFor(board.bits));
  renderBoard();
});

// ---- Старт ----------------------------------------------------------------

I18N.applyStatic();
startRound();
nextCard();
renderBoard();

// При смене языка перерисовываем текущее состояние, не создавая новых вопросов
I18N.onChange(() => {
  renderQuiz();
  renderCard();
  renderBoard();
});
