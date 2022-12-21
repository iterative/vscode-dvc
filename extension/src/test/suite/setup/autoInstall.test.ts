import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { restore, spy, stub } from 'sinon'
import { window } from 'vscode'
import { Disposable } from '../../../extension'
import * as PythonExtension from '../../../extensions/python'
import * as Python from '../../../python'
import { autoInstallDvc } from '../../../setup/autoInstall'
import * as WorkspaceFolders from '../../../vscode/workspaceFolders'

const { getDefaultPython } = Python

suite('Auto Install Test Suite', () => {
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
  })

  describe('autoInstallDvc', () => {
    const defaultPython = getDefaultPython()

    it('should return early if no python binary is found', async () => {
      stub(PythonExtension, 'getPythonExecutionDetails').resolves(undefined)
      stub(Python, 'findPythonBin').resolves(undefined)
      const mockInstallPackages = stub(Python, 'installPackages').resolves(
        undefined
      )

      const showProgressSpy = spy(window, 'withProgress')
      const showErrorSpy = spy(window, 'showErrorMessage')

      await autoInstallDvc()

      expect(showProgressSpy).not.to.be.called
      expect(showErrorSpy).to.be.called
      expect(mockInstallPackages).not.to.be.called
    })

    it('should return early if no the is no workspace folder open', async () => {
      stub(PythonExtension, 'getPythonExecutionDetails').resolves(undefined)
      stub(Python, 'findPythonBin').resolves(defaultPython)
      const mockInstallPackages = stub(Python, 'installPackages').resolves(
        undefined
      )
      stub(WorkspaceFolders, 'getFirstWorkspaceFolder').returns(undefined)

      const showProgressSpy = spy(window, 'withProgress')
      const showErrorSpy = spy(window, 'showErrorMessage')

      await autoInstallDvc()

      expect(showProgressSpy).not.to.be.called
      expect(showErrorSpy).to.be.called
      expect(mockInstallPackages).not.to.be.called
    })

    it('should install DVC and DVCLive if a Python interpreter is found', async () => {
      const cwd = __dirname
      stub(PythonExtension, 'getPythonExecutionDetails').resolves(undefined)
      stub(Python, 'findPythonBin').resolves(defaultPython)
      const mockInstallPackages = stub(Python, 'installPackages').resolves(
        undefined
      )
      stub(WorkspaceFolders, 'getFirstWorkspaceFolder').returns(cwd)

      const showProgressSpy = spy(window, 'withProgress')
      const showErrorSpy = spy(window, 'showErrorMessage')

      await autoInstallDvc()

      expect(showProgressSpy).to.be.called
      expect(showErrorSpy).not.to.be.called
      expect(mockInstallPackages).to.be.calledTwice
      expect(mockInstallPackages).to.be.calledWithExactly(
        cwd,
        defaultPython,
        'dvc'
      )
      expect(mockInstallPackages).to.be.calledWithExactly(
        cwd,
        defaultPython,
        'dvclive'
      )
    })
  })
})
