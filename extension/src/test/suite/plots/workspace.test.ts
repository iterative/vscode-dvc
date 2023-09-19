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
import * as quickPickUtil from '../../../plots/quickPick'
import { WorkspacePipeline } from '../../../pipeline/workspace'

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

  describe('dvc.addPlot', () => {
    it('should be able to add a top-level plot', async () => {
      const mockPickPlotType = stub(quickPickUtil, 'pickPlotType')
      const mockAddTopLevelPlot = stub(
        WorkspacePipeline.prototype,
        'addTopLevelPlot'
      )

      mockPickPlotType.onFirstCall().resolves(quickPickUtil.PLOT_TYPE.TOP_LEVEL)
      mockAddTopLevelPlot.onFirstCall().resolves(undefined)

      await commands.executeCommand(RegisteredCommands.ADD_PLOT)

      expect(mockAddTopLevelPlot).to.be.calledOnce
    })

    it('should be able to add a custom plot', async () => {
      const { plotsModel } = await buildPlots({
        disposer: disposable,
        plotsDiff: plotsDiffFixture
      })

      const mockPickPlotType = stub(quickPickUtil, 'pickPlotType')

      const mockGetMetricAndParam = stub(
        customPlotQuickPickUtil,
        'pickMetricAndParam'
      )

      const mockMetricVsParamOrderValue = {
        metric: 'summary.json:accuracy',
        param: 'params.yaml:log_file'
      }

      mockPickPlotType.onFirstCall().resolves(quickPickUtil.PLOT_TYPE.CUSTOM)
      mockGetMetricAndParam.onFirstCall().resolves(mockMetricVsParamOrderValue)

      const mockSetCustomPlotsOrder = stub(plotsModel, 'setCustomPlotsOrder')
      mockSetCustomPlotsOrder.returns(undefined)

      await commands.executeCommand(RegisteredCommands.ADD_PLOT)

      expect(mockSetCustomPlotsOrder).to.be.calledWith([
        ...customPlotsOrderFixture,
        mockMetricVsParamOrderValue
      ])
    })

    it('should not add a plot if users cancels', async () => {
      const mockPickPlotType = stub(quickPickUtil, 'pickPlotType')
      const mockAddTopLevelPlot = stub(
        WorkspacePipeline.prototype,
        'addTopLevelPlot'
      )
      const mockGetMetricAndParam = stub(
        customPlotQuickPickUtil,
        'pickMetricAndParam'
      )

      mockPickPlotType.onFirstCall().resolves(undefined)

      await commands.executeCommand(RegisteredCommands.ADD_PLOT)

      expect(mockAddTopLevelPlot).not.to.be.called
      expect(mockGetMetricAndParam).not.to.be.called
    })

    it('should not add a custom plot if user cancels during custom plot creation', async () => {
      const { plotsModel } = await buildPlots({
        disposer: disposable,
        plotsDiff: plotsDiffFixture
      })
      const mockGetMetricAndParam = stub(
        customPlotQuickPickUtil,
        'pickMetricAndParam'
      )
      const mockPickPlotType = stub(quickPickUtil, 'pickPlotType')

      mockPickPlotType.onFirstCall().resolves(quickPickUtil.PLOT_TYPE.CUSTOM)
      mockGetMetricAndParam.onFirstCall().resolves(undefined)

      const mockSetCustomPlotsOrder = stub(plotsModel, 'setCustomPlotsOrder')
      mockSetCustomPlotsOrder.returns(undefined)

      await commands.executeCommand(RegisteredCommands.ADD_PLOT)

      expect(mockSetCustomPlotsOrder).to.not.be.called
    })
  })

  describe('dvc.views.plots.removeCustomPlots', () => {
    it('should be able to remove a custom plot', async () => {
      const { plotsModel } = await buildPlots({
        disposer: disposable,
        plotsDiff: plotsDiffFixture
      })

      const mockSelectCustomPlots = stub(
        customPlotQuickPickUtil,
        'pickCustomPlots'
      )

      mockSelectCustomPlots
        .onFirstCall()
        .resolves(['custom-summary.json:loss-params.yaml:log_file'])

      stub(plotsModel, 'getCustomPlotsOrder').returns([
        {
          metric: 'summary.json:loss',
          param: 'params.yaml:log_file'
        }
      ])

      const mockSetCustomPlotsOrder = stub(plotsModel, 'setCustomPlotsOrder')
      mockSetCustomPlotsOrder.returns(undefined)

      await commands.executeCommand(RegisteredCommands.PLOTS_CUSTOM_REMOVE)

      expect(mockSetCustomPlotsOrder).to.be.calledWith([])
    })

    it('should not remove a custom plot if the user cancels', async () => {
      const { plotsModel } = await buildPlots({
        disposer: disposable,
        plotsDiff: plotsDiffFixture
      })

      const mockSelectCustomPlots = stub(
        customPlotQuickPickUtil,
        'pickCustomPlots'
      )

      mockSelectCustomPlots.onFirstCall().resolves(undefined)

      stub(plotsModel, 'getCustomPlotsOrder').returns([
        {
          metric: 'summary.json:loss',
          param: 'params.yaml:log_file'
        }
      ])

      const mockSetCustomPlotsOrder = stub(plotsModel, 'setCustomPlotsOrder')
      mockSetCustomPlotsOrder.returns(undefined)

      await commands.executeCommand(RegisteredCommands.PLOTS_CUSTOM_REMOVE)

      expect(mockSetCustomPlotsOrder).to.not.be.called
    })
  })
})
