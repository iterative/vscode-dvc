import { join } from 'path'
import { collectChanges, collectColumns } from './collect'
import { joinColumnPath } from './paths'
import { Column, ColumnType } from '../webview/contract'
import outputFixture from '../../test/fixtures/expShow/output'
import columnsFixture from '../../test/fixtures/expShow/columns'
import { ExperimentsOutput } from '../../cli/reader'

describe('collectColumns', () => {
  it('should return a value equal to the columns fixture when given the output fixture', () => {
    const columns = collectColumns(outputFixture)
    expect(columns).toStrictEqual(columnsFixture)
  })

  it('should output both params and metrics when both are present', () => {
    const columns = collectColumns({
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
    const params = columns.find(column => column.type === ColumnType.PARAMS)
    const metrics = columns.find(column => column.type === ColumnType.METRICS)
    expect(params).toBeDefined()
    expect(metrics).toBeDefined()
  })

  it('should omit params when none exist in the source data', () => {
    const columns = collectColumns({
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
    const params = columns.find(column => column.type === ColumnType.PARAMS)
    const metrics = columns.find(column => column.type === ColumnType.METRICS)
    expect(params).toBeUndefined()
    expect(metrics).toBeDefined()
  })

  it('should return an empty array if no params and metrics are provided', () => {
    const columns = collectColumns({
      workspace: {
        baseline: {}
      }
    })
    expect(columns).toStrictEqual([])
  })

  const exampleBigNumber = 3000000000
  const columns = collectColumns({
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

  const exampleMixedParam = columns.find(
    column =>
      column.parentPath === joinColumnPath(ColumnType.PARAMS, 'params.yaml')
  ) as Column

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
    const columns = collectColumns({
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
    const mixedParam = columns.find(
      column =>
        column.path ===
        joinColumnPath(ColumnType.PARAMS, 'params.yaml', 'mixedNumber')
    ) as Column

    expect(mixedParam.minNumber).toStrictEqual(-1)
    expect(mixedParam.maxNumber).toStrictEqual(1)
  })

  const numericColumns = collectColumns({
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
  const param = numericColumns.filter(
    column => column.type === ColumnType.PARAMS
  ) as Column[]
  const paramWithNumbers = param.find(p => p.name === 'withNumbers') as Column
  const paramWithoutNumbers = param.find(
    p => p.name === 'withoutNumbers'
  ) as Column

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
    const columns = collectColumns({
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

    const params = columns.filter(
      column =>
        column.parentPath === joinColumnPath(ColumnType.PARAMS, 'params.yaml')
    ) as Column[]

    expect(params?.map(({ name }) => name)).toStrictEqual([
      'one',
      'two',
      'three',
      'four'
    ])
  })

  it('should create concatenated columns for nesting deeper than 5', () => {
    const columns = collectColumns({
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

    expect(columns.map(({ path }) => path)).toStrictEqual([
      joinColumnPath(ColumnType.PARAMS, 'params.yaml'),
      joinColumnPath(ColumnType.PARAMS, 'params.yaml', 'one.two.three.four'),
      joinColumnPath(
        ColumnType.PARAMS,
        'params.yaml',
        'one.two.three.four',
        'five'
      ),
      joinColumnPath(
        ColumnType.PARAMS,
        'params.yaml',
        'one.two.three.four',
        'five',
        'six'
      ),
      joinColumnPath(
        ColumnType.PARAMS,
        'params.yaml',
        'one.two.three.four',
        'five',
        'six',
        'seven'
      )
    ])
  })

  it('should not report types for params and metrics without primitives or children for params and metrics without objects', () => {
    const columns = collectColumns({
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

    const objectParam = columns.find(
      column =>
        column.parentPath === joinColumnPath(ColumnType.PARAMS, 'params.yaml')
    ) as Column

    expect(objectParam.name).toStrictEqual('onlyHasChild')
    expect(objectParam.types).toBeUndefined()

    const primitiveParam = columns.find(
      column =>
        column.parentPath ===
        joinColumnPath(ColumnType.PARAMS, 'params.yaml', 'onlyHasChild')
    ) as Column

    expect(primitiveParam.name).toStrictEqual('onlyHasPrimitive')
    expect(primitiveParam.types).toBeDefined()

    const onlyHasPrimitiveChild = columns.find(
      column =>
        column.parentPath ===
        joinColumnPath(
          ColumnType.PARAMS,
          'params.yaml',
          'onlyHasChild',
          'onlyHasPrimitive'
        )
    ) as Column

    expect(onlyHasPrimitiveChild).toBeUndefined()
  })

  it('should collect all params and metrics from the test fixture', () => {
    expect(collectColumns(outputFixture).map(({ path }) => path)).toStrictEqual(
      [
        joinColumnPath(ColumnType.METRICS, 'summary.json'),
        joinColumnPath(ColumnType.METRICS, 'summary.json', 'loss'),
        joinColumnPath(ColumnType.METRICS, 'summary.json', 'accuracy'),
        joinColumnPath(ColumnType.METRICS, 'summary.json', 'val_loss'),
        joinColumnPath(ColumnType.METRICS, 'summary.json', 'val_accuracy'),
        joinColumnPath(ColumnType.PARAMS, 'params.yaml'),
        joinColumnPath(ColumnType.PARAMS, 'params.yaml', 'epochs'),
        joinColumnPath(ColumnType.PARAMS, 'params.yaml', 'learning_rate'),
        joinColumnPath(ColumnType.PARAMS, 'params.yaml', 'dvc_logs_dir'),
        joinColumnPath(ColumnType.PARAMS, 'params.yaml', 'log_file'),
        joinColumnPath(ColumnType.PARAMS, 'params.yaml', 'dropout'),
        joinColumnPath(ColumnType.PARAMS, 'params.yaml', 'process'),
        joinColumnPath(
          ColumnType.PARAMS,
          'params.yaml',
          'process',
          'threshold'
        ),
        joinColumnPath(ColumnType.PARAMS, 'params.yaml', 'process', 'test_arg'),
        joinColumnPath(ColumnType.PARAMS, join('nested', 'params.yaml')),
        joinColumnPath(
          ColumnType.PARAMS,
          join('nested', 'params.yaml'),
          'test'
        ),
        joinColumnPath(ColumnType.DEPS, 'deps'),
        joinColumnPath(ColumnType.DEPS, 'deps', 'data'),
        joinColumnPath(ColumnType.DEPS, 'deps', 'data', 'MNIST'),
        joinColumnPath(ColumnType.DEPS, 'deps', 'train.py')
      ]
    )
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
      joinColumnPath(
        ColumnType.PARAMS,
        'params.yaml',
        'dropout',
        'lower',
        'p',
        '0.05'
      ),
      joinColumnPath(
        ColumnType.PARAMS,
        'params.yaml',
        'dropout',
        'upper',
        'p',
        '0.025'
      )
    ])
  })
})
