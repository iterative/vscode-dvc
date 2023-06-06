/* eslint-disable sort-keys-fix/sort-keys-fix */
import { collectChanges, collectColumns, collectRelativeMetricsFiles } from '.'
import { timestampColumn } from '../constants'
import { buildMetricOrParamPath } from '../paths'
import { Column, ColumnType } from '../../webview/contract'
import outputFixture from '../../../test/fixtures/expShow/base/output'
import columnsFixture from '../../../test/fixtures/expShow/base/columns'
import workspaceChangesFixture from '../../../test/fixtures/expShow/base/workspaceChanges'
import uncommittedDepsFixture from '../../../test/fixtures/expShow/uncommittedDeps/output'
import {
  ValueTree,
  ExpShowOutput,
  experimentHasError,
  EXPERIMENT_WORKSPACE_ID
} from '../../../cli/dvc/contract'
import { getConfigValue } from '../../../vscode/config'
import { generateTestExpShowOutput } from '../../../test/util/experiments'

jest.mock('../../../vscode/config')

const mockedGetConfigValue = jest.mocked(getConfigValue)
mockedGetConfigValue.mockImplementation(() => 5)

describe('collectColumns', () => {
  it('should return a value equal to the columns fixture when given the output fixture', () => {
    const columns = collectColumns(outputFixture)
    expect(columns).toStrictEqual(columnsFixture)
  })

  it('should output both params and metrics when both are present', () => {
    const columns = collectColumns(
      generateTestExpShowOutput({
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
      })
    )
    const params = columns.find(column => column.type === ColumnType.PARAMS)
    const metrics = columns.find(column => column.type === ColumnType.METRICS)
    expect(params).toBeDefined()
    expect(metrics).toBeDefined()
  })

  it('should omit params when none exist in the source data', () => {
    const columns = collectColumns(
      generateTestExpShowOutput({
        metrics: {
          1: {
            data: { 2: 3 }
          }
        }
      })
    )
    const params = columns.find(column => column.type === ColumnType.PARAMS)
    const metrics = columns.find(column => column.type === ColumnType.METRICS)
    expect(params).toBeUndefined()
    expect(metrics).toBeDefined()
  })

  it('should return an empty array if no params and metrics are provided', () => {
    const columns = collectColumns(generateTestExpShowOutput({}))
    expect(columns).toStrictEqual([])
  })

  const exampleBigNumber = 3000000000

  const data: ExpShowOutput = generateTestExpShowOutput(
    {
      params: {
        'params.yaml': {
          data: { mixedParam: exampleBigNumber }
        }
      }
    },
    {
      rev: 'branchA',
      data: {
        params: {
          'params.yaml': {
            data: { mixedParam: 'string' }
          }
        }
      },
      experiments: [
        {
          params: {
            'params.yaml': {
              data: { mixedParam: true }
            }
          }
        }
      ]
    },
    {
      rev: 'branchB',
      data: {
        params: {
          'params.yaml': {
            data: { mixedParam: null }
          }
        }
      }
    }
  )

  const columns = collectColumns(data)

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
    const columns = collectColumns(
      generateTestExpShowOutput(
        {},
        {
          rev: 'branchA',
          data: {
            params: {
              'params.yaml': {
                data: { mixedNumber: null }
              }
            }
          },
          experiments: [
            {
              params: {
                'params.yaml': {
                  data: { mixedNumber: 0 }
                }
              }
            },
            {
              params: {
                'params.yaml': {
                  data: { mixedNumber: -1 }
                }
              }
            },
            {
              params: {
                'params.yaml': {
                  data: { mixedNumber: 1 }
                }
              }
            }
          ]
        }
      )
    )

    const mixedParam = columns.find(
      column =>
        column.path ===
        buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml', 'mixedNumber')
    ) as Column

    expect(mixedParam.minNumber).toStrictEqual(-1)
    expect(mixedParam.maxNumber).toStrictEqual(1)
  })

  const numericColumns = collectColumns(
    generateTestExpShowOutput(
      {},
      {
        rev: 'branch1',
        data: {
          params: {
            'params.yaml': {
              data: { withNumbers: -1, withoutNumbers: 'a' }
            }
          }
        },
        experiments: [
          {
            params: {
              'params.yaml': {
                data: { withNumbers: 2, withoutNumbers: 'b' }
              }
            }
          },
          {
            params: {
              'params.yaml': {
                data: { withNumbers: 'c', withoutNumbers: 'b' }
              }
            }
          }
        ]
      }
    )
  )

  const param = numericColumns.filter(
    column => column.type === ColumnType.PARAMS
  )
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
    const columns = collectColumns(
      generateTestExpShowOutput(
        {
          params: {
            'params.yaml': {
              data: { one: 1 }
            }
          }
        },
        {
          rev: 'branchA',
          data: {
            params: {
              'params.yaml': {
                data: { two: 2 }
              }
            }
          },
          experiments: [
            {
              params: {
                'params.yaml': {
                  data: { three: 3 }
                }
              }
            }
          ]
        },
        {
          rev: 'branchB',
          data: {
            params: {
              'params.yaml': {
                data: { four: 4 }
              }
            }
          }
        }
      )
    )

    const params = columns.filter(
      column =>
        column.parentPath ===
        buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml')
    )

    expect(params?.map(({ label }) => label)).toStrictEqual([
      'one',
      'two',
      'three',
      'four'
    ])
  })

  it('should create concatenated columns for nesting deeper than 5', () => {
    const columns = collectColumns(
      generateTestExpShowOutput({
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
      })
    )

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
    const columns = collectColumns(
      generateTestExpShowOutput({
        params: {
          'params.yaml': {
            data: {
              onlyHasChild: {
                onlyHasPrimitive: 1
              }
            }
          }
        }
      })
    )

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
})

