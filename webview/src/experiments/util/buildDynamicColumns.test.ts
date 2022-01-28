/* eslint-disable sort-keys-fix/sort-keys-fix */
import { join } from 'path'
import { ColumnGroup } from 'react-table'
import { Experiment } from 'dvc/src/experiments/webview/contract'
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
        ...buildDynamicColumns(columnsFixture, 'metrics'),
        ...buildDynamicColumns(columnsFixture, 'params')
      ])
    ).toEqual([
      {
        columns: [
          { id: joinMetricOrParamPath('metrics', 'summary.json', 'loss') },
          { id: joinMetricOrParamPath('metrics', 'summary.json', 'accuracy') },
          { id: joinMetricOrParamPath('metrics', 'summary.json', 'val_loss') },
          {
            id: joinMetricOrParamPath('metrics', 'summary.json', 'val_accuracy')
          }
        ],
        id: joinMetricOrParamPath('metrics', 'summary.json')
      },
      {
        columns: [
          {
            columns: [
              { id: joinMetricOrParamPath('params', 'params.yaml', 'epochs') }
            ],
            id: joinMetricOrParamPath(
              'params',
              'params.yaml',
              'epochs_previous_placeholder'
            )
          },
          {
            columns: [
              {
                id: joinMetricOrParamPath(
                  'params',
                  'params.yaml',
                  'learning_rate'
                )
              }
            ],
            id: joinMetricOrParamPath(
              'params',
              'params.yaml',
              'learning_rate_previous_placeholder'
            )
          },
          {
            columns: [
              {
                id: joinMetricOrParamPath(
                  'params',
                  'params.yaml',
                  'dvc_logs_dir'
                )
              }
            ],
            id: joinMetricOrParamPath(
              'params',
              'params.yaml',
              'dvc_logs_dir_previous_placeholder'
            )
          },
          {
            columns: [
              { id: joinMetricOrParamPath('params', 'params.yaml', 'log_file') }
            ],
            id: joinMetricOrParamPath(
              'params',
              'params.yaml',
              'log_file_previous_placeholder'
            )
          },
          {
            columns: [
              { id: joinMetricOrParamPath('params', 'params.yaml', 'dropout') }
            ],
            id: joinMetricOrParamPath(
              'params',
              'params.yaml',
              'dropout_previous_placeholder'
            )
          },
          {
            columns: [
              {
                id: joinMetricOrParamPath(
                  'params',
                  'params.yaml',
                  'process',
                  'threshold'
                )
              },
              {
                id: joinMetricOrParamPath(
                  'params',
                  'params.yaml',
                  'process',
                  'test_arg'
                )
              }
            ],
            id: joinMetricOrParamPath('params', 'params.yaml', 'process')
          }
        ],
        id: joinMetricOrParamPath('params', 'params.yaml')
      },
      {
        columns: [
          { id: joinMetricOrParamPath('params', nestedParamsFile, 'test') }
        ],
        id: joinMetricOrParamPath('params', nestedParamsFile)
      }
    ])
  })

  it('Correctly parses the deeply nested fixture', () => {
    expect(
      simplifyColumns(buildDynamicColumns(deeplyNestedColumnsFixture, 'params'))
    ).toEqual([
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
                          'params',
                          'params.yaml',
                          'nested1',
                          'doubled'
                        )
                      }
                    ],
                    id: joinMetricOrParamPath(
                      'params',
                      'params.yaml',
                      'nested1',
                      'doubled_previous_placeholder'
                    )
                  }
                ],
                id: joinMetricOrParamPath(
                  'params',
                  'params.yaml',
                  'nested1',
                  'doubled_previous_placeholder'
                )
              }
            ],
            id: joinMetricOrParamPath('params', 'params.yaml', 'nested1')
          },
          {
            columns: [
              {
                columns: [
                  {
                    columns: [
                      {
                        id: joinMetricOrParamPath(
                          'params',
                          'params.yaml',
                          'nested1%2Enested2%2Enested3%2Enested4',
                          'nested5',
                          'nested6',
                          'nested7'
                        )
                      }
                    ],
                    id: joinMetricOrParamPath(
                      'params',
                      'params.yaml',
                      'nested1%2Enested2%2Enested3%2Enested4',
                      'nested5',
                      'nested6'
                    )
                  }
                ],
                id: joinMetricOrParamPath(
                  'params',
                  'params.yaml',
                  'nested1%2Enested2%2Enested3%2Enested4',
                  'nested5'
                )
              }
            ],
            id: joinMetricOrParamPath(
              'params',
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
                          'params',
                          'params.yaml',
                          'nested1%2Enested2%2Enested3',
                          'nested4',
                          'nested5b',
                          'nested6'
                        )
                      },
                      {
                        id: joinMetricOrParamPath(
                          'params',
                          'params.yaml',
                          'nested1%2Enested2%2Enested3',
                          'nested4',
                          'nested5b',
                          'doubled'
                        )
                      }
                    ],
                    id: joinMetricOrParamPath(
                      'params',
                      'params.yaml',
                      'nested1%2Enested2%2Enested3',
                      'nested4',
                      'nested5b'
                    )
                  }
                ],
                id: joinMetricOrParamPath(
                  'params',
                  'params.yaml',
                  'nested1%2Enested2%2Enested3',
                  'nested4'
                )
              }
            ],
            id: joinMetricOrParamPath(
              'params',
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
                          'params',
                          'params.yaml',
                          'outlier'
                        )
                      }
                    ],
                    id: joinMetricOrParamPath(
                      'params',
                      'params.yaml',
                      'outlier_previous_placeholder'
                    )
                  }
                ],
                id: joinMetricOrParamPath(
                  'params',
                  'params.yaml',
                  'outlier_previous_placeholder'
                )
              }
            ],
            id: joinMetricOrParamPath(
              'params',
              'params.yaml',
              'outlier_previous_placeholder'
            )
          }
        ],
        id: joinMetricOrParamPath('params', 'params.yaml')
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
    expect(simplifyColumns(buildDynamicColumns(input, 'params'))).toEqual([
      {
        columns: [
          {
            columns: [
              { id: joinMetricOrParamPath('params', 'params.yaml', 'a') }
            ],
            id: joinMetricOrParamPath(
              'params',
              'params.yaml',
              'a_previous_placeholder'
            )
          },
          {
            columns: [
              { id: joinMetricOrParamPath('params', 'params.yaml', 'c', 'd') }
            ],
            id: joinMetricOrParamPath('params', 'params.yaml', 'c')
          }
        ],
        id: joinMetricOrParamPath('params', 'params.yaml')
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
    expect(simplifyColumns(buildDynamicColumns(input, 'params'))).toEqual([
      {
        columns: [
          {
            columns: [
              { id: joinMetricOrParamPath('params', 'params.yaml', '1') }
            ],
            id: joinMetricOrParamPath(
              'params',
              'params.yaml',
              '1_previous_placeholder'
            )
          },
          {
            columns: [
              { id: joinMetricOrParamPath('params', 'params.yaml', 'c', 'd') }
            ],
            id: joinMetricOrParamPath('params', 'params.yaml', 'c')
          }
        ],
        id: joinMetricOrParamPath('params', 'params.yaml')
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
      simplifyColumns(
        buildDynamicColumns(input, joinMetricOrParamPath('params'))
      )
    ).toEqual([
      {
        columns: [
          {
            columns: [
              { id: joinMetricOrParamPath('params', 'params.yaml', 'c', 'd') }
            ],
            id: joinMetricOrParamPath('params', 'params.yaml', 'c')
          },
          {
            columns: [
              { id: joinMetricOrParamPath('params', 'params.yaml', 'f') }
            ],
            id: joinMetricOrParamPath(
              'params',
              'params.yaml',
              'f_previous_placeholder'
            )
          }
        ],
        id: joinMetricOrParamPath('params', 'params.yaml')
      }
    ])
  })
})
