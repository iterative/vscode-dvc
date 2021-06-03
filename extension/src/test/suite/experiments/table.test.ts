import { resolve } from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import chai from 'chai'
import { stub, spy, restore } from 'sinon'
import sinonChai from 'sinon-chai'
import { window, commands, workspace, Uri } from 'vscode'
import { Deferred } from '@hediet/std/synchronization'
import { Disposable } from '../../../extension'
import { CliReader } from '../../../cli/reader'
import complexExperimentsOutput from '../../../experiments/webview/complex-output-example.json'
import { ExperimentsTable } from '../../../experiments/table'
import { Config } from '../../../config'
import { ResourceLocator } from '../../../resourceLocator'

chai.use(sinonChai)
const { expect } = chai

suite('Experiments Table Test Suite', () => {
  window.showInformationMessage('Start all experiments tests.')

  const dvcDemoPath = resolve(__dirname, '..', '..', '..', '..', '..', 'demo')
  const resourcePath = resolve(__dirname, '..', '..', '..', '..', 'resources')

  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
    return commands.executeCommand('workbench.action.closeAllEditors')
  })

  describe('refresh', () => {
    it('should return the currently unresolved promise if one exists', async () => {
      let deferred = new Deferred()
      const stubbedExperimentShow = stub(async () => {
        await deferred.promise
        deferred = new Deferred()
        return complexExperimentsOutput
      })
      const testCliReader = ({
        experimentShow: stubbedExperimentShow
      } as unknown) as CliReader

      const testTable = new ExperimentsTable(
        'demo',
        {} as Config,
        testCliReader,
        {} as ResourceLocator
      )

      const firstUpdate = testTable.refresh()
      const secondUpdate = testTable.refresh()

      deferred.resolve()
      await secondUpdate

      const thirdUpdate = testTable.refresh()
      expect(firstUpdate).to.equal(secondUpdate)
      expect(secondUpdate).to.not.equal(thirdUpdate)

      deferred.resolve()
    })
  })

  describe('showWebview', () => {
    it('should be able to make the experiment webview visible', async () => {
      stub(CliReader.prototype, 'experimentShow').resolves(
        complexExperimentsOutput
      )

      const config = disposable.track(new Config())
      const cliReader = disposable.track(new CliReader(config))

      const resourceLocator = disposable.track(
        new ResourceLocator(Uri.file(resourcePath))
      )
      const experimentsTable = disposable.track(
        new ExperimentsTable(dvcDemoPath, config, cliReader, resourceLocator)
      )

      const webview = await experimentsTable.showWebview()

      expect(webview.isActive()).to.be.true
      expect(webview.isVisible()).to.be.true
    })

    it('should only be able to open a single experiments webview', async () => {
      const mockReader = stub(CliReader.prototype, 'experimentShow').resolves(
        complexExperimentsOutput
      )

      const config = disposable.track(new Config())
      const cliReader = disposable.track(new CliReader(config))
      const resourceLocator = disposable.track(
        new ResourceLocator(Uri.file(resourcePath))
      )
      const experimentsTable = disposable.track(
        new ExperimentsTable(dvcDemoPath, config, cliReader, resourceLocator)
      )

      const windowSpy = spy(window, 'createWebviewPanel')
      const uri = Uri.file(resolve(dvcDemoPath, 'train.py'))

      const document = await workspace.openTextDocument(uri)
      await window.showTextDocument(document)

      expect(window.activeTextEditor?.document).to.deep.equal(document)

      const webview = await experimentsTable.showWebview()

      expect(windowSpy).to.have.been.calledOnce
      expect(mockReader).to.have.been.calledOnce

      windowSpy.resetHistory()
      mockReader.resetHistory()

      await commands.executeCommand('workbench.action.previousEditor')
      expect(window.activeTextEditor?.document).to.deep.equal(document)

      const sameWebview = await experimentsTable.showWebview()

      expect(webview === sameWebview).to.be.true

      expect(windowSpy).not.to.have.been.called
      expect(mockReader).not.to.have.been.called
    })
  })
})
