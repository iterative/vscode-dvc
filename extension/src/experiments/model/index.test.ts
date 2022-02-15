import { commands } from 'vscode'
import { ExperimentsModel } from '.'
import { Operator } from './filterBy'
import {
  copyOriginalBranchColors,
  copyOriginalExperimentColors,
  getWorkspaceColor
} from './colors'
import outputFixture from '../../test/fixtures/expShow/output'
import rowsFixture from '../../test/fixtures/expShow/rows'
import { buildMockMemento } from '../../test/util'
import { joinMetricOrParamPath } from '../metricsAndParams/paths'

jest.mock('vscode')

const mockedCommands = jest.mocked(commands)
mockedCommands.executeCommand = jest.fn()

beforeEach(() => {
  jest.resetAllMocks()
})

describe('ExperimentsModel', () => {
  const runningExperiment = 'exp-12345'
  const [expColor] = copyOriginalExperimentColors()
  const [branchColor] = copyOriginalBranchColors()
  const workspaceColor = getWorkspaceColor()

  const buildTestData = (
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

  const buildTestExperiment = (
    sha: string,
    id: string,
    color: string,
    testParam: number
  ) => ({
    checkpoint_tip: sha,
    displayColor: color,
    displayNameOrParent: `[${id}]`,
    id,
    label: sha,
    mutable: false,
    name: id,
    params: { 'params.yaml': { test: testParam } },
    sha
  })

  const buildTestCheckpoint = (
    sha: string,
    checkpointTip: string,
    color: string,
    testParam: number
  ) => ({
    checkpoint_tip: checkpointTip,
    displayColor: color,
    id: sha,
    label: sha.slice(0, 7),
    mutable: false,
    params: { 'params.yaml': { test: testParam } },
    sha: sha
  })

  it('should return rows that equal the rows fixture when given the output fixture', async () => {
    const model = new ExperimentsModel('', buildMockMemento())
    await model.transformAndSet(outputFixture, true)
    expect(model.getRowData()).toEqual(rowsFixture)
  })

  it('should continue to apply filters to new data if selection mode is set to use filters', async () => {
    const testPath = joinMetricOrParamPath('params', 'params.yaml', 'test')

    const experimentsModel = new ExperimentsModel('', buildMockMemento())
    experimentsModel.addFilter({
      operator: Operator.GREATER_THAN,
      path: testPath,
      value: '2'
    })
    const baseline = buildTestData(2, undefined, 'testBranch')

    await experimentsModel.transformAndSet({
      testBranch: {
        baseline,
        test0: buildTestData(0, 'tip2'),
        test1: buildTestData(1, 'tip2'),
        tip2: buildTestData(2, 'tip2', runningExperiment)
      },
      workspace: {
        baseline: buildTestData(3)
      }
    })

    expect(experimentsModel.getSelectedExperiments()).toEqual([
      buildTestExperiment('tip2', runningExperiment, expColor, 2)
    ])

    experimentsModel.setSelectionMode(true)
    experimentsModel.setSelectedToFilters()
    expect(experimentsModel.getSelectedExperiments()).toEqual([])

    const unfilteredCheckpoint = buildTestData(3, 'tip3', runningExperiment)

    const experimentWithNewCheckpoint = {
      testBranch: {
        baseline,
        test0: buildTestData(0, 'tip3'),
        test1: buildTestData(1, 'tip3'),
        test2: buildTestData(2, 'tip3'),
        tip3: unfilteredCheckpoint
      },
      workspace: {
        baseline: buildTestData(3)
      }
    }

    await experimentsModel.transformAndSet(experimentWithNewCheckpoint)
    expect(experimentsModel.getSelectedExperiments()).toEqual([
      buildTestExperiment('tip3', runningExperiment, expColor, 3)
    ])
  })

  it('should apply filters to checkpoints and experiments if selection mode is set to use filters', async () => {
    const testPath = joinMetricOrParamPath('params', 'params.yaml', 'test')

    const experimentsModel = new ExperimentsModel('', buildMockMemento())
    experimentsModel.addFilter({
      operator: Operator.GREATER_THAN_OR_EQUAL,
      path: testPath,
      value: '2'
    })
    const baseline = buildTestData(2, undefined, 'testBranch')

    await experimentsModel.transformAndSet({
      testBranch: {
        '0notIncluded': buildTestData(0, 'tip'),
        '1notIncluded': buildTestData(1, 'tip'),
        '2included': buildTestData(2, 'tip'),
        '3included': buildTestData(2.05, 'tip'),
        '4included': buildTestData(2.05, 'tip'),
        baseline,
        tip: buildTestData(2.1, 'tip', runningExperiment)
      },
      workspace: {
        baseline: buildTestData(3)
      }
    })

    experimentsModel.setSelectionMode(true)
    experimentsModel.setSelectedToFilters()

    expect(experimentsModel.getSelectedRevisions()).toEqual([
      {
        displayColor: workspaceColor,
        id: 'workspace',
        label: 'workspace',
        mutable: false,
        params: { 'params.yaml': { test: 3 } }
      },
      {
        displayColor: branchColor,
        id: 'testBranch',
        label: 'testBranch',
        mutable: false,
        name: 'testBranch',
        params: { 'params.yaml': { test: 2 } },
        sha: 'testBranch'
      },
      buildTestExperiment('tip', runningExperiment, expColor, 2.1),
      buildTestCheckpoint('2included', 'tip', expColor, 2),
      buildTestCheckpoint('3included', 'tip', expColor, 2.05),
      buildTestCheckpoint('4included', 'tip', expColor, 2.05)
    ])
  })
})
