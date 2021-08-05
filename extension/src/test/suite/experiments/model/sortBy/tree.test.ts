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
          params: {
            'params.yaml': {
              data: {
                testparam: 10,
                testparam2: 2
              }
            }
          },
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
                testparam2: 2
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
          params: {
            'params.yaml': {
              data: {
                testparam: 1,
                testparam2: 2
              }
            }
          },
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
    it('should be able to update the table data by adding and removing a sort', async () => {
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

      const testParamPathArray = ['params', 'params.yaml', 'testparam']
      const testParamPath = path.join(...testParamPathArray)

      mockShowQuickPick.onFirstCall().resolves({
        value: {
          group: 'params',
          hasChildren: false,
          maxNumber: 10,
          maxStringLength: 2,
          minNumber: 1,
          name: 'testparam',
          parentPath: 'params/params.yaml',
          path: testParamPath,
          types: ['number']
        }
      } as QuickPickItemWithValue<ParamOrMetric>)
      mockShowQuickPick
        .onSecondCall()
        .resolves({ value: false } as QuickPickItemWithValue<boolean>)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub((Experiments as any).prototype, 'getRepository').returns(
        experimentsRepository
      )
      stub(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (Experiments as any).prototype,
        'getFocusedOrDefaultOrPickProject'
      ).returns(dvcDemoPath)

      const tableSortAdded = new Promise(resolve => {
        experimentsRepository.onDidChangeExperiments(resolve)
      })

      await commands.executeCommand('dvc.addNewExperimentsTableSort')

      await tableSortAdded

      const tableSortRemoved = new Promise(resolve => {
        experimentsRepository.onDidChangeExperiments(resolve)
      })

      await commands.executeCommand('dvc.clearExperimentsTableSort')
      await tableSortRemoved

      expect(
        messageSpy
          .getCall(0)
          .firstArg.tableData.rows[1].subRows.map((exp: Experiment) =>
            get(exp, testParamPathArray)
          )
      ).to.deep.equal([1, 2, 3])
      expect(
        messageSpy
          .getCall(-1)
          .firstArg.tableData.rows[1].subRows.map((exp: Experiment) =>
            get(exp, testParamPathArray)
          )
      ).to.deep.equal([1, 3, 2])
    })
  })
})