describe('collectChanges', () => {
  const mockedMetricsAndParams = {
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

  it('should mark new dep files as changes', () => {
    const changes = collectChanges(uncommittedDepsFixture)
    const [workspace] = uncommittedDepsFixture
    if (experimentHasError(workspace)) {
      throw new Error('Experiment should not have error')
    }

    expect(changes).toStrictEqual(
      Object.keys(workspace.data.deps || {})
        .map(dep => `deps:${dep}`)
        .sort()
    )
  })

  it('should return the expected data from the output fixture', () => {
    const changes = collectChanges(outputFixture)
    expect(changes).toStrictEqual(workspaceChangesFixture)
  })

  it('should return an empty array if there are no changes from the current commit and the workspace', () => {
    const data: ExpShowOutput = generateTestExpShowOutput(
      mockedMetricsAndParams,
      {
        data: mockedMetricsAndParams,
        rev: 'f8a6ee1997b193ebc774837a284081ff9e8dc2d5'
      }
    )

    expect(collectChanges(data)).toStrictEqual([])
  })

  it('should collect the changes between the current commit and the workspace', () => {
    const data: ExpShowOutput = generateTestExpShowOutput(
      mockedMetricsAndParams,
      { rev: 'f8a6ee1997b193ebc774837a284081ff9e8dc2d5' }
    )

    expect(collectChanges(data)).toStrictEqual([
      'metrics:logs.json:acc',
      'metrics:logs.json:loss',
      'metrics:logs.json:step',
      'params:params.yaml:lr',
      'params:params.yaml:seed',
      'params:params.yaml:weight_decay'
    ])
  })

  it('should not fail when the workspace does not have metrics but a previous commit does', () => {
    const data: ExpShowOutput = generateTestExpShowOutput(
      {
        params: mockedMetricsAndParams.params
      },
      {
        data: mockedMetricsAndParams,
        rev: 'f8a6ee1997b193ebc774837a284081ff9e8dc2d5'
      }
    )

    expect(collectChanges(data)).toStrictEqual([])
  })

  const getParams = (data: ValueTree) => ({
    params: {
      'params.yaml': {
        data
      }
    }
  })

  it('should work for objects', () => {
    expect(
      collectChanges(
        generateTestExpShowOutput(
          getParams({
            a: { b: 1, d: { e: 100 } }
          }),
          {
            data: getParams({
              a: { b: 'c', d: { e: 'f' } }
            }),
            rev: '31c419826c6961bc0ec1d3900ac18bf904dcf82e'
          }
        )
      )
    ).toStrictEqual(['params:params.yaml:a.b', 'params:params.yaml:a.d.e'])

    expect(
      collectChanges(
        generateTestExpShowOutput(
          getParams({
            a: { b: 'c', d: { e: 'f' } }
          }),
          {
            data: getParams({
              a: { b: 'c', d: { e: 'f' } }
            }),
            rev: '31c419826c6961bc0ec1d3900ac18bf904dcf82e'
          }
        )
      )
    ).toStrictEqual([])
  })

  it('should work for arrays', () => {
    expect(
      collectChanges(
        generateTestExpShowOutput(
          getParams({
            a: [1, 1]
          }),
          {
            data: getParams({
              a: [1, 0]
            }),
            rev: '31c419826c6961bc0ec1d3900ac18bf904dcf82e'
          }
        )
      )
    ).toStrictEqual(['params:params.yaml:a'])

    expect(
      collectChanges(
        generateTestExpShowOutput(
          getParams({
            a: [1, 0]
          }),
          {
            data: getParams({
              a: [1, 0]
            }),
            rev: '31c419826c6961bc0ec1d3900ac18bf904dcf82e'
          }
        )
      )
    ).toStrictEqual([])
  })

  it('should work for nested arrays', () => {
    expect(
      collectChanges(
        generateTestExpShowOutput(
          getParams({
            a: { b: [1, 1] }
          }),
          {
            data: getParams({
              a: { b: [1, 0] }
            }),
            rev: '31c419826c6961bc0ec1d3900ac18bf904dcf82e'
          }
        )
      )
    ).toStrictEqual(['params:params.yaml:a.b'])

    expect(
      collectChanges(
        generateTestExpShowOutput(
          getParams({
            a: { b: [1, 0] }
          }),
          {
            data: getParams({
              a: { b: [1, 0] }
            }),
            rev: '31c419826c6961bc0ec1d3900ac18bf904dcf82e'
          }
        )
      )
    ).toStrictEqual([])
  })

  it('should work for missing nested arrays', () => {
    expect(
      collectChanges(
        generateTestExpShowOutput(
          {},
          {
            data: getParams({
              a: { b: [1, 0] }
            }),
            rev: '31c419826c6961bc0ec1d3900ac18bf904dcf82e'
          }
        )
      )
    ).toStrictEqual([])

    expect(
      collectChanges(
        generateTestExpShowOutput(
          getParams({
            a: { b: [1, 0] }
          }),
          { rev: '31c419826c6961bc0ec1d3900ac18bf904dcf82e' }
        )
      )
    ).toStrictEqual(['params:params.yaml:a.b'])
  })

  it('should handle when a parameter has a null value', () => {
    const nullParam = {
      param_tuning: {
        logistic_regression: null
      }
    }

    expect(
      collectChanges(
        generateTestExpShowOutput(getParams(nullParam), {
          data: getParams(nullParam),
          rev: '9c6ba26745d2fbc286a13b99011d5126b5a245dc'
        })
      )
    ).toStrictEqual([])

    expect(
      collectChanges(
        generateTestExpShowOutput(getParams(nullParam), {
          data: getParams({
            param_tuning: {
              logistic_regression: 1
            }
          }),
          rev: '9c6ba26745d2fbc286a13b99011d5126b5a245dc'
        })
      )
    ).toStrictEqual(['params:params.yaml:param_tuning.logistic_regression'])
  })

  it('should compare against the most recent commit', () => {
    const matchingParams = {
      lr: 0.1
    }
    const differingParams = {
      lr: 10000000
    }

    const data = generateTestExpShowOutput(
      getParams(matchingParams),
      {
        rev: '31c419826c6961bc0ec1d3900ac18bf904dcf82e',
        data: getParams(matchingParams)
      },
      {
        rev: '1987d9de990090d73cf2afd73e6889d182585bf3',
        data: getParams(differingParams)
      },
      {
        rev: '3d7fcb87062d136a2025f8c302312abe9593edf8',
        data: getParams(differingParams)
      }
    )
    expect(collectChanges(data)).toStrictEqual([])
  })

  it('should not fail when there is no commit data', () => {
    expect(collectChanges(generateTestExpShowOutput({}))).toStrictEqual([])
  })

  it('should collect the changes between the current commit and the workspace when the values are nested', () => {
    const data = generateTestExpShowOutput(
      {
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
      },
      {
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
        },
        rev: 'f8a6ee1997b193ebc774837a284081ff9e8dc2d5'
      }
    )

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

describe('collectRelativeMetricsFiles', () => {
  it('should return the expected metrics files from the test fixture', () => {
    expect(collectRelativeMetricsFiles(outputFixture)).toStrictEqual([
      'summary.json'
    ])
  })

  it('should not fail when given an error', () => {
    expect(
      collectRelativeMetricsFiles([
        {
          rev: EXPERIMENT_WORKSPACE_ID,
          error: { msg: 'I broke', type: 'not important' }
        }
      ])
    ).toStrictEqual([])
  })

  it('should not fail when given empty output', () => {
    const existingFiles: string[] = []

    expect(collectRelativeMetricsFiles([])).toStrictEqual(existingFiles)
  })
})
