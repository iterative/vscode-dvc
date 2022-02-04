import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { stub, restore } from 'sinon'
import { expect } from 'chai'
import { Disposable } from '../../../../extension'
import { FileSystemData } from '../../../../fileSystem/data'
import { dvcDemoPath } from '../../../util'
import * as FileSystem from '../../../../fileSystem'
import * as Watcher from '../../../../fileSystem/watcher'
import { getFirstArgOfCall, mockDisposable } from '../../util'
import { join } from '../../../util/path'

suite('File System Data Test Suite', () => {
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
  })

  describe('FileSystemData', () => {
    it('should read the dvc.yaml from the demo path and send an event containing the path and the yaml', async () => {
      stub(Watcher, 'createFileSystemWatcher').returns(mockDisposable)
      const data = disposable.track(new FileSystemData(dvcDemoPath))

      disposable.track(
        data.onDidUpdate(({ path, yaml }) => {
          expect(path).to.equal(dvcDemoPath)
          expect(yaml.stages.train.outs).to.deep.equal([
            { 'model.pt': { checkpoint: true } }
          ])
        })
      )

      await data.isReady()
    })

    it('should create a watcher with the expected glob', async () => {
      const mockCreateFileSystemWatcher = stub(
        Watcher,
        'createFileSystemWatcher'
      ).returns(mockDisposable)
      stub(FileSystem, 'loadYaml').returns(undefined)
      const data = disposable.track(new FileSystemData(dvcDemoPath))

      expect(mockCreateFileSystemWatcher).to.be.calledOnce
      expect(getFirstArgOfCall(mockCreateFileSystemWatcher, 0)).to.equal(
        join(dvcDemoPath, '**', 'dvc.yaml')
      )

      await data.isReady()
    })
  })
})
