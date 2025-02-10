import { cardinal, ordinal } from "./helpers";

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

/** t[i] is a timestamp. Use 9 timestamps availables (1..9) */
const t = new Array(10).fill().map(() => performance.now());

/** reset[i] () resets the timer t[i] */
const reset = new Array(10).fill().map((e, i) => () => {
  t[i] = performance.now();
});

/** elapsed[i] () returns the time elapsed since the t[i] timestamp */
const elapsed = new Array(10)
  .fill()
  .map((e, i) => () => performance.now - t[i]);

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
  console.log(ans);
};

let msg = "";
let nstrike = 0;
let nfalse = 0;
let ncorrect = 0;

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
  //   if(nstrike>=required & mode=="user",
  //     msg = "";
  //     mode = "menu";
  //     javascript("hide([1,2,3]); show([3,4,5]); movecenter([3,4,5]);");
  //   );

  //   reset9();
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

const restart = () => {};

const nextlevel = () => {};

const usecomputer = () => {};

const getX = () => {};

/** For each parameter vector x, return whether
 * button1 has the correct answer (false), or
 * button2 has the correct answer (true).
 */
const answer = (x) => {
  let ans;
  if (level === 1) {
    //   ans = (|x_[1,2,3]-hue(0)|<.1);
  }

  if (level === 2) {
    //   ans = ((x_1-x_3)>0);
  }

  if (level === 3) {
    //   randomint = x_1*8;
    //   ans = mod(randomint,2)==1;
  }
  return ans;
};

/** Draw the case given by parameters x
 * @param x parameters of the case
 */
const drawIt = (x) => {};

document.getElementById("button1").onclick = () => click(false);
document.getElementById("button2").onclick = () => click(true);
document.getElementById("button3").onclick = restart;
document.getElementById("button4").onclick = nextlevel;
document.getElementById("button5").onclick = usecomputer;
