import {
  ordinal,
  cardinal,
  setButtonLabels,
  hide,
  show,
  movecenter,
  moveright,
  gaussianRandom,
  updateInfoLevel,
} from "./helpers.js";

import { level1, level2, level3 } from "./levels.js";

import { drawNetwork } from "./network.js";

import { train, predict, getWeights, resetWeights } from "./tf-helpers.js";

const mainCanvas = document.getElementById("mainCanvas");

// const state = {
//   mode: "user",
//   level: 1,
//   nstrike: 0,
//   ncorrect: 0,
//   nfalse: 0,
//   required: 4,
// };

let msg = "";
let nstrike = 0;
let nfalse = 0;
let ncorrect = 0;
let required = 4; //TO DO: this parameter should be passed by url
let mode = "user"; // "menu" || "user" || "computer"
let level = 1; // 1 || 2 || 3   //TO DO: this parameter should be passed by url
let xLabels = [];
let yLabels = [];
let computing = false;
let guesser;

/* Neural Network (nn) */

/** Number of neurons on each layer */
const N = [4, 6, 2];

/** Weights & biases */
let W = [
  new Array(N[0]).fill().map(() => new Array(N[1]).fill(0)), // Matrix connecting layer 0 and 1
  new Array(N[1]).fill(0), // Weights of layer 1
  new Array(N[1]).fill().map(() => new Array(N[2]).fill(0)), // Matrix connecting layer 1 and 2
  new Array(N[2]).fill(0), // Weights of layer 2
];

window.W = W;

/* Timers */

// tN() = time since tN, in seconds
// resetN() resets the variable tN to current time.
// tN is initialised to current time (for all N)

/** t[i] is a timestamp. Use 9 timestamps availables (1..9)
 * tN in the original code.
 */
const t = new Array(10).fill().map(() => performance.now());

/** reset[i] () resets the timer t[i] */
const reset = new Array(10).fill().map((e, i) => () => {
  t[i] = performance.now();
});

/** elapsed[i] () returns the time in seconds elapsed since the t[i] timestamp.
 * tN() in the original code.
 */
const elapsed = new Array(10)
  .fill()
  .map((e, i) => () => (performance.now() - t[i]) / 1000);

/** Set the timers to random values and get new input X */
const generateRandomX = () => {
  t[0] = 1000 * Math.random();
  t[1] = 500 * Math.random();
  t[2] = 1000 * Math.random();
  t[3] = 500 * Math.random();
  t[4] = 500 * Math.random();
  t[5] = 500 * Math.random();
  return getX();
};

/** Handler for the click event on button1 and button2.
 * @param ans boolean which is false for button1 and true for button2
 */
const click = (ans) => {
  console.log("click:", ans);
  if (elapsed[9]() > 1) {
    const x = getX();
    console.log("x:", x);
    console.log("answer:", answer(x));
    answer(x) === ans ? correct() : incorrect();
  }
  hide("button1", "button2");
  reset[9]();
};

/** Handle a correct answer */
const correct = () => {
  ncorrect += 1;
  nstrike += 1;
  // if(mode=="user",
  //   playsin(440*2^(nstrike/12), damp->4, line->2, amp->.2);
  // );
  const emojis = ["😃", "😄", "😀", "😁", "🙃", "😊", "🤗"];
  msg = "your answer was correct " + emojis[Math.floor(5 * Math.random())];

  if (nstrike > 1) {
    msg = msg.concat(
      ` (${ordinal(nstrike)} time) <br>
      Can you make ${cardinal(required)} correct guesses in a row?`
    );
  }

  if (nstrike >= required && mode === "user") {
    msg = "";
    setMode("menu");
  }

  document.getElementById("result").innerHTML = msg;
  updateInfoLevel({ mode, level, ncorrect, nfalse, nstrike, required });
  reset[9]();
};

/** Handle an incorrect answer */
const incorrect = () => {
  const emojis = ["😢", "🙄", "😕", "😮", "😞"];
  msg = "your answer was not correct " + emojis[Math.floor(5 * Math.random())];
  // if(mode=="user",
  //   playsin(440*2^(-5/12), damp->4, line->2, amp->.1);
  // );
  document.getElementById("result").innerHTML = msg;

  nstrike = 0;
  nfalse += 1;
  updateInfoLevel({ mode, level, ncorrect, nfalse, nstrike, required });
};

/** Array of cImg items.
 * The last five data points in the computer-generated
 * data are displayed.
 */
let cImg = new Array(5).fill(null).map(() => {
  const item = document.createElement("div"); // item container
  const cnv = document.createElement("canvas"); // image
  const txt = document.createElement("div"); // label (guess option plus a sign "✔" or "✗")
  cnv.width = 800;
  cnv.height = 500;
  item.classList = "cImgItem";
  item.appendChild(cnv);
  item.appendChild(txt);
  document.getElementById("cImgContainer").appendChild(item);
  return { cnv: cnv, txt: txt };
});

//training data
let xs = [];
let ys = [];

let cimgcnt = 0;
let cnt = 0;

