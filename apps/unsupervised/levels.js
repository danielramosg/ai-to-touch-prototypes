import { distVec, hslToRgb, gaussianRandom } from "./helpers.js";

// class Level {
//   xLabels;
//   yLabels;
//   getX;
//   answer; // returns the index of the true answer in labelsYlevelN
//   draw;
// }

/** Level 1.
 *  A circle blue or red
 */
const level1 = {
  epoch: performance.now(),

  timer() {
    return (performance.now() - this.epoch) / 1000;
  },

  xLabels: ["color (red)", "color (green)", "color (blue)", "size"],
  yLabels: ["biru", "merah"], // blue red in Indonesian

  getX() {
    const cval = (this.timer() / 2) % 2 > 1 ? 1 : 0; // switch every two seconds from 0 to 1
    const hue = cval * 263.5; // 265.5 deg = 0.73 * 360 deg
    const a = (this.timer() / 2) % 1; // alpha/size ranges from 0 to 1 every two seconds
    return hslToRgb(hue, 100, 50).concat(a);
  },

  answer(x) {
    return distVec([x[0], x[1], x[2]], hslToRgb(0, 100, 50)) < 0.1 // close to red
      ? 1 // red
      : 0; // blue
  },

  draw(cnv, x) {
    const ctx = cnv.getContext("2d");

    ctx.clearRect(0, 0, 800, 500);
    ctx.beginPath();
    ctx.fillStyle = `rgba(${x
      .slice(0, 3)
      .concat(1 - 4 * (x[3] - 0.5) * (x[3] - 0.5))
      .join(",")})`;
    ctx.arc(400, 250, 150 * x[3] + 20, 0, 2 * Math.PI);
    ctx.fill();
  },
};

/** Level 2
 *  Two circles, green and purple, joined by a segment.
 *  Is the green circle the one on the right or on the left?
 */
const level2 = {
  epoch: performance.now(),

  timer() {
    return (performance.now() - this.epoch) / 1000;
  },

  xLabels: ["x purple", "y purple", "x green", "y green"],
  yLabels: ["kiri", "kanan"], // left right in Indonesian

  getX() {
    const pt1 = [4 * Math.sin(this.timer() / 2), 4 * Math.cos(this.timer())];
    const pt2 = [4 * Math.sin(this.timer()), 4 * Math.cos(this.timer() / 1.12)];
    return pt1.concat(pt2);
    // two pairs of coordinates, each one following a Lissajous figure.
  },

  answer(x) {
    return x[0] - x[2] > 0 // green x coordinate smaller than purple x coordinate
      ? 0 // left
      : 1; // right
  },

  draw(cnv, x) {
    const ctx = cnv.getContext("2d");

    ctx.clearRect(0, 0, 800, 500);
    ctx.setTransform(40, 0, 0, 40, 400, 250);

    ctx.lineWidth = 0.3;
    ctx.strokeStyle = "grey";
    ctx.beginPath();
    ctx.moveTo(x[0], x[1]);
    ctx.lineTo(x[2], x[3]);
    ctx.stroke();

    ctx.lineWidth = 0.1;
    ctx.strokeStyle = "white";
    ctx.fillStyle = "rgb(30%,20%,40%)"; // purple
    ctx.beginPath();
    ctx.arc(x[0], x[1], 1.3, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgb(50%,100%,10%)"; // green
    ctx.beginPath();
    ctx.arc(x[2], x[3], 1.3, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // if(mode=="user",
    //     //  x = 4*[sin(t3()/2), cos(t3())]++4*[sin(t3()),cos(t3()/1.1234)]
    //     v1 = |[cos(t3()/2)/2, sin(t3())]|;
    //     v2 = |[cos(t3()),sin(t3()/1.1234)/1.1234]|;
    //     playsin(300*v1, line->"x12", amp->.1);
    //     playsin(300*v2, line->"x34", amp->.1);
    //   );
  },
};

/** Level 3
 *  A certain number of circles appear rotating.
 *  Is the number of circles odd or even?
 */
const level3 = {
  epoch: performance.now(),

  timer() {
    return (performance.now() - this.epoch) / 1000;
  },

  labelsXLevel3: ["number", "rotation", "size", "color"],
  labelsYLevel3: ["genap", "gasal"], // even odd in Indonesian

  randomint: 3,
  dir: gaussianRandom(),

  getX() {
    if (Math.floor(this.timer() / 2) !== Math.floor(this.epoch / 2)) {
      // trigger every two seconds
      this.randomint = 2 + Math.floor(Math.random() * 4); // an integer between 2 and 5 inclusive
      this.dir = gaussianRandom(); // direction of turning
    }
    this.epoch = this.timer();
    return [
      this.randomint / 8,
      this.dir,
      (this.timer() / 2) % 1, // parameter determining radius, rotation speed, and alpha
      (this.randomint * 0.43 + 0.3) % 1, // parameter determining hue
    ];
  },

  answer(x) {
    return (x[0] * 8) % 2 === 1 // odd
      ? 1 // odd
      : 0; // even
  },

  draw(cnv, x) {
    const ctx = cnv.getContext("2d");

    const randomint = x[0] * 8;
    const param = x[2];
    const dir = x[1];

    ctx.clearRect(0, 0, 800, 500);
    ctx.setTransform(40, 0, 0, 40, 400, 250);
    ctx.fillStyle = `hsla(${x[3] * 360},100%,50%,${
      1 - 0.9 * 4 * (param - 0.5) * (param - 0.5)
    })`;

    for (let k = 0; k < randomint; k += 1) {
      const xx =
        (2 + param) *
        Math.cos((2 * Math.PI * k) / randomint + dir * 0.7 * (param + 10));
      const yy =
        (2 + param) *
        Math.sin((2 * Math.PI * k) / randomint + dir * 0.7 * (param + 10));

      ctx.beginPath();
      ctx.arc(xx, yy, 0.9, 0, 2 * Math.PI);
      ctx.fill();
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  },
};

export { level1, level2, level3 };
