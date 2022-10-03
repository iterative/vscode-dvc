import {
  TextDocuments,
  InitializeResult,
  ServerCapabilities,
  _Connection,
  TextDocumentPositionParams,
  CodeActionParams,
  DefinitionParams,
  SymbolKind,
  Location,
  Position,
  Range,
  DocumentSymbol
} from 'vscode-languageserver/node'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { URI } from 'vscode-uri'
import { TextDocumentWrapper } from './TextDocumentWrapper'

export class LanguageServer {
  private documentsKnownToEditor!: TextDocuments<TextDocument>

  public listen(connection: _Connection) {
    this.documentsKnownToEditor = new TextDocuments(TextDocument)

    connection.onInitialize(() => this.onInitialize())

    connection.onDefinition(params => {
      if (!params.textDocument.uri.endsWith('dvc.yaml')) {
        return null
      }

      return this.onDefinition(params)
    })

    this.documentsKnownToEditor.listen(connection)

    connection.listen()
  }

  private getAllDocuments() {
    const openDocuments = this.documentsKnownToEditor.all()
    const acc: TextDocumentWrapper[] = openDocuments.map(doc => this.wrap(doc))

    return acc
  }

  private getDvcTextDocument(
    params: TextDocumentPositionParams | CodeActionParams
  ) {
    const uri = params.textDocument.uri
    const doc = this.documentsKnownToEditor.get(uri)

    if (!doc) {
      return null
    }

    return this.wrap(doc)
  }

  private wrap(doc: TextDocument) {
    return new TextDocumentWrapper(doc)
  }

  private isPossibleFilePath(symbol: DocumentSymbol) {
    const isFile = symbol.kind === SymbolKind.File
    const isProperty = symbol.kind === SymbolKind.Property

    return isFile || (symbol.detail && isProperty)
  }

  private getFilePathFromSymbol(symbol: DocumentSymbol) {
    if (symbol.kind === SymbolKind.File) {
      return symbol.name
    }

    return symbol.detail ?? ''
  }

  private getFilePathLocations(
    symbolUnderCursor: DocumentSymbol,
    allDocs: TextDocumentWrapper[]
  ) {
    if (!this.isPossibleFilePath(symbolUnderCursor)) {
      return []
    }

    const filePath = this.getFilePathFromSymbol(symbolUnderCursor)

    const matchingFiles = allDocs.filter(doc =>
      URI.file(doc.uri).fsPath.endsWith(filePath)
    )

    return matchingFiles.map(doc => {
      const uri = doc.uri
      const start = Position.create(0, 0)
      const end = doc.positionAt(doc.getText().length - 1)
      const range = Range.create(start, end)

      return Location.create(uri, range)
    })
  }

  private getLocationsFromOtherDocuments(
    symbolUnderCursor: DocumentSymbol,
    allDocs: TextDocumentWrapper[]
  ) {
    const locationsAccumulator = []

    for (const txtDoc of allDocs) {
      const locations = txtDoc.findLocationsFor(symbolUnderCursor)
      locationsAccumulator.push(...locations)
    }

    return locationsAccumulator
  }

  private onDefinition(params: DefinitionParams) {
    const document = this.getDvcTextDocument(params)
    const symbolUnderCursor = document?.symbolAt(params.position)

    if (document && symbolUnderCursor) {
      const allDocs = this.getAllDocuments()
      const locationsAccumulator = []

      const fileLocations = this.getFilePathLocations(
        symbolUnderCursor,
        allDocs
      )

      locationsAccumulator.push(...fileLocations)

      const locationsFromOtherDocuments = this.getLocationsFromOtherDocuments(
        symbolUnderCursor,
        allDocs
      )

      locationsAccumulator.push(...locationsFromOtherDocuments)

      const externalLocations = locationsAccumulator.filter(
        location => location.uri !== document.uri
      )

      if (externalLocations.length > 0) {
        return this.arrayOrSingleResponse(externalLocations)
      }

      return this.arrayOrSingleResponse(locationsAccumulator)
    }

    return null
  }

  private arrayOrSingleResponse<T>(elements: T[]) {
    if (elements.length === 1) {
      return elements[0]
    }

    return elements
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
