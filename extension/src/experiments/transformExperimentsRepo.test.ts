import { transformExperimentsRepo, Column } from './transformExperimentsRepo'

describe('transformExperimentsRepo', () => {
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
      params: Column[]
    }
    const [paramsFileColumn] = params
    const [exampleMixedColumn] = paramsFileColumn.childColumns as Column[]

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
    }) as { params: Column[] }
    const [paramsFileColumn] = params
    const [mixedColumn] = paramsFileColumn.childColumns as Column[]

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
      params: Column[]
    }
    const [paramsFileColumn] = params
    const [columnWithNumbers, columnWithoutNumbers] =
      paramsFileColumn.childColumns as Column[]

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

    const [paramsYamlColumn] = params as Column[]
    const paramsColumns = paramsYamlColumn.childColumns as Column[]

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

    const [paramsYamlColumn] = params as Column[]
    const [objectColumn] = paramsYamlColumn.childColumns as Column[]

    expect(objectColumn.name).toEqual('onlyHasChild')
    expect(objectColumn.childColumns).toBeDefined()
    expect(objectColumn.types).toBeUndefined()

    const primitiveColumn = (objectColumn.childColumns as Column[])[0]

    expect(primitiveColumn.name).toEqual('onlyHasPrimitive')
    expect(primitiveColumn.types).toBeDefined()
    expect(primitiveColumn.childColumns).toBeUndefined()
  })
})
