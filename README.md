# Binary Trainer

A browser-based trainer for the binary number system. No build step and no dependencies: plain HTML, CSS and JS.

Live demo: https://azeke97.github.io/binary-trainer/ (available once GitHub Pages is enabled).

## Modes

- **Quiz** — 20 rounds of 5 questions. Questions are generated randomly and come in mixed order:
  - binary → decimal;
  - decimal → binary;
  - binary addition;
  - place value of a bit;
  - largest number that fits in N bits.

  Difficulty grows as you go: rounds 1–4 use 4 bits, 5–8 use 5 bits … 17–20 use 8 bits.
  Wrong options are based on common mistakes: a single flipped bit, reversed bit order, ±1, OR/XOR instead of addition.
  Every question has a hint and a worked explanation. Progress and the best score are saved in `localStorage`.
  Keyboard: `1`–`4` pick an answer, `Enter` goes to the next question.
- **Flashcards** — an endless stream of random cards. Click a card to reveal the answer and the explanation.
- **Bits** — a 4- or 8-bit toggler that shows the binary and decimal value and the breakdown into powers of two. The “Challenge” mode asks you to build a given number.

## Languages

The interface is available in Russian and English; the RU / EN switch is in the header. Your choice is saved. On the first visit the language is taken from the browser settings. If you switch the language mid-round, the current questions and answers stay the same — only the text changes.

All texts live in `i18n.js`. To add a language, copy the `en` block, translate the strings, then add the language code to `LANGS` and a button to `#lang-switch`.

## Running locally

Open `index.html` in a browser or start any static server:

```bash
python3 -m http.server 8000
```

## Publishing on GitHub Pages

1. Push the repository to GitHub.
2. Open Settings → Pages → Source: `Deploy from a branch`, branch `main`, folder `/ (root)`.
3. In about a minute the site will be available at `https://<username>.github.io/<repo>/`.

## Project structure

| File | Contents |
| --- | --- |
| `index.html` | markup for the three tabs |
| `style.css` | styles, dark and light theme (follows the system setting) |
| `i18n.js` | RU / EN dictionaries and language switching |
| `questions.js` | question generators and wrong-option selection |
| `app.js` | logic for the quiz, flashcards and bit toggler |

To add a new question type:
1. Write a generator in `questions.js`. It must return `{ type, params, value, answer, options, explain }`.
2. Add the generator to `buildRound`.
3. Add the `q.<type>.kind`, `prompt` and `hint` texts for both languages in `i18n.js`.

## License

MIT
