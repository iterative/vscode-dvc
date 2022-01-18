import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { restore, spy, stub } from 'sinon'
import { buildPlots } from '../plots/util'
import { Disposable } from '../../../extension'
import livePlotsFixture from '../../fixtures/expShow/livePlots'
import plotsDiffFixture from '../../fixtures/plotsDiff/output'
import staticPlotsFixture from '../../fixtures/plotsDiff/staticPlots/vscode'
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
      const {
        data,
        experiments,
        plots,
        plotsModel,
        mockPlotsDiff,
        messageSpy
      } = await buildPlots(disposable, plotsDiffFixture)

      const mockGetLivePlots = stub(plotsModel, 'getLivePlots')
      const getLivePlotsEvent = new Promise(resolve =>
        mockGetLivePlots.callsFake(() => {
          resolve(undefined)
          return mockGetLivePlots.wrappedMethod.bind(plotsModel)()
        })
      )
      stub(experiments, 'getColors').returns({
        '6220556': '#f14c4c',
        '7ee8096': '#cca700',
        a9eb4fd: '#3794ff',
        e36f8a9: '#d18616'
      })
      stub(plotsModel, 'getRevisions').returns([
        'a9eb4fd',
        '7ee8096',
        'e36f8a9',
        '6220556'
      ])

      const managedUpdateSpy = spy(data, 'managedUpdate')

      const webview = await plots.showWebview()
      await getLivePlotsEvent

      expect(mockPlotsDiff).to.be.called
      expect(managedUpdateSpy, 'should call the cli when the webview is loaded')
        .to.be.calledOnce

      expect(messageSpy).to.be.calledWith({
        static: staticPlotsFixture
      })

      const expectedPlotsData: TPlotsData = {
        live: livePlotsFixture,
        sectionCollapsed: defaultSectionCollapsed
      }

      expect(messageSpy).to.be.calledWith(expectedPlotsData)

      expect(webview.isActive()).to.be.true
      expect(webview.isVisible()).to.be.true
    }).timeout(8000)
  })
})
