import { join, resolve } from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub, restore } from 'sinon'
import { EventEmitter, Uri, workspace } from 'vscode'
import { Disposable } from '../../extension'
import { Config } from '../../config'
import * as Extensions from '../../vscode/extensions'
import * as Python from '../../extensions/python'
import * as WorkspaceFolders from '../../vscode/workspaceFolders'
import { ConfigKey, setConfigValue } from '../../vscode/config'

suite('Config Test Suite', () => {
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
    return setConfigValue(ConfigKey.FOCUSED_PROJECTS, undefined)
  })

  describe('Config', () => {
    it('should re-fetch the python extension API (and execution details) if any extensions are enabled/disabled or installed/uninstalled', async () => {
      const mockGetExtensionAPI = stub(Extensions, 'getExtensionAPI').resolves(
        undefined
      )

      const extensionsChanged = disposable.track(new EventEmitter<void>())

      const config = disposable.track(new Config(extensionsChanged.event))
      expect(mockGetExtensionAPI).to.be.calledTwice
      expect(config.getPythonBinPath()).to.be.undefined

      const pythonBinPath = join('some', 'magic', 'python', 'path')

      const executionDetailsUpdated = new Promise(resolve =>
        disposable.track(
          config.onDidChangeConfigurationDetails(() => {
            resolve(undefined)
          })
        )
      )

      stub(Python, 'getPythonBinPath').resolves(pythonBinPath)
      extensionsChanged.fire()

      await executionDetailsUpdated
      expect(config.getPythonBinPath()).to.equal(pythonBinPath)
    })
  })

  it('should fire an event if dvc.focusedProjects is changed', async () => {
    const getConfigUpdatedPromise = () =>
      new Promise(resolve => {
        const singleUseListener = workspace.onDidChangeConfiguration(e => {
          if (e.affectsConfiguration(ConfigKey.FOCUSED_PROJECTS)) {
            resolve(undefined)
            disposable.untrack(singleUseListener)
            singleUseListener.dispose()
          }
        })
        disposable.track(singleUseListener)
      })

    const extensionsChanged = disposable.track(new EventEmitter<void>())
    const config = disposable.track(new Config(extensionsChanged.event))
    await config.isReady()

    let configUpdated = getConfigUpdatedPromise()
    let setupTriggeredCount = 0
    disposable.track(
      config.onDidChangeConfigurationDetails(() => {
        setupTriggeredCount = setupTriggeredCount + 1
      })
    )
    const mockDvcMonoRepo = Uri.file(resolve('mono-repo')).fsPath
    const mockGetWorkspaceFolders = stub(
      WorkspaceFolders,
      'getWorkspaceFolders'
    ).returns([mockDvcMonoRepo])
    const mockDvcSubRoot1 = Uri.file(join(mockDvcMonoRepo, 'subroot1')).fsPath
    const mockDvcSubRoot2 = Uri.file(
      join(mockDvcMonoRepo, 'subroot2', 'deep', 'root')
    ).fsPath

    await setConfigValue(ConfigKey.FOCUSED_PROJECTS, mockDvcSubRoot1)
    await configUpdated

    expect(
      config.getFocusedProjects(),
      'should set the focused project to the root if it is inside of the workspace'
    ).to.deep.equal([mockDvcSubRoot1])
    expect(setupTriggeredCount).to.equal(1)

    configUpdated = getConfigUpdatedPromise()

    await setConfigValue(ConfigKey.FOCUSED_PROJECTS, [mockDvcSubRoot1])
    await configUpdated

    expect(
      config.getFocusedProjects(),
      'should not call setup if the value(s) inside of the option have not changed'
    ).to.deep.equal([mockDvcSubRoot1])
    expect(setupTriggeredCount).to.equal(1)

    configUpdated = getConfigUpdatedPromise()

    await setConfigValue(ConfigKey.FOCUSED_PROJECTS, [
      mockDvcSubRoot1,
      mockDvcSubRoot2
    ])
    await configUpdated

    expect(
      config.getFocusedProjects(),
      'should be able to focus multiple sub-projects'
    ).to.deep.equal([mockDvcSubRoot1, mockDvcSubRoot2])
    expect(setupTriggeredCount).to.equal(2)

    await setConfigValue(ConfigKey.FOCUSED_PROJECTS, [
      mockDvcSubRoot2,
      mockDvcSubRoot1
    ])
    await configUpdated

    expect(
      config.getFocusedProjects(),
      'should not call setup if the value(s) inside of the option have not changed'
    ).to.deep.equal([mockDvcSubRoot1, mockDvcSubRoot2])
    expect(setupTriggeredCount).to.equal(2)

    await setConfigValue(ConfigKey.FOCUSED_PROJECTS, [
      mockDvcSubRoot2,
      mockDvcSubRoot1,
      mockDvcMonoRepo
    ])
    await configUpdated

    expect(
      config.getFocusedProjects(),
      'should be able to focus multiple sub-projects along with the monorepo root'
    ).to.deep.equal([mockDvcMonoRepo, mockDvcSubRoot1, mockDvcSubRoot2])
    expect(setupTriggeredCount).to.equal(3)

    await setConfigValue(ConfigKey.FOCUSED_PROJECTS, undefined)
    await configUpdated

    expect(
      config.getFocusedProjects(),
      'should be able to unset the option'
    ).to.equal(undefined)
    expect(setupTriggeredCount).to.equal(4)

    await setConfigValue(ConfigKey.FOCUSED_PROJECTS, null)
    await configUpdated

    expect(
      config.getFocusedProjects(),
      'should be able to set the option to the default value'
    ).to.equal(undefined)
    expect(setupTriggeredCount).to.equal(4)

    mockGetWorkspaceFolders.restore()

    await setConfigValue(ConfigKey.FOCUSED_PROJECTS, [
      mockDvcSubRoot2,
      mockDvcSubRoot1,
      mockDvcMonoRepo
    ])
    await configUpdated

    expect(
      config.getFocusedProjects(),
      'should exclude projects that are outside of the workspace'
    ).to.equal(undefined)
    expect(setupTriggeredCount).to.equal(4)
  })
})
