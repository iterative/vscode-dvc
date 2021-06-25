import { resolve } from 'path'
import { beforeEach, describe, it, suite } from 'mocha'
import chai from 'chai'
import { stub, restore } from 'sinon'
import sinonChai from 'sinon-chai'
import { window } from 'vscode'
import { Disposable } from '../../../extension'
import { CliReader } from '../../../cli/reader'
import { Config } from '../../../config'
import { InternalCommands } from '../../../internalCommands'
import { Repository } from '../../../repository'

chai.use(sinonChai)
const { expect } = chai

suite('Repository Test Suite', () => {
  window.showInformationMessage('Start all experiments tests.')

  const dvcDemoPath = resolve(__dirname, '..', '..', '..', '..', '..', 'demo')

  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
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
        repository.resetState(),
        repository.resetState(),
        repository.resetState(),
        repository.resetState(),
        repository.resetState()
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
      repository.updateState(),
      repository.updateState(),
      repository.updateState(),
      repository.updateState(),
      repository.updateState()
    ])

    expect(mockList).not.to.be.called
    expect(mockDiff).to.be.calledTwice
    expect(mockStatus).to.be.calledTwice
  })
})
