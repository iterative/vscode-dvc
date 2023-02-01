import { dirname } from 'path'
import {
  TextDocuments,
  InitializeResult,
  ServerCapabilities,
  _Connection,
  TextDocumentPositionParams,
  CodeActionParams,
  DefinitionParams,
  SymbolKind,
  DocumentSymbol,
  Connection,
  Location,
  TextDocumentSyncKind
} from 'vscode-languageserver/node'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { URI } from 'vscode-uri'
import {
  getTextDocumentLocation,
  getUriLocation,
  symbolAt
} from './textDocument'

export class LanguageServer {
  private documentsKnownToEditor!: TextDocuments<TextDocument>

  public listen(connection: _Connection) {
    this.documentsKnownToEditor = new TextDocuments(TextDocument)

    connection.onInitialize(() => this.onInitialize())

    connection.onDefinition(params => {
      if (!params.textDocument.uri.endsWith('dvc.yaml')) {
        return null
      }

      return this.onDefinition(params, connection)
    })

    this.documentsKnownToEditor.listen(connection)

    connection.listen()
  }

  private getDocument(params: TextDocumentPositionParams | CodeActionParams) {
    const uri = params.textDocument.uri
    return this.documentsKnownToEditor.get(uri)
  }

  private getKnownDocumentLocations(symbolUnderCursor: DocumentSymbol) {
    if (symbolUnderCursor.kind !== SymbolKind.File) {
      return []
    }

    const filePath = symbolUnderCursor.name

    const matchingFiles = this.documentsKnownToEditor
      .all()
      .filter(doc => URI.parse(doc.uri).fsPath.endsWith(filePath))

    return matchingFiles.map(doc => getTextDocumentLocation(doc))
  }

  private async onDefinition(params: DefinitionParams, connection: Connection) {
    const document = this.getDocument(params)

    const symbolUnderCursor = symbolAt(document, params.position)

    if (!(document && symbolUnderCursor)) {
      return null
    }

    const fileLocations = this.getKnownDocumentLocations(symbolUnderCursor)

    if (fileLocations.length === 0) {
      await this.checkIfSymbolsAreFiles(
        connection,
        document,
        symbolUnderCursor,
        fileLocations
      )
    }

    if (fileLocations.length > 0) {
      return this.arrayOrSingleResponse(fileLocations)
    }

    return null
  }

  private async checkIfSymbolsAreFiles(
    connection: _Connection,
    document: TextDocument,
    symbolUnderCursor: DocumentSymbol,
    fileLocations: Location[]
  ) {
    for (const possibleFile of symbolUnderCursor.name.split(' ')) {
      const possiblePath = URI.parse(
        [dirname(document.uri), possibleFile].join('/')
      ).toString()
      const file = await connection.sendRequest<{
        contents: string
      } | null>('readFileContents', possiblePath)
      if (file) {
        const location = getUriLocation(possiblePath, file.contents)
        fileLocations.push(location)
      }
    }
  }

  private arrayOrSingleResponse<T>(elements: T[]) {
    if (elements.length === 1) {
      return elements[0]
    }

    return elements
  }

  private onInitialize() {
    const serverCapabilities: ServerCapabilities = {
      definitionProvider: true,
      textDocumentSync: TextDocumentSyncKind.Incremental
    }

    const result: InitializeResult = {
      capabilities: serverCapabilities
    }
    return result
  }
}
