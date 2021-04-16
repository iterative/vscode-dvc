import { describe, it } from 'mocha'
import chai from 'chai'
import sinonChai from 'sinon-chai'
import { Terminal, window } from 'vscode'
import { PseudoTerminal } from '../../PseudoTerminal'
import { Disposable } from '../../extension'

chai.use(sinonChai)
const { expect } = chai

suite('Pseudo Terminal Test Suite', () => {
  window.showInformationMessage('Start all integrated terminal tests.')

  const closeTerminalEvent = (): Promise<Terminal> => {
    return new Promise(resolve => {
      const listener: Disposable = window.onDidCloseTerminal(
        (event: Terminal) => {
          listener.dispose()
          return resolve(event)
        }
      )
    })
  }

  describe('PseudoTerminal', () => {
    it('should be able to open a terminal', async () => {
      const disposable = Disposable.fn()
      const pseudoTerminal = new PseudoTerminal()
      disposable.track(pseudoTerminal)

      pseudoTerminal.openCurrentInstance()

      const openTerminalEvent = (): Promise<Terminal> => {
        return new Promise(resolve => {
          const listener: Disposable = window.onDidOpenTerminal(
            (event: Terminal) => {
              return resolve(event)
            }
          )
          disposable.track(listener)
        })
      }

      const terminal = await openTerminalEvent()
      expect(terminal.creationOptions?.name).to.equal('DVC')

      disposable.dispose()
      return closeTerminalEvent()
    }).timeout(12000)
  })
})
