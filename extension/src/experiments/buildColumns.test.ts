import { buildColumns, Column } from './buildColumns'

describe('buildColumns', () => {
  describe('minimal mixed column example', () => {
    const exampleBigNumber = 3000000000
    const {
      flatColumns: [exampleMixedColumn]
    } = buildColumns({
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
    })

    it('correctly identifies mixed type params', () =>
      expect(exampleMixedColumn.types).toEqual([
        'string',
        'boolean',
        'null',
        'number'
      ]))

    it('correctly identifies a number as the highest string length of a mixed column', () =>
      expect(exampleMixedColumn.maxStringLength).toEqual(10))

    it('adds a highest and lowest number from the one present', () => {
      expect(exampleMixedColumn.maxNumber).toEqual(exampleBigNumber)
      expect(exampleMixedColumn.minNumber).toEqual(exampleBigNumber)
    })
  })

  describe('Number features', () => {
    const {
      flatColumns: [columnWithNumbers, columnWithoutNumbers]
    } = buildColumns({
      workspace: {
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
      }
    })

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
    const { nestedColumns, flatColumns } = buildColumns({
      brancha: {
        baseline: {
          params: {
            'params.yaml': {
              one: 1
            }
          }
        },
        otherexp: {
          params: {
            'params.yaml': {
              two: 2
            }
          }
        }
      },
      branchb: {
        baseline: {
          params: {
            'params.yaml': {
              three: 3
            }
          }
        }
      },
      workspace: {
        baseline: {
          params: {
            'params.yaml': {
              four: 4
            }
          }
        }
      }
    })

    const [paramsFilesColumn] = nestedColumns
    const paramsYamlColumn = (paramsFilesColumn.childColumns as Column[])[0]
    const paramsColumns = paramsYamlColumn.childColumns as Column[]

    expect(paramsColumns?.map(({ name }) => name)).toEqual([
      'one',
      'two',
      'three',
      'four'
    ])

    expect(flatColumns?.map(({ name }) => name)).toEqual([
      'one',
      'two',
      'three',
      'four',
      'metrics'
    ])
  })

  it('does not report types for columns without primitives or children for columns without objects', () => {
    const {
      nestedColumns: [paramsColumn]
    } = buildColumns({
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
    const objectColumn: Column = ((paramsColumn.childColumns as Column[])[0]
      .childColumns as Column[])[0] as Column

    expect(objectColumn.name).toEqual('onlyHasChild')
    expect(objectColumn.childColumns).toBeDefined()
    expect(objectColumn.types).toBeUndefined()

    const primitiveColumn = (objectColumn.childColumns as Column[])[0]

    expect(primitiveColumn.name).toEqual('onlyHasPrimitive')
    expect(primitiveColumn.types).toBeDefined()
    expect(primitiveColumn.childColumns).toBeUndefined()
  })
})
