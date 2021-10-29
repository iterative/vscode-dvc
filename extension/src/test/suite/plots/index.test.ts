import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { spy, restore } from 'sinon'
import { buildExperiments } from '../experiments/util'
import { Disposable } from '../../../extension'
import complexExperimentsOutput from '../../fixtures/complex-output-example'
import complexLivePlotsData from '../../fixtures/complex-live-plots-example'
import { closeAllEditors, dvcDemoPath } from '../util'
import { BaseWebview } from '../../../webview'
import { PlotsData } from '../../../plots/webview/contract'
import { Plots } from '../../../plots'

suite('Plots Test Suite', () => {
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
    return closeAllEditors()
  })

  describe('showWebview', () => {
    it('should be able to make the plots webview visible', async () => {
      const { experiments, internalCommands, resourceLocator } =
        buildExperiments(disposable, complexExperimentsOutput)

      const messageSpy = spy(BaseWebview.prototype, 'show')

      const plots = disposable.track(
        new Plots(dvcDemoPath, internalCommands, resourceLocator)
      )
      plots.setExperiments(experiments)
      await plots.isReady()

      const webview = await plots.showWebview()

      const expectedPlotsData: PlotsData = complexLivePlotsData

      expect(messageSpy).to.be.calledWith({ data: expectedPlotsData })

      expect(webview.isActive()).to.be.true
      expect(webview.isVisible()).to.be.true
    }).timeout(5000)
  })
})
