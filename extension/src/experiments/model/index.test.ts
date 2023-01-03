/* eslint-disable sort-keys-fix/sort-keys-fix */
import { join } from 'path'
import { commands } from 'vscode'
import { ExperimentsModel } from '.'
import { copyOriginalColors } from './status/colors'
import { Operator } from './filterBy'
import outputFixture from '../../test/fixtures/expShow/base/output'
import rowsFixture from '../../test/fixtures/expShow/base/rows'
import deeplyNestedRowsFixture from '../../test/fixtures/expShow/deeplyNested/rows'
import deeplyNestedOutputFixture from '../../test/fixtures/expShow/deeplyNested/output'
import uncommittedDepsFixture from '../../test/fixtures/expShow/uncommittedDeps/output'
import { buildMockMemento } from '../../test/util'
import { buildMetricOrParamPath } from '../columns/paths'
import { Experiment, ColumnType } from '../webview/contract'
import { definedAndNonEmpty } from '../../util/array'
import dataTypesRowsFixture from '../../test/fixtures/expShow/dataTypes/rows'
import dataTypesOutputFixture from '../../test/fixtures/expShow/dataTypes/output'
import survivalOutputFixture from '../../test/fixtures/expShow/survival/output'
import survivalRowsFixture from '../../test/fixtures/expShow/survival/rows'

import {
  ExperimentStatus,
  EXPERIMENT_WORKSPACE_ID
} from '../../cli/dvc/contract'

jest.mock('vscode')

const mockedCommands = jest.mocked(commands)
mockedCommands.executeCommand = jest.fn()

beforeEach(() => {
  jest.resetAllMocks()
})

