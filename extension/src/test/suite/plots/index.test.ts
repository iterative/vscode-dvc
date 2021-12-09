import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { restore, spy } from 'sinon'
import { buildPlots } from '../plots/util'
import { Disposable } from '../../../extension'
import livePlotsFixture from '../../fixtures/expShow/livePlots'
import plotsShowFixture from '../../fixtures/plotsShow/output'
import { closeAllEditors } from '../util'
import { PlotsData as TPlotsData } from '../../../plots/webview/contract'
import { PlotsData } from '../../../plots/data'

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
      const { plots, mockPlotsShow, messageSpy } = await buildPlots(
        disposable,
        plotsShowFixture
      )
      const managedUpdateSpy = spy(PlotsData.prototype, 'managedUpdate')

      const webview = await plots.showWebview()

      const expectedPlotsData: TPlotsData = {
        live: livePlotsFixture
      }

      expect(messageSpy).to.be.calledWith(expectedPlotsData)
      expect(mockPlotsShow).to.be.called
      expect(managedUpdateSpy, 'should call the cli when the webview is loaded')
        .to.be.calledOnce

      expect(webview.isActive()).to.be.true
      expect(webview.isVisible()).to.be.true
    }).timeout(8000)
  })
})
