import { join, sep } from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { FileSystemWatcher } from 'vscode'
import { expect } from 'chai'
import { stub, restore } from 'sinon'
import { Disposable } from '../../../../extension'
import { CliReader } from '../../../../cli/reader'
import expShowFixture from '../../../fixtures/expShow/output'
import { Config } from '../../../../config'
import { dvcDemoPath, getFirstArgOfCall } from '../../util'
import { OutputChannel } from '../../../../vscode/outputChannel'
import { ExperimentsData } from '../../../../experiments/data'
import { InternalCommands } from '../../../../commands/internal'
import * as Watcher from '../../../../fileSystem/watcher'
import * as Time from '../../../../util/time'

suite('Experiments Data Test Suite', () => {
  const disposable = Disposable.fn()
  const mockWatcher = {
    dispose: stub()
  } as Disposable

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
  })

  describe('ExperimentsData', () => {
    it('should debounce all calls to update that are made within 200ms', async () => {
      stub(Watcher, 'createFileSystemWatcher').resolves(mockWatcher)
      stub(Watcher, 'createNecessaryFileSystemWatcher').returns(mockWatcher)

      const config = disposable.track(new Config())
      const cliReader = disposable.track(new CliReader(config))
      const mockExperimentShow = stub(cliReader, 'experimentShow').resolves(
        expShowFixture
      )

      const outputChannel = disposable.track(
        new OutputChannel([cliReader], '-1', 'data test suite')
      )

      const internalCommands = disposable.track(
        new InternalCommands(outputChannel, cliReader)
      )

      const data = disposable.track(
        new ExperimentsData(dvcDemoPath, internalCommands)
      )

      await Promise.all([
        data.managedUpdate(),
        data.managedUpdate(),
        data.managedUpdate(),
        data.managedUpdate(),
        data.managedUpdate(),
        data.managedUpdate()
      ])

      expect(mockExperimentShow).to.be.calledOnce
    })

    it('should call the updater function on setup', async () => {
      stub(Watcher, 'createNecessaryFileSystemWatcher').returns(mockWatcher)

      const config = disposable.track(new Config())
      const cliReader = disposable.track(new CliReader(config))
      const mockExperimentShow = stub(cliReader, 'experimentShow').resolves(
        expShowFixture
      )

      const mockCreateFileSystemWatcher = stub(
        Watcher,
        'createFileSystemWatcher'
      ).returns(mockWatcher)

      const outputChannel = disposable.track(
        new OutputChannel([cliReader], '-2', 'WWWEEEEEEEE')
      )

      const internalCommands = disposable.track(
        new InternalCommands(outputChannel, cliReader)
      )
      const data = disposable.track(
        new ExperimentsData(dvcDemoPath, internalCommands)
      )

      await data.isReady()

      expect(mockExperimentShow).to.be.calledOnce
      expect(mockCreateFileSystemWatcher).to.be.calledOnce

      expect(getFirstArgOfCall(mockCreateFileSystemWatcher, 0)).to.equal(
        join(
          dvcDemoPath,
          '**',
          `{dvc.lock,dvc.yaml,params.yaml,nested${sep}params.yaml,summary.json}`
        )
      )
    })

    it('should dispose of the current watcher and instantiate a new one if the params files change', async () => {
      stub(Watcher, 'createNecessaryFileSystemWatcher').returns(mockWatcher)

      const now = stub(Time, 'getCurrentEpoch').returns(100)

      const config = disposable.track(new Config())
      const cliReader = disposable.track(new CliReader(config))
      const mockExperimentShow = stub(cliReader, 'experimentShow').resolves(
        expShowFixture
      )

      const mockDispose = stub()

      const mockCreateFileSystemWatcher = stub(
        Watcher,
        'createFileSystemWatcher'
      )
      mockCreateFileSystemWatcher.callsFake(() => {
        return { dispose: mockDispose } as unknown as FileSystemWatcher
      })

      const outputChannel = disposable.track(
        new OutputChannel([cliReader], '200', 'chunnel')
      )

      const internalCommands = disposable.track(
        new InternalCommands(outputChannel, cliReader)
      )
      const data = disposable.track(
        new ExperimentsData(dvcDemoPath, internalCommands)
      )

      await data.isReady()
      now.resetBehavior()
      now.returns(20000000000)

      mockExperimentShow.resolves(
        Object.assign(
          { ...expShowFixture },
          {
            workspace: {
              baseline: {
                data: {
                  metrics: {
                    ...(expShowFixture.workspace.baseline.data?.metrics || {}),
                    'new_summary.json': {
                      data: { auc: 0, loss: 1 }
                    }
                  },
                  params: {
                    ...(expShowFixture.workspace.baseline.data?.params || {}),
                    'new_params.yml': {
                      data: { new_seed: 10000, new_weight_decay: 0 }
                    }
                  }
                }
              }
            }
          }
        )
      )

      const dataUpdatedEvent = new Promise(resolve =>
        data.onDidUpdate(data => resolve(data))
      )

      data.managedUpdate()

      await dataUpdatedEvent

      expect(mockCreateFileSystemWatcher).to.be.calledTwice
      expect(mockDispose).to.be.calledOnce
      expect(getFirstArgOfCall(mockCreateFileSystemWatcher, 0)).to.equal(
        join(
          dvcDemoPath,
          '**',
          `{dvc.lock,dvc.yaml,params.yaml,nested${sep}params.yaml,summary.json}`
        )
      )
      expect(getFirstArgOfCall(mockCreateFileSystemWatcher, 1)).to.equal(
        join(
          dvcDemoPath,
          '**',
          `{dvc.lock,dvc.yaml,params.yaml,nested${sep}params.yaml,new_params.yml,new_summary.json,summary.json}`
        )
      )
    })
  })
})