/** Reset Neural Network and history of saved observations */
const resethistory = () => {
  cimgcnt = 0;
  xs = [];
  ys = [];
  cnt = 0;
  resetWeights();
  resetStats();
};

const restartLevel = () => {
  //   resetclock();
  setMode("user");
  setLevel(level);

  resetStats();
  reset[0]();
  reset[1]();
  reset[2]();
  reset[9]();
  msg = "";

  updateInfoLevel({ mode, level, ncorrect, nfalse, nstrike, required });
};

/** Get a new data point */
const getX = () => {
  if (level === 1) return level1.getX();
  if (level === 2) return level2.getX();
  if (level === 3) return level3.getX();
};

/** For each parameter vector x, return
 * the index of the true answer in yLabels
 */
const answer = (x) => {
  if (level === 1) return level1.answer(x);
  if (level === 2) return level2.answer(x);
  if (level === 3) return level3.answer(x);
};

/** Draw the case given by parameters x
 * @param x parameters of the case
 */
const drawIt = (cnv, x) => {
  if (level === 1) level1.draw(cnv, x);
  if (level === 2) level2.draw(cnv, x);
  if (level === 3) level3.draw(cnv, x);
};

const makeComputerGuess = () => {
  cimgcnt = (cimgcnt + 1) % 5;

  // generate a new datum
  const x = generateRandomX();

  //make some guess for the datum based on nn
  predict([x]).then((ans) => {
    // then draw that guess
    const y = ans[0];

    const guess = y[0] > 0.5 ? 0 : 1;
    let guessLabel = guess === 0 ? yLabels[0] : yLabels[1];

    if (guess === answer(x)) {
      guessLabel = guessLabel.concat(` ✔`);
      correct();
    } else {
      guessLabel = guessLabel.concat(` ✗`);
      incorrect();
    }

    drawIt(cImg[cimgcnt].cnv, x);
    cImg[cimgcnt].txt.innerHTML = guessLabel;

    // and add the datum to the training data
    xs.push(x);
    ys.push(answer(x) === 0 ? [1, 0] : [0, 1]);

    // if model is not getting better, restart it
    cnt += 1;
    if (cnt > 20 && nstrike < 4) {
      resetWeights();
      cnt = 0;
    }

    // cut away too old answers
    if (xs.length > 32) {
      xs.shift();
      ys.shift();
    }

    // resetWeights();
    // getWeights().then((d) => {
    //   W = d;
    //   console.log(W);
    // });

    // console.log(W);
    if (!computing && xs.length > 1) {
      computing = true;
      console.log("computing");

      train(xs, ys)
        .then(() => getWeights())
        .then((d) => {
          W = d;
          computing = false;
        });
    }
  });
};

/* UI */

const setMode = (m) => {
  mode = m;
  if (m === "menu") {
    hide("button1", "button2", "button3", "cImgContainer", "infoLevel");
    show("button3", "button4", "button5");
    movecenter("button3", "button4", "button5");

    clearInterval(guesser);
  }

  if (m === "user") {
    hide("button3", "button4", "button5", "cImgContainer");
    show("button1", "button2", "infoLevel");

    clearInterval(guesser);
  }

  if (m === "computer") {
    hide("button1", "button2", "button5");
    show("button3", "button4", "cImgContainer", "infoLevel");
    moveright("button3", "button4");

    resethistory();
    reset[7]();
    reset[8]();
    reset[9]();
    guesser = setInterval(makeComputerGuess, 1000);
  }
};

const setLevel = (l) => {
  level = l;

  if (l === 1) {
    xLabels = level1.xLabels;
    yLabels = level1.yLabels;
  }
  if (l === 2) {
    xLabels = level2.xLabels;
    yLabels = level2.yLabels;
  }
  if (l === 3) {
    xLabels = level3.xLabels;
    yLabels = level3.yLabels;
  }
  setButtonLabels(yLabels);
  resetStats();
  updateInfoLevel({ mode, level, ncorrect, nfalse, nstrike, required });

  resethistory();
};

const resetStats = () => {
  ncorrect = 0;
  nfalse = 0;
  nstrike = 0;
};

const nextlevel = () => {
  level = (level % 3) + 1;
  setMode("user");
  setLevel(level);
};

document.getElementById("button1").onclick = () => click(0);
document.getElementById("button2").onclick = () => click(1);
document.getElementById("button3").onclick = restartLevel;
document.getElementById("button4").onclick = nextlevel;
document.getElementById("button5").onclick = () => setMode("computer");

/* RUN */

resethistory();
restartLevel();
// setMode("computer");

updateInfoLevel({ mode, level, ncorrect, nfalse, nstrike, required });

const mainAnimation = () => {
  if (mode === "user") {
    drawIt(mainCanvas, getX());

    if (elapsed[9]() < 2) {
      const a = (2 - elapsed[9]()) / 2;
      document.getElementById("result").style.opacity = a;
    }

    if (elapsed[9]() > 1) show("button1", "button2");
  }

  if (mode === "menu") {
    drawIt(mainCanvas, getX());
  }

  if (mode === "computer") {
    drawNetwork(N, W, xLabels, yLabels);
  }

  requestAnimationFrame(mainAnimation);
};

mainAnimation();
