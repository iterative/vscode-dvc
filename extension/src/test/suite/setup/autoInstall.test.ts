import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { restore, spy, stub } from 'sinon'
import { window } from 'vscode'
import { Disposable } from '../../../extension'
import * as PythonExtension from '../../../extensions/python'
import * as Python from '../../../python'
import { autoInstallDvc, autoUpgradeDvc } from '../../../setup/autoInstall'
import * as WorkspaceFolders from '../../../vscode/workspaceFolders'
import { bypassProgressCloseDelay } from '../util'
import { Toast } from '../../../vscode/toast'

const { getDefaultPython } = Python

suite('Auto Install Test Suite', () => {
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
  })

  const defaultPython = getDefaultPython()

  describe('autoUpgradeDvc', () => {
    it('should return early if no Python interpreter is found', async () => {
      stub(PythonExtension, 'getPythonExecutionDetails').resolves(undefined)
      stub(Python, 'findPythonBin').resolves(undefined)
      const mockInstallPackages = stub(Python, 'installPackages').resolves(
        undefined
      )

      const showProgressSpy = spy(window, 'withProgress')
      const showErrorSpy = spy(window, 'showErrorMessage')

      await autoUpgradeDvc()

      expect(showProgressSpy).not.to.be.called
      expect(showErrorSpy).to.be.called
      expect(mockInstallPackages).not.to.be.called
    })

    it('should return early if there is no workspace folder open', async () => {
      stub(PythonExtension, 'getPythonExecutionDetails').resolves(undefined)
      stub(Python, 'findPythonBin').resolves(defaultPython)
      const mockInstallPackages = stub(Python, 'installPackages').resolves(
        undefined
      )
      stub(WorkspaceFolders, 'getFirstWorkspaceFolder').returns(undefined)

      const showProgressSpy = spy(window, 'withProgress')
      const showErrorSpy = spy(window, 'showErrorMessage')

      await autoUpgradeDvc()

      expect(showProgressSpy).not.to.be.called
      expect(showErrorSpy).to.be.called
      expect(mockInstallPackages).not.to.be.called
    })

    it('should install DVC if a Python interpreter is found', async () => {
      bypassProgressCloseDelay()
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
      expect(mockInstallPackages).to.be.called
      expect(mockInstallPackages).to.be.calledWithExactly(
        cwd,
        defaultPython,
        'dvc'
      )
    })

    it('should show an error message if DVC fails to install', async () => {
      bypassProgressCloseDelay()
      const cwd = __dirname
      stub(PythonExtension, 'getPythonExecutionDetails').resolves(undefined)
      stub(Python, 'findPythonBin').resolves(defaultPython)
      const mockInstallPackages = stub(Python, 'installPackages')
        .onFirstCall()
        .rejects(new Error('Network error'))
      stub(WorkspaceFolders, 'getFirstWorkspaceFolder').returns(cwd)

      const showProgressSpy = spy(window, 'withProgress')
      const showErrorSpy = spy(window, 'showErrorMessage')
      const reportProgressErrorSpy = spy(Toast, 'reportProgressError')

      await autoUpgradeDvc()

      expect(showProgressSpy).to.be.called
      expect(showErrorSpy).not.to.be.called
      expect(reportProgressErrorSpy).to.be.calledOnce
      expect(mockInstallPackages).to.be.called
      expect(mockInstallPackages).to.be.calledWithExactly(
        cwd,
        defaultPython,
        'dvc'
      )
    })
  })

  describe('autoInstallDvc', () => {
    it('should return early if no Python interpreter is found', async () => {
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

    it('should return early if there is no workspace folder open', async () => {
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
      bypassProgressCloseDelay()
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

    it('should show an error message and exit early if DVCLive fails to install', async () => {
      bypassProgressCloseDelay()
      const cwd = __dirname
      stub(PythonExtension, 'getPythonExecutionDetails').resolves(undefined)
      stub(Python, 'findPythonBin').resolves(defaultPython)
      const mockInstallPackages = stub(Python, 'installPackages').rejects(
        new Error('Failed to install DVCLive')
      )
      stub(WorkspaceFolders, 'getFirstWorkspaceFolder').returns(cwd)

      const showProgressSpy = spy(window, 'withProgress')
      const showErrorSpy = spy(window, 'showErrorMessage')

      await autoInstallDvc()

      expect(showProgressSpy).to.be.called
      expect(showErrorSpy).not.to.be.called
      expect(mockInstallPackages).to.be.calledOnce
      expect(mockInstallPackages).to.be.calledWithExactly(
        cwd,
        defaultPython,
        'dvclive'
      )
    })

    it('should show an error message if DVC fails to install', async () => {
      bypassProgressCloseDelay()
      const cwd = __dirname
      stub(PythonExtension, 'getPythonExecutionDetails').resolves(undefined)
      stub(Python, 'findPythonBin').resolves(defaultPython)
      const mockInstallPackages = stub(Python, 'installPackages')
        .onFirstCall()
        .resolves(undefined)
        .onSecondCall()
        .rejects(new Error('Network error'))
      stub(WorkspaceFolders, 'getFirstWorkspaceFolder').returns(cwd)

      const showProgressSpy = spy(window, 'withProgress')
      const showErrorSpy = spy(window, 'showErrorMessage')
      const reportProgressErrorSpy = spy(Toast, 'reportProgressError')

      await autoInstallDvc()

      expect(showProgressSpy).to.be.called
      expect(showErrorSpy).not.to.be.called
      expect(reportProgressErrorSpy).to.be.calledOnce
      expect(mockInstallPackages).to.be.calledTwice
      expect(mockInstallPackages).to.be.calledWithExactly(
        cwd,
        defaultPython,
        'dvclive'
      )
      expect(mockInstallPackages).to.be.calledWithExactly(
        cwd,
        defaultPython,
        'dvc'
      )
    })
  })
})
