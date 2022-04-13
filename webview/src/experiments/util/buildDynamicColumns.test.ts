/* eslint-disable sort-keys-fix/sort-keys-fix */
import { join } from 'dvc/src/test/util/path'
import { ColumnGroup } from 'react-table'
import {
  Experiment,
  MetricOrParamType
} from 'dvc/src/experiments/webview/contract'
import { collectMetricsAndParams } from 'dvc/src/experiments/metricsAndParams/collect'
import { columns as deeplyNestedColumnsFixture } from 'dvc/src/test/fixtures/expShow/deeplyNested'
import columnsFixture from 'dvc/src/test/fixtures/expShow/columns'
import { joinMetricOrParamPath } from 'dvc/src/experiments/metricsAndParams/paths'
import buildDynamicColumns from './buildDynamicColumns'

interface MinimalColumn {
  id?: string
  columns?: MinimalColumn[]
}

const nestedParamsFile = join('nested', 'params.yaml')

const simplifyColumns = (columns: ColumnGroup<Experiment>[]) =>
  columns.map(({ id, columns }) => {
    const newColumn: MinimalColumn = { id }
    if (columns) {
      newColumn.columns = simplifyColumns(columns as ColumnGroup<Experiment>[])
    }
    return newColumn
  })

describe('buildDynamicColumns', () => {
  it('Correctly parses the standard fixture', () => {
    expect(
      simplifyColumns([
        ...buildDynamicColumns(columnsFixture, MetricOrParamType.METRICS),
        ...buildDynamicColumns(columnsFixture, MetricOrParamType.PARAMS)
      ])
    ).toStrictEqual([
      {
        columns: [
          {
            id: joinMetricOrParamPath(
              MetricOrParamType.METRICS,
              'summary.json',
              'loss'
            )
          },
          {
            id: joinMetricOrParamPath(
              MetricOrParamType.METRICS,
              'summary.json',
              'accuracy'
            )
          },
          {
            id: joinMetricOrParamPath(
              MetricOrParamType.METRICS,
              'summary.json',
              'val_loss'
            )
          },
          {
            id: joinMetricOrParamPath(
              MetricOrParamType.METRICS,
              'summary.json',
              'val_accuracy'
            )
          }
        ],
        id: joinMetricOrParamPath(MetricOrParamType.METRICS, 'summary.json')
      },
      {
        columns: [
          {
            columns: [
              {
                id: joinMetricOrParamPath(
                  MetricOrParamType.PARAMS,
                  'params.yaml',
                  'epochs'
                )
              }
            ],
            id: joinMetricOrParamPath(
              MetricOrParamType.PARAMS,
              'params.yaml',
              'epochs_previous_placeholder'
            )
          },
          {
            columns: [
              {
                id: joinMetricOrParamPath(
                  MetricOrParamType.PARAMS,
                  'params.yaml',
                  'learning_rate'
                )
              }
            ],
            id: joinMetricOrParamPath(
              MetricOrParamType.PARAMS,
              'params.yaml',
              'learning_rate_previous_placeholder'
            )
          },
          {
            columns: [
              {
                id: joinMetricOrParamPath(
                  MetricOrParamType.PARAMS,
                  'params.yaml',
                  'dvc_logs_dir'
                )
              }
            ],
            id: joinMetricOrParamPath(
              MetricOrParamType.PARAMS,
              'params.yaml',
              'dvc_logs_dir_previous_placeholder'
            )
          },
          {
            columns: [
              {
                id: joinMetricOrParamPath(
                  MetricOrParamType.PARAMS,
                  'params.yaml',
                  'log_file'
                )
              }
            ],
            id: joinMetricOrParamPath(
              MetricOrParamType.PARAMS,
              'params.yaml',
              'log_file_previous_placeholder'
            )
          },
          {
            columns: [
              {
                id: joinMetricOrParamPath(
                  MetricOrParamType.PARAMS,
                  'params.yaml',
                  'dropout'
                )
              }
            ],
            id: joinMetricOrParamPath(
              MetricOrParamType.PARAMS,
              'params.yaml',
              'dropout_previous_placeholder'
            )
          },
          {
            columns: [
              {
                id: joinMetricOrParamPath(
                  MetricOrParamType.PARAMS,
                  'params.yaml',
                  'process',
                  'threshold'
                )
              },
              {
                id: joinMetricOrParamPath(
                  MetricOrParamType.PARAMS,
                  'params.yaml',
                  'process',
                  'test_arg'
                )
              }
            ],
            id: joinMetricOrParamPath(
              MetricOrParamType.PARAMS,
              'params.yaml',
              'process'
            )
          }
        ],
        id: joinMetricOrParamPath(MetricOrParamType.PARAMS, 'params.yaml')
      },
      {
        columns: [
          {
            id: joinMetricOrParamPath(
              MetricOrParamType.PARAMS,
              nestedParamsFile,
              'test'
            )
          }
        ],
        id: joinMetricOrParamPath(MetricOrParamType.PARAMS, nestedParamsFile)
      }
    ])
  })

  it('Correctly parses the deeply nested fixture', () => {
    expect(
      simplifyColumns(
        buildDynamicColumns(
          deeplyNestedColumnsFixture,
          MetricOrParamType.PARAMS
        )
      )
    ).toStrictEqual([
      {
        columns: [
          {
            columns: [
              {
                columns: [
                  {
                    columns: [
                      {
                        id: joinMetricOrParamPath(
                          MetricOrParamType.PARAMS,
                          'params.yaml',
                          'nested1',
                          'doubled'
                        )
                      }
                    ],
                    id: joinMetricOrParamPath(
                      MetricOrParamType.PARAMS,
                      'params.yaml',
                      'nested1',
                      'doubled_previous_placeholder'
                    )
                  }
                ],
                id: joinMetricOrParamPath(
                  MetricOrParamType.PARAMS,
                  'params.yaml',
                  'nested1',
                  'doubled_previous_placeholder'
                )
              }
            ],
            id: joinMetricOrParamPath(
              MetricOrParamType.PARAMS,
              'params.yaml',
              'nested1'
            )
          },
          {
            columns: [
              {
                columns: [
                  {
                    columns: [
                      {
                        id: joinMetricOrParamPath(
                          MetricOrParamType.PARAMS,
                          'params.yaml',
                          'nested1%2Enested2%2Enested3%2Enested4',
                          'nested5',
                          'nested6',
                          'nested7'
                        )
                      }
                    ],
                    id: joinMetricOrParamPath(
                      MetricOrParamType.PARAMS,
                      'params.yaml',
                      'nested1%2Enested2%2Enested3%2Enested4',
                      'nested5',
                      'nested6'
                    )
                  }
                ],
                id: joinMetricOrParamPath(
                  MetricOrParamType.PARAMS,
                  'params.yaml',
                  'nested1%2Enested2%2Enested3%2Enested4',
                  'nested5'
                )
              }
            ],
            id: joinMetricOrParamPath(
              MetricOrParamType.PARAMS,
              'params.yaml',
              'nested1%2Enested2%2Enested3%2Enested4'
            )
          },
          {
            columns: [
              {
                columns: [
                  {
                    columns: [
                      {
                        id: joinMetricOrParamPath(
                          MetricOrParamType.PARAMS,
                          'params.yaml',
                          'nested1%2Enested2%2Enested3',
                          'nested4',
                          'nested5b',
                          'nested6'
                        )
                      },
                      {
                        id: joinMetricOrParamPath(
                          MetricOrParamType.PARAMS,
                          'params.yaml',
                          'nested1%2Enested2%2Enested3',
                          'nested4',
                          'nested5b',
                          'doubled'
                        )
                      }
                    ],
                    id: joinMetricOrParamPath(
                      MetricOrParamType.PARAMS,
                      'params.yaml',
                      'nested1%2Enested2%2Enested3',
                      'nested4',
                      'nested5b'
                    )
                  }
                ],
                id: joinMetricOrParamPath(
                  MetricOrParamType.PARAMS,
                  'params.yaml',
                  'nested1%2Enested2%2Enested3',
                  'nested4'
                )
              }
            ],
            id: joinMetricOrParamPath(
              MetricOrParamType.PARAMS,
              'params.yaml',
              'nested1%2Enested2%2Enested3'
            )
          },
          {
            columns: [
              {
                columns: [
                  {
                    columns: [
                      {
                        id: joinMetricOrParamPath(
                          MetricOrParamType.PARAMS,
                          'params.yaml',
                          'outlier'
                        )
                      }
                    ],
                    id: joinMetricOrParamPath(
                      MetricOrParamType.PARAMS,
                      'params.yaml',
                      'outlier_previous_placeholder'
                    )
                  }
                ],
                id: joinMetricOrParamPath(
                  MetricOrParamType.PARAMS,
                  'params.yaml',
                  'outlier_previous_placeholder'
                )
              }
            ],
            id: joinMetricOrParamPath(
              MetricOrParamType.PARAMS,
              'params.yaml',
              'outlier_previous_placeholder'
            )
          }
        ],
        id: joinMetricOrParamPath(MetricOrParamType.PARAMS, 'params.yaml')
      }
    ])
  })

  it('Correctly parses a minimal input with a single-depth column at the start', () => {
    const input = collectMetricsAndParams({
      workspace: {
        baseline: {
          data: {
            params: {
              'params.yaml': {
                data: {
                  a: 'b',
                  c: {
                    d: 'e'
                  }
                }
              }
            }
          }
        }
      }
    })
    expect(
      simplifyColumns(buildDynamicColumns(input, MetricOrParamType.PARAMS))
    ).toStrictEqual([
      {
        columns: [
          {
            columns: [
              {
                id: joinMetricOrParamPath(
                  MetricOrParamType.PARAMS,
                  'params.yaml',
                  'a'
                )
              }
            ],
            id: joinMetricOrParamPath(
              MetricOrParamType.PARAMS,
              'params.yaml',
              'a_previous_placeholder'
            )
          },
          {
            columns: [
              {
                id: joinMetricOrParamPath(
                  MetricOrParamType.PARAMS,
                  'params.yaml',
                  'c',
                  'd'
                )
              }
            ],
            id: joinMetricOrParamPath(
              MetricOrParamType.PARAMS,
              'params.yaml',
              'c'
            )
          }
        ],
        id: joinMetricOrParamPath(MetricOrParamType.PARAMS, 'params.yaml')
      }
    ])
  })

  it('Correctly parses a minimal input with a single-depth number-keyed column at the end', () => {
    const input = collectMetricsAndParams({
      workspace: {
        baseline: {
          data: {
            params: {
              'params.yaml': {
                data: {
                  c: {
                    d: 'e'
                  },
                  1: 'g'
                }
              }
            }
          }
        }
      }
    })
    expect(
      simplifyColumns(buildDynamicColumns(input, MetricOrParamType.PARAMS))
    ).toStrictEqual([
      {
        columns: [
          {
            columns: [
              {
                id: joinMetricOrParamPath(
                  MetricOrParamType.PARAMS,
                  'params.yaml',
                  '1'
                )
              }
            ],
            id: joinMetricOrParamPath(
              MetricOrParamType.PARAMS,
              'params.yaml',
              '1_previous_placeholder'
            )
          },
          {
            columns: [
              {
                id: joinMetricOrParamPath(
                  MetricOrParamType.PARAMS,
                  'params.yaml',
                  'c',
                  'd'
                )
              }
            ],
            id: joinMetricOrParamPath(
              MetricOrParamType.PARAMS,
              'params.yaml',
              'c'
            )
          }
        ],
        id: joinMetricOrParamPath(MetricOrParamType.PARAMS, 'params.yaml')
      }
    ])
  })

  it('Correctly parses a minimal input with a single-depth string-keyed column at the end', () => {
    const input = collectMetricsAndParams({
      workspace: {
        baseline: {
          data: {
            params: {
              'params.yaml': {
                data: {
                  c: {
                    d: 'e'
                  },
                  f: 'g'
                }
              }
            }
          }
        }
      }
    })
    expect(
      simplifyColumns(buildDynamicColumns(input, MetricOrParamType.PARAMS))
    ).toStrictEqual([
      {
        columns: [
          {
            columns: [
              {
                id: joinMetricOrParamPath(
                  MetricOrParamType.PARAMS,
                  'params.yaml',
                  'c',
                  'd'
                )
              }
            ],
            id: joinMetricOrParamPath(
              MetricOrParamType.PARAMS,
              'params.yaml',
              'c'
            )
          },
          {
            columns: [
              {
                id: joinMetricOrParamPath(
                  MetricOrParamType.PARAMS,
                  'params.yaml',
                  'f'
                )
              }
            ],
            id: joinMetricOrParamPath(
              MetricOrParamType.PARAMS,
              'params.yaml',
              'f_previous_placeholder'
            )
          }
        ],
        id: joinMetricOrParamPath(MetricOrParamType.PARAMS, 'params.yaml')
      }
    ])
  })
})
