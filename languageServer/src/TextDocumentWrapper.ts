import {
  DocumentSymbol,
  Position,
  SymbolKind,
  Range,
  Location
} from 'vscode-languageserver/node'
import { TextDocument } from 'vscode-languageserver-textdocument'
import {
  isNode,
  isScalar,
  parseDocument,
  visit,
  Node,
  Scalar,
  Pair,
  isPair
} from 'yaml'
import { ITextDocumentWrapper } from './ITextDocumentWrapper'

export class TextDocumentWrapper implements ITextDocumentWrapper {
  uri: string

  private textDocument: TextDocument

  constructor(textDocument: TextDocument) {
    this.textDocument = textDocument
    this.uri = this.textDocument.uri
  }

  public getLocation() {
    const uri = this.uri
    const start = Position.create(0, 0)
    const end = this.positionAt(this.getText().length - 1)
    const range = Range.create(start, end)

    return Location.create(uri, range)
  }

  public offsetAt(position: Position) {
    return this.textDocument.offsetAt(position)
  }

  public positionAt(offset: number) {
    return this.textDocument.positionAt(offset)
  }

  public getYamlDocument() {
    return parseDocument(this.getText())
  }

  public symbolAt(position: Position): DocumentSymbol | undefined {
    return this.symbolScopeAt(position).pop()
  }

  private getText() {
    return this.textDocument.getText()
  }

  private yamlScalarNodeToDocumentSymbols(
    node: Scalar,
    [nodeStart, valueEnd, nodeEnd]: [number, number, number]
  ) {
    const nodeValue = String(node.value)

    let symbolKind: SymbolKind = SymbolKind.String

    if (/\.[A-Za-z]+$/.test(nodeValue) && !nodeValue.includes(' ')) {
      symbolKind = SymbolKind.File
    }

    return [
      DocumentSymbol.create(
        nodeValue,
        undefined,
        symbolKind,
        Range.create(this.positionAt(nodeStart), this.positionAt(nodeEnd)),
        Range.create(this.positionAt(nodeStart), this.positionAt(valueEnd))
      )
    ]
  }

  private yamlNodeToDocumentSymbols(
    node: Node | Pair,
    range: [number, number, number]
  ): DocumentSymbol[] {
    if (isScalar(node)) {
      return this.yamlScalarNodeToDocumentSymbols(node, range)
    }

    if (isPair(node)) {
      return this.yamlNodeToDocumentSymbols(node.value as Node | Pair, range)
    }

    return []
  }

  private symbolScopeAt(position: Position): DocumentSymbol[] {
    const cursorOffset: number = this.offsetAt(position)

    const symbolsFound: Array<DocumentSymbol | null> = []

    visit(this.getYamlDocument(), (_, node) => {
      if (isNode(node) && node.range) {
        const range = node.range
        const nodeStart = range[0]
        const nodeEnd = range[2]
        const isCursorInsideNode =
          cursorOffset >= nodeStart && cursorOffset <= nodeEnd

        if (isCursorInsideNode) {
          symbolsFound.push(...this.yamlNodeToDocumentSymbols(node, range))
        }
      }
    })
    const symbolStack = (symbolsFound.filter(Boolean) as DocumentSymbol[]).sort(
      (a, b) => {
        const offA = this.offsetAt(a.range.end) - this.offsetAt(a.range.start)
        const offB = this.offsetAt(b.range.end) - this.offsetAt(b.range.start)

        return offB - offA // We want the tighter fits for last, so we can just pop them
      }
    )

    return [...symbolStack]
  }
}
