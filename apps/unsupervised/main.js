import {
  ordinal,
  cardinal,
  setlabels,
  hide,
  show,
  movecenter,
  moveright,
  gaussianRandom,
  hslToRgb,
  distVec,
} from "./helpers";

let msg = "";
let nstrike = 0;
let nfalse = 0;
let ncorrect = 0;
let required = 4; //TO DO: this parameter should be passed by url
let mode = ""; // "menu" || "user" || "computer"
let level = 1; // 1 || 2 || 3   //TO DO: this parameter should be passed by url

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

/** reset[i] () resets the timer t[i] */
const reset = new Array(10).fill().map((e, i) => () => {
  t[i] = performance.now();
});

/** elapsed[i] () returns the time in seconds elapsed since the t[i] timestamp.
 * tN() in the original code.
 */
const elapsed = new Array(10)
  .fill()
  .map((e, i) => () => 1000 * (performance.now() - t[i]));

/** Set the timers to random values and get new input X */
const generateRandomX = () => {
  t[0] = 1000 * Math.random();
  t[1] = 500 * Math.random();
  t[2] = 1000 * Math.random();
  t[3] = 500 * Math.random();
  t[4] = 500 * Math.random();
  t[5] = 500 * Math.random();
  getX();
};

/** Handler for the click event on button1 and button2.
 * @param ans boolean which is false for button1 and true for button2
 */
const click = (ans) => {
  console.log("click", ans);
  if (elapsed[9]() > 1) {
    x = getX();
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
      `\n(${ordinal(nstrike)} time)
      Can you make ${cardinal(required)} correct guesses in a row?`;
  }

  if (nstrike >= required && mode === "user") {
    msg = "";
    mode = "menu";
    hide([1, 2, 3]);
    show([3, 4, 5]);
    movecenter([3, 4, 5]);
  }

  reset[9]();
};

/** Handle an incorrect answer */
const incorrect = () => {
  const emojis = ["😢", "🙄", "😕", "😮", "😞"];
  msg = "your answer was not correct " + emojis[Math.floor(5 * Math.random())];
  // if(mode=="user",
  //   playsin(440*2^(-5/12), damp->4, line->2, amp->.1);
  // );
  nstrike = 0;
  nfalse += 1;
};

/** Computer guesses, as array of strings.
 *
 * Each string is a label of the computer guess
 * plus a sign "✔" or "✗" depending on whether the
 * guess is correct or not.
 * */
const computerguess = new Array(5).fill("");

/** Array of canvas elements */
let cimg = new Array(5).fill(null);

//training data
const xs = [];
const ys = [];

let cimgcnt = 0;
let cnt = 0;

/** Reset Neural Network and history of saved observations */
const resethistory = () => {
  cimg = cimg.map(() => {
    const cnv = document.createElement("canvas");
    cnv.width = 160;
    cnv.height = 90;
    return cnv;
  });
  computerguess.fill("");
  cimgcnt = 0;
  xs = [];
  ys = [];
  cnt = 0;
  resetweights();
  ncorrect = 0;
  nfalse = 0;
  nstrike = 0;
};

const restart = () => {
  //   resetclock();
  hide([3, 4, 5]);
  show([1, 2]);

  if (level === 1) labels = ["biru", "merah"]; // blue red in Indonesian
  if (level === 2) labels = ["kiri", "kanan"]; // left right in Indonesian
  if (level === 3) labels = ["genap", "gasal"]; // even odd in Indonesian
  setlabels(labels);

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

let randomint = 3;
let dir = gaussianRandom();

const getX = () => {
  let x;
  if (level === 1) {
    const cval = (elapsed[0]() / 2) % 2 > 1 ? 1 : 0; // switch every two seconds from 0 to 1
    const hue = cval * 263.5; // 265.5 deg = 0.73 * 360 deg
    const alpha = (elapsed[0]() / 2) % 1; // alpha ranges from 0 to 1 every two seconds
    x = hslToRgb(hue, 100, 100).concat(alpha);
  }

  if (level === 2) {
    const pt1 = [4 * Math.sin(elapsed[3]() / 2), 4 * Math.cos(elapsed[3]())];
    const pt2 = [4 * Math.sin(elapsed[3]()), 4 * Math.cos(elapsed[3]() / 1.12)];
    x = pt1.concat(pt2);
    // two pairs of coordinates, each one following a Lissajous figure.
  }

  if (level === 3) {
    if (Math.floor(elapsed[0]() / 2) !== Math.floor(lt0 / 2)) {
      // trigger every two seconds
      randomint = 2 + Math.floor(Math.random() * 4); // an integer between 2 and 5 inclusive
      dir = gaussianRandom(); // direction of turning
    }
    lt0 = elapsed[0]();
    x = [
      randomint / 8,
      dir,
      (elapsed[0]() / 2) % 1, // parameter determining radius, rotation speed, and alpha
      (randomint * 0.43 + 0.3) % 1, // parameter determining hue
    ];
  }
  return x;
};

/** For each parameter vector x, return whether
 * button1 has the correct answer (false), or
 * button2 has the correct answer (true).
 */
const answer = (x) => {
  if (level === 1)
    return distVec([x[0], x[1], x[2]], hslToRgb(0, 100, 100)) < 0.1;
  //   ans = (|x_[1,2,3]-hue(0)|<.1);

  if (level === 2) return x[0] - x[2] > 0;
  //   ans = ((x_1-x_3)>0);

  if (level === 3) return (x[0] * 8) % 2 === 1;
  //   randomint = x_1*8;
  //   ans = mod(randomint,2)==1;
};

/** Draw the case given by parameters x
 * @param x parameters of the case
 */
const drawIt = (x) => {};

resethistory();
restart();

document.getElementById("button1").onclick = () => click(false);
document.getElementById("button2").onclick = () => click(true);
document.getElementById("button3").onclick = restart;
document.getElementById("button4").onclick = nextlevel;
document.getElementById("button5").onclick = usecomputer;
