import '@testing-library/jest-dom/extend-expect'
import { render, screen } from '@testing-library/react'
import React, { createRef } from 'react'
import { Table } from '@tanstack/react-table'
import { Experiment } from 'dvc/src/experiments/webview/contract'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import tableData from 'dvc/src/test/fixtures/expShow/base/tableData'
import { TableContent } from './TableContent'
import { experimentsReducers } from '../../../store'

jest.mock('../../../../shared/api')
jest.mock('./ExperimentGroup')
jest.mock('./Row')

describe('TableContent', () => {
  const mockedGetIsExpanded = jest.fn()
  const mockedGetAllCells = jest.fn().mockReturnValue([1, 2, 3, 4, 5]) // Only needed as length
  const instance = {
    getRowModel: () => ({
      flatRows: [
        {
          columnFilters: {},
          columnFiltersMeta: {},
          depth: 0,
          id: '1',
          index: 1,
          original: {
            Created: '2023-04-20T05:14:46',
            branch: 'current',
            commit: {
              author: 'Matt Seddon',
              date: '31 hours ago',
              message: 'Update dependency dvc to v2.55.0 (#76)\n\n',
              tags: []
            },
            deps: {
              data: {
                changes: false,
                value: 'ab3353d'
              },
              'train.py': {
                changes: false,
                value: 'f431663'
              }
            },
            description: 'Update dependency dvc to v2.55.0 (#76)',
            id: 'a9b32d1',
            label: 'a9b32d1',
            metrics: {
              'training/metrics.json': {
                step: 14,
                test: {
                  acc: 0.7735,
                  loss: 0.9596208930015564
                },
                train: {
                  acc: 0.7694,
                  loss: 0.9731049537658691
                }
              }
            },
            params: {
              'params.yaml': {
                epochs: 15,
                lr: 0.003,
                weight_decay: 0
              }
            },
            selected: false,
            sha: 'a9b32d14966b9be1396f2211d9eb743359708a07',
            starred: false,
            subRows: [
              {
                Created: '2023-04-21T12:04:32',
                deps: {
                  data: {
                    changes: false,
                    value: 'ab3353d'
                  },
                  'train.py': {
                    changes: false,
                    value: 'f431663'
                  }
                },
                description: '[prize-luce]',
                id: 'prize-luce',
                label: 'ae4100a',
                metrics: {
                  'training/metrics.json': {
                    step: 14,
                    test: {
                      acc: 0.7735,
                      loss: 0.9596208930015564
                    },
                    train: {
                      acc: 0.7694,
                      loss: 0.9731049537658691
                    }
                  }
                },
                params: {
                  'params.yaml': {
                    epochs: 15,
                    lr: 0.003,
                    weight_decay: 0
                  }
                },
                selected: false,
                sha: 'ae4100a4b4a972c3ceffa3062739845d944b3ddf',
                starred: false
              }
            ]
          },
          originalSubRows: [
            {
              Created: '2023-04-21T12:04:32',
              branch: 'current',
              deps: {
                data: {
                  changes: false,
                  value: 'ab3353d'
                },
                'train.py': {
                  changes: false,
                  value: 'f431663'
                }
              },
              description: '[prize-luce]',
              id: 'prize-luce',
              label: 'ae4100a',
              metrics: {
                'training/metrics.json': {
                  step: 14,
                  test: {
                    acc: 0.7735,
                    loss: 0.9596208930015564
                  },
                  train: {
                    acc: 0.7694,
                    loss: 0.9731049537658691
                  }
                }
              },
              params: {
                'params.yaml': {
                  epochs: 15,
                  lr: 0.003,
                  weight_decay: 0
                }
              },
              selected: false,
              sha: 'ae4100a4b4a972c3ceffa3062739845d944b3ddf',
              starred: false
            }
          ],
          subRows: [
            {
              depth: 1,
              id: '1.prize-luce',
              index: 0,
              original: {
                Created: '2023-04-21T12:04:32',
                branch: 'current',
                deps: {
                  data: {
                    changes: false,
                    value: 'ab3353d'
                  },
                  'train.py': {
                    changes: false,
                    value: 'f431663'
                  }
                },
                description: '[prize-luce]',
                id: 'prize-luce',
                label: 'ae4100a',
                metrics: {
                  'training/metrics.json': {
                    step: 14,
                    test: {
                      acc: 0.7735,
                      loss: 0.9596208930015564
                    },
                    train: {
                      acc: 0.7694,
                      loss: 0.9731049537658691
                    }
                  }
                },
                params: {
                  'params.yaml': {
                    epochs: 15,
                    lr: 0.003,
                    weight_decay: 0
                  }
                },
                selected: false,
                sha: 'ae4100a4b4a972c3ceffa3062739845d944b3ddf',
                starred: false
              },
              parentId: '1',
              subRows: []
            }
          ]
        },
        {
          depth: 0,
          id: '1',
          index: 1,
          original: {
            Created: '2023-04-20T05:14:46',
            branch: 'current',
            commit: {
              author: 'Matt Seddon',
              date: '31 hours ago',
              message: 'Update dependency dvc to v2.55.0 (#76)\n\n',
              tags: []
            },
            deps: {
              data: {
                changes: false,
                value: 'ab3353d'
              },
              'train.py': {
                changes: false,
                value: 'f431663'
              }
            },
            description: 'Update dependency dvc to v2.55.0 (#76)',
            id: 'a9b32d1',
            label: 'a9b32d1',
            metrics: {
              'training/metrics.json': {
                step: 14,
                test: {
                  acc: 0.7735,
                  loss: 0.9596208930015564
                },
                train: {
                  acc: 0.7694,
                  loss: 0.9731049537658691
                }
              }
            },
            params: {
              'params.yaml': {
                epochs: 15,
                lr: 0.003,
                weight_decay: 0
              }
            },
            selected: false,
            sha: 'a9b32d14966b9be1396f2211d9eb743359708a07',
            starred: false,
            subRows: [
              {
                Created: '2023-04-21T12:04:32',
                deps: {
                  data: {
                    changes: false,
                    value: 'ab3353d'
                  },
                  'train.py': {
                    changes: false,
                    value: 'f431663'
                  }
                },
                description: '[prize-luce]',
                id: 'prize-luce',
                label: 'ae4100a',
                metrics: {
                  'training/metrics.json': {
                    step: 14,
                    test: {
                      acc: 0.7735,
                      loss: 0.9596208930015564
                    },
                    train: {
                      acc: 0.7694,
                      loss: 0.9731049537658691
                    }
                  }
                },
                params: {
                  'params.yaml': {
                    epochs: 15,
                    lr: 0.003,
                    weight_decay: 0
                  }
                },
                selected: false,
                sha: 'ae4100a4b4a972c3ceffa3062739845d944b3ddf',
                starred: false
              }
            ]
          },
          originalSubRows: [
            {
              Created: '2023-04-21T12:04:32',
              branch: 'current',
              deps: {
                data: {
                  changes: false,
                  value: 'ab3353d'
                },
                'train.py': {
                  changes: false,
                  value: 'f431663'
                }
              },
              description: '[prize-luce]',
              id: 'prize-luce',
              label: 'ae4100a',
              metrics: {
                'training/metrics.json': {
                  step: 14,
                  test: {
                    acc: 0.7735,
                    loss: 0.9596208930015564
                  },
                  train: {
                    acc: 0.7694,
                    loss: 0.9731049537658691
                  }
                }
              },
              params: {
                'params.yaml': {
                  epochs: 15,
                  lr: 0.003,
                  weight_decay: 0
                }
              },
              selected: false,
              sha: 'ae4100a4b4a972c3ceffa3062739845d944b3ddf',
              starred: false
            }
          ],
          subRows: [
            {
              _uniqueValuesCache: {},
              _valuesCache: {},
              columnFilters: {},
              columnFiltersMeta: {},
              depth: 1,
              id: '1.prize-luce',
              index: 0,
              original: {
                Created: '2023-04-21T12:04:32',
                branch: 'current',
                deps: {
                  data: {
                    changes: false,
                    value: 'ab3353d'
                  },
                  'train.py': {
                    changes: false,
                    value: 'f431663'
                  }
                },
                description: '[prize-luce]',
                id: 'prize-luce',
                label: 'ae4100a',
                metrics: {
                  'training/metrics.json': {
                    step: 14,
                    test: {
                      acc: 0.7735,
                      loss: 0.9596208930015564
                    },
                    train: {
                      acc: 0.7694,
                      loss: 0.9731049537658691
                    }
                  }
                },
                params: {
                  'params.yaml': {
                    epochs: 15,
                    lr: 0.003,
                    weight_decay: 0
                  }
                },
                selected: false,
                sha: 'ae4100a4b4a972c3ceffa3062739845d944b3ddf',
                starred: false
              },
              parentId: '1',
              subRows: []
            }
          ]
        },
        {
          columnFilters: {},
          columnFiltersMeta: {},
          depth: 1,
          id: '1.prize-luce',
          index: 0,
          original: {
            Created: '2023-04-21T12:04:32',
            branch: 'current',
            deps: {
              data: {
                changes: false,
                value: 'ab3353d'
              },
              'train.py': {
                changes: false,
                value: 'f431663'
              }
            },
            description: '[prize-luce]',
            id: 'prize-luce',
            label: 'ae4100a',
            metrics: {
              'training/metrics.json': {
                step: 14,
                test: {
                  acc: 0.7735,
                  loss: 0.9596208930015564
                },
                train: {
                  acc: 0.7694,
                  loss: 0.9731049537658691
                }
              }
            },
            params: {
              'params.yaml': {
                epochs: 15,
                lr: 0.003,
                weight_decay: 0
              }
            },
            selected: false,
            sha: 'ae4100a4b4a972c3ceffa3062739845d944b3ddf',
            starred: false
          },
          parentId: '1',
          subRows: []
        },
        {
          columnFilters: {},
          columnFiltersMeta: {},
          depth: 0,
          id: '2',
          index: 2,
          original: {
            Created: '2023-04-17T00:50:06',
            branch: 'current',
            commit: {
              author: 'Matt Seddon',
              date: '4 days ago',
              message: 'Update dependency dvclive to v2.6.4 (#75)\n\n',
              tags: []
            },
            deps: {
              data: {
                changes: false,
                value: 'ab3353d'
              },
              'train.py': {
                changes: false,
                value: 'f431663'
              }
            },
            description: 'Update dependency dvclive to v2.6.4 (#75)',
            id: '48086f1',
            label: '48086f1',
            metrics: {
              'training/metrics.json': {
                step: 14,
                test: {
                  acc: 0.7735,
                  loss: 0.9596208930015564
                },
                train: {
                  acc: 0.7694,
                  loss: 0.9731049537658691
                }
              }
            },
            params: {
              'params.yaml': {
                epochs: 15,
                lr: 0.003,
                weight_decay: 0
              }
            },
            selected: false,
            sha: '48086f1f70b2c535bafd830f7ce956355f6b78ec',
            starred: false
          },
          subRows: []
        },
        {
          depth: 0,
          id: '3',
          index: 3,
          original: {
            Created: '2023-04-17T00:49:44',
            branch: 'current',
            commit: {
              author: 'Matt Seddon',
              date: '4 days ago',
              message: 'Drop checkpoint: true (#74)\n\n',
              tags: []
            },
            deps: {
              data: {
                changes: false,
                value: 'ab3353d'
              },
              'train.py': {
                changes: false,
                value: 'f431663'
              }
            },
            description: 'Drop checkpoint: true (#74)',
            id: '29ecaaf',
            label: '29ecaaf',
            metrics: {
              'training/metrics.json': {
                step: 14,
                test: {
                  acc: 0.7735,
                  loss: 0.9596208930015564
                },
                train: {
                  acc: 0.7694,
                  loss: 0.9731049537658691
                }
              }
            },
            params: {
              'params.yaml': {
                epochs: 15,
                lr: 0.003,
                weight_decay: 0
              }
            },
            selected: false,
            sha: '29ecaaf3adf216045e96e81fb8e3027c9122af52',
            starred: false
          },
          subRows: []
        }
      ],
      rows: [
        {
          depth: 0,
          getAllCells: mockedGetAllCells,
          getIsExpanded: mockedGetIsExpanded,
          id: '0',
          index: 0,
          original: {
            branch: 'current',
            deps: {
              data: {
                changes: false,
                value: 'ab3353d'
              },
              'train.py': {
                changes: false,
                value: 'f431663'
              }
            },
            id: 'workspace',
            label: 'workspace',
            metrics: {
              'training/metrics.json': {
                step: 14,
                test: {
                  acc: 0.7735,
                  loss: 0.9596208930015564
                },
                train: {
                  acc: 0.7694,
                  loss: 0.9731049537658691
                }
              }
            },
            params: {
              'params.yaml': {
                epochs: 15,
                lr: 0.003,
                weight_decay: 0
              }
            },
            selected: false,
            starred: false
          },
          subRows: []
        },
        {
          depth: 0,
          getAllCells: mockedGetAllCells,
          getIsExpanded: mockedGetIsExpanded,
          id: '1',
          index: 1,
          original: {
            Created: '2023-04-20T05:14:46',
            branch: 'current',
            commit: {
              author: 'Matt Seddon',
              date: '31 hours ago',
              message: 'Update dependency dvc to v2.55.0 (#76)\n\n',
              tags: []
            },
            deps: {
              data: {
                changes: false,
                value: 'ab3353d'
              },
              'train.py': {
                changes: false,
                value: 'f431663'
              }
            },
            description: 'Update dependency dvc to v2.55.0 (#76)',
            id: 'a9b32d1',
            label: 'a9b32d1',
            metrics: {
              'training/metrics.json': {
                step: 14,
                test: {
                  acc: 0.7735,
                  loss: 0.9596208930015564
                },
                train: {
                  acc: 0.7694,
                  loss: 0.9731049537658691
                }
              }
            },
            params: {
              'params.yaml': {
                epochs: 15,
                lr: 0.003,
                weight_decay: 0
              }
            },
            selected: false,
            sha: 'a9b32d14966b9be1396f2211d9eb743359708a07',
            starred: false
          },
          subRows: []
        },
        {
          depth: 1,
          getAllCells: mockedGetAllCells,
          getIsExpanded: mockedGetIsExpanded,
          id: '1.prize-luce',
          index: 0,
          original: {
            Created: '2023-04-21T12:04:32',
            branch: 'current',
            deps: {
              data: {
                changes: false,
                value: 'ab3353d'
              },
              'train.py': {
                changes: false,
                value: 'f431663'
              }
            },
            description: '[prize-luce]',
            id: 'prize-luce',
            label: 'ae4100a',
            metrics: {
              'training/metrics.json': {
                step: 14,
                test: {
                  acc: 0.7735,
                  loss: 0.9596208930015564
                },
                train: {
                  acc: 0.7694,
                  loss: 0.9731049537658691
                }
              }
            },
            params: {
              'params.yaml': {
                epochs: 15,
                lr: 0.003,
                weight_decay: 0
              }
            },
            selected: false,
            sha: 'ae4100a4b4a972c3ceffa3062739845d944b3ddf',
            starred: false
          },
          parentId: '1',
          subRows: []
        },
        {
          depth: 0,
          getAllCells: mockedGetAllCells,
          getIsExpanded: mockedGetIsExpanded,
          id: '2',
          index: 2,
          original: {
            Created: '2023-04-17T00:50:06',
            branch: 'current',
            commit: {
              author: 'Matt Seddon',
              date: '4 days ago',
              message: 'Update dependency dvclive to v2.6.4 (#75)\n\n',
              tags: []
            },
            deps: {
              data: {
                changes: false,
                value: 'ab3353d'
              },
              'train.py': {
                changes: false,
                value: 'f431663'
              }
            },
            description: 'Update dependency dvclive to v2.6.4 (#75)',
            id: '48086f1',
            label: '48086f1',
            metrics: {
              'training/metrics.json': {
                step: 14,
                test: {
                  acc: 0.7735,
                  loss: 0.9596208930015564
                },
                train: {
                  acc: 0.7694,
                  loss: 0.9731049537658691
                }
              }
            },
            params: {
              'params.yaml': {
                epochs: 15,
                lr: 0.003,
                weight_decay: 0
              }
            },
            selected: false,
            sha: '48086f1f70b2c535bafd830f7ce956355f6b78ec',
            starred: false
          },
          subRows: []
        },
        {
          depth: 0,
          getAllCells: mockedGetAllCells,
          getIsExpanded: mockedGetIsExpanded,
          id: '3',
          index: 3,
          original: {
            Created: '2023-04-17T00:49:44',
            branch: 'current',
            commit: {
              author: 'Matt Seddon',
              date: '4 days ago',
              message: 'Drop checkpoint: true (#74)\n\n',
              tags: []
            },
            deps: {
              data: {
                changes: false,
                value: 'ab3353d'
              },
              'train.py': {
                changes: false,
                value: 'f431663'
              }
            },
            description: 'Drop checkpoint: true (#74)',
            id: '29ecaaf',
            label: '29ecaaf',
            metrics: {
              'training/metrics.json': {
                step: 14,
                test: {
                  acc: 0.7735,
                  loss: 0.9596208930015564
                },
                train: {
                  acc: 0.7694,
                  loss: 0.9731049537658691
                }
              }
            },
            params: {
              'params.yaml': {
                epochs: 15,
                lr: 0.003,
                weight_decay: 0
              }
            },
            selected: false,
            sha: '29ecaaf3adf216045e96e81fb8e3027c9122af52',
            starred: false
          },
          subRows: []
        }
      ]
    })
  } as unknown as Table<Experiment>

  const renderTableContent = (
    rowsInstance = instance,
    branches = ['current']
  ) => {
    return render(
      <Provider
        store={configureStore({
          preloadedState: {
            tableData: { ...tableData, branches }
          },
          reducer: experimentsReducers
        })}
      >
        <table>
          <TableContent
            instance={rowsInstance}
            tableHeadHeight={50}
            tableRef={createRef()}
          />
        </table>
      </Provider>
    )
  }

  it('should display the branches names before its rows', () => {
    const instanceRows = instance.getRowModel()
    const multipleBranchesInstance = {
      ...instance,
      getRowModel: () => ({
        flatRows: instanceRows.flatRows,
        rows: [
          ...instanceRows.rows,
          ...instanceRows.rows.map(row => ({
            ...row,
            id: `${row.id}-new-branch`,
            original: { ...row.original, branch: 'new-branch' }
          }))
        ]
      })
    } as unknown as Table<Experiment>
    renderTableContent(multipleBranchesInstance, ['current', 'new-branch'])

    expect(screen.getAllByTestId('branch-name').length).toBe(2)
    expect(screen.getByText('current')).toBeInTheDocument()
    expect(screen.getByText('new-branch')).toBeInTheDocument()
  })
})
