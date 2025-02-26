import { ordinal, cardinal } from "./helpers.ts";
import {
  setButtonLabels,
  hide,
  show,
  movecenter,
  moveright,
} from "./ui-helpers.ts";
import { Network } from "./network.ts";
import type { Level } from "./levels.ts";

class App {
  nstrike: number;
  nfalse: number;
  ncorrect: number;
  required: number;
  mode: "user" | "computer" | "menu";
  level: number;
  levels: Level[];

  net: Network;
  guesser: number;

  mainCanvas: HTMLCanvasElement;

  constructor(levels: Level[]) {
    this.levels = levels;
    this.mainCanvas = document.getElementById(
      "mainCanvas"
    ) as HTMLCanvasElement;

    // State
    this.nstrike = 0;
    this.nfalse = 0;
    this.ncorrect = 0;
    this.required = 4; //TO DO: this parameter should be passed by url
    this.mode = "user"; // "menu" || "user" || "computer"
    this.level = 1; // 1 || 2 || 3   //TO DO: this parameter should be passed by url

    this.levels.forEach((lev) => {
      lev.network = new Network(lev, this);
    });

    // this.net = new Network(this.levels, this);
    this.setLevel(1);

    document.getElementById("button1")!.onclick = () => this.click(0);
    document.getElementById("button2")!.onclick = () => this.click(1);
    document.getElementById("button3")!.onclick = () => this.restartLevel();
    document.getElementById("button4")!.onclick = () => this.nextlevel();
    document.getElementById("button5")!.onclick = () =>
      this.setMode("computer");
  }

  /** Handler for the click event on button1 and button2.*/
  click(ans: number) {
    hide("button1", "button2");
    const x = this.getX(performance.now() / 1000);
    this.answer(x) === ans ? this.correct() : this.incorrect();
    show("result");
    setTimeout(() => {
      hide("result");
      if (this.mode === "user") show("button1", "button2");
    }, 1000);
  }

  /** Handle a correct answer */
  correct() {
    this.ncorrect += 1;
    this.nstrike += 1;
    this.updateInfoLevel();

    if (this.mode === "user") {
      //   playsin(440*2^(nstrike/12), damp->4, line->2, amp->.2);
      const emojis = ["😃", "😄", "😀", "😁", "🙃", "😊", "🤗"];
      let msg =
        "your answer was correct " + emojis[Math.floor(5 * Math.random())];

      if (this.nstrike > 1) {
        msg = msg.concat(
          ` (${ordinal(this.nstrike)} time) <br>
          Can you make ${cardinal(this.required)} correct guesses in a row?`
        );
      }

      if (this.nstrike >= this.required && this.mode === "user") {
        msg = "";
        this.setMode("menu");
      }

      document.getElementById("result")!.innerHTML = msg;
    }
  }

  /** Handle an incorrect answer */
  incorrect() {
    this.nfalse += 1;
    this.nstrike = 0;
    this.updateInfoLevel();

    if (this.mode === "user") {
      //   playsin(440*2^(-5/12), damp->4, line->2, amp->.1);
      const emojis = ["😢", "🙄", "😕", "😮", "😞"];
      const msg =
        "your answer was not correct " + emojis[Math.floor(5 * Math.random())];
      document.getElementById("result")!.innerHTML = msg;
    }
  }

  restartLevel() {
    this.setMode("user");
    this.setLevel(this.level);
    this.resetStats();
    this.updateInfoLevel();
  }

  setMode(m: "user" | "computer" | "menu") {
    this.mode = m;
    if (m === "menu") {
      hide("button1", "button2", "button3", "cImgContainer", "infoLevel");
      show("button3", "button4", "button5");
      movecenter("button3", "button4", "button5");

      this.levels[this.level].network!.stop();
    }

    if (m === "user") {
      hide("button3", "button4", "button5", "cImgContainer");
      show("button1", "button2", "infoLevel");

      this.levels[this.level].network!.stop();
    }

    if (m === "computer") {
      hide("button1", "button2", "button5");
      show("button3", "button4", "cImgContainer", "infoLevel");
      moveright("button3", "button4");

      this.levels[this.level].network!.resetWeights();
      this.levels[this.level].network!.resethistory();

      this.levels[this.level].network!.run();
    }
  }

  setLevel(l: number) {
    this.level = l;

    setButtonLabels(this.levels[this.level].yLabels);
    this.resetStats();
    this.updateInfoLevel();
    this.levels[l].network!.resethistory();
  }

  updateInfoLevel() {
    document.getElementById("levelLabel")!.innerHTML = String(this.level);
    document.getElementById("correctLabel")!.innerHTML = String(this.ncorrect);
    document.getElementById("incorrectLabel")!.innerHTML = String(this.nfalse);
    document.getElementById("correctRowLabel")!.innerHTML = String(
      this.nstrike
    ).concat(this.mode === "user" ? `/${this.required}` : ``);
  }

  resetStats() {
    this.ncorrect = 0;
    this.nfalse = 0;
    this.nstrike = 0;
  }

  nextlevel() {
    this.level = (this.level % 3) + 1;
    this.setMode("user");
    this.setLevel(this.level);
  }

  /** Get a new data point */
  getX(seed: number) {
    return this.levels[this.level].getX(seed);
  }

  /** For each parameter vector x, return
   * the index of the true answer in yLabels */
  answer(x) {
    return this.levels[this.level].answer(x);
  }

  /** Draw the case given by parameters x
   * @param cnv canvas to draw on
   * @param x parameters of the case */
  drawIt(cnv: HTMLCanvasElement, x: number[]) {
    return this.levels[this.level].draw(cnv, x);
  }

  animate() {
    const mainAnimation = () => {
      if (this.mode === "user")
        this.drawIt(this.mainCanvas, this.getX(performance.now() / 1000));
      if (this.mode === "menu")
        this.drawIt(this.mainCanvas, this.getX(performance.now() / 1000));
      if (this.mode === "computer")
        this.levels[this.level].network!.drawNetwork();
      requestAnimationFrame(mainAnimation);
    };
    mainAnimation();
  }
}

export { App };
