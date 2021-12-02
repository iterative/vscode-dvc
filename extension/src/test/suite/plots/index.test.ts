import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { restore } from 'sinon'
import { buildPlots } from '../plots/util'
import { Disposable } from '../../../extension'
import livePlotsFixture from '../../fixtures/expShow/livePlots'
import { plotsShowFixture } from '../../fixtures/plotsShow/output'
import { staticPlotsFixture } from '../../fixtures/plotsShow/staticPlots/integration'
import { closeAllEditors } from '../util'
import { PlotsData } from '../../../plots/webview/contract'

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

      const webview = await plots.showWebview()

      const expectedPlotsData: PlotsData = {
        live: livePlotsFixture,
        static: staticPlotsFixture
      }

      expect(messageSpy).to.be.calledWith(expectedPlotsData)
      expect(mockPlotsShow).to.be.called

      expect(webview.isActive()).to.be.true
      expect(webview.isVisible()).to.be.true
    }).timeout(8000)
  })
})
