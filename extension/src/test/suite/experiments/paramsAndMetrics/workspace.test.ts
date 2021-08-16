import { join } from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub, spy, restore } from 'sinon'
import { EventEmitter, window } from 'vscode'
import jsYaml from 'js-yaml'
import { Disposable } from '../../../../extension'
import { WorkspaceParams } from '../../../../experiments/paramsAndMetrics/workspace'
import * as Watcher from '../../../../fileSystem/watcher'
import * as Disposer from '../../../../util/disposable'
import { dvcDemoPath, getFirstArgOfCall } from '../../util'

suite('Experiments Test Suite', () => {
  window.showInformationMessage('Start all experiments workspace params tests.')

  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
  })

  describe('WorkspaceParams', () => {
    const dvcDemoLock = join(dvcDemoPath, 'dvc.lock')

    it('should call the updater function on setup', async () => {
      const mockUpdater = stub()
      const onDidChangeFileSystemSpy = spy(Watcher, 'onDidChangeFileSystem')

      const workspaceParams = disposable.track(
        new WorkspaceParams(dvcDemoPath, mockUpdater)
      )

      await workspaceParams.isReady()

      expect(mockUpdater).to.be.calledOnce
      expect(onDidChangeFileSystemSpy).to.be.calledTwice

      expect(getFirstArgOfCall(onDidChangeFileSystemSpy, 0)).to.equal(
        join(dvcDemoPath, 'params.yaml')
      )

      expect(getFirstArgOfCall(onDidChangeFileSystemSpy, 1)).to.equal(
        dvcDemoLock
      )
    })

    it('should dispose of current watchers and instantiate new ones if the params files change', async () => {
      const mockUpdater = stub()

      const mockDisposer = stub(Disposer, 'reset')

      const disposalEvent = new Promise(resolve => {
        mockDisposer.callsFake((...args) => {
          resolve(undefined)
          return mockDisposer.wrappedMethod(...args)
        })
      })

      const ee = new EventEmitter<void>()
      const event = ee.event

      const mockOnDidChangeFileSystem = stub(Watcher, 'onDidChangeFileSystem')
      mockOnDidChangeFileSystem
        .onFirstCall()
        .callsFake((...args) =>
          mockOnDidChangeFileSystem.wrappedMethod(...args)
        )
        .onSecondCall()
        .callsFake((path: string, watcher: (path: string) => void) => {
          event(() => watcher(path))
          return {
            dispose: () => undefined,
            isReady: Promise.resolve(undefined)
          }
        })

      const workspaceParams = disposable.track(
        new WorkspaceParams(dvcDemoPath, mockUpdater)
      )

      await workspaceParams.isReady()
      mockOnDidChangeFileSystem.restore()

      const onDidChangeFileSystemSpy = spy(Watcher, 'onDidChangeFileSystem')

      const mockJsYamlLoad = stub(jsYaml, 'load').returns({
        stages: {
          train: {
            params: {
              'newParams.yml': { seed: 10000, weight_decay: 0 },
              'params.yaml': { lr: 400 }
            }
          }
        }
      })

      ee.fire()

      await disposalEvent

      expect(mockDisposer).to.be.called
      expect(mockJsYamlLoad).to.be.called

      expect(onDidChangeFileSystemSpy).to.be.calledTwice
      expect(getFirstArgOfCall(onDidChangeFileSystemSpy, 0)).to.equal(
        join(dvcDemoPath, 'newParams.yml')
      )
      expect(getFirstArgOfCall(onDidChangeFileSystemSpy, 1)).to.equal(
        join(dvcDemoPath, 'params.yaml')
      )
    })
  })
})
