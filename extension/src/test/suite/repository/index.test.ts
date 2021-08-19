import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub, restore } from 'sinon'
import { window } from 'vscode'
import { Disposable } from '../../../extension'
import { CliReader } from '../../../cli/reader'
import { Config } from '../../../config'
import { InternalCommands } from '../../../internalCommands'
import { Repository } from '../../../repository'
import { dvcDemoPath } from '../util'

suite('Repository Test Suite', () => {
  window.showInformationMessage('Start all repository tests.')

  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
  })

  describe('Repository', () => {
    it('should not queue a reset within 200ms of one starting', async () => {
      const config = disposable.track(new Config())
      const cliReader = disposable.track(new CliReader(config))
      const mockList = stub(cliReader, 'listDvcOnlyRecursive').resolves([])
      const mockDiff = stub(cliReader, 'diff').resolves({})
      const mockStatus = stub(cliReader, 'status').resolves({})
      const internalCommands = disposable.track(
        new InternalCommands(config, cliReader)
      )

      const repository = disposable.track(
        new Repository(dvcDemoPath, internalCommands)
      )

      await Promise.all([
        repository.isReady(),
        repository.reset(),
        repository.reset(),
        repository.reset(),
        repository.reset(),
        repository.reset()
      ])

      expect(mockList).to.be.calledOnce
      expect(mockDiff).to.be.calledOnce
      expect(mockStatus).to.be.calledOnce
    })

    it('should not queue an update within 200ms of one starting', async () => {
      const config = disposable.track(new Config())
      const cliReader = disposable.track(new CliReader(config))
      const mockList = stub(cliReader, 'listDvcOnlyRecursive').resolves([])
      const mockDiff = stub(cliReader, 'diff').resolves({})
      const mockStatus = stub(cliReader, 'status').resolves({})
      const internalCommands = disposable.track(
        new InternalCommands(config, cliReader)
      )

      const repository = disposable.track(
        new Repository(dvcDemoPath, internalCommands)
      )
      await repository.isReady()
      mockList.resetHistory()
      mockDiff.resetHistory()
      mockStatus.resetHistory()

      await Promise.all([
        repository.update(),
        repository.update(),
        repository.update(),
        repository.update(),
        repository.update()
      ])

      expect(mockList).not.to.be.called
      expect(mockDiff).to.be.calledOnce
      expect(mockStatus).to.be.calledOnce
    })

    it('should debounce all calls made within 200ms of a reset', async () => {
      const config = disposable.track(new Config())
      const cliReader = disposable.track(new CliReader(config))
      const mockList = stub(cliReader, 'listDvcOnlyRecursive').resolves([])
      const mockDiff = stub(cliReader, 'diff').resolves({})
      const mockStatus = stub(cliReader, 'status').resolves({})
      const internalCommands = disposable.track(
        new InternalCommands(config, cliReader)
      )

      const mockReset = stub(Repository.prototype, 'reset').resolves(undefined)

      const repository = disposable.track(
        new Repository(dvcDemoPath, internalCommands)
      )

      await repository.isReady()
      mockReset.restore()

      await Promise.all([
        repository.reset(),
        repository.update(),
        repository.reset(),
        repository.update(),
        repository.reset(),
        repository.update()
      ])

      expect(mockList).to.be.calledOnce
      expect(mockDiff).to.be.calledOnce
      expect(mockStatus).to.be.calledOnce
    })

    it('should run update and queue reset (and send further calls to the reset queue) if they are called in that order', async () => {
      const config = disposable.track(new Config())
      const cliReader = disposable.track(new CliReader(config))
      const mockList = stub(cliReader, 'listDvcOnlyRecursive').resolves([])
      const mockDiff = stub(cliReader, 'diff').resolves({})
      const mockStatus = stub(cliReader, 'status').resolves({})
      const internalCommands = disposable.track(
        new InternalCommands(config, cliReader)
      )

      const mockReset = stub(Repository.prototype, 'reset').resolves(undefined)

      const repository = disposable.track(
        new Repository(dvcDemoPath, internalCommands)
      )

      await repository.isReady()
      mockReset.restore()

      await Promise.all([
        repository.update(),
        repository.reset(),
        repository.update(),
        repository.reset(),
        repository.update(),
        repository.reset()
      ])

      expect(mockList).to.be.calledOnce
      expect(mockDiff).to.be.calledTwice
      expect(mockStatus).to.be.calledTwice
    })
  })
})
