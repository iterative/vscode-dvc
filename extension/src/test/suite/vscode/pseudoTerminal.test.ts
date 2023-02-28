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

      const openTerminalEvent = new Promise<Terminal>(resolve => {
        disposable.track(
          window.onDidOpenTerminal((event: Terminal) => resolve(event))
        )
      })

      const closeTerminalEvent = new Promise<Terminal>(resolve => {
        disposable.track(
          window.onDidCloseTerminal((event: Terminal) => resolve(event))
        )
      })

      void pseudoTerminal.openCurrentInstance()

      const terminal = await openTerminalEvent
      expect(terminal.creationOptions?.name).to.equal(terminalName)

      pseudoTerminal.dispose()

      return closeTerminalEvent
    })
  })
})
