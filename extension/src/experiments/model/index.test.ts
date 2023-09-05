/* eslint-disable sort-keys-fix/sort-keys-fix */
import { join } from 'path'
import { commands } from 'vscode'
import { ExperimentsModel } from '.'
import { copyOriginalColors } from './status/colors'
import gitLogFixture from '../../test/fixtures/expShow/base/gitLog'
import rowOrderFixture from '../../test/fixtures/expShow/base/rowOrder'
import outputFixture from '../../test/fixtures/expShow/base/output'
import rowsFixture from '../../test/fixtures/expShow/base/rows'
import remoteExpRefsFixture from '../../test/fixtures/expShow/base/remoteExpRefs'
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
  ExecutorStatus,
  EXPERIMENT_WORKSPACE_ID,
  Executor,
  ExpWithError,
  ExpShowOutput
} from '../../cli/dvc/contract'
import { PersistenceKey } from '../../persistence/constants'

jest.mock('vscode')

const mockedCommands = jest.mocked(commands)
mockedCommands.executeCommand = jest.fn()

beforeEach(() => {
  jest.resetAllMocks()
})

const DEFAULT_DATA: [
  string,
  { running: boolean; expName?: string },
  { branch: string; sha: string }[],
  { [branch: string]: number }
] = ['', { running: false }, [], { main: 2000 }]

type TransformAndSetInputs = [ExpShowOutput, ...typeof DEFAULT_DATA]