describe('ExperimentsModel', () => {
  const runningExperiment = 'exp-12345'

  const [
    workspaceColor,
    branchColor,
    expColor,
    fourthColor,
    fifthColor,
    sixthColor
  ] = copyOriginalColors()

  const buildTestExperiment = (
    testParam: number,
    checkpoint_tip?: string,
    name?: string
  ) => {
    const data = {
      params: {
        'params.yaml': {
          data: { test: testParam }
        }
      }
    } as {
      checkpoint_tip?: string
      name?: string
      params: {
        'params.yaml': {
          data: { test: number }
        }
      }
    }
    if (checkpoint_tip) {
      data.checkpoint_tip = checkpoint_tip
    }
    if (name) {
      data.name = name
    }

    return { data }
  }

  it('should return the expected rows when given the output fixture', () => {
    const model = new ExperimentsModel('', buildMockMemento())
    model.transformAndSet(outputFixture, false, {})
    expect(model.getRowData()).toStrictEqual(rowsFixture)
  })

  it('should return the expected rows when given the survival fixture', () => {
    const model = new ExperimentsModel('', buildMockMemento())
    model.transformAndSet(survivalOutputFixture, false, {})
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

    model.transformAndSet(dvcLiveOnly, true, {})
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const runningWorkspace = (model as any).workspace
    expect(runningWorkspace?.executor).toStrictEqual(EXPERIMENT_WORKSPACE_ID)
    expect(runningWorkspace?.status).toStrictEqual(ExperimentStatus.RUNNING)

    model.transformAndSet(dvcLiveOnly, false, {})
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
      {}
    )

    const experiments = model.getAllExperiments()

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
    model.transformAndSet(uncommittedDepsFixture, false, {})
    const [workspace] = model.getExperiments()
    expect(workspace.deps).toStrictEqual({})
  })

  it('should return the expected rows when given the deeply nested output fixture', () => {
    const model = new ExperimentsModel('', buildMockMemento())
    model.transformAndSet(deeplyNestedOutputFixture, false, {})
    expect(model.getRowData()).toStrictEqual(deeplyNestedRowsFixture)
  })

  it('should return the expected rows when given the data types output fixture', () => {
    const model = new ExperimentsModel('', buildMockMemento())
    model.transformAndSet(dataTypesOutputFixture, false, {})
    expect(model.getRowData()).toStrictEqual(dataTypesRowsFixture)
  })

  it('should continue to apply filters to new data if selection mode is set to use filters', () => {
    const testPath = buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'test'
    )

    const experimentsModel = new ExperimentsModel('', buildMockMemento())
    experimentsModel.addFilter({
      operator: Operator.GREATER_THAN,
      path: testPath,
      value: '2'
    })
    const baseline = buildTestExperiment(2, undefined, 'testBranch')

    experimentsModel.transformAndSet(
      {
        testBranch: {
          baseline,
          test0: buildTestExperiment(0, 'tip2'),
          test1: buildTestExperiment(1, 'tip2'),
          tip2: buildTestExperiment(2, 'tip2', runningExperiment)
        },
        [EXPERIMENT_WORKSPACE_ID]: {
          baseline: buildTestExperiment(3)
        }
      },
      false,
      {}
    )
    experimentsModel.toggleStatus(runningExperiment)

    expect(experimentsModel.getSelectedExperiments()).toStrictEqual([
      expect.objectContaining({
        displayColor: workspaceColor,
        id: runningExperiment,
        label: 'tip2'
      })
    ])

    experimentsModel.setSelectionMode(true)
    experimentsModel.setSelected(experimentsModel.getUnfilteredExperiments())

    expect(experimentsModel.getSelectedExperiments()).toStrictEqual([])

    const unfilteredCheckpoint = buildTestExperiment(
      3,
      'tip3',
      runningExperiment
    )

    const experimentWithNewCheckpoint = {
      testBranch: {
        baseline,
        test0: buildTestExperiment(0, 'tip3'),
        test1: buildTestExperiment(1, 'tip3'),
        test2: buildTestExperiment(2, 'tip3'),
        tip3: unfilteredCheckpoint
      },
      [EXPERIMENT_WORKSPACE_ID]: {
        baseline: buildTestExperiment(3)
      }
    }

    experimentsModel.transformAndSet(experimentWithNewCheckpoint, false, {})
    expect(experimentsModel.getSelectedExperiments()).toStrictEqual([
      expect.objectContaining({
        id: runningExperiment,
        label: 'tip3'
      })
    ])
  })

  it('should apply filters to checkpoints and experiments if selection mode is set to use filters', () => {
    const testPath = buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'test'
    )

    const experimentsModel = new ExperimentsModel('', buildMockMemento())
    experimentsModel.addFilter({
      operator: Operator.GREATER_THAN_OR_EQUAL,
      path: testPath,
      value: '2'
    })
    const baseline = buildTestExperiment(2, undefined, 'testBranch')

    experimentsModel.transformAndSet(
      {
        testBranch: {
          '0notIncluded': buildTestExperiment(0, 'tip'),
          '1notIncluded': buildTestExperiment(1, 'tip'),
          '2included': buildTestExperiment(2, 'tip'),
          '3included': buildTestExperiment(2.05, 'tip'),
          '4included': buildTestExperiment(2.05, 'tip'),
          baseline,
          tip: buildTestExperiment(2.1, 'tip', runningExperiment)
        },
        [EXPERIMENT_WORKSPACE_ID]: {
          baseline: buildTestExperiment(3)
        }
      },
      false,
      {}
    )

    experimentsModel.setSelectionMode(true)
    experimentsModel.setSelected(experimentsModel.getUnfilteredExperiments())

    expect(experimentsModel.getSelectedRevisions()).toStrictEqual([
      expect.objectContaining({
        displayColor: workspaceColor,
        id: EXPERIMENT_WORKSPACE_ID,
        label: EXPERIMENT_WORKSPACE_ID
      }),
      expect.objectContaining({
        displayColor: branchColor,
        id: 'testBranch',
        label: 'testBranch'
      }),
      expect.objectContaining({
        displayColor: expColor,
        id: runningExperiment,
        label: 'tip'
      }),
      expect.objectContaining({
        displayColor: fourthColor,
        id: '2included',
        label: '2includ'
      }),
      expect.objectContaining({
        displayColor: fifthColor,
        id: '3included',
        label: '3includ'
      }),
      expect.objectContaining({
        displayColor: sixthColor,
        id: '4included',
        label: '4includ'
      })
    ])
  })

  it('should always limit the number of selected experiments to 7', () => {
    const experimentsModel = new ExperimentsModel('', buildMockMemento())

    experimentsModel.transformAndSet(
      {
        testBranch: {
          baseline: buildTestExperiment(2, undefined, 'testBranch'),
          exp1: buildTestExperiment(0, 'tip'),
          exp2: buildTestExperiment(0, 'tip'),
          exp3: buildTestExperiment(0, 'tip'),
          exp4: buildTestExperiment(0, 'tip'),
          exp5: buildTestExperiment(0, 'tip'),
          tip: buildTestExperiment(0, 'tip', runningExperiment)
        },
        [EXPERIMENT_WORKSPACE_ID]: {
          baseline: buildTestExperiment(3)
        }
      },
      false,
      {}
    )

    experimentsModel.setSelectionMode(true)

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((experimentsModel as any).useFiltersForSelection).toBe(false)
  })

  it('should fetch branch params', () => {
    const model = new ExperimentsModel('', buildMockMemento())
    model.transformAndSet(outputFixture, false, {})

    const branchParams = model.getExperimentParams('main')
    expect(definedAndNonEmpty(branchParams)).toBe(true)
  })

  it('should fetch workspace params', () => {
    const model = new ExperimentsModel('', buildMockMemento())
    model.transformAndSet(outputFixture, false, {})

    const workspaceParams = model.getExperimentParams(EXPERIMENT_WORKSPACE_ID)
    expect(definedAndNonEmpty(workspaceParams)).toBe(true)
  })

  it("should fetch an experiment's params", () => {
    const model = new ExperimentsModel('', buildMockMemento())
    model.transformAndSet(outputFixture, false, {})

    const experimentParams = model.getExperimentParams('exp-e7a67')
    expect(definedAndNonEmpty(experimentParams)).toBe(true)
  })

  it("should fetch an empty array if the experiment's params cannot be found", () => {
    const model = new ExperimentsModel('', buildMockMemento())
    model.transformAndSet(outputFixture, false, {})

    const noParams = model.getExperimentParams('not-an-experiment')
    expect(definedAndNonEmpty(noParams)).toBe(false)
  })
})
