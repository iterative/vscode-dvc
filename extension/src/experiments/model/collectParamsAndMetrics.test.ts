import { join } from 'path'
import { collectParamsAndMetrics } from './collectParamsAndMetrics'
import { ParamOrMetric } from '../webview/contract'

describe('metrics/params schema builder', () => {
  it('Outputs both params and metrics when both are present', () => {
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

  it('Omits params when none exist in the source data', () => {
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

  it('returns an empty array if no params and metrics are provided', () => {
    const paramsAndMetrics = collectParamsAndMetrics({
      workspace: {
        baseline: {}
      }
    })
    expect(paramsAndMetrics).toEqual([])
  })

  describe('minimal mixed param example', () => {
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
        paramOrMetric.parentPath === join('params', 'params.yaml')
    ) as ParamOrMetric

    it('correctly identifies mixed type params', () => {
      expect(exampleMixedParam.types).toEqual([
        'number',
        'string',
        'boolean',
        'null'
      ])
    })

    it('correctly identifies a number as the highest string length of a mixed param', () => {
      expect(exampleMixedParam.maxStringLength).toEqual(10)
    })

    it('adds a highest and lowest number from the one present', () => {
      expect(exampleMixedParam.maxNumber).toEqual(exampleBigNumber)
      expect(exampleMixedParam.minNumber).toEqual(exampleBigNumber)
    })
  })

  it('finds different minNumber and maxNumber on a mixed param', () => {
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
        paramOrMetric.path === join('params', 'params.yaml', 'mixedNumber')
    ) as ParamOrMetric

    expect(mixedParam.minNumber).toEqual(-1)
    expect(mixedParam.maxNumber).toEqual(1)
  })

  describe('Number features', () => {
    const paramsAndMetrics = collectParamsAndMetrics({
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
    const param = paramsAndMetrics.filter(
      paramOrMetric => paramOrMetric.group === 'params'
    ) as ParamOrMetric[]
    const [paramWithNumbers, paramWithoutNumbers] = param

    it('does not add maxNumber or minNumber on a param with no numbers', () => {
      expect(paramWithoutNumbers.minNumber).toBeUndefined()
      expect(paramWithoutNumbers.maxNumber).toBeUndefined()
    })

    it('finds the min number of -1', () => {
      expect(paramWithNumbers.minNumber).toEqual(-1)
    })

    it('finds the max number of 2', () => {
      expect(paramWithNumbers.maxNumber).toEqual(2)
    })

    it('finds a max string length of two from -1', () => {
      expect(paramWithNumbers.maxStringLength).toEqual(2)
    })
  })

  it('aggregates multiple different field names', () => {
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
        paramOrMetric.parentPath === join('params', 'params.yaml')
    ) as ParamOrMetric[]

    expect(params?.map(({ name }) => name)).toEqual([
      'one',
      'two',
      'three',
      'four'
    ])
  })

  it('does not report types for params and metrics without primitives or children for params and metrics without objects', () => {
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
        paramOrMetric.parentPath === join('params', 'params.yaml')
    ) as ParamOrMetric

    expect(objectParam.name).toEqual('onlyHasChild')
    expect(objectParam.types).toBeUndefined()

    const primitiveParam = paramsAndMetrics.find(
      paramOrMetric =>
        paramOrMetric.parentPath ===
        join('params', 'params.yaml', 'onlyHasChild')
    ) as ParamOrMetric

    expect(primitiveParam.name).toEqual('onlyHasPrimitive')
    expect(primitiveParam.types).toBeDefined()

    const onlyHasPrimitiveChild = paramsAndMetrics.find(
      paramOrMetric =>
        paramOrMetric.parentPath ===
        join('params', 'params.yaml', 'onlyHasChild', 'onlyHasPrimitive')
    ) as ParamOrMetric

    expect(onlyHasPrimitiveChild).toBeUndefined()
  })
})
