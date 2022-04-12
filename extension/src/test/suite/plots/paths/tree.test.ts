import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { restore } from 'sinon'
import { commands } from 'vscode'
import plotsDiffFixture from 'dvc-fixtures/src/plotsDiff/output'
import comparisonPlotsFixture from 'dvc-fixtures/src/plotsDiff/comparison/vscode'
import { Disposable } from '../../../../extension'
import { Status } from '../../../../path/selection/model'
import { RegisteredCommands } from '../../../../commands/external'
import { dvcDemoPath } from '../../../util'
import { buildPlots } from '../util'
import { WEBVIEW_TEST_TIMEOUT } from '../../timeouts'

suite('Plots Paths Tree Test Suite', () => {
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
  })

  describe('PlotsPathsTree', () => {
    it('should appear in the UI', async () => {
      await expect(
        commands.executeCommand('dvc.views.plotsPathsTree.focus')
      ).to.be.eventually.equal(undefined)
    })

    it('should be able to toggle whether a plot is selected with dvc.views.plotsPathsTree.toggleStatus', async () => {
      const [path] = Object.keys(plotsDiffFixture)
      const { plots, messageSpy } = await buildPlots(
        disposable,
        plotsDiffFixture
      )

      await plots.showWebview()

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
  })
})
