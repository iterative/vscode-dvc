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
  ParamOrMetric
} from '../../../../../experiments/webview/contract'
import { QuickPickItemWithValue } from '../../../../../vscode/quickPick'

suite('Experiments Test Suite', () => {
  window.showInformationMessage('Start all experiments sort by tree tests.')

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

      let callIndex = 0
      const getTestParamsArray = () => {
        const result = messageSpy
          .getCall(callIndex)
          .firstArg.tableData.rows[1].subRows?.map((exp: Experiment) =>
            get(exp, testParamPathArray)
          )
        callIndex++
        return result
      }

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
      await commands.executeCommand('dvc.addExperimentsTableSort', dvcDemoPath)
      await tableChangedPromise
      mockShowQuickPick.reset()
      expect(
        getTestParamsArray(),
        'single sort with table command'
      ).to.deep.equal([1, 2, 3])

      const tableSortRemoved = new Promise(resolve => {
        experimentsRepository.onDidChangeExperiments(resolve)
      })
      await commands.executeCommand('dvc.removeExperimentsTableSorts')
      await tableSortRemoved
      expect(
        getTestParamsArray(),
        'row order is reset after first clear'
      ).to.deep.equal([1, 3, 2])

      await addSortWithMocks(otherTestParamPath, false)
      expect(
        getTestParamsArray(),
        `row order is changed after applying a sort on ${otherTestParamPath}`
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
        getTestParamsArray(),
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
        getTestParamsArray(),
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
        getTestParamsArray(),
        'remove first sort individually'
      ).to.deep.equal([3, 2, 1])

      await commands.executeCommand(
        'dvc.removeExperimentsTableSorts',
        dvcDemoPath
      )
      expect(getTestParamsArray(), 'final sort clear').to.deep.equal([1, 3, 2])
    })
  })
})
