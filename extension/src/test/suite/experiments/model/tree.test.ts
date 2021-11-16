import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { spy, stub, restore } from 'sinon'
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
import { LivePlotsData } from '../../../../plots/webview/contract'

suite('Experiments Tree Test Suite', () => {
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

      const messageSpy = spy(BaseWebview.prototype, 'show')

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
      const expectedDomain = [...domain]
      const expectedRange = [...range]

      const getExpectedLivePlots = (): LivePlotsData => ({
        colors: {
          domain: expectedDomain,
          range: expectedRange
        },
        plots: plotsData.map(plot => ({
          title: plot.title,
          values: plot.values.filter(values =>
            expectedDomain.includes(values.group)
          )
        }))
      })

      await plots.showWebview()

      while (expectedDomain.length) {
        expect(
          messageSpy,
          'a message is sent with colors for the currently selected experiments'
        ).to.be.calledWith({
          data: {
            live: getExpectedLivePlots(),
            static: undefined
          }
        })
        messageSpy.resetHistory()

        const id = expectedDomain.pop()
        expectedRange.pop()

        const unSelected = await commands.executeCommand(
          RegisteredCommands.EXPERIMENT_TOGGLE,
          {
            dvcRoot: dvcDemoPath,
            id
          }
        )

        expect(unSelected).to.equal(Status.unselected)
      }

      expect(
        messageSpy,
        'when there are no experiments selected we send undefined (show empty state)'
      ).to.be.calledWith({
        data: {
          live: undefined,
          static: undefined
        }
      })
      messageSpy.resetHistory()

      const id = domain[0]
      expectedDomain.push(id)
      expectedRange.push(range[0])

      const selected = await commands.executeCommand(
        RegisteredCommands.EXPERIMENT_TOGGLE,
        {
          dvcRoot: dvcDemoPath,
          id
        }
      )

      expect(selected, 'the experiment is now selected').to.equal(
        Status.selected
      )

      expect(messageSpy, 'we no longer send undefined').to.be.calledWith({
        data: {
          live: getExpectedLivePlots(),
          static: undefined
        }
      })
    }).timeout(6000)
  })
})
