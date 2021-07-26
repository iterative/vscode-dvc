import { join } from 'path'
import { transformExperimentsRepo } from './transformExperimentsRepo'
import { ParamOrMetric, Experiment } from '../webview/contract'

const paramsYaml = 'params.yaml'

describe('branch and checkpoint nesting', () => {
  it('returns an empty array if no branches are present', () => {
    const { branches } = transformExperimentsRepo({
      workspace: {
        baseline: {}
      }
    })
    expect(branches).toEqual([])
  })

  describe('a repo with two branches', () => {
    const { branches, experimentsByBranch, workspace } =
      transformExperimentsRepo({
        branchA: {
          baseline: { data: {} },
          otherExp1: { data: {} },
          otherExp2: {
            data: { checkpoint_tip: 'otherExp2' }
          },
          otherExp2_1: {
            data: { checkpoint_tip: 'otherExp2' }
          }
        },
        branchB: {
          baseline: { data: {} }
        },
        workspace: {
          baseline: {}
        }
      })

    it('defines workspace', () => {
      expect(workspace).toBeDefined()
    })

    it('finds two branches', () => {
      expect(branches.length).toEqual(2)
    })

    const [branchA, branchB] = branches
    it('lists branches in the same order as the map', () => {
      expect(branchA.id).toEqual('branchA')
      expect(branchB.id).toEqual('branchB')
    })

    it('finds two experiments on branchA', () => {
      expect(experimentsByBranch.get('branchA')?.length).toEqual(2)
    })

    it('finds no experiments on branchB', () => {
      expect(experimentsByBranch.get('branchB')).toBeUndefined()
    })
  })

  describe('a repo with one branch that has nested checkpoints', () => {
    const { experimentsByBranch, checkpointsByTip } = transformExperimentsRepo({
      branchA: {
        baseline: { data: {} },
        tip1: {
          data: { checkpoint_tip: 'tip1' }
        },
        tip1cp1: {
          data: { checkpoint_tip: 'tip1' }
        },
        tip1cp2: {
          data: { checkpoint_tip: 'tip1' }
        },
        tip1cp3: {
          data: { checkpoint_tip: 'tip1' }
        }
      },
      workspace: { baseline: {} }
    })

    it('only lists the tip as a top-level experiment', () => {
      expect(experimentsByBranch.size).toEqual(1)
    })

    const checkpoints = checkpointsByTip.get('tip1') as Experiment[]

    it('finds three checkpoints on the tip', () => {
      expect(checkpoints?.length).toEqual(3)
    })
    const [tip1cp1, tip1cp2, tip1cp3] = checkpoints

    it('finds checkpoints in order', () => {
      expect(tip1cp1.id).toEqual('tip1cp1')
      expect(tip1cp2.id).toEqual('tip1cp2')
      expect(tip1cp3.id).toEqual('tip1cp3')
    })
  })
})

describe('metrics/params schema builder', () => {
  it('Outputs both params and metrics when both are present', () => {
    const { paramsAndMetrics } = transformExperimentsRepo({
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
    const { paramsAndMetrics } = transformExperimentsRepo({
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
    const { paramsAndMetrics } = transformExperimentsRepo({
      workspace: {
        baseline: {}
      }
    })
    expect(paramsAndMetrics).toEqual([])
  })

  describe('minimal mixed param example', () => {
    const exampleBigNumber = 3000000000
    const { paramsAndMetrics } = transformExperimentsRepo({
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
      paramOrMetric => paramOrMetric.parentPath === join('params', paramsYaml)
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
    const { paramsAndMetrics } = transformExperimentsRepo({
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
        paramOrMetric.path === join('params', paramsYaml, 'mixedNumber')
    ) as ParamOrMetric

    expect(mixedParam.minNumber).toEqual(-1)
    expect(mixedParam.maxNumber).toEqual(1)
  })

  describe('Number features', () => {
    const { paramsAndMetrics } = transformExperimentsRepo({
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
    const { paramsAndMetrics } = transformExperimentsRepo({
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
      paramOrMetric => paramOrMetric.parentPath === join('params', paramsYaml)
    ) as ParamOrMetric[]

    expect(params?.map(({ name }) => name)).toEqual([
      'one',
      'two',
      'three',
      'four'
    ])
  })

  it('does not report types for params and metrics without primitives or children for params and metrics without objects', () => {
    const { paramsAndMetrics } = transformExperimentsRepo({
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
      paramOrMetric => paramOrMetric.parentPath === join('params', paramsYaml)
    ) as ParamOrMetric

    expect(objectParam.name).toEqual('onlyHasChild')
    expect(objectParam.types).toBeUndefined()

    const primitiveParam = paramsAndMetrics.find(
      paramOrMetric =>
        paramOrMetric.parentPath === join('params', paramsYaml, 'onlyHasChild')
    ) as ParamOrMetric

    expect(primitiveParam.name).toEqual('onlyHasPrimitive')
    expect(primitiveParam.types).toBeDefined()

    const onlyHasPrimitiveChild = paramsAndMetrics.find(
      paramOrMetric =>
        paramOrMetric.parentPath ===
        join('params', paramsYaml, 'onlyHasChild', 'onlyHasPrimitive')
    ) as ParamOrMetric

    expect(onlyHasPrimitiveChild).toBeUndefined()
  })
})
