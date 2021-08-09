import path, { resolve } from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub, spy, restore } from 'sinon'
import { window, commands, Uri } from 'vscode'
import get from 'lodash.get'
import { Disposable } from '../../../../../extension'
import { CliReader, ExperimentsRepoJSONOutput } from '../../../../../cli/reader'
import { Experiments } from '../../../../../experiments'
import { ExperimentsRepository } from '../../../../../experiments/repository'
import { Config } from '../../../../../config'
import { ResourceLocator } from '../../../../../resourceLocator'
import { CliRunner } from '../../../../../cli/runner'
import { InternalCommands } from '../../../../../internalCommands'
import {
  Experiment,
  ParamOrMetric,
  TableData
} from '../../../../../experiments/webview/contract'
import { QuickPickItemWithValue } from '../../../../../vscode/quickPick'

suite('Experiments Test Suite', () => {
  window.showInformationMessage('Start all experiments sort by tree tests.')

  const commonFields = {
    executor: null,
    queued: false,
    running: false
  }

  const testData = {
    '42b8736b08170529903cd203a1f40382a4b4a8cd': {
      baseline: {
        data: {
          ...commonFields,
          name: 'test-branch',
          timestamp: '2020-12-29T15:28:59'
        }
      },
      d3f4a0d3661c5977540d2205d819470cf0d2145a: {
        data: {
          ...commonFields,
          checkpoint_parent: '42b8736b08170529903cd203a1f40382a4b4a8cd',
          checkpoint_tip: 'd3f4a0d3661c5977540d2205d819470cf0d2145a',
          name: 'exp-05694',
          params: {
            'params.yaml': {
              data: {
                testparam: 1,
                testparam2: 1
              }
            }
          },
          timestamp: '2021-01-14T10:58:00'
        }
      },
      f0778b3eb6a390d6f6731c735a2a4561d1792c3a: {
        data: {
          ...commonFields,
          checkpoint_parent: '42b8736b08170529903cd203a1f40382a4b4a8cd',
          checkpoint_tip: 'f0778b3eb6a390d6f6731c735a2a4561d1792c3a',
          params: {
            'params.yaml': {
              data: {
                testparam: 3,
                testparam2: 1
              }
            }
          },
          timestamp: '2021-01-14T10:57:59'
        }
      },
      f81f1b5a1248b9d9f595fb53136298c69f908e66: {
        data: {
          ...commonFields,
          checkpoint_parent: '42b8736b08170529903cd203a1f40382a4b4a8cd',
          checkpoint_tip: 'f81f1b5a1248b9d9f595fb53136298c69f908e66',
          params: {
            'params.yaml': {
              data: {
                testparam: 2,
                testparam2: 2
              }
            }
          },
          timestamp: '2021-01-14T10:57:53'
        }
      }
    },
    workspace: {
      baseline: {
        data: {
          ...commonFields,
          executor: 'workspace',
          timestamp: null
        }
      }
    }
  }

  const dvcDemoPath = resolve(
    __dirname,
    '..',
    '..',
    '..',
    '..',
    '..',
    '..',
    'demo'
  )
  const resourcePath = resolve(
    __dirname,
    '..',
    '..',
    '..',
    '..',
    '..',
    '..',
    'resources'
  )
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
  })

  describe('experimentsSortByTree', () => {
    it('should be able to properly add and remove sorts with a variety of commands', async () => {
      // setup

      const mockShowQuickPick = stub(window, 'showQuickPick')

      const config = disposable.track(new Config())
      const cliReader = disposable.track(new CliReader(config))
      stub(cliReader, 'experimentShow').resolves(
        testData as unknown as ExperimentsRepoJSONOutput
      )
      const cliRunner = disposable.track(new CliRunner(config))

      const internalCommands = disposable.track(
        new InternalCommands(config, cliReader, cliRunner)
      )

      const resourceLocator = disposable.track(
        new ResourceLocator(Uri.file(resourcePath))
      )

      const experimentsRepository = new ExperimentsRepository(
        dvcDemoPath,
        internalCommands,
        resourceLocator
      )

      await experimentsRepository.isReady()
      const experimentsWebview = await experimentsRepository.showWebview()
      await experimentsWebview.isReady()
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
        const tableChangedPromise = new Promise(resolve => {
          experimentsRepository.onDidChangeExperiments(resolve)
        })
        await commands.executeCommand('dvc.addExperimentsTableSort')
        await tableChangedPromise
        mockShowQuickPick.reset()
      }

      const testParamParentPathArray = ['params', 'params.yaml']
      const testParamPathArray = [...testParamParentPathArray, 'testparam']
      const otherTestParamPathArray = [
        ...testParamParentPathArray,
        'testparam2'
      ]
      const testParamPath = path.join(...testParamPathArray)
      const otherTestParamPath = path.join(...otherTestParamPathArray)

      const pluckTestParams = (messageArg: { tableData: TableData }) =>
        messageArg.tableData.rows[1].subRows?.map((exp: Experiment) =>
          get(exp, testParamPathArray)
        )

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub((Experiments as any).prototype, 'getRepository').returns(
        experimentsRepository
      )
      stub(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (Experiments as any).prototype,
        'getFocusedOrDefaultOrPickProject'
      ).returns(dvcDemoPath)

      // Setup done, perform the test

      mockSortQuickPicks(testParamPath, false)
      const tableChangedPromise = new Promise(resolve => {
        experimentsRepository.onDidChangeExperiments(resolve)
      })
      await commands.executeCommand(
        'dvc.views.experimentsSortByTree.addSort',
        dvcDemoPath
      )
      await tableChangedPromise
      mockShowQuickPick.reset()
      expect(
        pluckTestParams(messageSpy.getCall(0).firstArg),
        'single sort with table command'
      ).to.deep.equal([1, 2, 3])

      const tableSortRemoved = new Promise(resolve => {
        experimentsRepository.onDidChangeExperiments(resolve)
      })
      await commands.executeCommand('dvc.removeExperimentsTableSorts')
      await tableSortRemoved
      expect(
        pluckTestParams(messageSpy.getCall(1).firstArg),
        'first clear'
      ).to.deep.equal([1, 3, 2])

      await addSortWithMocks(otherTestParamPath, false)
      expect(
        pluckTestParams(messageSpy.getCall(2).firstArg),
        'secondary sort'
      ).to.deep.equal([1, 3, 2])

      await addSortWithMocks(testParamPath, true)
      expect(
        experimentsRepository.getSorts(),
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
        pluckTestParams(messageSpy.getCall(3).firstArg),
        'the result of both sorts is sent to the webview'
      ).to.deep.equal([3, 1, 2])

      await addSortWithMocks(otherTestParamPath, true)
      expect(
        experimentsRepository.getSorts(),
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
        pluckTestParams(messageSpy.getCall(4).firstArg),
        'the result of the switched sort is sent to the webview'
      ).to.deep.equal([2, 3, 1])

      await commands.executeCommand(
        'dvc.views.experimentsSortByTree.removeSort',
        {
          parent: dvcDemoPath,
          sort: { path: otherTestParamPath }
        }
      )
      expect(
        pluckTestParams(messageSpy.getCall(5).firstArg),
        'remove first sort'
      ).to.deep.equal([3, 2, 1])

      await commands.executeCommand(
        'dvc.views.experimentsSortByTree.removeAllSorts',
        dvcDemoPath
      )
      expect(
        pluckTestParams(messageSpy.getCall(6).firstArg),
        'clear with removeAllSorts'
      ).to.deep.equal([1, 3, 2])
    })
  })
})
