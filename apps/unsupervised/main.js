import {
  ordinal,
  cardinal,
  setButtonLabels,
  hide,
  show,
  movecenter,
  moveright,
  gaussianRandom,
  hslToRgb,
  distVec,
  updateInfoLevel,
} from "./helpers.js";

import {
  answerLevel1,
  answerLevel2,
  answerLevel3,
  drawLevel1,
  drawLevel2,
  drawLevel3,
  getXLevel1,
  getXLevel2,
  getXLevel3,
  labelsXLevel1,
  labelsXLevel2,
  labelsXLevel3,
  labelsYLevel1,
  labelsYLevel2,
  labelsYLevel3,
} from "./levels.js";

import { drawNetwork } from "./network.js";

import { train, predict, getWeights, resetWeights } from "./tf-helpers.js";

const mainCanvas = document.getElementById("mainCanvas");

let msg = "";
let nstrike = 0;
let nfalse = 0;
let ncorrect = 0;
let required = 4; //TO DO: this parameter should be passed by url
let mode = "user"; // "menu" || "user" || "computer"
let level = 3; // 1 || 2 || 3   //TO DO: this parameter should be passed by url
let xLabels = [];
let yLabels = [];
let computing = false;

// Neural Network (nn)
/** Number of neurons on each layer */
const N = [4, 6, 2];

/** Weights & biases */
const W = [
  new Array(N[0]).fill().map(() => new Array(N[1]).fill(0)), // Matrix connecting layer 0 and 1
  new Array(N[1]).fill(0), // Weights of layer 1
  new Array(N[1]).fill().map(() => new Array(N[2]).fill(0)), // Matrix connecting layer 1 and 2
  new Array(N[2]).fill(0), // Weights of layer 2
];

/**Timers */
// tN() = time since tN, in seconds
// resetN() resets the variable tN to current time.
// tN is initialised to current time (for all N)

/** t[i] is a timestamp. Use 9 timestamps availables (1..9)
 * tN in the original code.
 */
const t = new Array(10).fill().map(() => performance.now());

let lt0 = t[0];
let lt3 = t[3];

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
  hide([1, 2]);
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
    msg =
      msg +
      ` (${ordinal(nstrike)} time) <br>
      Can you make ${cardinal(required)} correct guesses in a row?`;
  }

  if (nstrike >= required && mode === "user") {
    msg = "";
    mode = "menu";
    hide([1, 2, 3]);
    show([3, 4, 5]);
    movecenter([3, 4, 5]);
  }
  document.getElementById("result").innerHTML = msg;
  reset[9]();
  updateInfoLevel(
    level,
    ncorrect,
    nfalse,
    nstrike.toString().concat(mode === "user" ? `/${required}` : ``)
  );
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
  updateInfoLevel(
    level,
    ncorrect,
    nfalse,
    nstrike.toString().concat(mode === "user" ? `/${required}` : ``)
  );
};

/** Computer guesses, as array of strings.
 *
 * Each string is a label of the computer guess
 * plus a sign "✔" or "✗" depending on whether the
 * guess is correct or not.
 * */
const computerguess = new Array(5).fill("");

/** Array of cImg items */
let cImg = new Array(5).fill(null).map(() => {
  const item = document.createElement("div");
  const cnv = document.createElement("canvas");
  const txt = document.createElement("div");
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
  computerguess.fill("");
  cimgcnt = 0;
  xs = [];
  ys = [];
  cnt = 0;
  resetWeights();
  ncorrect = 0;
  nfalse = 0;
  nstrike = 0;
};

const restart = () => {
  //   resetclock();
  hide([3, 4, 5]);
  show([1, 2]);

  if (level === 1) {
    xLabels = labelsXLevel1;
    yLabels = labelsYLevel1;
  }
  if (level === 2) {
    xLabels = labelsXLevel2;
    yLabels = labelsYLevel2;
  }
  if (level === 3) {
    xLabels = labelsXLevel3;
    yLabels = labelsYLevel3;
  }
  setButtonLabels(yLabels);

  required = 4; //  required = geturlparameter("required", 4);

  lt3 = elapsed[3]();
  ncorrect = 0;
  nfalse = 0;
  nstrike = 0;
  reset[0]();
  reset[1]();
  reset[2]();
  reset[9]();
  msg = "";
  mode = "user";
};

const nextlevel = () => {
  level = (level % 3) + 1;
  resethistory();
  restart();
};

const usecomputer = () => {
  hide([1, 2, 5]);
  show([3, 4]);
  moveright([3, 4]);
  resethistory();
  //required = 8;
  reset[7]();
  reset[8]();
  reset[9]();
  mode = "computer";
};

const L3Data = {
  timer: elapsed[0],
  lastTimer: t[0],
  randomint: 3,
  dir: gaussianRandom(),
};

/** Get a new data point */
const getX = () => {
  if (level === 1) return getXLevel1(elapsed[0]);
  if (level === 2) return getXLevel2(elapsed[3]);
  if (level === 3) return getXLevel3(L3Data);
};

/** For each parameter vector x, return whether
 * button1 has the correct answer (false), or
 * button2 has the correct answer (true).
 */
const answer = (x) => {
  if (level === 1) return answerLevel1(x);
  if (level === 2) return answerLevel2(x);
  if (level === 3) return answerLevel3(x);
};

/** Draw the case given by parameters x
 * @param x parameters of the case
 */
const drawIt = (cnv, x) => {
  if (level === 1) drawLevel1(cnv, x);
  if (level === 2) drawLevel2(cnv, x);
  if (level === 3) drawLevel3(cnv, x);
};

resethistory();
restart();
mode = "computer";

document.getElementById("button1").onclick = () => click(false);
document.getElementById("button2").onclick = () => click(true);
document.getElementById("button3").onclick = restart;
document.getElementById("button4").onclick = nextlevel;
document.getElementById("button5").onclick = usecomputer;

updateInfoLevel(
  level,
  ncorrect,
  nfalse,
  nstrike.toString().concat(mode === "user" ? `/${required}` : ``)
);

const mainAnimation = () => {
  if (mode === "user") {
    drawIt(mainCanvas, getX());

    if (elapsed[9]() < 2) {
      const a = (2 - elapsed[9]()) / 2;
      document.getElementById("result").style.opacity = a;
    }

    if (elapsed[9]() > 1) show([1, 2]);
  }

  if (mode === "menu") {
    drawIt(mainCanvas, getX());
  }

  if (mode === "computer") {
    drawNetwork(N, W, xLabels, yLabels);

    if (elapsed[7]() > 1) {
      cimgcnt = (cimgcnt + 1) % 5;
      const x = generateRandomX();

      console.log(x);
      drawIt(cImg[cimgcnt].cnv, x);
      cImg[cimgcnt].txt.innerHTML = "aaaa";

      reset[7]();
    }
    // //generate new random image
  }

  requestAnimationFrame(mainAnimation);
};

mainAnimation();
