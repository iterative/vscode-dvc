import { commands } from 'vscode'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { restore, stub } from 'sinon'
import { buildPlots } from '../plots/util'
import { Disposable } from '../../../extension'
import plotsDiffFixture from '../../fixtures/plotsDiff/output'
import { closeAllEditors } from '../util'
import * as customPlotQuickPickUtil from '../../../plots/model/quickPick'
import { customPlotsOrderFixture } from '../../fixtures/expShow/base/customPlots'
import { RegisteredCommands } from '../../../commands/external'

suite('Workspace Plots Test Suite', () => {
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(function () {
    this.timeout(6000)
    disposable.dispose()
    return closeAllEditors()
  })

  describe('dvc.addCustomPlot', () => {
    it('should be able to add a custom plot', async () => {
      const { plotsModel } = await buildPlots(disposable, plotsDiffFixture)

      const mockGetMetricAndParam = stub(
        customPlotQuickPickUtil,
        'pickMetricAndParam'
      )

      const mockMetricVsParamOrderValue = {
        metric: 'summary.json:accuracy',
        param: 'params.yaml:dropout'
      }

      mockGetMetricAndParam.onFirstCall().resolves(mockMetricVsParamOrderValue)

      const mockSetCustomPlotsOrder = stub(plotsModel, 'setCustomPlotsOrder')
      mockSetCustomPlotsOrder.returns(undefined)

      await commands.executeCommand(RegisteredCommands.PLOTS_CUSTOM_ADD)

      expect(mockSetCustomPlotsOrder).to.be.calledWith([
        ...customPlotsOrderFixture,
        mockMetricVsParamOrderValue
      ])
    })

    it('should not add a custom plot if user cancels', async () => {
      const { plotsModel } = await buildPlots(disposable, plotsDiffFixture)
      const mockGetMetricAndParam = stub(
        customPlotQuickPickUtil,
        'pickMetricAndParam'
      )

      mockGetMetricAndParam.onFirstCall().resolves(undefined)

      const mockSetCustomPlotsOrder = stub(plotsModel, 'setCustomPlotsOrder')
      mockSetCustomPlotsOrder.returns(undefined)

      await commands.executeCommand(RegisteredCommands.PLOTS_CUSTOM_ADD)

      expect(mockSetCustomPlotsOrder).to.not.be.called
    })
  })

  describe('dvc.removeCustomPlots', () => {
    it('should be able to remove a custom plot', async () => {
      const { plotsModel } = await buildPlots(disposable, plotsDiffFixture)

      const mockSelectCustomPlots = stub(
        customPlotQuickPickUtil,
        'pickCustomPlots'
      )

      mockSelectCustomPlots
        .onFirstCall()
        .resolves(['custom-summary.json:loss-params.yaml:dropout'])

      stub(plotsModel, 'getCustomPlotsOrder').returns([
        {
          metric: 'summary.json:loss',
          param: 'params.yaml:dropout'
        }
      ])

      const mockSetCustomPlotsOrder = stub(plotsModel, 'setCustomPlotsOrder')
      mockSetCustomPlotsOrder.returns(undefined)

      await commands.executeCommand(RegisteredCommands.PLOTS_CUSTOM_REMOVE)

      expect(mockSetCustomPlotsOrder).to.be.calledWith([])
    })

    it('should not remove a custom plot if the user cancels', async () => {
      const { plotsModel } = await buildPlots(disposable, plotsDiffFixture)

      const mockSelectCustomPlots = stub(
        customPlotQuickPickUtil,
        'pickCustomPlots'
      )

      mockSelectCustomPlots.onFirstCall().resolves(undefined)

      stub(plotsModel, 'getCustomPlotsOrder').returns([
        {
          metric: 'summary.json:loss',
          param: 'params.yaml:dropout'
        }
      ])

      const mockSetCustomPlotsOrder = stub(plotsModel, 'setCustomPlotsOrder')
      mockSetCustomPlotsOrder.returns(undefined)

      await commands.executeCommand(RegisteredCommands.PLOTS_CUSTOM_REMOVE)

      expect(mockSetCustomPlotsOrder).to.not.be.called
    })
  })
})
