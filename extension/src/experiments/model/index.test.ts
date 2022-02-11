import { commands } from 'vscode'
import { ExperimentsModel } from '.'
import { Operator } from './filterBy'
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
  it('should return rows that equal the rows fixture when given the output fixture', async () => {
    const model = new ExperimentsModel('', buildMockMemento())
    await model.transformAndSet(outputFixture)
    expect(model.getRowData()).toEqual(rowsFixture)
  })

  it('should continue to apply filters to new data if selection mode is set to use filters', async () => {
    const runningExperiment = 'exp-12345'

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

    const testPath = joinMetricOrParamPath('params', 'params.yaml', 'test')

    const experimentsModel = new ExperimentsModel('', buildMockMemento())
    experimentsModel.addFilter({
      operator: Operator.GREATER_THAN,
      path: testPath,
      value: '2'
    })

    await experimentsModel.transformAndSet({
      testBranch: {
        baseline: buildTestExperiment(2),
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
        baseline: buildTestExperiment(2),
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
})
