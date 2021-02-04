import tensorflow as tf

def create_model(dropout):
  return tf.keras.models.Sequential([
    tf.keras.layers.Flatten(input_shape=(28, 28)),
    tf.keras.layers.Dense(512, activation='relu'),
    tf.keras.layers.Dropout(dropout),
    tf.keras.layers.Dense(10, activation='softmax')
  ])
