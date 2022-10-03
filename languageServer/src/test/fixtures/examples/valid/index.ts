export const foreach_dvc_yaml = `
stages:
  test_dict:
    foreach:
      first: 1
      second: 2
      third: 3
    do:
      cmd: echo \${item.value}
  test_seq:
    foreach: [1, 2, 3]
    do:
      cmd: echo \${item}
  test_nested_seq:
    foreach:
      - os: macos_latest
        pyv: 3.6
      - os: windows-latest
        pyv: 3.7
      - os: ubuntu-latest
        pyv: 3.8
    do:
      cmd: "echo OS: \${item.os} \${item.pvy}"
  test_variables:
    foreach: \${vars}
    do:
      cmd: echo \${item}
  test_nested:
    foreach: \${nested.item}
    do:
      cmd: echo \${item}
  test_index:
    foreach: \${nested.item[index]}
    do:
      cmd: echo \${item}

`
export const metrics_dvc_yaml = `
stages:
  generate-metrics:
    cmd: echo "metric" > scores.json
    metrics:
      - scores.json
  copy_metrics:
    cmd: cp scores.json scores2.json
    deps:
      - scores.json
    metrics:
      - scores2.json:
          cache: false
  copy_metrics3:
    cmd: cat scores.json scores2.json > scores3.json
    deps:
      - scores.json
      - scores2.json
    metrics:
      - scores3.json:
          persist: false

`

export const minimal_dvc_yaml = `
stages:
  stage1:
    cmd: echo foo
  stage2:
    cmd:
      - echo hello
      - echo world

`

export const file_path_dvc_yaml = `
stages:
  stage1:
    cmd: echo foo
    params:
      - params.json
  stage2:
    cmd:
      - echo hello
      - echo world

`

export const outs_dvc_yaml = `
stages:
  copy_multiple:
    cmd: cp foo bar && cp foo1 bar1 && cp foo2 bar2
    deps:
      - foo
      - foo1
    outs:
      - foo1
      - bar1:
          cache: false
      - bar2:
          persist: true
      - bar3:
          checkpoint: true
      - bar4:
          desc: "bar4"
    live:
      foo:
        summary: true
        html: true
        cache: false

`
export const params_dvc_yaml = `
stages:
  use-params_stage:
    cmd: cat params.yaml > params2.yaml
    params:
      - auc
      - loss
    outs:
      - params2.yaml
  use-custom-params_file:
    cmd: cat my_params.yaml > params2.yaml
    params:
      - my_params.yaml:
          - auc
          - loss
    outs:
      - params2.yaml
  use-full-params_file:
    cmd: cat full_file.yaml > params2.yaml
    params:
      - my_params.yaml:
    outs:
      - params2.yaml
`
export const plots_dvc_yaml = `
stages:
  stage_one:
    cmd: python train.py input plots
    deps:
      - input
    plots:
      - plot1
      - plot2:
          cache: true
      - plot3:
          persist: true
      - plot4:
          persist: false
          x: "2"
      - plot5:
          cache: false
          y: epoch
          y_label: Epochs
          title: test run
          template: confusion
          x: auc
          x_label: AUC

`
export const simple_dvc_yaml = `
stages:
  stage1:
    cmd: python train.py input output
    deps:
      - input
    outs:
      - output

`
export const vars_dvc_yaml = `
vars:
- custom_params.yaml
- models:
      us:
        threshold: 10
- desc: 'Reusable description'
- params.json
- myvar: 'value'
- config/myapp.yaml
- params.json:clean,feats

stages:
  test_vars:
    vars:
      - params.json:build
      - model:
          filename: 'model-us.hdf5'
    cmd: echo hello world
  test_foreach_vars:
    foreach: \${vars}
    do:
      vars:
        - params.json:build
        - model:
            filename: 'model-us.hdf5'
      cmd: echo \${item} \${model.filename}

`
