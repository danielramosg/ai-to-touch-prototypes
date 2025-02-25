// https://js.tensorflow.org/api/latest/
// import * as tf from "@tensorflow/tfjs";
// to do: use import here and remove the script in the html file. Use Parcel to package
// note: uncomment the import to get VS Code function documentation

importScripts("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs");

/* TF helpers */

const create = (N) => {
  self.model = tf.sequential({
    layers: [
      tf.layers.dense({
        units: N[1],
        inputShape: [N[0]],
        //kernelRegularizer: tf.regularizers.l1l2({l1:0,l2:0.005}),
        kernelRegularizer: "l1l2",
        biasRegularizer: "l1l2",
        activation: "relu",
      }),
      tf.layers.dense({
        units: N[2],
        kernelRegularizer: "l1l2",
        biasRegularizer: "l1l2",
        activation: "softmax",
      }),
    ],
  });

  self.model.compile({
    optimizer: tf.train.adam(0.05),
    loss: "meanSquaredError",
  });
};

const train = (xs, ys) =>
  self.model.fit(
    tf.tensor2d(xs, [xs.length, 4]),
    tf.tensor2d(ys, [ys.length, 2]),
    {
      //batchSize: 32,
      shuffle: true,
      epochs: 1,
    }
  );

const predict = (xs) =>
  self.model.predict(tf.tensor2d(xs, [xs.length, 4])).array();

const getWeights = () =>
  Promise.all([0, 1, 2, 3].map((k) => model.getWeights()[k].array()));

/* Communication with main program */

self.onmessage = (e) => {
  console.log("Message received from main program");
  console.log(e);

  switch (e.data.command) {
    case "say":
      console.log(e.data);
      break;

    case "create":
      console.log(`Creating model with shape ${e.data.N}`);

      create(e.data.N);
      break;

    case "predict":
      console.log(`Predicting for input ${e.data.xs}`);
      predict(e.data.xs).then((d) => {
        self.postMessage({ type: "prediction", ys: d });
      });
      break;

    case "trainAndGetWeights":
      console.log(`Training network ${e.data.N}`);

      train(e.data.xs, e.data.ys)
        .then(() => getWeights())
        .then((d) => {
          console.log(`Sending weights`);
          self.postMessage({ type: "getWeights", W: d });
        });
      break;
  }
  //   self.postMessage("Message sent from the worker");
};
