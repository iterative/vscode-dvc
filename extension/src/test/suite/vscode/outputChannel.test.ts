import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { EventEmitter, window, OutputChannel as VSOutputChannel } from 'vscode'
import { restore, stub, fake } from 'sinon'
import { OutputChannel } from '../../../vscode/outputChannel'
import { Disposable } from '../../../extension'
import { Cli, CliResult, CliStarted } from '../../../cli'
import { Config } from '../../../config'

suite('Output Channel Test Suite', () => {
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
  })

  describe('OutputChannel', () => {
    const cwd = __dirname
    const version = '1.0.0'

    it('should handle a process completing without error', () => {
      const processCompleted = disposable.track(new EventEmitter<CliResult>())
      const processStarted = disposable.track(new EventEmitter<CliStarted>())

      const cli = disposable.track(
        new Cli({} as Config, { processCompleted, processStarted })
      )
      const mockAppend = fake()
      const mockOutputChannel = stub(window, 'createOutputChannel').returns({
        append: mockAppend,
        dispose: fake()
      } as unknown as VSOutputChannel)

      disposable.track(new OutputChannel([cli], version, 'The Success Channel'))

      processStarted.fire({
        command: 'some command',
        cwd,
        pid: 3000
      })

      processCompleted.fire({
        command: 'some command',
        cwd,
        duration: 500,
        exitCode: 0,
        pid: 3000
      })

      expect(mockOutputChannel).to.be.called
      expect(mockAppend).to.be.calledWithMatch(
        /\[.*?] > some command - INITIALIZED\n/
      )
      expect(mockAppend).to.be.calledWithMatch(
        /\[.*?] > some command - COMPLETED \(500ms\)\n/
      )
    })

    it('should handle a process throwing an error', () => {
      const processCompleted = disposable.track(new EventEmitter<CliResult>())
      const processStarted = disposable.track(new EventEmitter<CliStarted>())

      const cli = disposable.track(
        new Cli({} as Config, { processCompleted, processStarted })
      )
      const mockAppend = fake()
      const mockOutputChannel = stub(window, 'createOutputChannel').returns({
        append: mockAppend,
        dispose: fake()
      } as unknown as VSOutputChannel)

      disposable.track(new OutputChannel([cli], version, 'The Test Channel'))
      processCompleted.fire({
        command: 'some command',
        cwd,
        duration: 20,
        exitCode: -9,
        pid: 12345,
        stderr:
          'THIS IS AN IMPOSSIBLE ERROR. THIS ERROR CANNOT OCCUR. IF THIS ERROR OCCURS, SEE YOUR IBM REPRESENTATIVE.'
      })

      expect(mockOutputChannel).to.be.called
      expect(mockAppend).to.be.calledWithMatch(
        /\[.*?] > some command - FAILED with code -9 \(20ms\).*?/
      )
    })
  })
})
