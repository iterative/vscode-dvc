import { join } from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub, restore } from 'sinon'
import { EventEmitter } from 'vscode'
import { Disposable } from '../../extension'
import { Config } from '../../config'
import * as Extensions from '../../vscode/extensions'
import * as Python from '../../extensions/python'

suite('Config Test Suite', () => {
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
  })

  describe('Config', () => {
    it('should re-fetch the python extension API (and execution details) if any extensions are enabled/disabled or installed/uninstalled', async () => {
      const mockGetExtensionAPI = stub(Extensions, 'getExtensionAPI').resolves(
        undefined
      )

      const extensionsChanged = disposable.track(new EventEmitter<void>())

      const config = disposable.track(new Config(extensionsChanged.event))
      expect(mockGetExtensionAPI).to.be.calledTwice
      expect(config.pythonBinPath).to.be.undefined

      const pythonBinPath = join('some', 'magic', 'python', 'path')

      const executionDetailsUpdated = new Promise(resolve =>
        disposable.track(
          config.onDidChangeExecutionDetails(() => {
            resolve(undefined)
          })
        )
      )

      stub(Python, 'getPythonBinPath').resolves(pythonBinPath)
      extensionsChanged.fire()

      await executionDetailsUpdated
      expect(config.pythonBinPath).to.equal(pythonBinPath)
    })
  })
})
