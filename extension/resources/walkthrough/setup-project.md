# Setup a DVC Project

> Skip this step if you already have a DVC project with metrics, plots, and
> params.

💡 Check out the
[DVC Get Started](https://github.com/iterative/example-get-started) or
[Extension Demo](https://github.com/iterative/vscode-dvc-demo) projects to
quickly try the extension.

To quickly setup a new DVC project run
[`dvc exp init -i`](https://dvc.org/doc/command-reference/exp/init#example-interactive-mode)
in a [Terminal](command:workbench.action.terminal.new). It will generate a
config file `dvc.yaml` that describes the project, and will look something like
this:

```yaml
train:
  cmd: python src/train.py
  deps:
    - data/features
    - src/train.py
  params:
    - epochs
  outs:
    - models/predict.h5
  metrics:
    - metrics.json:
        cache: false
```

💡 Names, values in this file are project dependent and can be customized.

DVC and this extension read experiments data from these files (e.g
`metrics.json`, `params.yaml`, etc). Your code needs to write and read to them
(the example below is Python, but it can be done in any language):

```python
with open('metrics.json', 'w') as fd:
  json.dump({'avg_prec': avg_prec, 'roc_auc': roc_auc}, fd)
```

To DVC-ify an existing machine learning project use the
[`DVCLive`](https://dvc.org/doc/dvclive) Python library, which can read and
write a lot of different common metrics and plots:

```python
from dvclive import Live

live = Live("evaluation")

live.log("avg_prec", metrics.average_precision_score(labels, predictions))
live.log("roc_auc", metrics.roc_auc_score(labels, predictions))
```

💡 View
[Instant Experiment Tracking: Just Add DVC!](https://iterative.ai/blog/exp-tracking-dvc-python)
for a quick-start guide on migrating an existing project. Use
[Setup](command:dvc.showExperimentsSetup) to be guided through the onboarding
process.
