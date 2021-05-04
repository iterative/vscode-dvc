import { afterEach, describe, it, suite } from 'mocha'
import chai from 'chai'
import { stub, spy } from 'sinon'
import sinonChai from 'sinon-chai'
import { resolve } from 'path'
import {
  window,
  commands,
  workspace,
  Uri,
  ConfigurationChangeEvent
} from 'vscode'
import { Disposable } from '../../extension'
import * as DvcReader from '../../cli/reader'
import complexExperimentsOutput from '../../webviews/experiments/complex-output-example.json'
import { ExperimentsWebview } from '../../webviews/experiments/ExperimentsWebview'

chai.use(sinonChai)
const { expect } = chai

suite('Extension Test Suite', () => {
  window.showInformationMessage('Start all extension tests.')

  const dvcPathOption = 'dvc.dvcPath'

  const dvcDemoPath = resolve(__dirname, '..', '..', '..', '..', 'demo')

  afterEach(async () => {
    await workspace.getConfiguration().update(dvcPathOption, undefined, false)
    return commands.executeCommand('workbench.action.closeAllEditors')
  })

  describe('showExperiments', () => {
    const showExperimentsCommand = 'dvc.showExperiments'
    it('should be able to make the experiments webview visible', async () => {
      const mockReader = stub(DvcReader, 'experimentShow').resolves(
        complexExperimentsOutput
      )

      const experimentsWebview = (await commands.executeCommand(
        showExperimentsCommand
      )) as ExperimentsWebview

      expect(experimentsWebview.isActive()).to.be.true
      expect(experimentsWebview.isVisible()).to.be.true

      mockReader.restore()
      experimentsWebview.dispose()
    })

    it('should only be able to open a single experiments webview', async () => {
      const windowSpy = spy(window, 'createWebviewPanel')
      const uri = Uri.file(resolve(dvcDemoPath, 'train.py'))

      const mockReader = stub(DvcReader, 'experimentShow').resolves(
        complexExperimentsOutput
      )

      const document = await workspace.openTextDocument(uri)
      await window.showTextDocument(document)

      expect(window.activeTextEditor?.document).to.deep.equal(document)

      const experimentsWebview = (await commands.executeCommand(
        showExperimentsCommand
      )) as ExperimentsWebview

      expect(windowSpy).to.have.been.calledOnce
      expect(mockReader).to.have.been.calledOnce

      windowSpy.resetHistory()
      mockReader.resetHistory()

      await commands.executeCommand('workbench.action.previousEditor')
      expect(window.activeTextEditor?.document).to.deep.equal(document)

      const sameWebview = await commands.executeCommand('dvc.showExperiments')

      expect(experimentsWebview === sameWebview).to.be.true

      expect(windowSpy).not.to.have.been.called
      expect(mockReader).to.have.been.calledOnce

      windowSpy.restore()
      mockReader.restore()
      experimentsWebview.dispose()
    })
  })

  describe('dvc.selectDvcPath', () => {
    const selectDvcPathItem = async (selection: number) => {
      const selectionPromise = commands.executeCommand('dvc.selectDvcPath')

      for (let i = 0; i <= selection; i++) {
        await commands.executeCommand('workbench.action.quickOpenSelectNext')
      }
      await commands.executeCommand(
        'workbench.action.acceptSelectedQuickOpenItem'
      )
      await selectionPromise
    }

    it('should set dvc.dvcPath to blank on the first option', async () => {
      const mockShowInputBox = stub(window, 'showInputBox')
      await selectDvcPathItem(0)

      expect(await workspace.getConfiguration().get(dvcPathOption)).to.equal('')

      expect(mockShowInputBox).not.to.have.been.called

      mockShowInputBox.restore()
    })

    it('should invoke the file picker with the second option', async () => {
      const disposable = Disposable.fn()
      const testUri = Uri.file('/file/picked/path/to/dvc')
      const fileResolve = [testUri]
      const mockShowOpenDialog = stub(window, 'showOpenDialog').resolves(
        fileResolve
      )

      const configurationChangeEvent = () => {
        return new Promise(resolve => {
          const listener: Disposable = workspace.onDidChangeConfiguration(
            (event: ConfigurationChangeEvent) => {
              return resolve(event)
            }
          )
          disposable.track(listener)
        })
      }

      await selectDvcPathItem(1)

      expect(mockShowOpenDialog).to.have.been.called

      await configurationChangeEvent()

      expect(await workspace.getConfiguration().get(dvcPathOption)).to.equal(
        testUri.fsPath
      )

      mockShowOpenDialog.restore()
      disposable.dispose()
    })
  })
})
