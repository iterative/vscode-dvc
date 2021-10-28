import { describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { spy } from 'sinon'
import { buildPlots } from './experiments/util'
import { Disposable } from '../../extension'
import { BaseWebview } from '../../webview'
import complexPlotsData from '../fixtures/complex-plots-example'

suite('Plots test suite', () => {
  const disposer = Disposable.fn()
  describe('webview', () => {
    it('can make the plots webview visible', async () => {
      const { plots } = buildPlots(disposer)
      const messageSpy = spy(BaseWebview.prototype, 'show')
      const webview = await plots.showWebview()
      expect(messageSpy).to.be.calledWith({ data: complexPlotsData })
      expect(webview.isActive()).to.be.true
      expect(webview.isVisible()).to.be.true
    })
  })
})
