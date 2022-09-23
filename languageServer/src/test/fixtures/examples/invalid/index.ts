export const foreach_extra_dvc_yaml = `
stages:
  test_dict:
    foreach:
      first: 1
      second: 2
      third: 3
    do:
      cmd: echo \${item.value}
    else:
      - foo

`
export const live_extra_dvc_yaml = `
stages:
  copy_multiple:
    cmd: echo foo > foo
    live:
      foo:
        summary: true
        html: true
        cache: false
        extra: false
`
export const metrics_extra_dvc_yaml = `
stages:
  generate-metrics:
    cmd: echo "metric" > scores.json
    metrics:
      - scores.json:
          cache: false
          extra: false

`
export const outs_extra_dvc_yaml = `
stages:
  copy_multiple:
    cmd: cp foo bar && cp foo1 bar1
    deps:
      - foo
      - foo1
    outs:
      - foo1
      - bar1:
          cache: false
          extra: false

`
export const plots_extra_dvc_yaml = `
stages:
  stage_one:
    cmd: python train.py input plots
    deps:
      - input
    plots:
      - plot1
      - plot2:
          cache: true
          extra: false

`
export const stage_extra_dvc_yaml = `
stages:
  stage1:
    cmd: python train.py input output
    deps:
      - input
    outs:
      - output
    extra: false

`
export const toplevel_extra_dvc_yaml = `
extra: foo

stages:
  stage1:
    cmd: python train.py input output
    deps:
      - input
    outs:
      - output

`
