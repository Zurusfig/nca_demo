import * as tf from '@tensorflow/tfjs';

export function parseConsts(json) {
  const dtypes = {
    DT_INT32: ['int32', 'intVal', Int32Array],
    DT_FLOAT: ['float32', 'floatVal', Float32Array]
  };
  const consts = {};

  json.modelTopology.node
    .filter(n => n.op === 'Const')
    .forEach(node => {
      try {
        if (!node.attr?.value?.tensor) return;
        const v = node.attr.value.tensor;
        if (!v.dtype || !dtypes[v.dtype]) return;

        const [dtype, field, ArrType] = dtypes[v.dtype];

        // Scalar
        if (!v.tensorShape?.dim) {
          const val = v[field]?.length > 0 ? v[field][0] : 0;
          consts[node.name] = [tf.scalar(val, dtype)];
          return;
        }

        const shape = v.tensorShape.dim.map(d => (d.size ? parseInt(d.size) : 0));
        const size = shape.reduce((a, b) => a * b, 1);

        if (size === 0) {
          consts[node.name] = [tf.zeros(shape.map(s => Math.max(s, 0)), dtype)];
          return;
        }

        // Binary encoded
        if (v.tensorContent) {
          const raw = atob(v.tensorContent);
          const buf = new Uint8Array(raw.length);
          for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);
          consts[node.name] = [tf.tensor(new ArrType(buf.buffer), shape, dtype)];
          return;
        }

        // Array encoded
        const arr = new ArrType(size);
        if (v[field]?.length > 0) {
          v[field].length === 1 ? arr.fill(v[field][0]) : arr.set(v[field].slice(0, size));
        }
        consts[node.name] = [tf.tensor(arr, shape, dtype)];
      } catch (e) {
        console.warn('Skipping const node:', node.name, e.message);
      }
    });

  return consts;
}
