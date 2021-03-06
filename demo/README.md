# dvc-checkpoints-mnist

This example DVC project uses [checkpoints](https://dvc.org/doc/api-reference/make_checkpoint) to iteratively train a model. The model is a simple convolutional neural network (CNN) classifier trained on the [MNIST](http://yann.lecun.com/exdb/mnist/) data of handwritten digits to predict the digit (0-9) in each image.

## Setup

To try it out for yourself:

1. Fork the repository and clone to your local workstation.
2. Install the prerequisites in `requirements.txt` (if you are using pip, run `pip install -r requirements.txt`).

## Experiment with checkpoints

Start training the model with `dvc exp run`. It will train for 10 epochs (you can also use `Ctrl-C` to cancel at any time and still recover the results of the completed epochs).

Once the training script completes, you can view the results of each checkpoint with:

```bash
$ dvc exp show
┏━━━━━━━━━━━━━━━┳━━━━━━━━━━┳━━━━━━━━┳━━━━━━━━┳━━━━━━━┳━━━━━━━━━━━━━━┓
┃ Experiment    ┃ Created  ┃   loss ┃    acc ┃ lr    ┃ weight_decay ┃
┡━━━━━━━━━━━━━━━╇━━━━━━━━━━╇━━━━━━━━╇━━━━━━━━╇━━━━━━━╇━━━━━━━━━━━━━━┩
│ workspace     │ -        │ 2.0218 │ 0.5554 │ 0.001 │ 0            │
│ main          │ 03:18 PM │      - │  0.001 │ 0     │              │
│ │ ╓ exp-03f0e │ 03:56 PM │ 2.0218 │ 0.5554 │ 0.001 │ 0            │
│ │ ╟ da99b44   │ 03:56 PM │ 2.0667 │ 0.4515 │ 0.001 │ 0            │
│ │ ╟ 5d521e1   │ 03:56 PM │ 2.1079 │  0.533 │ 0.001 │ 0            │
│ │ ╟ 8023596   │ 03:55 PM │ 2.1474 │ 0.4186 │ 0.001 │ 0            │
│ │ ╟ fe9d174   │ 03:55 PM │ 2.1808 │ 0.4627 │ 0.001 │ 0            │
│ │ ╟ e31d74b   │ 03:55 PM │ 2.2144 │ 0.3082 │ 0.001 │ 0            │
│ │ ╟ 9b6cfdf   │ 03:55 PM │ 2.2408 │ 0.3332 │ 0.001 │ 0            │
│ │ ╟ 0ab0291   │ 03:55 PM │ 2.2657 │ 0.3142 │ 0.001 │ 0            │
│ │ ╟ dc237bc   │ 03:54 PM │ 2.2841 │ 0.0995 │ 0.001 │ 0            │
│ ├─╨ e519765   │ 03:54 PM │    2.3 │ 0.1746 │ 0.001 │ 0            │
└───────────────┴──────────┴────────┴────────┴───────┴──────────────┘
```

You can also:
* Run `dvc exp run` again to continue training from the last checkpoint.
* Run `dvc exp apply [checkpoint_id]` to revert to any of the prior checkpoints (which will update the `model.pt` output file and metrics to that point).
* Run `dvc exp run --reset` to drop all the existing checkpoints and start from scratch.

## How to add checkpoints to your DVC project

Adding checkpoints to a DVC project requires a few additional lines of code.

In your script that reports metrics, add the `make_checkpoint()` function to be called whenever you want to record a checkpoint (every model epoch in this case, but it can be less frequently if you want less noise):

```diff
--- a/train.py
+++ b/train.py
@@ -5,6 +5,7 @@ import os
 import torch
 import torch.nn.functional as F
 import torchvision
+from dvc.api import make_checkpoint


 EPOCHS = 10
@@ -102,6 +103,7 @@ def main():
         torch.save(model.state_dict(), "model.pt")
         # Evaluate and checkpoint.
         evaluate(model, x_test, y_test)
+        make_checkpoint()


 if __name__ == "__main__":
```

Then, in `dvc.yaml`, add the `checkpoint: true` option to your model output:

```diff
     outs:
-    - model.pt
+    - model.pt:
+        checkpoint: true
```

That's it!
