import {
  TextDocuments,
  InitializeResult,
  ServerCapabilities,
  _Connection,
  TextDocumentPositionParams,
  CodeActionParams,
  DefinitionParams
} from 'vscode-languageserver/node'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { TextDocumentWrapper } from './TextDocumentWrapper'

export class LanguageServer {
  private documents!: TextDocuments<TextDocument>

  public listen(connection: _Connection) {
    this.documents = new TextDocuments(TextDocument)

    connection.onInitialize(() => this.onInitialize())

    connection.onDefinition(params => this.onDefinition(params))

    this.documents.listen(connection)

    connection.listen()
  }

  private getDvcTextDocument(
    params: TextDocumentPositionParams | CodeActionParams
  ) {
    const uri = params.textDocument.uri
    const doc = this.documents.get(uri)

    if (!doc) {
      return null
    }
    return this.wrap(doc)
  }

  private wrap(doc: TextDocument) {
    return new TextDocumentWrapper(doc)
  }

  private onDefinition(params: DefinitionParams) {
    const document = this.getDvcTextDocument(params)
    const symbolUnderCursor = document?.symbolAt(params.position)

    if (symbolUnderCursor) {
      const allDocs = this.documents.all()
      const locationsAccumulator = []

      for (const txtDoc of allDocs) {
        const finder = this.wrap(txtDoc)
        const locations = finder.findLocationsFor(symbolUnderCursor)
        locationsAccumulator.push(...locations)
      }

      return locationsAccumulator ?? []
    }

    return null
  }

  private onInitialize() {
    const serverCapabilities: ServerCapabilities = {
      definitionProvider: true
    }

    const result: InitializeResult = {
      capabilities: serverCapabilities
    }
    return result
  }
}
