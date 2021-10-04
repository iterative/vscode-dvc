import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub, spy, restore } from 'sinon'
import { window, commands } from 'vscode'
import get from 'lodash.get'
import { Disposable } from '../../../../../extension'
import { WorkspaceExperiments } from '../../../../../experiments/workspace'
import {
  Experiment,
  ParamOrMetric
} from '../../../../../experiments/webview/contract'
import { QuickPickItemWithValue } from '../../../../../vscode/quickPick'
import { dvcDemoPath, experimentsUpdatedEvent } from '../../../util'
import { joinParamOrMetricPath } from '../../../../../experiments/paramsAndMetrics/paths'
import { RegisteredCommands } from '../../../../../commands/external'
import { buildExperiments } from '../../util'
import { ExperimentsRepoJSONOutput } from '../../../../../cli/reader'

suite('Experiments Sort By Tree Test Suite', () => {
  const testData = {
    testBranch: {
      baseline: {
        data: {}
      },
      exp1: {
        data: {
          params: {
            'params.yaml': {
              data: {
                testparam: 1,
                testparam2: 1
              }
            }
          }
        }
      },
      exp2: {
        data: {
          params: {
            'params.yaml': {
              data: {
                testparam: 3,
                testparam2: 1
              }
            }
          }
        }
      },
      exp3: {
        data: {
          params: {
            'params.yaml': {
              data: {
                testparam: 2,
                testparam2: 2
              }
            }
          }
        }
      },
      exp4: {
        data: {
          params: {
            'params.yaml': {
              data: {
                testparam: 4,
                testparam2: 2
              }
            }
          }
        }
      }
    },
    workspace: {
      baseline: {
        data: {
          executor: 'workspace',
          timestamp: null
        }
      }
    }
  } as unknown as ExperimentsRepoJSONOutput

  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
  })

  describe('ExperimentsSortByTree', () => {
    it('should appear in the UI', async () => {
      await expect(
        commands.executeCommand('dvc.views.experimentsSortByTree.focus')
      ).to.be.eventually.equal(undefined)
    })

    it('should be able to properly add and remove sorts with a variety of commands', async () => {
      // setup

      const mockShowQuickPick = stub(window, 'showQuickPick')

      const { experiments } = buildExperiments(disposable, testData)

      await experiments.isReady()
      const experimentsWebview = await experiments.showWebview()
      const messageSpy = spy(experimentsWebview, 'showExperiments')

      const mockSortQuickPicks = (paramPath: string, descending: boolean) => {
        mockShowQuickPick.onFirstCall().resolves({
          value: {
            path: paramPath
          }
        } as QuickPickItemWithValue<ParamOrMetric>)
        mockShowQuickPick
          .onSecondCall()
          .resolves({ value: descending } as QuickPickItemWithValue<boolean>)
      }
      const addSortWithMocks = async (
        paramPath: string,
        descending: boolean
      ) => {
        mockSortQuickPicks(paramPath, descending)
        const tableChangedPromise = experimentsUpdatedEvent(experiments)

        await commands.executeCommand(RegisteredCommands.EXPERIMENT_SORT_ADD)
        await tableChangedPromise
        mockShowQuickPick.reset()
      }

      const testParamParentPathArray = ['params', 'params.yaml']
      const testParamPathArray = [...testParamParentPathArray, 'testparam']
      const otherTestParamPathArray = [
        ...testParamParentPathArray,
        'testparam2'
      ]
      const testParamPath = joinParamOrMetricPath(...testParamPathArray)
      const otherTestParamPath = joinParamOrMetricPath(
        ...otherTestParamPathArray
      )

      const getParamsArray = (selector = testParamPathArray) =>
        messageSpy
          .getCall(-1)
          .firstArg.tableData.rows[1].subRows?.map((exp: Experiment) =>
            get(exp, selector)
          )

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub((WorkspaceExperiments as any).prototype, 'getDvcRoots').returns([
        dvcDemoPath
      ])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub((WorkspaceExperiments as any).prototype, 'getRepository').returns(
        experiments
      )
      stub(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (WorkspaceExperiments as any).prototype,
        'getFocusedOrOnlyOrPickProject'
      ).returns(dvcDemoPath)

      // Setup done, perform the test

      mockSortQuickPicks(testParamPath, false)
      const tableChangedPromise = experimentsUpdatedEvent(experiments)

      await commands.executeCommand(
        RegisteredCommands.EXPERIMENT_SORT_ADD,
        dvcDemoPath
      )
      await tableChangedPromise
      mockShowQuickPick.reset()
      expect(getParamsArray(), 'single sort with table command').to.deep.equal([
        1, 2, 3, 4
      ])

      const tableSortRemoved = experimentsUpdatedEvent(experiments)

      await commands.executeCommand(
        'dvc.views.experimentsSortByTree.removeAllSorts'
      )
      await tableSortRemoved
      expect(
        getParamsArray(),
        'row order is reset after first clear'
      ).to.deep.equal([1, 3, 2, 4])

      await addSortWithMocks(otherTestParamPath, false)
      expect(
        getParamsArray(),
        `row order is maintained after applying a sort on ${otherTestParamPath}`
      ).to.deep.equal([1, 3, 2, 4])

      await addSortWithMocks(testParamPath, true)
      expect(
        experiments.getSorts(),
        'two sort definitions are applied'
      ).to.deep.equal([
        {
          descending: false,
          path: otherTestParamPath
        },
        {
          descending: true,
          path: testParamPath
        }
      ])
      expect(
        getParamsArray(),
        'the result of both sorts is sent to the webview'
      ).to.deep.equal([3, 1, 4, 2])

      await addSortWithMocks(otherTestParamPath, true)
      expect(
        experiments.getSorts(),
        'the direction of the first sort definition is switched'
      ).to.deep.equal([
        {
          descending: true,
          path: otherTestParamPath
        },
        {
          descending: true,
          path: testParamPath
        }
      ])
      expect(
        getParamsArray(),
        'the result of the switched sort is sent to the webview'
      ).to.deep.equal([4, 2, 3, 1])

      await commands.executeCommand(
        'dvc.views.experimentsSortByTree.removeSort',
        {
          parent: dvcDemoPath,
          sort: { path: testParamPath }
        }
      )
      expect(
        getParamsArray(),
        'when removing a sort that changes the order of ties, those ties should reflect their original order'
      ).to.deep.equal([2, 4, 1, 3])

      await commands.executeCommand(
        'dvc.views.experimentsSortByTree.removeAllSorts',
        dvcDemoPath
      )
      expect(getParamsArray(), 'final sort clear').to.deep.equal([1, 3, 2, 4])
    })

    it('should handle the user exiting from the choose repository quick pick', async () => {
      const mockShowQuickPick = stub(window, 'showQuickPick')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub((WorkspaceExperiments as any).prototype, 'getDvcRoots').returns([
        dvcDemoPath,
        'mockRoot'
      ])

      const getRepositorySpy = spy(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (WorkspaceExperiments as any).prototype,
        'getRepository'
      )

      mockShowQuickPick.resolves(undefined)

      await commands.executeCommand(RegisteredCommands.EXPERIMENT_SORT_ADD)

      expect(
        getRepositorySpy,
        'should not call get repository in addSort without a root'
      ).not.to.be.called

      await commands.executeCommand(RegisteredCommands.EXPERIMENT_SORTS_REMOVE)

      expect(
        getRepositorySpy,
        'should not call get repository in removeSorts without a root'
      ).not.to.be.called
    })
  })
})
