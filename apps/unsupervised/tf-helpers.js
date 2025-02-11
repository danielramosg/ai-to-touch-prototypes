// https://js.tensorflow.org/api/latest/
// import * as tf from "@tensorflow/tfjs";
// to do: use import here and remove the script in the html file. Use Parcel to package
// note: uncomment the import to get VS Code function documentation

const model = tf.sequential({
  layers: [
    tf.layers.dense({
      units: 6,
      inputShape: [4],
      //kernelRegularizer: tf.regularizers.l1l2({l1:0,l2:0.005}),
      kernelRegularizer: "l1l2",
      biasRegularizer: "l1l2",
      activation: "relu",
    }),
    tf.layers.dense({
      units: 2,
      kernelRegularizer: "l1l2",
      biasRegularizer: "l1l2",
      activation: "softmax",
    }),
  ],
});

model.compile({
  optimizer: tf.train.adam(0.05),
  loss: "meanSquaredError",
});

const train = (xs, ys) => {
  return model.fit(
    tf.tensor2d(xs, [xs.length, 4]),
    tf.tensor2d(ys, [ys.length, 2]),
    {
      //batchSize: 32,
      shuffle: true,
      epochs: 1,
    }
  );
};

const predict = () => {
  return model.predict(tf.tensor2d(xs, [xs.length, 4])).array();
};

const getWeights = () => {
  return Promise.all([0, 1, 2, 3].map((k) => model.getWeights()[k].array()));
};

const resetWeights = () => {
  model.weights.forEach((w) => {
    const newVals = tf.randomNormal(w.shape);
    w.val.assign(newVals);
  });
};

export { train, predict, getWeights, resetWeights };
