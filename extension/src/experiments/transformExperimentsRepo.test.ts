import { Experiment } from './contract'
import { transformExperimentsRepo } from './transformExperimentsRepo'
import complexExperimentsOutput from './webview/complex-output-example.json'
import { ColumnData } from './webview/contract'

describe('overall transformer functionality', () => {
  it('returns output matching a snapshot given complexExperimentsOutput', () =>
    expect(
      transformExperimentsRepo(complexExperimentsOutput)
    ).toMatchSnapshot())
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
      brancha: {
        baseline: {},
        otherexp1: {},
        otherexp2: {
          checkpoint_tip: 'otherexp2'
        },
        otherexp2_1: {
          checkpoint_tip: 'otherexp2'
        }
      },
      branchb: {
        baseline: {}
      },
      workspace: {
        baseline: {}
      }
    })

    it('defines workspace', () => expect(workspace).toBeDefined())
    it('finds two branches', () => expect(branches.length).toEqual(2))
    const [brancha, branchb] = branches
    it('lists branches in the same order as the map', () => {
      expect(brancha.baseline?.sha).toEqual('brancha')
      expect(branchb.baseline?.sha).toEqual('branchb')
    })
    it('finds two experiments on brancha', () => {
      expect(brancha.experiments?.length).toEqual(2)
    })
    it('finds no experiments on branchb', () => {
      expect(branchb.experiments).toBeUndefined()
    })
  })

  describe('a repo with one branch that has nested checkpoints', () => {
    const {
      branches: [brancha]
    } = transformExperimentsRepo({
      brancha: {
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

    it('only lists the tip as a top-level experiment', () =>
      expect(brancha.experiments?.length).toEqual(1))
    const [tip1] = brancha.experiments as Experiment[]
    it('finds three checkpoints on the tip', () =>
      expect(tip1.checkpoints?.length).toEqual(3))
    const [tip1cp1, tip1cp2, tip1cp3] = tip1.checkpoints as Experiment[]
    it('finds checkpoints in order', () => {
      expect(tip1cp1.sha).toEqual('tip1cp1')
      expect(tip1cp2.sha).toEqual('tip1cp2')
      expect(tip1cp3.sha).toEqual('tip1cp3')
    })
  })
})

describe('metrics/params column schema builder', () => {
  it('Outputs both params and metrics when both are present', () => {
    const { params, metrics } = transformExperimentsRepo({
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
    expect(params).toBeDefined()
    expect(metrics).toBeDefined()
  })

  it('Omits params when none exist in the source data', () => {
    const { params, metrics } = transformExperimentsRepo({
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
    expect(params).toBeUndefined()
    expect(metrics).toBeDefined()
  })

  it('returns undefined params and metrics if none are provided', () => {
    const { params, metrics } = transformExperimentsRepo({
      workspace: {
        baseline: {}
      }
    })
    expect(metrics).toBeUndefined()
    expect(params).toBeUndefined()
  })

  describe('minimal mixed column example', () => {
    const exampleBigNumber = 3000000000
    const { params } = transformExperimentsRepo({
      brancha: {
        baseline: {
          params: {
            'params.yaml': {
              mixedparam: 'string'
            }
          }
        },
        otherexp: {
          params: {
            'params.yaml': {
              mixedparam: true
            }
          }
        }
      },
      branchb: {
        baseline: {
          params: {
            'params.yaml': {
              mixedparam: null
            }
          }
        }
      },
      workspace: {
        baseline: {
          params: {
            'params.yaml': {
              mixedparam: exampleBigNumber
            }
          }
        }
      }
    }) as {
      params: ColumnData[]
    }
    const [paramsFileColumn] = params
    const [exampleMixedColumn] = paramsFileColumn.childColumns as ColumnData[]

    it('correctly identifies mixed type params', () =>
      expect(exampleMixedColumn.types).toEqual([
        'number',
        'string',
        'boolean',
        'null'
      ]))

    it('correctly identifies a number as the highest string length of a mixed column', () =>
      expect(exampleMixedColumn.maxStringLength).toEqual(10))

    it('adds a highest and lowest number from the one present', () => {
      expect(exampleMixedColumn.maxNumber).toEqual(exampleBigNumber)
      expect(exampleMixedColumn.minNumber).toEqual(exampleBigNumber)
    })
  })

  it('finds different minNumber and maxNumber on a mixed column', () => {
    const { params } = transformExperimentsRepo({
      branch1: {
        baseline: {
          params: {
            'params.yaml': {
              mixednumber: null
            }
          }
        },
        exp1: {
          params: {
            'params.yaml': {
              mixednumber: 0
            }
          }
        },
        exp2: {
          params: {
            'params.yaml': {
              mixednumber: -1
            }
          }
        },
        exp3: {
          params: {
            'params.yaml': {
              mixednumber: 1
            }
          }
        }
      },
      workspace: {
        baseline: {}
      }
    }) as { params: ColumnData[] }
    const [paramsFileColumn] = params
    const [mixedColumn] = paramsFileColumn.childColumns as ColumnData[]

    expect(mixedColumn.minNumber).toEqual(-1)
    expect(mixedColumn.maxNumber).toEqual(1)
  })

  describe('Number features', () => {
    const { params } = transformExperimentsRepo({
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
    }) as {
      params: ColumnData[]
    }
    const [paramsFileColumn] = params
    const [columnWithNumbers, columnWithoutNumbers] =
      paramsFileColumn.childColumns as ColumnData[]

    it('does not add maxNumber or minNumber on a column with no numbers', () => {
      expect(columnWithoutNumbers.minNumber).toBeUndefined()
      expect(columnWithoutNumbers.maxNumber).toBeUndefined()
    })
    it('finds the min number of -1', () =>
      expect(columnWithNumbers.minNumber).toEqual(-1))
    it('finds the max number of 2', () =>
      expect(columnWithNumbers.maxNumber).toEqual(2))
    it('finds a max string length of two from -1', () =>
      expect(columnWithNumbers.maxStringLength).toEqual(2))
  })

  it('aggregates multiple different field names', () => {
    const { params } = transformExperimentsRepo({
      brancha: {
        baseline: {
          params: {
            'params.yaml': {
              two: 2
            }
          }
        },
        otherexp: {
          params: {
            'params.yaml': {
              three: 3
            }
          }
        }
      },
      branchb: {
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

    const [paramsYamlColumn] = params as ColumnData[]
    const paramsColumns = paramsYamlColumn.childColumns as ColumnData[]

    expect(paramsColumns?.map(({ name }) => name)).toEqual([
      'one',
      'two',
      'three',
      'four'
    ])
  })

  it('does not report types for columns without primitives or children for columns without objects', () => {
    const { params } = transformExperimentsRepo({
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

    const [paramsYamlColumn] = params as ColumnData[]
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
