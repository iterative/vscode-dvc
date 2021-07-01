import { transformExperimentsRepo } from './transformExperimentsRepo'
import complexExperimentsOutput from './webview/complex-output-example.json'
import { ColumnData, Experiment } from './webview/contract'

describe('overall transformer functionality', () => {
  it('returns output matching a snapshot given complexExperimentsOutput', () => {
    expect(transformExperimentsRepo(complexExperimentsOutput)).toMatchSnapshot()
  })
})

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
    const { branches, workspace } = transformExperimentsRepo({
      branchA: {
        baseline: {},
        otherExp1: {},
        otherExp2: {
          checkpoint_tip: 'otherExp2'
        },
        otherExp2_1: {
          checkpoint_tip: 'otherExp2'
        }
      },
      branchB: {
        baseline: {}
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
      expect(branchA.subRows?.length).toEqual(2)
    })

    it('finds no experiments on branchB', () => {
      expect(branchB.subRows).toBeUndefined()
    })
  })

  describe('a repo with one branch that has nested checkpoints', () => {
    const {
      branches: [branchA]
    } = transformExperimentsRepo({
      branchA: {
        baseline: {},
        tip1: {
          checkpoint_tip: 'tip1'
        },
        tip1cp1: {
          checkpoint_tip: 'tip1'
        },
        tip1cp2: {
          checkpoint_tip: 'tip1'
        },
        tip1cp3: {
          checkpoint_tip: 'tip1'
        }
      },
      workspace: { baseline: {} }
    })

    it('only lists the tip as a top-level experiment', () => {
      expect(branchA.subRows?.length).toEqual(1)
    })

    const [tip1] = branchA.subRows as Experiment[]

    it('finds three checkpoints on the tip', () => {
      expect(tip1.subRows?.length).toEqual(3)
    })

    const [tip1cp1, tip1cp2, tip1cp3] = tip1.subRows as Experiment[]

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
          metrics: {
            1: {
              2: 3
            }
          },
          params: {
            a: {
              b: 'c'
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
          metrics: {
            1: {
              2: 3
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
          params: {
            'params.yaml': {
              mixedParam: 'string'
            }
          }
        },
        otherExp: {
          params: {
            'params.yaml': {
              mixedParam: true
            }
          }
        }
      },
      branchB: {
        baseline: {
          params: {
            'params.yaml': {
              mixedParam: null
            }
          }
        }
      },
      workspace: {
        baseline: {
          params: {
            'params.yaml': {
              mixedParam: exampleBigNumber
            }
          }
        }
      }
    })

    const [paramsFileColumn] = columns.filter(
      column => column.group === 'params'
    ) as ColumnData[]
    const [exampleMixedColumn] = paramsFileColumn.childColumns as ColumnData[]

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
          params: {
            'params.yaml': {
              mixedNumber: null
            }
          }
        },
        exp1: {
          params: {
            'params.yaml': {
              mixedNumber: 0
            }
          }
        },
        exp2: {
          params: {
            'params.yaml': {
              mixedNumber: -1
            }
          }
        },
        exp3: {
          params: {
            'params.yaml': {
              mixedNumber: 1
            }
          }
        }
      },
      workspace: {
        baseline: {}
      }
    })
    const [paramsFileColumn] = columns.filter(
      column => column.group === 'params'
    ) as ColumnData[]
    const [mixedColumn] = paramsFileColumn.childColumns as ColumnData[]

    expect(mixedColumn.minNumber).toEqual(-1)
    expect(mixedColumn.maxNumber).toEqual(1)
  })

  describe('Number features', () => {
    const { columns } = transformExperimentsRepo({
      branch1: {
        baseline: {
          params: {
            'params.yaml': {
              withNumbers: -1,
              withoutNumbers: 'a'
            }
          }
        },
        exp1: {
          params: {
            'params.yaml': {
              withNumbers: 2,
              withoutNumbers: 'b'
            }
          }
        },
        exp2: {
          params: {
            'params.yaml': {
              withNumbers: 'c',
              withoutNumbers: 'b'
            }
          }
        }
      },
      workspace: {
        baseline: {}
      }
    })
    const [paramsFileColumn] = columns.filter(
      column => column.group === 'params'
    ) as ColumnData[]
    const [columnWithNumbers, columnWithoutNumbers] =
      paramsFileColumn.childColumns as ColumnData[]

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
          params: {
            'params.yaml': {
              two: 2
            }
          }
        },
        otherExp: {
          params: {
            'params.yaml': {
              three: 3
            }
          }
        }
      },
      branchB: {
        baseline: {
          params: {
            'params.yaml': {
              four: 4
            }
          }
        }
      },
      workspace: {
        baseline: {
          params: {
            'params.yaml': {
              one: 1
            }
          }
        }
      }
    })

    const [paramsYamlColumn] = columns.filter(
      column => column.group === 'params'
    ) as ColumnData[]
    const paramsColumns = paramsYamlColumn.childColumns as ColumnData[]

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
          params: {
            'params.yaml': {
              onlyHasChild: {
                onlyHasPrimitive: 1
              }
            }
          }
        }
      }
    })

    const [paramsYamlColumn] = columns.filter(
      column => column.group === 'params'
    ) as ColumnData[]
    const [objectColumn] = paramsYamlColumn.childColumns as ColumnData[]

    expect(objectColumn.name).toEqual('onlyHasChild')
    expect(objectColumn.childColumns).toBeDefined()
    expect(objectColumn.types).toBeUndefined()

    const [primitiveColumn] = objectColumn.childColumns as ColumnData[]

    expect(primitiveColumn.name).toEqual('onlyHasPrimitive')
    expect(primitiveColumn.types).toBeDefined()
    expect(primitiveColumn.childColumns).toBeUndefined()
  })
})
