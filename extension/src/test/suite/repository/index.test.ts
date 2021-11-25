import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub, restore } from 'sinon'
import { Disposable } from '../../../extension'
import { CliReader } from '../../../cli/reader'
import { Config } from '../../../config'
import { InternalCommands } from '../../../commands/internal'
import { Repository } from '../../../repository'
import { dvcDemoPath, FakeTimers, mockTime } from '../util'
import { OutputChannel } from '../../../vscode/outputChannel'

suite('Repository Test Suite', () => {
  const disposable = Disposable.fn()
  let fakeTimers: FakeTimers

  beforeEach(() => {
    restore()
    fakeTimers = mockTime(disposable)
  })

  afterEach(() => {
    disposable.dispose()
  })

  const buildRepository = () => {
    const config = disposable.track(new Config())
    const cliReader = disposable.track(new CliReader(config))
    const mockList = stub(cliReader, 'listDvcOnlyRecursive').resolves([])
    const mockDiff = stub(cliReader, 'diff').resolves({})
    const mockStatus = stub(cliReader, 'status').resolves({})
    const outputChannel = disposable.track(
      new OutputChannel([cliReader], '1', 'T1')
    )
    const internalCommands = disposable.track(
      new InternalCommands(config, outputChannel, cliReader)
    )

    const repository = disposable.track(
      new Repository(dvcDemoPath, internalCommands)
    )

    return { mockDiff, mockList, mockStatus, repository }
  }

  describe('Repository', () => {
    it('should not queue a reset within 200ms of one starting', async () => {
      const { mockDiff, mockList, mockStatus, repository } = buildRepository()

      fakeTimers.advance(50)

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
      const { mockDiff, mockList, mockStatus, repository } = buildRepository()

      await repository.isReady()
      fakeTimers.advance(200)
      mockList.resetHistory()
      mockDiff.resetHistory()
      mockStatus.resetHistory()

      const firstUpdate = repository.update()
      fakeTimers.advance(50)

      await Promise.all([
        firstUpdate,
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
      const { mockDiff, mockList, mockStatus, repository } = buildRepository()
      fakeTimers.advance(50)

      await Promise.all([
        repository.isReady(),
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
      const mockReset = stub(Repository.prototype, 'reset').resolves(undefined)

      const { mockDiff, mockList, mockStatus, repository } = buildRepository()

      await repository.isReady()
      mockReset.restore()
      fakeTimers.advance(200)

      const firstUpdate = repository.update()
      const firstReset = repository.reset()
      fakeTimers.advance(50)

      await Promise.all([
        firstUpdate,
        firstReset,
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
