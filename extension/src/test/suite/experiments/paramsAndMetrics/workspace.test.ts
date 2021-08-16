import { join } from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub, spy, restore } from 'sinon'
import { window } from 'vscode'
import { utimes } from 'fs-extra'
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
        join(dvcDemoPath, 'dvc.lock')
      )
      expect(getFirstArgOfCall(onDidChangeFileSystemSpy, 1)).to.equal(
        join(dvcDemoPath, 'params.yaml')
      )
    })

    it('should dispose of current watchers and instantiate new ones if the params files change', async () => {
      const mockUpdater = stub()

      const workspaceParams = disposable.track(
        new WorkspaceParams(dvcDemoPath, mockUpdater)
      )

      await workspaceParams.isReady()

      const onDidChangeFileSystemSpy = spy(Watcher, 'onDidChangeFileSystem')

      const mockJsYamlLoad = stub(jsYaml, 'load')
      const jsYamlLoadEvent = new Promise(resolve =>
        mockJsYamlLoad.callsFake(() => {
          resolve(undefined)
          return {
            stages: {
              train: {
                params: {
                  'newParams.yaml': { seed: 10000, weight_decay: 0 },
                  'params.yaml': { lr: 400 }
                }
              }
            }
          }
        })
      )

      const mockDisposer = spy(Disposer, 'reset')

      const touchTime = new Date()
      await utimes(join(dvcDemoPath, 'dvc.lock'), touchTime, touchTime)

      await jsYamlLoadEvent

      expect(mockDisposer).to.be.called
      expect(mockJsYamlLoad).to.be.called

      expect(onDidChangeFileSystemSpy).to.be.calledTwice
      expect(getFirstArgOfCall(onDidChangeFileSystemSpy, 0)).to.equal(
        join(dvcDemoPath, 'newParams.yaml')
      )
      expect(getFirstArgOfCall(onDidChangeFileSystemSpy, 1)).to.equal(
        join(dvcDemoPath, 'params.yaml')
      )
    })
  })
})
