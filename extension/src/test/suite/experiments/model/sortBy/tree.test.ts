import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub, spy, restore } from 'sinon'
import { window, commands } from 'vscode'
import get from 'lodash.get'
import { Disposable } from '../../../../../extension'
import { WorkspaceExperiments } from '../../../../../experiments/workspace'
import {
  Experiment,
  Column,
  ColumnType
} from '../../../../../experiments/webview/contract'
import { QuickPickItemWithValue } from '../../../../../vscode/quickPick'
import { buildExperimentsWebview, stubWorkspaceGetters } from '../../util'
import { closeAllEditors, experimentsUpdatedEvent } from '../../../util'
import { dvcDemoPath } from '../../../../util'
import { generateTestExpShowOutput } from '../../../../util/experiments'
import { buildMetricOrParamPath } from '../../../../../experiments/columns/paths'
import { RegisteredCommands } from '../../../../../commands/external'
import {
  EXPERIMENT_WORKSPACE_ID,
  Executor,
  ExecutorStatus
} from '../../../../../cli/dvc/contract'
import { WEBVIEW_TEST_TIMEOUT } from '../../../timeouts'
import { starredSort } from '../../../../../experiments/model/sortBy/constants'

suite('Experiments Sort By Tree Test Suite', () => {
  const data = generateTestExpShowOutput(
    {},
    {
      experiments: [
        {
          data: {
            params: {
              'params.yaml': {
                data: {
                  testParam: 1,
                  testParam2: 1
                }
              }
            }
          },
          executor: {
            local: null,
            name: Executor.WORKSPACE,
            state: ExecutorStatus.RUNNING
          },
          name: 'exp-1',
          rev: EXPERIMENT_WORKSPACE_ID
        },
        {
          params: {
            'params.yaml': {
              data: {
                testParam: 3,
                testParam2: 1
              }
            }
          }
        },
        {
          params: {
            'params.yaml': {
              data: {
                testParam: 2,
                testParam2: 2
              }
            }
          }
        },
        {
          params: {
            'params.yaml': {
              data: {
                testParam: 4,
                testParam2: 2
              }
            }
          }
        }
      ],
      rev: '2d879497587b80b2d9e61f072d9dbe9c07a65357'
    }
  )

  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
    return closeAllEditors()
  })

  describe('ExperimentsSortByTree', () => {
    it('should appear in the UI', async () => {
      await expect(
        commands.executeCommand('dvc.views.experimentsSortByTree.focus')
      ).to.be.eventually.equal(undefined)
    })

    it('should be able to properly add and remove sorts with a variety of commands', async () => {
      const mockShowQuickPick = stub(window, 'showQuickPick')

      const { experiments, messageSpy } = await buildExperimentsWebview({
        disposer: disposable,
        dvcRoot: dvcDemoPath,
        expShow: data,
        gitLog: '',
        rowOrder: [
          { branch: 'main', sha: '2d879497587b80b2d9e61f072d9dbe9c07a65357' }
        ]
      })

      const mockSortQuickPicks = (paramPath: string, descending: boolean) => {
        mockShowQuickPick.onFirstCall().resolves({
          value: {
            path: paramPath
          }
        } as QuickPickItemWithValue<Column>)
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

      const testParamParentPathArray: [ColumnType, string] = [
        ColumnType.PARAMS,
        'params.yaml'
      ]
      const testParamPathArray: [ColumnType, ...string[]] = [
        ...testParamParentPathArray,
        'testParam'
      ]
      const otherTestParamPathArray: [ColumnType, ...string[]] = [
        ...testParamParentPathArray,
        'testParam2'
      ]
      const testParamPath = buildMetricOrParamPath(...testParamPathArray)
      const otherTestParamPath = buildMetricOrParamPath(
        ...otherTestParamPathArray
      )

      const getParamsArray = (selector = testParamPathArray) =>
        messageSpy
          .getCall(-1)
          .firstArg.rows[1].subRows?.map((exp: Experiment) =>
            get(exp, selector)
          )

      stub(WorkspaceExperiments.prototype, 'getDvcRoots').returns([dvcDemoPath])
      stub(WorkspaceExperiments.prototype, 'getOnlyOrPickProject').resolves(
        dvcDemoPath
      )
      stub(WorkspaceExperiments.prototype, 'getRepository').returns(experiments)

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
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should handle the user exiting from the choose repository quick pick', async () => {
      const mockShowQuickPick = stub(window, 'showQuickPick')

      stub(WorkspaceExperiments.prototype, 'getDvcRoots').returns([
        dvcDemoPath,
        'mockRoot'
      ])

      const getRepositorySpy = spy(
        WorkspaceExperiments.prototype,
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
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should provide a shortcut to sort by starred experiments', async () => {
      const { experimentsModel } = await stubWorkspaceGetters(disposable)

      const mockAddSort = stub(experimentsModel, 'addSort')

      await commands.executeCommand(
        RegisteredCommands.EXPERIMENT_SORT_ADD_STARRED
      )

      expect(mockAddSort).to.be.calledWith(starredSort)
    })
  })
})
