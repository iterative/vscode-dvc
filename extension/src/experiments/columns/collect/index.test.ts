/* eslint-disable sort-keys-fix/sort-keys-fix */
import {
  collectChanges,
  collectColumns,
  collectColumnsWithChangedValues,
  collectRelativeMetricsFiles
} from '.'
import { timestampColumn } from '../constants'
import { buildMetricOrParamPath } from '../paths'
import { ColumnType } from '../../webview/contract'
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
import rowsFixture from '../../../test/fixtures/expShow/base/rows'
import { Operator, filterExperiment } from '../../model/filterBy'

jest.mock('../../../vscode/config')

const mockedGetConfigValue = jest.mocked(getConfigValue)
mockedGetConfigValue.mockImplementation(() => 5)

describe('collectColumns', () => {
  it('should return a value equal to the columns fixture when given the output fixture', async () => {
    const columns = await collectColumns(outputFixture)
    expect(columns).toStrictEqual(columnsFixture)
  })

  it('should output both params and metrics when both are present', async () => {
    const columns = await collectColumns(
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

  it('should omit params when none exist in the source data', async () => {
    const columns = await collectColumns(
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

  it('should return an empty array if no params and metrics are provided', async () => {
    const columns = await collectColumns(generateTestExpShowOutput({}))
    expect(columns).toStrictEqual([])
  })

  it('should aggregate multiple different field names', async () => {
    const columns = await collectColumns(
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

  it('should create concatenated columns for nesting deeper than 5', async () => {
    const columns = await collectColumns(
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
      Object.keys(workspace?.data?.deps || {})
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

describe('collectColumnsWithChangedValues', () => {
  it('should return the expected columns from the test fixture', () => {
    const changedColumns = collectColumnsWithChangedValues(
      columnsFixture,
      rowsFixture,
      []
    )
    expect(changedColumns).toStrictEqual(
      columnsFixture.filter(({ path }) =>
        [
          'metrics:summary.json',
          'metrics:summary.json:loss',
          'metrics:summary.json:accuracy',
          'metrics:summary.json:val_loss',
          'metrics:summary.json:val_accuracy',
          'params:params.yaml',
          'params:params.yaml:code_names',
          'params:params.yaml:epochs',
          'params:params.yaml:learning_rate',
          'params:params.yaml:dropout',
          'params:params.yaml:process',
          'params:params.yaml:process.threshold',
          'params:params.yaml:process.test_arg'
        ].includes(path)
      )
    )
  })

  it('should return the expected columns when applying filters (calculate changed after filters)', () => {
    const uniformColumn = 'params:params.yaml:dropout'
    const filters = [
      {
        path: uniformColumn,
        operator: Operator.EQUAL,
        value: 0.124
      }
    ]
    const filteredRows = [...rowsFixture]
    for (const row of filteredRows) {
      row.subRows = row.subRows?.filter(exp => filterExperiment(filters, exp))
    }

    const changedColumns = collectColumnsWithChangedValues(
      columnsFixture,
      filteredRows,
      filters
    )
    expect(changedColumns.map(({ path }) => path)).not.toContain(uniformColumn)
  })
})
