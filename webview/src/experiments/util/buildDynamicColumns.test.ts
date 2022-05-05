/* eslint-disable sort-keys-fix/sort-keys-fix */
import { join } from 'dvc/src/test/util/path'
import { ColumnGroup } from 'react-table'
import { Experiment, ColumnType } from 'dvc/src/experiments/webview/contract'
import { collectColumns } from 'dvc/src/experiments/columns/collect'
import { columns as deeplyNestedColumnsFixture } from 'dvc/src/test/fixtures/expShow/deeplyNested'
import columnsFixture from 'dvc/src/test/fixtures/expShow/columns'
import { joinColumnPath } from 'dvc/src/experiments/columns/paths'
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
        ...buildDynamicColumns(columnsFixture, ColumnType.METRICS),
        ...buildDynamicColumns(columnsFixture, ColumnType.PARAMS)
      ])
    ).toStrictEqual([
      {
        columns: [
          {
            id: joinColumnPath(ColumnType.METRICS, 'summary.json', 'loss')
          },
          {
            id: joinColumnPath(ColumnType.METRICS, 'summary.json', 'accuracy')
          },
          {
            id: joinColumnPath(ColumnType.METRICS, 'summary.json', 'val_loss')
          },
          {
            id: joinColumnPath(
              ColumnType.METRICS,
              'summary.json',
              'val_accuracy'
            )
          }
        ],
        id: joinColumnPath(ColumnType.METRICS, 'summary.json')
      },
      {
        columns: [
          {
            columns: [
              {
                id: joinColumnPath(ColumnType.PARAMS, 'params.yaml', 'epochs')
              }
            ],
            id: joinColumnPath(
              ColumnType.PARAMS,
              'params.yaml',
              'epochs_previous_placeholder'
            )
          },
          {
            columns: [
              {
                id: joinColumnPath(
                  ColumnType.PARAMS,
                  'params.yaml',
                  'learning_rate'
                )
              }
            ],
            id: joinColumnPath(
              ColumnType.PARAMS,
              'params.yaml',
              'learning_rate_previous_placeholder'
            )
          },
          {
            columns: [
              {
                id: joinColumnPath(
                  ColumnType.PARAMS,
                  'params.yaml',
                  'dvc_logs_dir'
                )
              }
            ],
            id: joinColumnPath(
              ColumnType.PARAMS,
              'params.yaml',
              'dvc_logs_dir_previous_placeholder'
            )
          },
          {
            columns: [
              {
                id: joinColumnPath(ColumnType.PARAMS, 'params.yaml', 'log_file')
              }
            ],
            id: joinColumnPath(
              ColumnType.PARAMS,
              'params.yaml',
              'log_file_previous_placeholder'
            )
          },
          {
            columns: [
              {
                id: joinColumnPath(ColumnType.PARAMS, 'params.yaml', 'dropout')
              }
            ],
            id: joinColumnPath(
              ColumnType.PARAMS,
              'params.yaml',
              'dropout_previous_placeholder'
            )
          },
          {
            columns: [
              {
                id: joinColumnPath(
                  ColumnType.PARAMS,
                  'params.yaml',
                  'process',
                  'threshold'
                )
              },
              {
                id: joinColumnPath(
                  ColumnType.PARAMS,
                  'params.yaml',
                  'process',
                  'test_arg'
                )
              }
            ],
            id: joinColumnPath(ColumnType.PARAMS, 'params.yaml', 'process')
          }
        ],
        id: joinColumnPath(ColumnType.PARAMS, 'params.yaml')
      },
      {
        columns: [
          {
            id: joinColumnPath(ColumnType.PARAMS, nestedParamsFile, 'test')
          }
        ],
        id: joinColumnPath(ColumnType.PARAMS, nestedParamsFile)
      }
    ])
  })

  it('Correctly parses the deeply nested fixture', () => {
    expect(
      simplifyColumns(
        buildDynamicColumns(deeplyNestedColumnsFixture, ColumnType.PARAMS)
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
                        id: joinColumnPath(
                          ColumnType.PARAMS,
                          'params.yaml',
                          'nested1',
                          'doubled'
                        )
                      }
                    ],
                    id: joinColumnPath(
                      ColumnType.PARAMS,
                      'params.yaml',
                      'nested1',
                      'doubled_previous_placeholder'
                    )
                  }
                ],
                id: joinColumnPath(
                  ColumnType.PARAMS,
                  'params.yaml',
                  'nested1',
                  'doubled_previous_placeholder'
                )
              }
            ],
            id: joinColumnPath(ColumnType.PARAMS, 'params.yaml', 'nested1')
          },
          {
            columns: [
              {
                columns: [
                  {
                    columns: [
                      {
                        id: joinColumnPath(
                          ColumnType.PARAMS,
                          'params.yaml',
                          'nested1%2Enested2%2Enested3%2Enested4',
                          'nested5',
                          'nested6',
                          'nested7'
                        )
                      }
                    ],
                    id: joinColumnPath(
                      ColumnType.PARAMS,
                      'params.yaml',
                      'nested1%2Enested2%2Enested3%2Enested4',
                      'nested5',
                      'nested6'
                    )
                  }
                ],
                id: joinColumnPath(
                  ColumnType.PARAMS,
                  'params.yaml',
                  'nested1%2Enested2%2Enested3%2Enested4',
                  'nested5'
                )
              }
            ],
            id: joinColumnPath(
              ColumnType.PARAMS,
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
                        id: joinColumnPath(
                          ColumnType.PARAMS,
                          'params.yaml',
                          'nested1%2Enested2%2Enested3',
                          'nested4',
                          'nested5b',
                          'nested6'
                        )
                      },
                      {
                        id: joinColumnPath(
                          ColumnType.PARAMS,
                          'params.yaml',
                          'nested1%2Enested2%2Enested3',
                          'nested4',
                          'nested5b',
                          'doubled'
                        )
                      }
                    ],
                    id: joinColumnPath(
                      ColumnType.PARAMS,
                      'params.yaml',
                      'nested1%2Enested2%2Enested3',
                      'nested4',
                      'nested5b'
                    )
                  }
                ],
                id: joinColumnPath(
                  ColumnType.PARAMS,
                  'params.yaml',
                  'nested1%2Enested2%2Enested3',
                  'nested4'
                )
              }
            ],
            id: joinColumnPath(
              ColumnType.PARAMS,
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
                        id: joinColumnPath(
                          ColumnType.PARAMS,
                          'params.yaml',
                          'outlier'
                        )
                      }
                    ],
                    id: joinColumnPath(
                      ColumnType.PARAMS,
                      'params.yaml',
                      'outlier_previous_placeholder'
                    )
                  }
                ],
                id: joinColumnPath(
                  ColumnType.PARAMS,
                  'params.yaml',
                  'outlier_previous_placeholder'
                )
              }
            ],
            id: joinColumnPath(
              ColumnType.PARAMS,
              'params.yaml',
              'outlier_previous_placeholder'
            )
          }
        ],
        id: joinColumnPath(ColumnType.PARAMS, 'params.yaml')
      }
    ])
  })

  it('Correctly parses a minimal input with a single-depth column at the start', () => {
    const input = collectColumns({
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
      simplifyColumns(buildDynamicColumns(input, ColumnType.PARAMS))
    ).toStrictEqual([
      {
        columns: [
          {
            columns: [
              {
                id: joinColumnPath(ColumnType.PARAMS, 'params.yaml', 'a')
              }
            ],
            id: joinColumnPath(
              ColumnType.PARAMS,
              'params.yaml',
              'a_previous_placeholder'
            )
          },
          {
            columns: [
              {
                id: joinColumnPath(ColumnType.PARAMS, 'params.yaml', 'c', 'd')
              }
            ],
            id: joinColumnPath(ColumnType.PARAMS, 'params.yaml', 'c')
          }
        ],
        id: joinColumnPath(ColumnType.PARAMS, 'params.yaml')
      }
    ])
  })

  it('Correctly parses a minimal input with a single-depth number-keyed column at the end', () => {
    const input = collectColumns({
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
      simplifyColumns(buildDynamicColumns(input, ColumnType.PARAMS))
    ).toStrictEqual([
      {
        columns: [
          {
            columns: [
              {
                id: joinColumnPath(ColumnType.PARAMS, 'params.yaml', '1')
              }
            ],
            id: joinColumnPath(
              ColumnType.PARAMS,
              'params.yaml',
              '1_previous_placeholder'
            )
          },
          {
            columns: [
              {
                id: joinColumnPath(ColumnType.PARAMS, 'params.yaml', 'c', 'd')
              }
            ],
            id: joinColumnPath(ColumnType.PARAMS, 'params.yaml', 'c')
          }
        ],
        id: joinColumnPath(ColumnType.PARAMS, 'params.yaml')
      }
    ])
  })

  it('Correctly parses a minimal input with a single-depth string-keyed column at the end', () => {
    const input = collectColumns({
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
      simplifyColumns(buildDynamicColumns(input, ColumnType.PARAMS))
    ).toStrictEqual([
      {
        columns: [
          {
            columns: [
              {
                id: joinColumnPath(ColumnType.PARAMS, 'params.yaml', 'c', 'd')
              }
            ],
            id: joinColumnPath(ColumnType.PARAMS, 'params.yaml', 'c')
          },
          {
            columns: [
              {
                id: joinColumnPath(ColumnType.PARAMS, 'params.yaml', 'f')
              }
            ],
            id: joinColumnPath(
              ColumnType.PARAMS,
              'params.yaml',
              'f_previous_placeholder'
            )
          }
        ],
        id: joinColumnPath(ColumnType.PARAMS, 'params.yaml')
      }
    ])
  })
})
