/* eslint-disable sort-keys-fix/sort-keys-fix */
import { join } from 'path'
import { commands } from 'vscode'
import { ExperimentsModel } from '.'
import outputFixture from '../../test/fixtures/expShow/base/output'
import rowsFixture from '../../test/fixtures/expShow/base/rows'
import deeplyNestedRowsFixture from '../../test/fixtures/expShow/deeplyNested/rows'
import deeplyNestedOutputFixture from '../../test/fixtures/expShow/deeplyNested/output'
import uncommittedDepsFixture from '../../test/fixtures/expShow/uncommittedDeps/output'
import { buildMockMemento } from '../../test/util'
import { Experiment } from '../webview/contract'
import { definedAndNonEmpty } from '../../util/array'
import dataTypesRowsFixture from '../../test/fixtures/expShow/dataTypes/rows'
import dataTypesOutputFixture from '../../test/fixtures/expShow/dataTypes/output'
import survivalOutputFixture from '../../test/fixtures/expShow/survival/output'
import survivalRowsFixture from '../../test/fixtures/expShow/survival/rows'

import {
  ExperimentStatus,
  EXPERIMENT_WORKSPACE_ID
} from '../../cli/dvc/contract'
import { PersistenceKey } from '../../persistence/constants'

jest.mock('vscode')

const mockedCommands = jest.mocked(commands)
mockedCommands.executeCommand = jest.fn()

beforeEach(() => {
  jest.resetAllMocks()
})

