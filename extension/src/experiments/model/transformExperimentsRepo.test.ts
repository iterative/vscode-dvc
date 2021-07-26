import { join } from 'path'
import { transformExperimentsRepo } from './transformExperimentsRepo'
import { ColumnData, Experiment } from '../webview/contract'

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

describe('metrics/params column schema builder', () => {
  it('Outputs both params and metrics when both are present', () => {
    const { columns } = transformExperimentsRepo({
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
    const params = columns.find(column => column.group === 'params')
    const metrics = columns.find(column => column.group === 'metrics')
    expect(params).toBeDefined()
    expect(metrics).toBeDefined()
  })

  it('Omits params when none exist in the source data', () => {
    const { columns } = transformExperimentsRepo({
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
    const params = columns.find(column => column.group === 'params')
    const metrics = columns.find(column => column.group === 'metrics')
    expect(params).toBeUndefined()
    expect(metrics).toBeDefined()
  })

  it('returns an empty array if no params and metrics are provided', () => {
    const { columns } = transformExperimentsRepo({
      workspace: {
        baseline: {}
      }
    })
    expect(columns).toEqual([])
  })

  describe('minimal mixed column example', () => {
    const exampleBigNumber = 3000000000
    const { columns } = transformExperimentsRepo({
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

    const exampleMixedColumn = columns.find(
      column => column.parentPath === join('params', paramsYaml)
    ) as ColumnData

    it('correctly identifies mixed type params', () => {
      expect(exampleMixedColumn.types).toEqual([
        'number',
        'string',
        'boolean',
        'null'
      ])
    })

    it('correctly identifies a number as the highest string length of a mixed column', () => {
      expect(exampleMixedColumn.maxStringLength).toEqual(10)
    })

    it('adds a highest and lowest number from the one present', () => {
      expect(exampleMixedColumn.maxNumber).toEqual(exampleBigNumber)
      expect(exampleMixedColumn.minNumber).toEqual(exampleBigNumber)
    })
  })

  it('finds different minNumber and maxNumber on a mixed column', () => {
    const { columns } = transformExperimentsRepo({
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
    const mixedColumn = columns.find(
      column => column.path === join('params', paramsYaml, 'mixedNumber')
    ) as ColumnData

    expect(mixedColumn.minNumber).toEqual(-1)
    expect(mixedColumn.maxNumber).toEqual(1)
  })

  describe('Number features', () => {
    const { columns } = transformExperimentsRepo({
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
    const paramsFileColumn = columns.filter(
      column => column.group === 'params'
    ) as ColumnData[]
    const [columnWithNumbers, columnWithoutNumbers] = paramsFileColumn

    it('does not add maxNumber or minNumber on a column with no numbers', () => {
      expect(columnWithoutNumbers.minNumber).toBeUndefined()
      expect(columnWithoutNumbers.maxNumber).toBeUndefined()
    })

    it('finds the min number of -1', () => {
      expect(columnWithNumbers.minNumber).toEqual(-1)
    })

    it('finds the max number of 2', () => {
      expect(columnWithNumbers.maxNumber).toEqual(2)
    })

    it('finds a max string length of two from -1', () => {
      expect(columnWithNumbers.maxStringLength).toEqual(2)
    })
  })

  it('aggregates multiple different field names', () => {
    const { columns } = transformExperimentsRepo({
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

    const paramsColumns = columns.filter(
      column => column.parentPath === join('params', paramsYaml)
    ) as ColumnData[]

    expect(paramsColumns?.map(({ name }) => name)).toEqual([
      'one',
      'two',
      'three',
      'four'
    ])
  })

  it('does not report types for columns without primitives or children for columns without objects', () => {
    const { columns } = transformExperimentsRepo({
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

    const objectColumn = columns.find(
      column => column.parentPath === join('params', paramsYaml)
    ) as ColumnData

    expect(objectColumn.name).toEqual('onlyHasChild')
    expect(objectColumn.types).toBeUndefined()

    const primitiveColumn = columns.find(
      column => column.parentPath === join('params', paramsYaml, 'onlyHasChild')
    ) as ColumnData

    expect(primitiveColumn.name).toEqual('onlyHasPrimitive')
    expect(primitiveColumn.types).toBeDefined()

    const onlyHasPrimitiveChild = columns.find(
      column =>
        column.parentPath ===
        join('params', paramsYaml, 'onlyHasChild', 'onlyHasPrimitive')
    ) as ColumnData

    expect(onlyHasPrimitiveChild).toBeUndefined()
  })
})
