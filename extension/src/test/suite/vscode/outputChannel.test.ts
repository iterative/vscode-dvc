import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import chai from 'chai'
import sinonChai from 'sinon-chai'
import { EventEmitter, window, OutputChannel as VSOutputChannel } from 'vscode'
import { restore, stub, fake } from 'sinon'
import { OutputChannel } from '../../../vscode/outputChannel'
import { Disposable } from '../../../extension'
import { Cli, CliResult } from '../../../cli'
import { Config } from '../../../config'

chai.use(sinonChai)
const { expect } = chai

suite('Output Channel Test Suite', () => {
  window.showInformationMessage('Start all output channel tests.')

  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
  })

  describe('OutputChannel', () => {
    const version = '1.0.0'

    it('should handle a process completing without error', () => {
      const processCompleted = new EventEmitter<CliResult>()
      const processStarted = new EventEmitter<void>()

      const cli = new Cli({} as Config, { processCompleted, processStarted })
      const mockAppend = fake()
      const mockOutputChannel = stub(window, 'createOutputChannel').returns({
        append: mockAppend,
        dispose: fake()
      } as unknown as VSOutputChannel)

      disposable.track(new OutputChannel([cli], version, 'The Success Channel'))
      processCompleted.fire({ command: 'some command' })

      expect(mockOutputChannel).to.be.called
      expect(mockAppend).to.be.calledWithMatch(/\[.*?\] > some command \n/)
    })

    it('should handle a process throwing an error', () => {
      const processCompleted = new EventEmitter<CliResult>()
      const processStarted = new EventEmitter<void>()

      const cli = new Cli({} as Config, { processCompleted, processStarted })
      const mockAppend = fake()
      const mockOutputChannel = stub(window, 'createOutputChannel').returns({
        append: mockAppend,
        dispose: fake()
      } as unknown as VSOutputChannel)

      disposable.track(new OutputChannel([cli], version, 'The Test Channel'))
      processCompleted.fire({
        command: 'some command',
        stderr:
          'THIS IS AN IMPOSSIBLE ERROR. THIS ERROR CANNOT OCCUR. IF THIS ERROR OCCURS, SEE YOUR IBM REPRESENTATIVE.'
      })

      expect(mockOutputChannel).to.be.called
      expect(mockAppend).to.be.calledWithMatch(
        /\[.*?\] > some command failed..*?\n/
      )
    })
  })
})
