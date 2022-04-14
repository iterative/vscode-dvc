import { join } from 'path'
import { collectChanges, collectMetricsAndParams } from './collect'
import { joinMetricOrParamPath } from './paths'
import { MetricOrParam, MetricOrParamType } from '../webview/contract'
import outputFixture from '../../test/fixtures/expShow/output'
import columnsFixture from '../../test/fixtures/expShow/columns'
import { ExperimentsOutput } from '../../cli/reader'

describe('collectMetricsAndParams', () => {
  it('should return a value equal to the columns fixture when given the output fixture', () => {
    const metricsAndParams = collectMetricsAndParams(outputFixture)
    expect(metricsAndParams).toStrictEqual(columnsFixture)
  })

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
      metricOrParam => metricOrParam.type === MetricOrParamType.PARAMS
    )
    const metrics = metricsAndParams.find(
      metricOrParam => metricOrParam.type === MetricOrParamType.METRICS
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
      metricOrParam => metricOrParam.type === MetricOrParamType.PARAMS
    )
    const metrics = metricsAndParams.find(
      metricOrParam => metricOrParam.type === MetricOrParamType.METRICS
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
    expect(metricsAndParams).toStrictEqual([])
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
      joinMetricOrParamPath(MetricOrParamType.PARAMS, 'params.yaml')
  ) as MetricOrParam

  it('should correctly identify mixed type params', () => {
    expect(exampleMixedParam.types).toStrictEqual([
      'number',
      'string',
      'boolean',
      'null'
    ])
  })

  it('should correctly identify a number as the highest string length of a mixed param', () => {
    expect(exampleMixedParam.maxStringLength).toStrictEqual(10)
  })

  it('should add the highest and lowest number from the one present', () => {
    expect(exampleMixedParam.maxNumber).toStrictEqual(exampleBigNumber)
    expect(exampleMixedParam.minNumber).toStrictEqual(exampleBigNumber)
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
        joinMetricOrParamPath(
          MetricOrParamType.PARAMS,
          'params.yaml',
          'mixedNumber'
        )
    ) as MetricOrParam

    expect(mixedParam.minNumber).toStrictEqual(-1)
    expect(mixedParam.maxNumber).toStrictEqual(1)
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
    metricOrParam => metricOrParam.type === MetricOrParamType.PARAMS
  ) as MetricOrParam[]
  const paramWithNumbers = param.find(
    p => p.name === 'withNumbers'
  ) as MetricOrParam
  const paramWithoutNumbers = param.find(
    p => p.name === 'withoutNumbers'
  ) as MetricOrParam

  it('should not add a maxNumber or minNumber on a param with no numbers', () => {
    expect(paramWithoutNumbers.minNumber).toBeUndefined()
    expect(paramWithoutNumbers.maxNumber).toBeUndefined()
  })

  it('should find the min number of -1', () => {
    expect(paramWithNumbers.minNumber).toStrictEqual(-1)
  })

  it('should find the max number of 2', () => {
    expect(paramWithNumbers.maxNumber).toStrictEqual(2)
  })

  it('should find a max string length of two from -1', () => {
    expect(paramWithNumbers.maxStringLength).toStrictEqual(2)
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
        joinMetricOrParamPath(MetricOrParamType.PARAMS, 'params.yaml')
    ) as MetricOrParam[]

    expect(params?.map(({ name }) => name)).toStrictEqual([
      'one',
      'two',
      'three',
      'four'
    ])
  })

  it('should create concatenated columns for nesting deeper than 5', () => {
    const metricsAndParams = collectMetricsAndParams({
      workspace: {
        baseline: {
          data: {
            params: {
              'params.yaml': {
                data: {
                  one: {
                    two: {
                      three: { four: { five: { six: { seven: 'Lucky!' } } } }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    expect(metricsAndParams.map(({ path }) => path)).toStrictEqual([
      joinMetricOrParamPath(MetricOrParamType.PARAMS, 'params.yaml'),
      joinMetricOrParamPath(
        MetricOrParamType.PARAMS,
        'params.yaml',
        'one.two.three.four'
      ),
      joinMetricOrParamPath(
        MetricOrParamType.PARAMS,
        'params.yaml',
        'one.two.three.four',
        'five'
      ),
      joinMetricOrParamPath(
        MetricOrParamType.PARAMS,
        'params.yaml',
        'one.two.three.four',
        'five',
        'six'
      ),
      joinMetricOrParamPath(
        MetricOrParamType.PARAMS,
        'params.yaml',
        'one.two.three.four',
        'five',
        'six',
        'seven'
      )
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
        joinMetricOrParamPath(MetricOrParamType.PARAMS, 'params.yaml')
    ) as MetricOrParam

    expect(objectParam.name).toStrictEqual('onlyHasChild')
    expect(objectParam.types).toBeUndefined()

    const primitiveParam = metricsAndParams.find(
      metricOrParam =>
        metricOrParam.parentPath ===
        joinMetricOrParamPath(
          MetricOrParamType.PARAMS,
          'params.yaml',
          'onlyHasChild'
        )
    ) as MetricOrParam

    expect(primitiveParam.name).toStrictEqual('onlyHasPrimitive')
    expect(primitiveParam.types).toBeDefined()

    const onlyHasPrimitiveChild = metricsAndParams.find(
      metricOrParam =>
        metricOrParam.parentPath ===
        joinMetricOrParamPath(
          MetricOrParamType.PARAMS,
          'params.yaml',
          'onlyHasChild',
          'onlyHasPrimitive'
        )
    ) as MetricOrParam

    expect(onlyHasPrimitiveChild).toBeUndefined()
  })

  it('should collect all params and metrics from the test fixture', () => {
    expect(
      collectMetricsAndParams(outputFixture).map(({ path }) => path)
    ).toStrictEqual([
      joinMetricOrParamPath(MetricOrParamType.METRICS, 'summary.json'),
      joinMetricOrParamPath(MetricOrParamType.METRICS, 'summary.json', 'loss'),
      joinMetricOrParamPath(
        MetricOrParamType.METRICS,
        'summary.json',
        'accuracy'
      ),
      joinMetricOrParamPath(
        MetricOrParamType.METRICS,
        'summary.json',
        'val_loss'
      ),
      joinMetricOrParamPath(
        MetricOrParamType.METRICS,
        'summary.json',
        'val_accuracy'
      ),
      joinMetricOrParamPath(MetricOrParamType.PARAMS, 'params.yaml'),
      joinMetricOrParamPath(MetricOrParamType.PARAMS, 'params.yaml', 'epochs'),
      joinMetricOrParamPath(
        MetricOrParamType.PARAMS,
        'params.yaml',
        'learning_rate'
      ),
      joinMetricOrParamPath(
        MetricOrParamType.PARAMS,
        'params.yaml',
        'dvc_logs_dir'
      ),
      joinMetricOrParamPath(
        MetricOrParamType.PARAMS,
        'params.yaml',
        'log_file'
      ),
      joinMetricOrParamPath(MetricOrParamType.PARAMS, 'params.yaml', 'dropout'),
      joinMetricOrParamPath(MetricOrParamType.PARAMS, 'params.yaml', 'process'),
      joinMetricOrParamPath(
        MetricOrParamType.PARAMS,
        'params.yaml',
        'process',
        'threshold'
      ),
      joinMetricOrParamPath(
        MetricOrParamType.PARAMS,
        'params.yaml',
        'process',
        'test_arg'
      ),
      joinMetricOrParamPath(
        MetricOrParamType.PARAMS,
        join('nested', 'params.yaml')
      ),
      joinMetricOrParamPath(
        MetricOrParamType.PARAMS,
        join('nested', 'params.yaml'),
        'test'
      )
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

    expect(collectChanges(data)).toStrictEqual([])
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

    expect(collectChanges(data)).toStrictEqual([
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

    expect(collectChanges(data)).toStrictEqual([
      joinMetricOrParamPath(
        MetricOrParamType.PARAMS,
        'params.yaml',
        'dropout',
        'lower',
        'p',
        '0.05'
      ),
      joinMetricOrParamPath(
        MetricOrParamType.PARAMS,
        'params.yaml',
        'dropout',
        'upper',
        'p',
        '0.025'
      )
    ])
  })
})
