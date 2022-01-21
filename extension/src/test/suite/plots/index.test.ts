import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { restore, stub } from 'sinon'
import { buildPlots } from '../plots/util'
import { Disposable } from '../../../extension'
import livePlotsFixture from '../../fixtures/expShow/livePlots'
import plotsDiffFixture from '../../fixtures/plotsDiff/output'
import staticPlotsFixture from '../../fixtures/plotsDiff/static'
import comparisonPlotsFixture from '../../fixtures/plotsDiff/comparison/vscode'
import { closeAllEditors } from '../util'
import {
  defaultSectionCollapsed,
  PlotsData as TPlotsData
} from '../../../plots/webview/contract'

suite('Plots Test Suite', () => {
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(function () {
    this.timeout(5000)
    disposable.dispose()
    return closeAllEditors()
  })

  describe('showWebview', () => {
    it('should be able to make the plots webview visible', async () => {
      const { plots, plotsModel, mockPlotsDiff, messageSpy } = await buildPlots(
        disposable,
        plotsDiffFixture
      )

      const mockGetLivePlots = stub(plotsModel, 'getLivePlots')
      const getLivePlotsEvent = new Promise(resolve =>
        mockGetLivePlots.callsFake(() => {
          resolve(undefined)
          return mockGetLivePlots.wrappedMethod.bind(plotsModel)()
        })
      )

      const webview = await plots.showWebview()
      await getLivePlotsEvent

      expect(mockPlotsDiff).to.be.called

      const expectedPlotsData: TPlotsData = {
        comparison: comparisonPlotsFixture,
        live: livePlotsFixture,
        sectionCollapsed: defaultSectionCollapsed,
        static: staticPlotsFixture
      }

      expect(messageSpy).to.be.calledWith(expectedPlotsData)

      expect(webview.isActive()).to.be.true
      expect(webview.isVisible()).to.be.true
    }).timeout(8000)
  })
})
