export const getStartedDvcYaml = `
stages:
  prepare:
    cmd: python src/prepare.py data/data.xml
    deps:
      - data/data.xml
      - src/prepare.py
    params:
      - prepare.seed
      - prepare.split
    outs:
      - data/prepared
  featurize:
    cmd: python src/featurization.py data/prepared data/features
    deps:
      - data/prepared
      - src/featurization.py
    params:
      - featurize.max_features
      - featurize.ngrams
    outs:
      - data/features
  train:
    cmd: python src/train.py data/features model.pkl
    deps:
      - data/features
      - src/train.py
    params:
      - train.min_split
      - train.n_est
      - train.seed
    outs:
      - model.pkl
  evaluate:
    cmd: python src/evaluate.py model.pkl data/features
    deps:
      - data/features
      - model.pkl
      - src/evaluate.py
    metrics:
      - evaluation.json:
          cache: false
    plots:
      - evaluation/importance.png
      - evaluation/plots/confusion_matrix.json:
          cache: false
          template: confusion
          x: actual
          y: predicted
      - evaluation/plots/precision_recall.json:
          cache: false
          x: recall
          y: precision
      - evaluation/plots/roc.json:
          cache: false
          x: fpr
          y: tpr

`

export const dvcYamlWithVars = `
vars:
  - custom_params.yaml
  - models:
      us:
        threshold: 10
  - desc: "Reusable description"
  - params.json
  - myvar: "value"
  - config/myapp.yaml
  - params.json:clean,feats

stages:
  test_vars:
    vars:
      - params.json:build
      - model:
          filename: "model-us.hdf5"
    cmd: echo hello world
  test_foreach_vars:
    foreach: \${vars}
    do:
      vars:
        - params.json:build
        - model:
            filename: "model-us.hdf5"
      cmd: echo \${item} \${model.filename}
`

export const minimal = `
stages:
  stage1:
    cmd: echo foo
  stage2:
    cmd:
      - echo hello
      - echo world
`

export const paramsYaml = `
prepare:
  split: 0.20
  seed: 20170428

featurize:
  max_features: 200
  ngrams: 2

train:
  seed: 20170428
  n_est: 100
  min_split: 8
`
