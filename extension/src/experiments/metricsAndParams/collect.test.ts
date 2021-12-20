import { join } from 'path'
import { collectChanges, collectMetricsAndParams } from './collect'
import { joinMetricOrParamPath } from './paths'
import { MetricOrParam } from '../webview/contract'
import expShowFixture from '../../test/fixtures/expShow/output'
import { ExperimentsOutput } from '../../cli/reader'

describe('collectMetricsAndParams', () => {
  it('should output both params and metrics when both are present', () => {
    const metricsAndParams = collectMetricsAndParams({
      workspace: {
        baseline: {
          data: {
            metrics: {
              1: {
                data: { 2: 3 }
              }
            },
            params: {
              a: {
                data: {
                  b: 'c'
                }
              }
            }
          }
        }
      }
    })
    const params = metricsAndParams.find(
      metricOrParam => metricOrParam.group === 'params'
    )
    const metrics = metricsAndParams.find(
      metricOrParam => metricOrParam.group === 'metrics'
    )
    expect(params).toBeDefined()
    expect(metrics).toBeDefined()
  })

  it('should omit params when none exist in the source data', () => {
    const metricsAndParams = collectMetricsAndParams({
      workspace: {
        baseline: {
          data: {
            metrics: {
              1: {
                data: { 2: 3 }
              }
            }
          }
        }
      }
    })
    const params = metricsAndParams.find(
      metricOrParam => metricOrParam.group === 'params'
    )
    const metrics = metricsAndParams.find(
      metricOrParam => metricOrParam.group === 'metrics'
    )
    expect(params).toBeUndefined()
    expect(metrics).toBeDefined()
  })

  it('should return an empty array if no params and metrics are provided', () => {
    const metricsAndParams = collectMetricsAndParams({
      workspace: {
        baseline: {}
      }
    })
    expect(metricsAndParams).toEqual([])
  })

  const exampleBigNumber = 3000000000
  const metricsAndParams = collectMetricsAndParams({
    branchA: {
      baseline: {
        data: {
          params: {
            'params.yaml': {
              data: { mixedParam: 'string' }
            }
          }
        }
      },
      otherExp: {
        data: {
          params: {
            'params.yaml': {
              data: { mixedParam: true }
            }
          }
        }
      }
    },
    branchB: {
      baseline: {
        data: {
          params: {
            'params.yaml': {
              data: { mixedParam: null }
            }
          }
        }
      }
    },
    workspace: {
      baseline: {
        data: {
          params: {
            'params.yaml': {
              data: { mixedParam: exampleBigNumber }
            }
          }
        }
      }
    }
  })

  const exampleMixedParam = metricsAndParams.find(
    metricOrParam =>
      metricOrParam.parentPath ===
      joinMetricOrParamPath('params', 'params.yaml')
  ) as MetricOrParam

  it('should correctly identify mixed type params', () => {
    expect(exampleMixedParam.types).toEqual([
      'number',
      'string',
      'boolean',
      'null'
    ])
  })

  it('should correctly identify a number as the highest string length of a mixed param', () => {
    expect(exampleMixedParam.maxStringLength).toEqual(10)
  })

  it('should add the highest and lowest number from the one present', () => {
    expect(exampleMixedParam.maxNumber).toEqual(exampleBigNumber)
    expect(exampleMixedParam.minNumber).toEqual(exampleBigNumber)
  })

  it('should find a different minNumber and maxNumber on a mixed param', () => {
    const metricsAndParams = collectMetricsAndParams({
      branch1: {
        baseline: {
          data: {
            params: {
              'params.yaml': {
                data: { mixedNumber: null }
              }
            }
          }
        },
        exp1: {
          data: {
            params: {
              'params.yaml': {
                data: { mixedNumber: 0 }
              }
            }
          }
        },
        exp2: {
          data: {
            params: {
              'params.yaml': {
                data: { mixedNumber: -1 }
              }
            }
          }
        },
        exp3: {
          data: {
            params: {
              'params.yaml': {
                data: { mixedNumber: 1 }
              }
            }
          }
        }
      },
      workspace: {
        baseline: {}
      }
    })
    const mixedParam = metricsAndParams.find(
      metricOrParam =>
        metricOrParam.path ===
        joinMetricOrParamPath('params', 'params.yaml', 'mixedNumber')
    ) as MetricOrParam

    expect(mixedParam.minNumber).toEqual(-1)
    expect(mixedParam.maxNumber).toEqual(1)
  })

  const numericMetricsAndParams = collectMetricsAndParams({
    branch1: {
      baseline: {
        data: {
          params: {
            'params.yaml': {
              data: { withNumbers: -1, withoutNumbers: 'a' }
            }
          }
        }
      },
      exp1: {
        data: {
          params: {
            'params.yaml': {
              data: { withNumbers: 2, withoutNumbers: 'b' }
            }
          }
        }
      },
      exp2: {
        data: {
          params: {
            'params.yaml': {
              data: { withNumbers: 'c', withoutNumbers: 'b' }
            }
          }
        }
      }
    },
    workspace: {
      baseline: {}
    }
  })
  const param = numericMetricsAndParams.filter(
    metricOrParam => metricOrParam.group === 'params'
  ) as MetricOrParam[]
  const [paramWithNumbers, paramWithoutNumbers] = param

  it('should not add a maxNumber or minNumber on a param with no numbers', () => {
    expect(paramWithoutNumbers.minNumber).toBeUndefined()
    expect(paramWithoutNumbers.maxNumber).toBeUndefined()
  })

  it('should find the min number of -1', () => {
    expect(paramWithNumbers.minNumber).toEqual(-1)
  })

  it('should find the max number of 2', () => {
    expect(paramWithNumbers.maxNumber).toEqual(2)
  })

  it('should find a max string length of two from -1', () => {
    expect(paramWithNumbers.maxStringLength).toEqual(2)
  })

  it('should aggregate multiple different field names', () => {
    const metricsAndParams = collectMetricsAndParams({
      branchA: {
        baseline: {
          data: {
            params: {
              'params.yaml': {
                data: { two: 2 }
              }
            }
          }
        },
        otherExp: {
          data: {
            params: {
              'params.yaml': {
                data: { three: 3 }
              }
            }
          }
        }
      },
      branchB: {
        baseline: {
          data: {
            params: {
              'params.yaml': {
                data: { four: 4 }
              }
            }
          }
        }
      },
      workspace: {
        baseline: {
          data: {
            params: {
              'params.yaml': {
                data: { one: 1 }
              }
            }
          }
        }
      }
    })

    const params = metricsAndParams.filter(
      metricOrParam =>
        metricOrParam.parentPath ===
        joinMetricOrParamPath('params', 'params.yaml')
    ) as MetricOrParam[]

    expect(params?.map(({ name }) => name)).toEqual([
      'one',
      'two',
      'three',
      'four'
    ])
  })

  it('should not report types for params and metrics without primitives or children for params and metrics without objects', () => {
    const metricsAndParams = collectMetricsAndParams({
      workspace: {
        baseline: {
          data: {
            params: {
              'params.yaml': {
                data: {
                  onlyHasChild: {
                    onlyHasPrimitive: 1
                  }
                }
              }
            }
          }
        }
      }
    })

    const objectParam = metricsAndParams.find(
      metricOrParam =>
        metricOrParam.parentPath ===
        joinMetricOrParamPath('params', 'params.yaml')
    ) as MetricOrParam

    expect(objectParam.name).toEqual('onlyHasChild')
    expect(objectParam.types).toBeUndefined()

    const primitiveParam = metricsAndParams.find(
      metricOrParam =>
        metricOrParam.parentPath ===
        joinMetricOrParamPath('params', 'params.yaml', 'onlyHasChild')
    ) as MetricOrParam

    expect(primitiveParam.name).toEqual('onlyHasPrimitive')
    expect(primitiveParam.types).toBeDefined()

    const onlyHasPrimitiveChild = metricsAndParams.find(
      metricOrParam =>
        metricOrParam.parentPath ===
        joinMetricOrParamPath(
          'params',
          'params.yaml',
          'onlyHasChild',
          'onlyHasPrimitive'
        )
    ) as MetricOrParam

    expect(onlyHasPrimitiveChild).toBeUndefined()
  })

  it('should collect all params and metrics from the test fixture', () => {
    expect(
      collectMetricsAndParams(expShowFixture).map(({ path }) => path)
    ).toEqual([
      joinMetricOrParamPath('metrics', 'summary.json', 'loss'),
      joinMetricOrParamPath('metrics', 'summary.json', 'accuracy'),
      joinMetricOrParamPath('metrics', 'summary.json', 'val_loss'),
      joinMetricOrParamPath('metrics', 'summary.json', 'val_accuracy'),
      joinMetricOrParamPath('metrics', 'summary.json'),
      joinMetricOrParamPath('params', 'params.yaml', 'epochs'),
      joinMetricOrParamPath('params', 'params.yaml', 'learning_rate'),
      joinMetricOrParamPath('params', 'params.yaml', 'dvc_logs_dir'),
      joinMetricOrParamPath('params', 'params.yaml', 'log_file'),
      joinMetricOrParamPath('params', 'params.yaml', 'dropout'),
      joinMetricOrParamPath('params', 'params.yaml', 'process', 'threshold'),
      joinMetricOrParamPath('params', 'params.yaml', 'process', 'test_arg'),
      joinMetricOrParamPath('params', 'params.yaml', 'process'),
      joinMetricOrParamPath('params', 'params.yaml'),
      joinMetricOrParamPath('params', join('nested', 'params.yaml'), 'test'),
      joinMetricOrParamPath('params', join('nested', 'params.yaml'))
    ])
  })
})

