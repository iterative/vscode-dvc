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
import { generateTestExpShowOutput } from '../../test/util/experiments'
import { Experiment } from '../webview/contract'
import { definedAndNonEmpty } from '../../util/array'
import dataTypesRowsFixture from '../../test/fixtures/expShow/dataTypes/rows'
import dataTypesOutputFixture from '../../test/fixtures/expShow/dataTypes/output'
import survivalOutputFixture from '../../test/fixtures/expShow/survival/output'
import survivalRowsFixture from '../../test/fixtures/expShow/survival/rows'

import {
  ExperimentStatus,
  EXPERIMENT_WORKSPACE_ID,
  Executor
} from '../../cli/dvc/contract'
import { PersistenceKey } from '../../persistence/constants'

jest.mock('vscode')

const mockedCommands = jest.mocked(commands)
mockedCommands.executeCommand = jest.fn()

beforeEach(() => {
  jest.resetAllMocks()
})

describe('ExperimentsModel', () => {
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
    const dvcLiveOnly = generateTestExpShowOutput(
      {
        params: {
          'dvclive/params.yaml': {
            data: {
              encoder_size: 128
            }
          }
        },
        metrics: {
          'dvclive/metrics.json': {
            data: {
              train_loss: 0.015903037041425705,
              epoch: 49,
              step: 30
            }
          }
        }
      },
      {
        data: {
          timestamp: '2022-12-07T09:36:20'
        },
        rev: '399b45c9f676a10899671e146625d8694c7cce14'
      }
    )

    model.transformAndSet(dvcLiveOnly, true, '')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const runningWorkspace = (model as any).workspace
    expect(runningWorkspace?.executor).toStrictEqual(EXPERIMENT_WORKSPACE_ID)
    expect(runningWorkspace?.status).toStrictEqual(ExperimentStatus.RUNNING)

    model.transformAndSet(dvcLiveOnly, false, '')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stoppedWorkspace = (model as any).workspace
    expect(stoppedWorkspace?.executor).toBeFalsy()
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
    const data = generateTestExpShowOutput(
      {
        params: { 'params.yaml': { data: { epochs: 100 } } }
      },
      {
        rev: '0e7fbf190b78e7f8fdae6531bae123739e2db99b',
        data: {
          deps: existingDep,
          params: { 'params.yaml': { data: { epochs: 100 } } },
          timestamp: '2022-08-10T19:40:14'
        },
        experiments: [
          {
            rev: shaWithChange,
            name: 'exp-750e4',
            data: {
              deps: {
                ...existingDep,
                [newDep]: {
                  hash: '3f2d494f913d08ab7b52927137b9b04c.dir',
                  nfiles: 9737,
                  size: 311710
                }
              },
              timestamp: '2022-08-11T23:04:39'
            }
          },
          {
            rev: '46ce5efeba777f70a3f87177f9177995243ac828',
            name: 'exp-d6ddc',
            data: {
              deps: existingDep,
              params: { 'params.yaml': { data: { epochs: 100 } } },
              timestamp: '2022-08-11T22:55:46'
            }
          }
        ]
      }
    )

    model.transformAndSet(data, false, '')

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
    const getParams = (value: number) => ({
      params: {
        'params.yaml': {
          data: { test: value }
        }
      }
    })

    const experimentsModel = new ExperimentsModel('', buildMockMemento())

    const param0 = getParams(0)

    const data = generateTestExpShowOutput(getParams(3), {
      rev: 'testBranch',
      data: getParams(2),
      experiments: [
        param0,
        param0,
        param0,
        param0,
        param0,
        param0,
        param0,
        param0,
        param0
      ]
    })

    experimentsModel.transformAndSet(data, false, '')

    experimentsModel.setSelected([
      { id: 'exp-1' },
      { id: 'exp-2' },
      { id: 'exp-3' },
      { id: 'exp-4' },
      { id: 'exp-5' },
      { id: 'testBranch' },
      { id: 'exp-6' },
      { id: EXPERIMENT_WORKSPACE_ID },
      { id: 'exp-7' },
      { id: 'exp-8' }
    ] as Experiment[])
    expect(experimentsModel.getSelectedRevisions()).toHaveLength(7)
  })

  it('should swap an experiment running in the workspace for the workspace and not select an experiment running in the queue', () => {
    const params = {
      params: {
        'params.yaml': {
          data: {
            lr: 0.000000000000001
          }
        }
      }
    }
    const data = generateTestExpShowOutput(
      {},
      {
        experiments: [
          {
            data: params,
            executor: {
              local: null,
              name: Executor.WORKSPACE,
              state: ExperimentStatus.RUNNING
            },
            name: 'unselectable-nuffy',
            rev: EXPERIMENT_WORKSPACE_ID
          },
          {},
          {},
          {},
          {
            data: params,
            executor: {
              local: null,
              name: Executor.DVC_TASK,
              state: ExperimentStatus.RUNNING
            },
            name: 'unselectable-task',
            rev: EXPERIMENT_WORKSPACE_ID
          }
        ],
        rev: 'testBranch'
      }
    )

    const model = new ExperimentsModel('', buildMockMemento())
    model.transformAndSet(data, false, '')

    expect(model.getSelectedRevisions().map(({ id }) => id)).toStrictEqual([
      EXPERIMENT_WORKSPACE_ID
    ])

    model.setSelected([])
    expect(model.getSelectedRevisions().map(({ id }) => id)).toStrictEqual([])

    model.setSelected(model.getCombinedList())
    expect(model.getSelectedRevisions().map(({ id }) => id)).toStrictEqual([
      EXPERIMENT_WORKSPACE_ID,
      'testBranch',
      'exp-2',
      'exp-3',
      'exp-4'
    ])
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

    model.setNbfCommitsToShow(42, 'special-branch')

    expect(model.getNbOfCommitsToShow('special-branch')).toBe(42)
  })

  it('should persist the number of commits to show when changing it', () => {
    const memento = buildMockMemento()
    const model = new ExperimentsModel('', memento)

    model.setNbfCommitsToShow(42, 'main')

    expect(memento.get(PersistenceKey.NUMBER_OF_COMMITS_TO_SHOW)).toStrictEqual(
      {
        main: 42
      }
    )
  })
})
