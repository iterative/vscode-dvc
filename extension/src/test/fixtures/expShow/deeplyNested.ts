import { ExperimentsOutput } from '../../../cli/reader'
import { collectColumns } from '../../../experiments/columns/collect'
import { collectExperiments } from '../../../experiments/model/collect'
import { copyOriginalColors } from '../../../experiments/model/status/colors'
import { TableData } from '../../../experiments/webview/contract'

export const deeplyNestedOutput: ExperimentsOutput = {
  workspace: {
    baseline: {
      data: {
        timestamp: null,
        params: {
          'params.yaml': {
            data: {
              nested1: {
                doubled: 'first instance!',
                nested2: {
                  nested3: {
                    nested4: {
                      nested5: { nested6: { nested7: 'Lucky!' } },
                      nested5b: {
                        nested6: 'Wow!!!!!!!!!!!!!!!!!!!!',
                        doubled: 'second instance!'
                      }
                    }
                  }
                }
              },
              outlier: 1
            }
          }
        },
        queued: false,
        running: false,
        executor: null
      }
    }
  },
  '53c3851f46955fa3e2b8f6e1c52999acc8c9ea77': {
    baseline: {
      data: {
        timestamp: '2020-11-21T19:58:22',
        params: {
          'params.yaml': {
            data: {
              nested1: {
                doubled: 'first instance!',
                nested2: {
                  nested3: {
                    nested4: {
                      nested5: { nested6: { nested7: 'Lucky!' } },
                      nested5b: {
                        nested6: 'Wow!!!!!!!!!!!!!!!!!!!!',
                        doubled: 'second instance!'
                      }
                    }
                  }
                }
              },
              outlier: 1
            }
          }
        },
        queued: false,
        running: false,
        executor: null,
        name: 'main'
      }
    }
  }
}

export const columns = collectColumns(deeplyNestedOutput)

const { workspace, branches } = collectExperiments(deeplyNestedOutput)
const colors = copyOriginalColors()
export const rows = [
  { ...workspace, displayColor: colors[0] },
  ...branches.map((branch, i) => ({ ...branch, displayColor: colors[i + 1] }))
]

const deeplyNestedTableData: TableData = {
  changes: [],
  columnOrder: [],
  columnWidths: {},
  sorts: [
    {
      path: 'params:params.yaml:nested1.doubled',
      descending: true
    },
    {
      path: 'params:params.yaml:outlier',
      descending: false
    },
    {
      path: 'params:params.yaml:nested1%2Enested2%2Enested3.nested4.nested5b.nested6',
      descending: false
    },
    {
      path: 'params:params.yaml:nested1%2Enested2%2Enested3.nested4.nested5b.doubled',
      descending: true
    }
  ],
  columns,
  rows
}

export default deeplyNestedTableData
