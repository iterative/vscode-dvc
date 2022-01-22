import { ColumnGroup } from 'react-table'
import { Experiment } from 'dvc/src/experiments/webview/contract'
import { collectMetricsAndParams } from 'dvc/src/experiments/metricsAndParams/collect'
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

  it('Correctly parses a minimal input with a single-depth column at the end', () => {
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
