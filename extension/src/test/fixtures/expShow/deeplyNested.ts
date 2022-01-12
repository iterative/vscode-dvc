import { ExperimentsOutput } from '../../../cli/reader'
import { collectMetricsAndParams } from '../../../experiments/metricsAndParams/collect'
import { collectExperiments } from '../../../experiments/model/collect'
import { TableData } from '../../../experiments/webview/contract'

export const deeplyNestedOutput: ExperimentsOutput = {
  workspace: {
    baseline: {
      data: {
        timestamp: null,
        params: {
          'params.yaml': {
            data: {
              outlier: 1,
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
              }
            }
          }
        },
        queued: false,
        running: false,
        executor: null,
        metrics: {
          'logs.json': {
            data: { step: 9, loss: 1.1647908687591553, acc: 0.752 }
          }
        }
      }
    }
  },
  a665ebd62d35b60fbe523e0df9406f3f2597d02f: {
    baseline: {
      data: {
        timestamp: '2022-01-11T15:01:20',
        params: {
          'params.yaml': {
            data: { seed: 473987, lr: 0.0005, weight_decay: 0 }
          }
        },
        queued: false,
        running: false,
        executor: null,
        metrics: {
          'logs.json': {
            data: { step: 9, loss: 1.1647908687591553, acc: 0.752 }
          }
        },
        name: 'collect-column-nesting-concatenation'
      }
    },
    c49930846dc34acd7d7c7d38651c510b2a945871: {
      data: {
        checkpoint_tip: 'c49930846dc34acd7d7c7d38651c510b2a945871',
        timestamp: '2022-01-11T15:30:32',
        params: {
          'params.yaml': {
            data: { seed: 473987, lr: 0.0005, weight_decay: 0 }
          }
        },
        queued: false,
        running: false,
        executor: null,
        metrics: {
          'logs.json': {
            data: { step: 1, loss: 1.039016604423523, acc: 0.7703 }
          }
        },
        name: 'exp-4ec3d',
        checkpoint_parent: '6a7a64c7077ec63a6e64bfc43d11f6047b62055f'
      }
    },
    '6a7a64c7077ec63a6e64bfc43d11f6047b62055f': {
      data: {
        checkpoint_tip: 'c49930846dc34acd7d7c7d38651c510b2a945871',
        timestamp: '2022-01-11T15:30:31',
        params: {
          'params.yaml': {
            data: { seed: 473987, lr: 0.0005, weight_decay: 0 }
          }
        },
        queued: false,
        running: false,
        executor: null,
        metrics: {
          'logs.json': {
            data: { step: 1, loss: 1.039016604423523, acc: 0.7703 }
          }
        },
        checkpoint_parent: '2dc16b478ac6a1e83d06bfe800227168a0a17007'
      }
    },
    '2dc16b478ac6a1e83d06bfe800227168a0a17007': {
      data: {
        checkpoint_tip: 'c49930846dc34acd7d7c7d38651c510b2a945871',
        timestamp: '2022-01-11T15:30:23',
        params: {
          'params.yaml': {
            data: { seed: 473987, lr: 0.0005, weight_decay: 0 }
          }
        },
        queued: false,
        running: false,
        executor: null,
        metrics: {
          'logs.json': {
            data: { step: 0, loss: 1.060091495513916, acc: 0.754 }
          }
        },
        checkpoint_parent: 'a665ebd62d35b60fbe523e0df9406f3f2597d02f'
      }
    }
  }
}

const columns = collectMetricsAndParams(deeplyNestedOutput)
const { workspace, branches } = collectExperiments(deeplyNestedOutput)
const rows = [workspace, ...branches]

const deeplyNestedTableData: TableData = {
  changes: [],
  columnOrder: [],
  columnWidths: {},
  sorts: [],
  columns,
  rows
}

export default deeplyNestedTableData
