import { resolve } from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub, restore } from 'sinon'
import { window } from 'vscode'
import { Disposable } from '../../../extension'
import { CliReader } from '../../../cli/reader'
import { Config } from '../../../config'
import { InternalCommands } from '../../../internalCommands'
import { Repository } from '../../../repository'

suite('Repository Test Suite', () => {
  window.showInformationMessage('Start all repository tests.')

  const dvcDemoPath = resolve(__dirname, '..', '..', '..', '..', '..', 'demo')

  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
  })

  describe('Repository', () => {
    it('should queue a reset and return early if a reset is in progress', async () => {
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
        repository.reset(),
        repository.reset(),
        repository.reset(),
        repository.reset(),
        repository.reset()
      ])

      expect(mockList).to.be.calledTwice
      expect(mockDiff).to.be.calledTwice
      expect(mockStatus).to.be.calledTwice
    })
  })

  it('should queue an update and return early if an update is in progress', async () => {
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
    expect(mockDiff).to.be.calledTwice
    expect(mockStatus).to.be.calledTwice
  })

  it('should queue a reset and return early if a reset is in progress and any other calls are made', async () => {
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
      repository.reset(),
      repository.update(),
      repository.reset(),
      repository.update(),
      repository.reset(),
      repository.update()
    ])

    expect(mockList).to.be.calledTwice
    expect(mockDiff).to.be.calledTwice
    expect(mockStatus).to.be.calledTwice
  })

  it('will run both update and reset (and send further calls to the reset queue) if they are called in that order', async () => {
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
      repository.reset(),
      repository.update(),
      repository.reset(),
      repository.update(),
      repository.reset()
    ])

    expect(mockList).to.be.calledTwice
    expect(mockDiff).to.be.calledThrice
    expect(mockStatus).to.be.calledThrice
  })
})
