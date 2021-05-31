import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import chai from 'chai'
import sinonChai from 'sinon-chai'
import { EventEmitter, window, OutputChannel as VSOutputChannel } from 'vscode'
import { OutputChannel } from '../../../vscode/outputChannel'
import { Disposable } from '../../../extension'
import { restore, stub, fake } from 'sinon'
import { Cli } from '../../../cli'
import { Config } from '../../../Config'

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
    it('should be able to be instantiated', () => {
      const ran = new EventEmitter<string>()
      const cli = new Cli({} as Config, ran)
      const mockAppend = fake()
      const mockOutputChannel = stub(window, 'createOutputChannel').returns(({
        append: mockAppend,
        dispose: fake()
      } as unknown) as VSOutputChannel)

      disposable.track(new OutputChannel([cli], 'output channel 2'))
      ran.fire('some command')

      expect(mockOutputChannel).to.be.called
      expect(mockAppend).to.be.calledWith('some command')
    })
  })
})
