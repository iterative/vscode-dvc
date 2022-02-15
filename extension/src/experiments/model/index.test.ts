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

  it('should return rows that equal the rows fixture when given the output fixture', async () => {
    const model = new ExperimentsModel('', buildMockMemento())
    await model.transformAndSet(outputFixture, true)
    expect(model.getRowData()).toEqual(rowsFixture)
  })

  it('should continue to apply filters to new data if selection mode is set to use filters', async () => {
    const runningExperiment = 'exp-12345'

    const testPath = joinMetricOrParamPath('params', 'params.yaml', 'test')

    const experimentsModel = new ExperimentsModel('', buildMockMemento())
    experimentsModel.addFilter({
      operator: Operator.GREATER_THAN,
      path: testPath,
      value: '2'
    })
    const baseline = buildTestExperiment(2, undefined, 'testBranch')

    await experimentsModel.transformAndSet({
      testBranch: {
        baseline,
        test0: buildTestExperiment(0, 'tip'),
        test1: buildTestExperiment(1, 'tip'),
        tip: buildTestExperiment(2, 'tip', runningExperiment)
      },
      workspace: {
        baseline: buildTestExperiment(3)
      }
    })

    const unfilteredExperiments = {
      [runningExperiment]: '#f14c4c'
    }

    expect(experimentsModel.getSelectedExperiments()).toEqual(
      unfilteredExperiments
    )

    experimentsModel.setSelectionMode(true)
    experimentsModel.setSelectedToFilters()
    expect(experimentsModel.getSelectedExperiments()).toEqual({})

    const unfilteredCheckpoint = buildTestExperiment(
      3,
      'tip',
      runningExperiment
    )

    const experimentWithNewCheckpoint = {
      testBranch: {
        baseline,
        test0: buildTestExperiment(0, 'tip'),
        test1: buildTestExperiment(1, 'tip'),
        test2: buildTestExperiment(2, 'tip'),
        tip: unfilteredCheckpoint
      },
      workspace: {
        baseline: buildTestExperiment(3)
      }
    }

    await experimentsModel.transformAndSet(experimentWithNewCheckpoint)
    expect(experimentsModel.getSelectedExperiments()).toEqual(
      unfilteredExperiments
    )
  })

  it('should apply filters to checkpoints and experiments if selection mode is set to use filters', async () => {
    const runningExperiment = 'exp-12345'
    const testPath = joinMetricOrParamPath('params', 'params.yaml', 'test')

    const experimentsModel = new ExperimentsModel('', buildMockMemento())
    experimentsModel.addFilter({
      operator: Operator.GREATER_THAN_OR_EQUAL,
      path: testPath,
      value: '2'
    })
    const baseline = buildTestExperiment(2, undefined, 'testBranch')

    await experimentsModel.transformAndSet({
      testBranch: {
        '0notIncluded': buildTestExperiment(0, 'tip'),
        '1notIncluded': buildTestExperiment(1, 'tip'),
        '2included': buildTestExperiment(2, 'tip'),
        '3included': buildTestExperiment(2.05, 'tip'),
        '4included': buildTestExperiment(2.05, 'tip'),
        baseline,
        tip: buildTestExperiment(2.1, 'tip', runningExperiment)
      },
      workspace: {
        baseline: buildTestExperiment(3)
      }
    })

    experimentsModel.setSelectionMode(true)
    experimentsModel.setSelectedToFilters()

    const [expColor] = copyOriginalExperimentColors()
    const [branchColor] = copyOriginalBranchColors()

    const filteredRevisions = {
      '2includ': expColor,
      '3includ': expColor,
      '4includ': expColor,
      testBranch: branchColor,
      tip: expColor,
      workspace: getWorkspaceColor()
    }

    expect(experimentsModel.getSelectedRevisions()).toEqual(filteredRevisions)
  })
})
