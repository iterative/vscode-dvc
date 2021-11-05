import { join } from 'path'
import { collectChanges, collectParamsAndMetrics } from './collect'
import { joinParamOrMetricPath } from './paths'
import { ParamOrMetric } from '../webview/contract'
import expShowFixture from '../../test/fixtures/expShow/output'
import { ExperimentsRepoJSONOutput } from '../../cli/reader'

describe('collectParamsAndMetrics', () => {
  it('should output both params and metrics when both are present', () => {
    const paramsAndMetrics = collectParamsAndMetrics({
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
    const params = paramsAndMetrics.find(
      paramOrMetric => paramOrMetric.group === 'params'
    )
    const metrics = paramsAndMetrics.find(
      paramOrMetric => paramOrMetric.group === 'metrics'
    )
    expect(params).toBeDefined()
    expect(metrics).toBeDefined()
  })

  it('should omit params when none exist in the source data', () => {
    const paramsAndMetrics = collectParamsAndMetrics({
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
    const params = paramsAndMetrics.find(
      paramOrMetric => paramOrMetric.group === 'params'
    )
    const metrics = paramsAndMetrics.find(
      paramOrMetric => paramOrMetric.group === 'metrics'
    )
    expect(params).toBeUndefined()
    expect(metrics).toBeDefined()
  })

  it('should return an empty array if no params and metrics are provided', () => {
    const paramsAndMetrics = collectParamsAndMetrics({
      workspace: {
        baseline: {}
      }
    })
    expect(paramsAndMetrics).toEqual([])
  })

  const exampleBigNumber = 3000000000
  const paramsAndMetrics = collectParamsAndMetrics({
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

  const exampleMixedParam = paramsAndMetrics.find(
    paramOrMetric =>
      paramOrMetric.parentPath ===
      joinParamOrMetricPath('params', 'params.yaml')
  ) as ParamOrMetric

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
    const paramsAndMetrics = collectParamsAndMetrics({
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
    const mixedParam = paramsAndMetrics.find(
      paramOrMetric =>
        paramOrMetric.path ===
        joinParamOrMetricPath('params', 'params.yaml', 'mixedNumber')
    ) as ParamOrMetric

    expect(mixedParam.minNumber).toEqual(-1)
    expect(mixedParam.maxNumber).toEqual(1)
  })

  const numericParamsAndMetrics = collectParamsAndMetrics({
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
  const param = numericParamsAndMetrics.filter(
    paramOrMetric => paramOrMetric.group === 'params'
  ) as ParamOrMetric[]
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
    const paramsAndMetrics = collectParamsAndMetrics({
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

    const params = paramsAndMetrics.filter(
      paramOrMetric =>
        paramOrMetric.parentPath ===
        joinParamOrMetricPath('params', 'params.yaml')
    ) as ParamOrMetric[]

    expect(params?.map(({ name }) => name)).toEqual([
      'one',
      'two',
      'three',
      'four'
    ])
  })

  it('should not report types for params and metrics without primitives or children for params and metrics without objects', () => {
    const paramsAndMetrics = collectParamsAndMetrics({
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

    const objectParam = paramsAndMetrics.find(
      paramOrMetric =>
        paramOrMetric.parentPath ===
        joinParamOrMetricPath('params', 'params.yaml')
    ) as ParamOrMetric

    expect(objectParam.name).toEqual('onlyHasChild')
    expect(objectParam.types).toBeUndefined()

    const primitiveParam = paramsAndMetrics.find(
      paramOrMetric =>
        paramOrMetric.parentPath ===
        joinParamOrMetricPath('params', 'params.yaml', 'onlyHasChild')
    ) as ParamOrMetric

    expect(primitiveParam.name).toEqual('onlyHasPrimitive')
    expect(primitiveParam.types).toBeDefined()

    const onlyHasPrimitiveChild = paramsAndMetrics.find(
      paramOrMetric =>
        paramOrMetric.parentPath ===
        joinParamOrMetricPath(
          'params',
          'params.yaml',
          'onlyHasChild',
          'onlyHasPrimitive'
        )
    ) as ParamOrMetric

    expect(onlyHasPrimitiveChild).toBeUndefined()
  })

  it('should collect all params and metrics from the test fixture', () => {
    expect(
      collectParamsAndMetrics(expShowFixture).map(({ path }) => path)
    ).toEqual([
      joinParamOrMetricPath('params', 'params.yaml', 'epochs'),
      joinParamOrMetricPath('params', 'params.yaml', 'learning_rate'),
      joinParamOrMetricPath('params', 'params.yaml', 'dvc_logs_dir'),
      joinParamOrMetricPath('params', 'params.yaml', 'log_file'),
      joinParamOrMetricPath('params', 'params.yaml', 'dropout'),
      joinParamOrMetricPath('params', 'params.yaml', 'process', 'threshold'),
      joinParamOrMetricPath('params', 'params.yaml', 'process', 'test_arg'),
      joinParamOrMetricPath('params', 'params.yaml', 'process'),
      joinParamOrMetricPath('params', 'params.yaml'),
      joinParamOrMetricPath('params', join('nested', 'params.yaml'), 'test'),
      joinParamOrMetricPath('params', join('nested', 'params.yaml')),
      joinParamOrMetricPath('metrics', 'summary.json', 'loss'),
      joinParamOrMetricPath('metrics', 'summary.json', 'accuracy'),
      joinParamOrMetricPath('metrics', 'summary.json', 'val_loss'),
      joinParamOrMetricPath('metrics', 'summary.json', 'val_accuracy'),
      joinParamOrMetricPath('metrics', 'summary.json')
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
    const data: ExperimentsRepoJSONOutput = {
      f8a6ee1997b193ebc774837a284081ff9e8dc2d5: mockedExperimentData,
      workspace: mockedExperimentData
    }

    expect(collectChanges(data)).toEqual([])
  })

  it('should collect the changes between the current commit and the workspace', () => {
    const data: ExperimentsRepoJSONOutput = {
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

    const data: ExperimentsRepoJSONOutput = {
      f8a6ee1997b193ebc774837a284081ff9e8dc2d5: mockedCommitData,
      workspace: mockedWorkspaceData
    }

    expect(collectChanges(data)).toEqual([
      'params:params.yaml:dropout.lower.p.0.05',
      'params:params.yaml:dropout.upper.p.0.025'
    ])
  })
})
