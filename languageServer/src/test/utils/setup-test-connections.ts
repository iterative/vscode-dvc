import { Duplex } from 'stream'
import { Connection, createConnection } from 'vscode-languageserver/node'
import { LanguageServer } from '../../LanguageServer'

class TestStream extends Duplex {
  _write(chunk: string, _encoding: string, done: () => void) {
    this.emit('data', chunk)
    done()
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _read(_size: number) {}
}

export let server: Connection
export let client: Connection

export const setupTestConnections = () => {
  const dvcLanguageService = new LanguageServer()
  const up = new TestStream()
  const down = new TestStream()

  server = createConnection(up, down)
  client = createConnection(down, up)
  client.onRequest('isFile', () => null)

  dvcLanguageService.listen(server)
  client.listen()
}

export const disposeTestConnections = () => {
  client.dispose()
  server.dispose()
}
