/** Given a neural network N, return the layout position of neuron j of layer k
 */
const pos = (N, k, j) => [
  (k - 1) * 5,
  (-3 * (j - (N[k] - 1) / 2)) / (Math.sqrt(N[k]) - 0.5),
];

/** Draw the neural network diagram
 * @param N array of the number of neurons in each layer
 * @param W weights
 * @param xLabels labels for the input layer
 * @param yLabels labels for the output layer
 */
const drawNetwork = (N, W, xLabels, yLabels) => {
  const cnv = document.getElementById("mainCanvas");
  const ctx = cnv.getContext("2d");
  ctx.clearRect(0, 0, 500, 500);
  ctx.setTransform(40, 0, 0, 40, 250, 250);
  ctx.fillStyle = "grey";
  ctx.strokeStyle = "white";

  for (let k = 0; k < 2; k += 1) {
    for (let j0 = 0; j0 < N[k]; j0 += 1) {
      for (let j1 = 0; j1 < N[k + 1]; j1 += 1) {
        const p0 = pos(N, k, j0);
        const p1 = pos(N, k + 1, j1);
        // const w = W[2 * k][j0][j1];
        const w = -0.09; //test
        const lw = Math.min(0.1, 4 * w * w);
        if (lw > 0) {
          ctx.lineWidth = lw;
          ctx.strokeStyle = `hsl(${w > 0 ? 0.3 * 360 : 0.8 * 360},100%,50%)`; // green, purple
          ctx.beginPath();
          ctx.moveTo(p0[0], p0[1]);
          ctx.lineTo(p1[0], p1[1]);
          ctx.stroke();
        }
      }
    }
  }

  for (let k = 0; k < 3; k += 1) {
    for (let j = 0; j < N[k]; j += 1) {
      const p = pos(N, k, j);
      //   const w = k > 0 ? W[2 * k - 1] : 0;
      const w = 0.5;

      ctx.fillStyle = "grey";
      ctx.beginPath();
      ctx.arc(p[0], p[1], 0.4, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = `hsla(${
        w > 0 ? 0.3 * 360 : 0.8 * 360
      },100%,50%,${Math.abs(w)})`;
      ctx.beginPath();
      ctx.arc(p[0], p[1], 0.3, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
};

export { drawNetwork };
