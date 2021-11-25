import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { EventEmitter, Terminal, window } from 'vscode'
import { restore } from 'sinon'
import { Disposable } from '../../../extension'
import { PseudoTerminal } from '../../../vscode/pseudoTerminal'

suite('Pseudo Terminal Test Suite', () => {
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
  })

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
      const terminalName = 'Open Test Terminal'

      const pseudoTerminal = disposable.track(
        new PseudoTerminal(
          disposable.track(new EventEmitter<string>()),
          disposable.track(new EventEmitter<void>()),
          terminalName
        )
      )

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
      expect(terminal.creationOptions?.name).to.equal(terminalName)

      pseudoTerminal.dispose()

      return closeTerminalEvent()
    })
  })
})
