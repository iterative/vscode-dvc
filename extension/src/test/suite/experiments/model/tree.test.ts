import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub, restore } from 'sinon'
import { commands } from 'vscode'
import { Disposable } from '../../../../extension'
import { WorkspaceExperiments } from '../../../../experiments/workspace'
import { Status } from '../../../../experiments/model'
import { dvcDemoPath } from '../../util'
import { RegisteredCommands } from '../../../../commands/external'
import { buildExperiments } from '../util'
import { WorkspacePlots } from '../../../../plots/workspace'
import { BaseWebview } from '../../../../webview'
import { CliReader } from '../../../../cli/reader'
import { Plots } from '../../../../plots'
import livePlotsFixture from '../../../fixtures/expShow/livePlots'

suite('Experiments Params And Metrics Tree Test Suite', () => {
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
  })

  describe('ExperimentsTree', () => {
    it('should appear in the UI', async () => {
      await expect(
        commands.executeCommand('dvc.views.experimentsTree.focus')
      ).to.be.eventually.equal(undefined)
    })

    it('should be able to toggle whether an experiment is shown in the plots webview with dvc.views.experimentsTree.toggleStatus', async () => {
      const { experiments, internalCommands, resourceLocator } =
        buildExperiments(disposable)

      await experiments.isReady()

      const mockShow = stub(BaseWebview.prototype, 'show')

      const messageEvent = () =>
        new Promise(resolve => {
          mockShow.resetBehavior()
          mockShow.resetHistory()
          mockShow.callsFake((...args) => {
            resolve(undefined)
            return mockShow.wrappedMethod(...args)
          })
        })

      stub(CliReader.prototype, 'plotsShow').resolves({})

      const plots = disposable.track(
        new Plots(dvcDemoPath, internalCommands, resourceLocator.scatterGraph)
      )
      plots.setExperiments(experiments)
      await plots.isReady()

      stub(WorkspaceExperiments.prototype, 'getRepository').returns(experiments)
      stub(WorkspacePlots.prototype, 'getRepository').returns(plots)

      const { plots: plotsData, colors } = livePlotsFixture
      const { domain, range } = colors
      const mutableFixture = {
        colors: {
          domain: [...domain],
          range: [...range]
        },
        plots: plotsData
      }

      const initialEvent = messageEvent()
      await plots.showWebview()
      await initialEvent

      while (mutableFixture.colors.domain.length) {
        expect(mockShow).to.be.calledWith({
          data: {
            live: mutableFixture,
            static: undefined
          }
        })
        const messageReceived = messageEvent()
        const id = mutableFixture.colors.domain.pop()
        mutableFixture.colors.range.pop()

        const unSelected = await commands.executeCommand(
          RegisteredCommands.EXPERIMENT_TOGGLE,
          {
            dvcRoot: dvcDemoPath,
            id
          }
        )

        expect(unSelected).to.equal(Status.unselected)

        await messageReceived
      }

      expect(mockShow).to.be.calledWith({
        data: {
          live: undefined,
          static: undefined
        }
      })
    }).timeout(10000)
  })
})