describe('ExperimentsModel', () => {
  const runningExperiment = 'exp-12345'

  const buildTestExperiment = (testParam: number, name?: string) => {
    const data = {
      params: {
        'params.yaml': {
          data: { test: testParam }
        }
      }
    } as {
      name?: string
      params: {
        'params.yaml': {
          data: { test: number }
        }
      }
    }
    if (name) {
      data.name = name
    }

    return { data }
  }

  it('should return the expected rows when given the output fixture', () => {
    const model = new ExperimentsModel('', buildMockMemento())
    model.transformAndSet(outputFixture, false, '')
    expect(model.getRowData()).toStrictEqual(rowsFixture)
  })

  it('should return the expected rows when given the survival fixture', () => {
    const model = new ExperimentsModel('', buildMockMemento())
    model.transformAndSet(survivalOutputFixture, false, '')
    expect(model.getRowData()).toStrictEqual(survivalRowsFixture)
  })

  it('should set the workspace to running if a signal file for a DVCLive only experiment has been found', () => {
    const model = new ExperimentsModel('', buildMockMemento())
    const dvcLiveOnly = {
      [EXPERIMENT_WORKSPACE_ID]: {
        baseline: {
          data: {
            timestamp: null,
            params: {
              'dvclive/params.yaml': {
                data: {
                  encoder_size: 128
                }
              }
            },
            deps: {},
            outs: {},
            status: ExperimentStatus.SUCCESS,
            executor: null,
            metrics: {
              'dvclive/metrics.json': {
                data: {
                  train_loss: 0.015903037041425705,
                  epoch: 49,
                  step: 30
                }
              }
            }
          }
        }
      },
      '399b45c9f676a10899671e146625d8694c7cce14': {
        baseline: {
          data: {
            timestamp: '2022-12-07T09:36:20',
            deps: {},
            outs: {},
            status: ExperimentStatus.SUCCESS,
            executor: null,
            metrics: {},
            name: 'main'
          }
        }
      }
    }

    model.transformAndSet(dvcLiveOnly, true, '')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const runningWorkspace = (model as any).workspace
    expect(runningWorkspace?.executor).toStrictEqual(EXPERIMENT_WORKSPACE_ID)
    expect(runningWorkspace?.status).toStrictEqual(ExperimentStatus.RUNNING)

    model.transformAndSet(dvcLiveOnly, false, '')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stoppedWorkspace = (model as any).workspace
    expect(stoppedWorkspace?.executor).toBeNull()
    expect(stoppedWorkspace?.status).toStrictEqual(ExperimentStatus.SUCCESS)
  })

  // eslint-disable-next-line sonarjs/cognitive-complexity
  it('should handle a new dep file being introduced in the workspace', () => {
    const newDep = join('data', '.ldb_workspace')
    const shaWithChange = '060985f9883e99cad9efbd5e0c0d1797aa54f23a'
    const existingDep = {
      'train.py': {
        hash: '5ca8bcdcff40d2eea929628131aa53c6',
        size: 3741,
        nfiles: null
      }
    }

    const model = new ExperimentsModel('', buildMockMemento())
    model.transformAndSet(
      {
        [EXPERIMENT_WORKSPACE_ID]: {
          baseline: {
            data: {
              executor: null,
              params: { 'params.yaml': { data: { epochs: 100 } } },
              status: ExperimentStatus.SUCCESS,
              timestamp: null
            }
          }
        },
        '0e7fbf190b78e7f8fdae6531bae123739e2db99b': {
          baseline: {
            data: {
              deps: existingDep,
              executor: null,
              name: 'main',
              params: { 'params.yaml': { data: { epochs: 100 } } },
              status: ExperimentStatus.SUCCESS,
              timestamp: '2022-08-10T19:40:14'
            }
          },
          [shaWithChange]: {
            data: {
              deps: {
                ...existingDep,
                [newDep]: {
                  hash: '3f2d494f913d08ab7b52927137b9b04c.dir',
                  nfiles: 9737,
                  size: 311710
                }
              },
              executor: null,
              name: 'exp-750e4',
              status: ExperimentStatus.SUCCESS,
              timestamp: '2022-08-11T23:04:39'
            }
          },
          '46ce5efeba777f70a3f87177f9177995243ac828': {
            data: {
              deps: existingDep,
              executor: null,
              name: 'exp-d6ddc',
              params: { 'params.yaml': { data: { epochs: 100 } } },
              status: ExperimentStatus.SUCCESS,
              timestamp: '2022-08-11T22:55:46'
            }
          }
        }
      },
      false,
      ''
    )

    const experiments = model.getCombinedList()

    const changed: string[] = []
    for (const { deps, sha } of experiments) {
      if (sha && deps) {
        for (const { changes } of Object.values(deps)) {
          if (changes) {
            changed.push(sha)
          }
        }
      }
    }
    expect(changed).toStrictEqual([shaWithChange])
  })

  it('should handle deps have all null properties (never been committed)', () => {
    const model = new ExperimentsModel('', buildMockMemento())
    model.transformAndSet(uncommittedDepsFixture, false, '')
    const [workspace] = model.getWorkspaceAndCommits()
    expect(workspace.deps).toStrictEqual({})
  })

  it('should return the expected rows when given the deeply nested output fixture', () => {
    const model = new ExperimentsModel('', buildMockMemento())
    model.transformAndSet(deeplyNestedOutputFixture, false, '')
    expect(model.getRowData()).toStrictEqual(deeplyNestedRowsFixture)
  })

  it('should return the expected rows when given the data types output fixture', () => {
    const model = new ExperimentsModel('', buildMockMemento())
    model.transformAndSet(dataTypesOutputFixture, false, '')
    expect(model.getRowData()).toStrictEqual(dataTypesRowsFixture)
  })

  it('should always limit the number of selected experiments to 7', () => {
    const experimentsModel = new ExperimentsModel('', buildMockMemento())

    experimentsModel.transformAndSet(
      {
        testBranch: {
          baseline: buildTestExperiment(2, 'testBranch'),
          exp1: buildTestExperiment(0),
          exp2: buildTestExperiment(0),
          exp3: buildTestExperiment(0),
          exp4: buildTestExperiment(0),
          exp5: buildTestExperiment(0),
          tip: buildTestExperiment(0, runningExperiment)
        },
        [EXPERIMENT_WORKSPACE_ID]: {
          baseline: buildTestExperiment(3)
        }
      },
      false,
      ''
    )

    experimentsModel.setSelected([
      { id: 'exp1' },
      { id: 'exp2' },
      { id: 'exp3' },
      { id: 'exp4' },
      { id: 'exp5' },
      { id: 'testBranch' },
      { id: 'tip' },
      { id: EXPERIMENT_WORKSPACE_ID }
    ] as Experiment[])
    expect(experimentsModel.getSelectedRevisions()).toHaveLength(6)
  })

  it('should fetch commit params', () => {
    const model = new ExperimentsModel('', buildMockMemento())
    model.transformAndSet(outputFixture, false, '')

    const commitParams = model.getExperimentParams('main')
    expect(definedAndNonEmpty(commitParams)).toBe(true)
  })

  it('should fetch workspace params', () => {
    const model = new ExperimentsModel('', buildMockMemento())
    model.transformAndSet(outputFixture, false, '')

    const workspaceParams = model.getExperimentParams(EXPERIMENT_WORKSPACE_ID)
    expect(definedAndNonEmpty(workspaceParams)).toBe(true)
  })

  it("should fetch an experiment's params", () => {
    const model = new ExperimentsModel('', buildMockMemento())
    model.transformAndSet(outputFixture, false, '')

    const experimentParams = model.getExperimentParams('exp-e7a67')
    expect(definedAndNonEmpty(experimentParams)).toBe(true)
  })

  it("should fetch an empty array if the experiment's params cannot be found", () => {
    const model = new ExperimentsModel('', buildMockMemento())
    model.transformAndSet(outputFixture, false, '')

    const noParams = model.getExperimentParams('not-an-experiment')
    expect(definedAndNonEmpty(noParams)).toBe(false)
  })

  it('should set the number of commits to show correctly', () => {
    const model = new ExperimentsModel('', buildMockMemento())

    model.setNbfCommitsToShow(42)

    expect(model.getNbOfCommitsToShow()).toBe(42)
  })

  it('should persist the number of commits to show when changing it', () => {
    const memento = buildMockMemento()
    const model = new ExperimentsModel('', memento)

    model.setNbfCommitsToShow(42)

    expect(memento.get(PersistenceKey.NUMBER_OF_COMMITS_TO_SHOW)).toBe(42)
  })
})
