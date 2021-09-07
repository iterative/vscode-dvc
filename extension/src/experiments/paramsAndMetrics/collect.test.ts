import { join } from 'path'
import { collectFiles, collectParamsAndMetrics } from './collect'
import { ParamOrMetric } from '../webview/contract'
import complexExperimentsOutput from '../webview/complex-output-example'
import { ExperimentsRepoJSONOutput } from '../../cli/reader'
import { joinParamOrMetricPath } from '../../util/paths'

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
})

describe('collectFiles', () => {
  it('should collect all of the available files from the test fixture', () => {
    expect(collectFiles(complexExperimentsOutput)).toEqual([
      'params.yaml',
      join('nested', 'params.yaml'),
      'summary.json'
    ])
  })

  it('should collect all of the available files from a more complex example', () => {
    const workspace = {
      workspace: {
        baseline: {
          data: {
            metrics: {
              'logs.json': {},
              'metrics.json': {},
              'summary.json': {}
            },
            params: {
              'further/nested.params.yaml': {},
              'nested/params.yaml': {},
              'params.yaml': {}
            }
          }
        }
      }
    } as ExperimentsRepoJSONOutput

    expect(collectFiles(workspace).sort()).toEqual([
      'further/nested.params.yaml',
      'logs.json',
      'metrics.json',
      'nested/params.yaml',
      'params.yaml',
      'summary.json'
    ])
  })
})
