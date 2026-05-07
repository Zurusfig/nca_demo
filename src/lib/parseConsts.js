import * as tf from '@tensorflow/tfjs';

export function parseConsts(model) {
  const consts = {};
  const weightsData = model.weights || {};

  for (const [key, weight] of Object.entries(weightsData)) {
    if (key.includes('const') || weight.shape && weight.shape.length === 0) {
      consts[key] = weight;
    }
  }

  return consts;
}

export function loadModelWithConsts(modelUrl) {
  return tf.loadGraphModel(modelUrl).then(model => {
    const consts = parseConsts(model);
    return { model, consts };
  });
}
