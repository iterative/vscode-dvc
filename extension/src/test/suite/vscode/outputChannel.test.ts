import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import chai from 'chai'
import sinonChai from 'sinon-chai'
import { EventEmitter, window, OutputChannel as VSOutputChannel } from 'vscode'
import { OutputChannel } from '../../../vscode/outputChannel'
import { Disposable } from '../../../extension'
import { restore, stub, fake } from 'sinon'
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
    it('should handle a process completing without error', () => {
      const ran = new EventEmitter<CliResult>()
      const cli = new Cli({} as Config, ran)
      const mockAppend = fake()
      const mockOutputChannel = stub(window, 'createOutputChannel').returns(({
        append: mockAppend,
        dispose: fake()
      } as unknown) as VSOutputChannel)

      disposable.track(new OutputChannel([cli], 'The Success Channel'))
      ran.fire({ command: 'some command' })

      expect(mockOutputChannel).to.be.called
      expect(mockAppend).to.be.calledWith('> some command \n')
    })

    it('should handle a process throwing an error', () => {
      const ran = new EventEmitter<CliResult>()
      const cli = new Cli({} as Config, ran)
      const mockAppend = fake()
      const mockOutputChannel = stub(window, 'createOutputChannel').returns(({
        append: mockAppend,
        dispose: fake()
      } as unknown) as VSOutputChannel)

      const usefulMessage =
        'THIS IS AN IMPOSSIBLE ERROR. THIS ERROR CANNOT OCCUR. IF THIS ERROR OCCURS, SEE YOUR IBM REPRESENTATIVE.'
      disposable.track(new OutputChannel([cli], 'The Success Channel'))
      ran.fire({
        command: 'some command',
        stderr: usefulMessage
      })

      expect(mockOutputChannel).to.be.called
      expect(mockAppend).to.be.calledWith(
        `> some command failed. ${usefulMessage}\n`
      )
    })
  })
})
