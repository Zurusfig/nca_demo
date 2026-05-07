#!/usr/bin/env python3
"""
Export TensorFlow Keras CA models to TensorFlow.js JSON format.

Usage:
  python export_models.py

Expects trained model weights files:
  - p2_final.weights.h5 (Phase 2)
  - p3_final.weights.h5 (Phase 3)

And a CAModel class defined in the same directory or imported.
"""

import os
import json
import tensorflow as tf
from google.protobuf.json_format import MessageToDict
from tensorflow.python.framework import convert_to_constants

# EDIT: Define CAModel or import from your training script
# For now, this is a placeholder — replace with your actual model class
try:
    from ca_model import CAModel
except ImportError:
    print("⚠️  Could not import CAModel. Please define it or import it here.")
    print("Expected: CAModel class with .call() method and .load_weights()")
    exit(1)


def export_model_to_json(model, phase_name, weights_file, output_file):
    """
    Export a Keras CAModel to TensorFlow.js graph-model JSON format.

    Args:
        model: CAModel instance
        phase_name: e.g., "Phase 2" or "Phase 3"
        weights_file: path to .h5 weights file
        output_file: path to output .json file (e.g., 'p2_final.json')
    """
    print(f"\n{'='*60}")
    print(f"Exporting {phase_name} Model")
    print(f"{'='*60}")

    # Load weights
    print(f"📦 Loading weights from {weights_file}...")
    try:
        model.load_weights(weights_file)
        print(f"✓ Weights loaded")
    except Exception as e:
        print(f"✗ Failed to load weights: {e}")
        return False

    # Create concrete function with fixed input shapes
    print(f"🔧 Creating concrete function...")
    cf = model.call.get_concrete_function(
        x=tf.TensorSpec([None, None, None, 18]),
        fire_rate=tf.constant(0.5),
        angle=tf.constant(0.0),
        step_size=tf.constant(1.0)
    )

    # Convert variables to constants (freeze the graph)
    print(f"❄️  Freezing graph constants...")
    cf = convert_to_constants.convert_variables_to_constants_v2(cf)
    graph_def = cf.graph.as_graph_def()

    # Convert to JSON
    print(f"📝 Converting to JSON...")
    graph_json = MessageToDict(graph_def)
    graph_json['versions'] = dict(producer='1.14', minConsumer='1.14')

    model_json = {
        'format': 'graph-model',
        'modelTopology': graph_json,
        'weightsManifest': [],
    }

    # Write JSON
    print(f"💾 Writing to {output_file}...")
    with open(output_file, 'w') as f:
        json.dump(model_json, f)

    file_size_mb = os.path.getsize(output_file) / (1024 * 1024)
    print(f"✓ Exported successfully ({file_size_mb:.1f} MB)")
    return True


def main():
    # Initialize models
    ca_p2 = CAModel()
    ca_p3 = CAModel()

    # Export Phase 2
    export_model_to_json(
        ca_p2,
        "Phase 2 (Fertilizer)",
        'p2_final.weights.h5',
        'public/models/p2_final.json'
    )

    # Export Phase 3
    export_model_to_json(
        ca_p3,
        "Phase 3 (Fertilizer + Sun)",
        'p3_final.weights.h5',
        'public/models/p3_final.json'
    )

    print(f"\n{'='*60}")
    print("✓ All models exported!")
    print(f"{'='*60}")
    print("\nNext steps:")
    print("  1. Commit public/models/p2_final.json and p3_final.json")
    print("  2. Run: npm run dev")
    print("  3. Open http://localhost:5173")
    print("  4. Adjust fertilizer and sun sliders to see the CA grow!")


if __name__ == '__main__':
    main()
