/* eslint-disable sort-keys-fix/sort-keys-fix */
import { ColumnGroup } from 'react-table'
import { Experiment } from 'dvc/src/experiments/webview/contract'
import { collectMetricsAndParams } from 'dvc/src/experiments/metricsAndParams/collect'
import { columns as deeplyNestedColumns } from 'dvc/src/test/fixtures/expShow/deeplyNested'
import buildDynamicColumns from './buildDynamicColumns'

interface MinimalColumn {
  id?: string
  columns?: MinimalColumn[]
}

const simplifyColumns = (columns: ColumnGroup<Experiment>[]) =>
  columns.map(({ id, columns }) => {
    const newColumn: MinimalColumn = { id }
    if (columns) {
      newColumn.columns = simplifyColumns(columns as ColumnGroup<Experiment>[])
    }
    return newColumn
  })

describe('buildDynamicColumns', () => {
  it('Correctly parses the deeply nested fixture', () => {
    expect(
      simplifyColumns(buildDynamicColumns(deeplyNestedColumns, 'params'))
    ).toEqual([
      {
        columns: [
          {
            columns: [
              {
                columns: [
                  {
                    columns: [{ id: 'params:params.yaml:nested1.doubled' }],
                    id: 'params:params.yaml:nested1.doubled_previous_placeholder'
                  }
                ],
                id: 'params:params.yaml:nested1.doubled_previous_placeholder'
              }
            ],
            id: 'params:params.yaml:nested1'
          },
          {
            columns: [
              {
                columns: [
                  {
                    columns: [
                      {
                        id: 'params:params.yaml:nested1%2Enested2%2Enested3%2Enested4.nested5.nested6.nested7'
                      }
                    ],
                    id: 'params:params.yaml:nested1%2Enested2%2Enested3%2Enested4.nested5.nested6'
                  }
                ],
                id: 'params:params.yaml:nested1%2Enested2%2Enested3%2Enested4.nested5'
              }
            ],
            id: 'params:params.yaml:nested1%2Enested2%2Enested3%2Enested4'
          },
          {
            columns: [
              {
                columns: [
                  {
                    columns: [
                      {
                        id: 'params:params.yaml:nested1%2Enested2%2Enested3.nested4.nested5b.nested6'
                      },
                      {
                        id: 'params:params.yaml:nested1%2Enested2%2Enested3.nested4.nested5b.doubled'
                      }
                    ],
                    id: 'params:params.yaml:nested1%2Enested2%2Enested3.nested4.nested5b'
                  }
                ],
                id: 'params:params.yaml:nested1%2Enested2%2Enested3.nested4'
              }
            ],
            id: 'params:params.yaml:nested1%2Enested2%2Enested3'
          },
          {
            columns: [
              {
                columns: [
                  {
                    columns: [{ id: 'params:params.yaml:outlier' }],
                    id: 'params:params.yaml:outlier_previous_placeholder'
                  }
                ],
                id: 'params:params.yaml:outlier_previous_placeholder'
              }
            ],
            id: 'params:params.yaml:outlier_previous_placeholder'
          }
        ],
        id: 'params:params.yaml'
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
            columns: [{ id: 'params:params.yaml:a' }],
            id: 'params:params.yaml:a_previous_placeholder'
          },
          {
            columns: [{ id: 'params:params.yaml:c.d' }],
            id: 'params:params.yaml:c'
          }
        ],
        id: 'params:params.yaml'
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
            columns: [{ id: 'params:params.yaml:1' }],
            id: 'params:params.yaml:1_previous_placeholder'
          },
          {
            columns: [{ id: 'params:params.yaml:c.d' }],
            id: 'params:params.yaml:c'
          }
        ],
        id: 'params:params.yaml'
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
    expect(simplifyColumns(buildDynamicColumns(input, 'params'))).toEqual([
      {
        columns: [
          {
            columns: [{ id: 'params:params.yaml:c.d' }],
            id: 'params:params.yaml:c'
          },
          {
            columns: [{ id: 'params:params.yaml:f' }],
            id: 'params:params.yaml:f_previous_placeholder'
          }
        ],
        id: 'params:params.yaml'
      }
    ])
  })
})
