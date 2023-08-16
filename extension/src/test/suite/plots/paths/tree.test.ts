import { join } from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { restore, SinonStub, stub } from 'sinon'
import { commands, QuickPickItem, window } from 'vscode'
import { Disposable } from '../../../../extension'
import { Status } from '../../../../path/selection/model'
import plotsDiffFixture from '../../../fixtures/plotsDiff/output'
import comparisonPlotsFixture from '../../../fixtures/plotsDiff/comparison/vscode'
import templatePlotsFixture from '../../../fixtures/plotsDiff/template'
import { RegisteredCommands } from '../../../../commands/external'
import { dvcDemoPath } from '../../../util'
import { buildPlots, buildPlotsWebview } from '../util'
import { WEBVIEW_TEST_TIMEOUT } from '../../timeouts'
import {
  QuickPickItemWithValue,
  QuickPickOptionsWithTitle
} from '../../../../vscode/quickPick'
import { PlotPath } from '../../../../plots/paths/collect'
import { REVISIONS } from '../../../fixtures/plotsDiff'
import {
  bypassProcessManagerDebounce,
  closeAllEditors,
  getMockNow
} from '../../util'

suite('Plots Paths Tree Test Suite', () => {
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
    return closeAllEditors()
  })

  describe('PlotsPathsTree', () => {
    it('should appear in the UI', async () => {
      await expect(
        commands.executeCommand('dvc.views.plotsPathsTree.focus')
      ).to.be.eventually.equal(undefined)
    })

    it('should be able to toggle whether a plot is selected with dvc.views.plotsPathsTree.toggleStatus', async () => {
      const [path] = Object.keys(plotsDiffFixture.data)
      const { messageSpy } = await buildPlotsWebview({
        disposer: disposable,
        plotsDiff: plotsDiffFixture
      })

      const isUnselected = await commands.executeCommand(
        RegisteredCommands.PLOTS_PATH_TOGGLE,
        {
          dvcRoot: dvcDemoPath,
          path
        }
      )

      expect(isUnselected).to.equal(Status.UNSELECTED)

      expect(messageSpy).to.be.calledWithMatch({
        comparison: {
          ...comparisonPlotsFixture,
          plots: comparisonPlotsFixture.plots.filter(
            ({ path: plotPath }) => plotPath !== path
          )
        }
      })
      messageSpy.resetHistory()

      const isSelected = await commands.executeCommand(
        RegisteredCommands.PLOTS_PATH_TOGGLE,
        {
          dvcRoot: dvcDemoPath,
          path
        }
      )

      expect(isSelected).to.equal(Status.SELECTED)
      expect(messageSpy).to.be.calledWithMatch({
        comparison: comparisonPlotsFixture
      })
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should be able to select / de-select plots using dvc.views.plotsPathsTree.selectPlots', async () => {
      const { messageSpy } = await buildPlotsWebview({
        disposer: disposable,
        plotsDiff: plotsDiffFixture
      })

      messageSpy.resetHistory()

      const noneSelected: QuickPickItemWithValue<PlotPath>[] = []
      const multiImagePath = join('plots', 'image')
      const allSelected: QuickPickItemWithValue<PlotPath>[] = [
        {
          label: multiImagePath,
          value: { path: multiImagePath } as PlotPath
        }
      ]
      for (const path of Object.keys(plotsDiffFixture.data)) {
        if (path.includes(multiImagePath)) {
          continue
        }
        allSelected.push({ label: path, value: { path } as PlotPath })
      }

      const mockShowQuickPick = stub(window, 'showQuickPick') as SinonStub<
        [items: readonly QuickPickItem[], options: QuickPickOptionsWithTitle],
        Thenable<
          | QuickPickItemWithValue<PlotPath>[]
          | QuickPickItemWithValue<PlotPath>
          | undefined
        >
      >
      mockShowQuickPick
        .onFirstCall()
        .resolves(noneSelected)
        .onSecondCall()
        .resolves(allSelected)

      await commands.executeCommand(RegisteredCommands.PLOTS_SELECT)

      expect(mockShowQuickPick).to.be.calledOnce

      expect(
        messageSpy,
        'a message is sent with no plots selected'
      ).to.be.calledWithMatch({
        comparison: null,
        template: null
      })

      await commands.executeCommand(RegisteredCommands.PLOTS_SELECT)

      expect(
        messageSpy,
        'a message is sent with all the plots selected'
      ).to.be.calledWithMatch({
        comparison: comparisonPlotsFixture,
        template: templatePlotsFixture
      })
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should be able to refresh revision data for all plots using dvc.views.plots.refreshPlots', async () => {
      const mockNow = getMockNow()
      const { data, mockPlotsDiff, plots } = await buildPlots({
        disposer: disposable,
        plotsDiff: plotsDiffFixture
      })

      const webview = await plots.showWebview()
      await webview.isReady()

      const dataUpdated = new Promise(resolve =>
        disposable.track(data.onDidUpdate(() => resolve(undefined)))
      )
      mockPlotsDiff.resetHistory()

      bypassProcessManagerDebounce(mockNow)

      await commands.executeCommand(RegisteredCommands.PLOTS_REFRESH)
      await dataUpdated

      expect(mockPlotsDiff).to.be.calledOnce
      expect(mockPlotsDiff).to.be.calledWithExactly(
        dvcDemoPath,
        REVISIONS[0],
        REVISIONS[2],
        REVISIONS[3],
        REVISIONS[4],
        REVISIONS[1]
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)
  })
})
