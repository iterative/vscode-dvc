import { join } from 'path'
import { collectChanges, collectColumns } from '.'
import { timestampColumn } from './timestamp'
import { buildDepPath, buildMetricOrParamPath } from '../paths'
import { Column, ColumnType } from '../../webview/contract'
import outputFixture from '../../../test/fixtures/expShow/output'
import columnsFixture from '../../../test/fixtures/expShow/columns'
import workspaceChangesFixture from '../../../test/fixtures/expShow/workspaceChanges'
import uncommittedDepsFixture from '../../../test/fixtures/expShow/uncommittedDeps'
import { ExperimentsOutput } from '../../../cli/dvc/reader'

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
      column.parentPath ===
      buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml')
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
        buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml', 'mixedNumber')
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
  const paramWithNumbers = param.find(p => p.label === 'withNumbers') as Column
  const paramWithoutNumbers = param.find(
    p => p.label === 'withoutNumbers'
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
        column.parentPath ===
        buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml')
    ) as Column[]

    expect(params?.map(({ label }) => label)).toStrictEqual([
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
      timestampColumn.path,
      buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml'),
      buildMetricOrParamPath(
        ColumnType.PARAMS,
        'params.yaml',
        'one.two.three.four'
      ),
      buildMetricOrParamPath(
        ColumnType.PARAMS,
        'params.yaml',
        'one.two.three.four',
        'five'
      ),
      buildMetricOrParamPath(
        ColumnType.PARAMS,
        'params.yaml',
        'one.two.three.four',
        'five',
        'six'
      ),
      buildMetricOrParamPath(
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
        column.parentPath ===
        buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml')
    ) as Column

    expect(objectParam.label).toStrictEqual('onlyHasChild')
    expect(objectParam.types).toBeUndefined()

    const primitiveParam = columns.find(
      column =>
        column.parentPath ===
        buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml', 'onlyHasChild')
    ) as Column

    expect(primitiveParam.label).toStrictEqual('onlyHasPrimitive')
    expect(primitiveParam.types).toBeDefined()

    const onlyHasPrimitiveChild = columns.find(
      column =>
        column.parentPath ===
        buildMetricOrParamPath(
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
        timestampColumn.path,
        buildMetricOrParamPath(ColumnType.METRICS, 'summary.json'),
        buildMetricOrParamPath(ColumnType.METRICS, 'summary.json', 'loss'),
        buildMetricOrParamPath(ColumnType.METRICS, 'summary.json', 'accuracy'),
        buildMetricOrParamPath(ColumnType.METRICS, 'summary.json', 'val_loss'),
        buildMetricOrParamPath(
          ColumnType.METRICS,
          'summary.json',
          'val_accuracy'
        ),
        buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml'),
        buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml', 'code_names'),
        buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml', 'epochs'),
        buildMetricOrParamPath(
          ColumnType.PARAMS,
          'params.yaml',
          'learning_rate'
        ),
        buildMetricOrParamPath(
          ColumnType.PARAMS,
          'params.yaml',
          'dvc_logs_dir'
        ),
        buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml', 'log_file'),
        buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml', 'dropout'),
        buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml', 'process'),
        buildMetricOrParamPath(
          ColumnType.PARAMS,
          'params.yaml',
          'process',
          'threshold'
        ),
        buildMetricOrParamPath(
          ColumnType.PARAMS,
          'params.yaml',
          'process',
          'test_arg'
        ),
        buildMetricOrParamPath(
          ColumnType.PARAMS,
          join('nested', 'params.yaml')
        ),
        buildMetricOrParamPath(
          ColumnType.PARAMS,
          join('nested', 'params.yaml'),
          'test'
        ),
        buildDepPath('data'),
        buildDepPath('data', 'data.xml'),
        buildDepPath('src'),
        buildDepPath('src', 'prepare.py'),
        buildDepPath('data', 'prepared'),
        buildDepPath('src', 'featurization.py'),
        buildDepPath('data', 'features'),
        buildDepPath('src', 'train.py'),
        buildDepPath('model.pkl'),
        buildDepPath('src', 'evaluate.py')
      ]
    )
  })

  it('should mark new dep files as changes', () => {
    const changes = collectChanges(uncommittedDepsFixture)
    expect(changes).toStrictEqual(
      Object.keys(uncommittedDepsFixture.workspace.baseline.data?.deps || {})
        .map(dep => `deps:${dep}`)
        .sort()
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

  it('should return the expected data from the output fixture', () => {
    const changes = collectChanges(outputFixture)
    expect(changes).toStrictEqual(workspaceChangesFixture)
  })

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
      buildMetricOrParamPath(
        ColumnType.PARAMS,
        'params.yaml',
        'dropout',
        'lower',
        'p',
        '0.05'
      ),
      buildMetricOrParamPath(
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