describe('collectChanges', () => {
  const mockedExperimentData = {
    baseline: {
      data: {
        metrics: {
          'logs.json': {
            data: { acc: 0.752, loss: 1.1647908687591553, step: 9 }
          }
        },
        params: {
          'params.yaml': {
            data: { lr: 0.0005, seed: 473987, weight_decay: 0 }
          }
        }
      }
    }
  }

  it('should return an empty array if there are no changes from the current commit and the workspace', () => {
    const data: ExperimentsOutput = {
      f8a6ee1997b193ebc774837a284081ff9e8dc2d5: mockedExperimentData,
      workspace: mockedExperimentData
    }

    expect(collectChanges(data)).toEqual([])
  })

  it('should collect the changes between the current commit and the workspace', () => {
    const data: ExperimentsOutput = {
      f8a6ee1997b193ebc774837a284081ff9e8dc2d5: {
        baseline: {
          data: {}
        }
      },
      workspace: mockedExperimentData
    }

    expect(collectChanges(data)).toEqual([
      'metrics:logs.json:acc',
      'metrics:logs.json:loss',
      'metrics:logs.json:step',
      'params:params.yaml:lr',
      'params:params.yaml:seed',
      'params:params.yaml:weight_decay'
    ])
  })

  it('should collect the changes between the current commit and the workspace when the values are nested', () => {
    const mockedCommitDropoutData = {
      baseline: {
        data: {
          params: {
            'params.yaml': {
              data: {
                dropout: {
                  lower: { p: { '0.025': 0.45, '0.05': 0.5 } },
                  upper: { p: { '0.025': 0.9, '0.05': 0.85 } }
                }
              }
            }
          }
        }
      }
    }

    const mockedWorkspaceDropoutData = {
      baseline: {
        data: {
          params: {
            'params.yaml': {
              data: {
                dropout: {
                  lower: { p: { '0.025': 0.45, '0.05': 0.55 } },
                  upper: { p: { '0.025': 0.7, '0.05': 0.85 } }
                }
              }
            }
          }
        }
      }
    }

    const mockedCommitData = Object.assign(
      { ...mockedExperimentData },
      { ...mockedCommitDropoutData }
    )

    const mockedWorkspaceData = Object.assign(
      { ...mockedExperimentData },
      { ...mockedWorkspaceDropoutData }
    )

    const data: ExperimentsOutput = {
      f8a6ee1997b193ebc774837a284081ff9e8dc2d5: mockedCommitData,
      workspace: mockedWorkspaceData
    }

    expect(collectChanges(data)).toEqual([
      'params:params.yaml:dropout.lower.p.0.05',
      'params:params.yaml:dropout.upper.p.0.025'
    ])
  })
})
