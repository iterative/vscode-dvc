import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import chai from 'chai'
import { stub, spy, restore } from 'sinon'
import sinonChai from 'sinon-chai'
import { resolve } from 'path'
import { window, commands, workspace, Uri } from 'vscode'
import { Disposable } from '../../../extension'
import * as CliReader from '../../../cli/reader'
import complexExperimentsOutput from '../../../Experiments/Webview/complex-output-example.json'
import { Experiments } from '../../../Experiments'
import { Config } from '../../../Config'
import { ResourceLocator } from '../../../ResourceLocator'

chai.use(sinonChai)
const { expect } = chai

suite('Experiment Test Suite', () => {
  window.showInformationMessage('Start all experiments tests.')

  const dvcDemoPath = resolve(__dirname, '..', '..', '..', '..', '..', 'demo')
  const resourcePath = resolve(__dirname, '..', '..', '..', '..', 'resources')

  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
  })

  describe('showWebview', () => {
    it('should be able to make the experiments webview visible', async () => {
      stub(CliReader, 'experimentShow').resolves(complexExperimentsOutput)

      const config = disposable.track(new Config())
      const resourceLocator = disposable.track(
        new ResourceLocator(Uri.file(resourcePath))
      )
      const experiments = disposable.track(
        new Experiments(dvcDemoPath, config, resourceLocator)
      )

      const webview = await experiments.showWebview()

      expect(webview.isActive()).to.be.true
      expect(webview.isVisible()).to.be.true
    })

    it('should only be able to open a single experiments webview', async () => {
      const mockReader = stub(CliReader, 'experimentShow').resolves(
        complexExperimentsOutput
      )

      const config = disposable.track(new Config())
      const resourceLocator = disposable.track(
        new ResourceLocator(Uri.file(resourcePath))
      )
      const experiments = disposable.track(
        new Experiments(dvcDemoPath, config, resourceLocator)
      )

      const windowSpy = spy(window, 'createWebviewPanel')
      const uri = Uri.file(resolve(dvcDemoPath, 'train.py'))

      const document = await workspace.openTextDocument(uri)
      await window.showTextDocument(document)

      expect(window.activeTextEditor?.document).to.deep.equal(document)

      const webview = await experiments.showWebview()

      expect(windowSpy).to.have.been.calledOnce
      expect(mockReader).to.have.been.calledOnce

      windowSpy.resetHistory()
      mockReader.resetHistory()

      await commands.executeCommand('workbench.action.previousEditor')
      expect(window.activeTextEditor?.document).to.deep.equal(document)

      const sameWebview = await experiments.showWebview()

      expect(webview === sameWebview).to.be.true

      expect(windowSpy).not.to.have.been.called
      expect(mockReader).not.to.have.been.called
    })
  })
})
