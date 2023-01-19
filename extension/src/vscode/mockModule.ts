import { URI } from 'vscode-uri'
import { stub } from 'sinon'
import mock from 'mock-require'

class MockEventEmitter {
  public fire() {
    return stub()
  }

  public event() {
    return stub()
  }
}

mock('vscode', {
  EventEmitter: MockEventEmitter,
  Uri: {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    file: URI.file
  },
  commands: { executeCommand: () => undefined }
})

mock('@hediet/std/disposable', {
  Disposable: {
    fn: () => ({
      track: <T>(disposable: T): T => disposable,
      untrack: () => undefined
    })
  }
})