describe('ExperimentsModel', () => {
  it('should return the expected rows when given the base fixture', () => {
    const model = new ExperimentsModel('', buildMockMemento())
    model.transformAndSetLocal(
      outputFixture,
      gitLogFixture,
      { running: false },
      rowOrderFixture,
      { main: 6 }
    )
    model.transformAndSetRemote(remoteExpRefsFixture)
    model.setStudioData([], ['42b8736b08170529903cd203a1f40382a4b4a8cd'])
    expect(model.getRowData()).toStrictEqual(rowsFixture)
  })

  it('should return the expected rows when given the survival fixture', () => {
    const model = new ExperimentsModel('', buildMockMemento())
    model.transformAndSetLocal(
      survivalOutputFixture,
      '',
      { running: false },
      [
        { branch: 'main', sha: '3d5adcb974bb2c85917a5d61a489b933adaa2b7f' },
        { branch: 'main', sha: 'a49e03966a1f9f1299ec222ebc4bed8625d2c54d' },
        { branch: 'main', sha: '4f7b50c3d171a11b6cfcd04416a16fc80b61018d' }
      ],
      { main: 700 }
    )
    expect(model.getRowData()).toStrictEqual(
      expect.objectContaining(survivalRowsFixture)
    )
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

    model.transformAndSetLocal(dvcLiveOnly, '', { running: true }, [], {
      main: 2000
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const runningWorkspace = (model as any).workspace
    expect(runningWorkspace?.executor).toStrictEqual(EXPERIMENT_WORKSPACE_ID)
    expect(runningWorkspace?.executorStatus).toStrictEqual(
      ExecutorStatus.RUNNING
    )

    model.transformAndSetLocal(dvcLiveOnly, ...DEFAULT_DATA)
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

    model.transformAndSetLocal(data, ...DEFAULT_DATA)

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
    model.transformAndSetLocal(uncommittedDepsFixture, ...DEFAULT_DATA)
    const [workspace] = model.getWorkspaceAndCommits()
    expect(workspace.deps).toStrictEqual({})
  })

  it('should return the expected rows when given the deeply nested output fixture', () => {
    const model = new ExperimentsModel('', buildMockMemento())
    model.transformAndSetLocal(
      deeplyNestedOutputFixture,
      '',
      { running: false },
      [{ branch: 'main', sha: '53c3851f46955fa3e2b8f6e1c52999acc8c9ea77' }],
      { main: 10 }
    )
    expect(model.getRowData()).toStrictEqual(
      expect.objectContaining(deeplyNestedRowsFixture)
    )
  })

  it('should return the expected rows when given the data types output fixture', () => {
    const model = new ExperimentsModel('', buildMockMemento())
    model.transformAndSetLocal(
      dataTypesOutputFixture,
      '',
      { running: false },
      [{ branch: 'main', sha: '53c3851f46955fa3e2b8f6e1c52999acc8c9ea77' }],
      { main: 10 }
    )
    expect(model.getRowData()).toStrictEqual(
      expect.objectContaining(dataTypesRowsFixture)
    )
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

    experimentsModel.transformAndSetLocal(data, ...DEFAULT_DATA)

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

  it('should not swap an experiment running in the workspace for the workspace and not prevent selection of an experiment running in the queue', () => {
    const params = {
      params: {
        'params.yaml': {
          data: {
            lr: 0.000000000000001
          }
        }
      }
    }
    const runningExpName = 'selectable-nuffy'
    const runningTaskName = 'selectable-task'

    const data = generateTestExpShowOutput(
      {},
      {
        experiments: [
          {
            data: params,
            executor: {
              local: null,
              name: Executor.WORKSPACE,
              state: ExecutorStatus.RUNNING
            },
            name: runningExpName,
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
              state: ExecutorStatus.RUNNING
            },
            name: runningTaskName,
            rev: EXPERIMENT_WORKSPACE_ID
          }
        ],
        rev: 'testBranch'
      }
    )

    const model = new ExperimentsModel('', buildMockMemento())
    model.transformAndSetLocal(data, ...DEFAULT_DATA)

    expect(model.getSelectedRevisions().map(({ id }) => id)).toStrictEqual([
      runningExpName
    ])

    model.setSelected([])
    expect(model.getSelectedRevisions().map(({ id }) => id)).toStrictEqual([])

    model.setSelected(model.getCombinedList())
    expect(model.getSelectedRevisions().map(({ id }) => id)).toStrictEqual([
      EXPERIMENT_WORKSPACE_ID,
      'testBranch',
      runningExpName,
      'exp-2',
      'exp-3',
      'exp-4',
      runningTaskName
    ])
  })

  it('should fetch workspace params', () => {
    const model = new ExperimentsModel('', buildMockMemento())
    model.transformAndSetLocal(outputFixture, ...DEFAULT_DATA)

    const workspaceParams = model.getWorkspaceParams()
    expect(definedAndNonEmpty(workspaceParams)).toBe(true)
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

  it('should always return the current branch first', () => {
    const model = new ExperimentsModel('', buildMockMemento())

    model.setSelectedBranches(['A', 'old', 'B', 'C', 'older'])
    model.setBranches(
      ['A', 'B', 'C', 'four', 'five', 'six'],
      ['A', 'B', 'C', 'four', 'five'],
      'six'
    )

    expect(model.getBranchesToShow()).toStrictEqual(['six', 'A', 'B', 'C'])
  })

  it('should return all selectable branches', () => {
    const model = new ExperimentsModel('', buildMockMemento())

    model.setBranches(
      ['main', 'A', 'B', 'C', 'four', 'five'],
      ['A', 'B', 'C', 'four', 'five'],
      'main'
    )

    expect(model.getAvailableBranchesToSelect()).toStrictEqual([
      'A',
      'B',
      'C',
      'four',
      'five'
    ])
  })

  it('should remove outdated selected branches when calling setBranches', () => {
    const model = new ExperimentsModel('', buildMockMemento())

    model.setSelectedBranches(['A', 'old', 'B', 'C', 'older'])
    model.setBranches(
      ['main', 'A', 'B', 'C', 'four', 'five', 'six'],
      ['A', 'B', 'C', 'four', 'five', 'six'],
      'main'
    )

    expect(model.getBranchesToShow()).toStrictEqual(['main', 'A', 'B', 'C'])
  })

  it('should persist the selected branches when calling setBranches', () => {
    const memento = buildMockMemento()
    const model = new ExperimentsModel('', memento)

    model.setSelectedBranches(['A', 'old', 'B', 'C', 'older'])
    model.setBranches(
      ['A', 'B', 'C', 'five', 'four', 'six'],
      ['A', 'B', 'C', 'five', 'six'],
      'four'
    )

    expect(memento.get(PersistenceKey.EXPERIMENTS_BRANCHES)).toStrictEqual([
      'A',
      'B',
      'C'
    ])
  })

  it('should persist the selected branches when calling setSelectedBranches', () => {
    const memento = buildMockMemento()
    const model = new ExperimentsModel('', memento)

    model.setSelectedBranches(['A', 'old', 'B', 'C', 'older'])

    expect(memento.get(PersistenceKey.EXPERIMENTS_BRANCHES)).toStrictEqual([
      'A',
      'old',
      'B',
      'C',
      'older'
    ])
  })

  it('should remove the current branch from the selected branches and only persist the selected branches', () => {
    const memento = buildMockMemento()
    const model = new ExperimentsModel('', memento)

    model.setSelectedBranches(['A', 'old', 'B', 'C', 'older'])
    model.setBranches(
      ['B', 'A', 'C', 'four', 'five', 'six'],
      ['B', 'C', 'four', 'five', 'six'],
      'A'
    )

    expect(model.getBranchesToShow()).toStrictEqual(['A', 'B', 'C'])
    expect(memento.get(PersistenceKey.EXPERIMENTS_BRANCHES)).toStrictEqual([
      'B',
      'C'
    ])
  })

  const getSelectedRevisions = (
    model: ExperimentsModel
  ): { id: string; displayColor: string }[] =>
    model
      .getSelectedRevisions()
      .map(({ displayColor, id }) => ({ displayColor, id }))

  it('should not update the status of experiments if exp show fails and there was a running experiment', () => {
    const memento = buildMockMemento()
    const model = new ExperimentsModel('', memento)
    const colorList = copyOriginalColors()
    const expectedSelection = [
      { id: 'exp-83425', displayColor: colorList[0] },
      { id: 'exp-e7a67', displayColor: colorList[1] },
      { id: EXPERIMENT_WORKSPACE_ID, displayColor: colorList[2] }
    ]

    const runningExperimentData: TransformAndSetInputs = [
      outputFixture,
      gitLogFixture,
      { running: false },
      [],
      {
        main: 2000
      }
    ]

    const transientErrorData: TransformAndSetInputs = [
      [
        {
          rev: EXPERIMENT_WORKSPACE_ID,
          error: {
            type: 'caught error',
            msg:
              'unexpected error - [Errno 2]' +
              "No such file or directory: '.dvc/tmp/exps/run/ee47660cc5723ec201b88aa0fb8002e47508ee65/ee47660cc5723ec201b88aa0fb8002e47508ee65.run'" +
              'Having any troubles? Hit us up at https://dvc.org/support, we are always happy to help!'
          }
        } as ExpWithError
      ],
      gitLogFixture,
      { running: false },
      [],
      {
        main: 2000
      }
    ]

    model.transformAndSetLocal(...runningExperimentData)

    model.toggleStatus('exp-e7a67')
    model.toggleStatus(EXPERIMENT_WORKSPACE_ID)

    expect(getSelectedRevisions(model)).toStrictEqual(expectedSelection)
    expect(model.hasRunningExperiment()).toBe(true)

    model.transformAndSetLocal(...transientErrorData)

    expect(getSelectedRevisions(model)).toStrictEqual(
      expectedSelection.slice(2)
    )
    expect(model.hasRunningExperiment()).toBe(true)

    model.transformAndSetLocal(...runningExperimentData)

    expect(getSelectedRevisions(model)).toStrictEqual(expectedSelection)
    expect(model.hasRunningExperiment()).toBe(true)
  })

  it('should update the status of experiments if exp show fails and there was not a running experiment', () => {
    const memento = buildMockMemento()
    const model = new ExperimentsModel('', memento)
    const colorList = copyOriginalColors()

    const noRunningExperimentData: TransformAndSetInputs = [
      survivalOutputFixture,
      ...DEFAULT_DATA
    ]

    const unexpectedErrorData: TransformAndSetInputs = [
      [
        {
          rev: EXPERIMENT_WORKSPACE_ID,
          error: {
            type: 'caught error',
            msg: 'unexpected - error'
          }
        } as ExpWithError
      ],
      ...DEFAULT_DATA
    ]

    model.transformAndSetLocal(...noRunningExperimentData)

    model.toggleStatus('main')

    expect(getSelectedRevisions(model)).toStrictEqual([
      { id: 'main', displayColor: colorList[0] }
    ])
    expect(model.hasRunningExperiment()).toBe(false)

    model.transformAndSetLocal(...unexpectedErrorData)

    expect(getSelectedRevisions(model)).toStrictEqual([])
    expect(model.hasRunningExperiment()).toBe(false)

    model.transformAndSetLocal(...noRunningExperimentData)

    expect(getSelectedRevisions(model)).toStrictEqual([])
    expect(model.hasRunningExperiment()).toBe(false)
  })

  it('should capture a Cli error when exp show fails', () => {
    const model = new ExperimentsModel('', buildMockMemento())

    const errorMsg = 'a very unexpected error - (╯°□°）╯︵ ┻━┻'

    const data = [
      {
        rev: EXPERIMENT_WORKSPACE_ID,
        error: { msg: errorMsg, type: 'caught error' }
      }
    ]
    model.transformAndSetLocal(data, gitLogFixture, { running: false }, [], {
      main: 6
    })

    expect(model.getCliError()).toStrictEqual(errorMsg)

    model.transformAndSetLocal(
      outputFixture,
      gitLogFixture,
      { running: false },
      rowOrderFixture,
      { main: 6 }
    )

    expect(model.getCliError()).toBe(undefined)
  })
})
