// https://js.tensorflow.org/api/latest/
import * as tf from "@tensorflow/tfjs";

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

const train = (xs: number[][], ys: number[][]) => {
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

const predict = (xs: number[][]) => {
  return (model.predict(tf.tensor2d(xs, [xs.length, 4])) as tf.Tensor).array();
};

const getWeights = () => {
  return Promise.all([0, 1, 2, 3].map((k) => model.getWeights()[k].array()));
};

const resetWeights = () => {
  model.weights.forEach((w) => {
    const newVals = tf.randomNormal(w.shape as number[]);
    w.write(newVals);
  });
};

export { train, predict, getWeights, resetWeights };
