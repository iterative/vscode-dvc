import { TextDocument } from 'vscode-languageserver-textdocument'
import {
  DocumentSymbol,
  Location,
  Position,
  Range,
  SymbolKind
} from 'vscode-languageserver/node'
import {
  isNode,
  isPair,
  isScalar,
  Node,
  Pair,
  parseDocument,
  Scalar,
  visit
} from 'yaml'

export const getLocationToOpen = (uri: string): Location => {
  const position = Position.create(0, 0)
  const range = Range.create(position, position)

  return Location.create(uri, range)
}

const yamlScalarNodeToDocumentSymbols = (
  textDocument: TextDocument,
  node: Scalar,
  [nodeStart, valueEnd, nodeEnd]: [number, number, number]
) => {
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
      Range.create(
        textDocument.positionAt(nodeStart),
        textDocument.positionAt(nodeEnd)
      ),
      Range.create(
        textDocument.positionAt(nodeStart),
        textDocument.positionAt(valueEnd)
      )
    )
  ]
}

const yamlNodeToDocumentSymbols = (
  textDocument: TextDocument,
  node: Node | Pair,
  range: [number, number, number]
): DocumentSymbol[] => {
  if (isScalar(node)) {
    return yamlScalarNodeToDocumentSymbols(textDocument, node, range)
  }

  if (isPair(node)) {
    return yamlNodeToDocumentSymbols(
      textDocument,
      node.value as Node | Pair,
      range
    )
  }

  return []
}

const symbolScopeAt = (
  textDocument: TextDocument,
  position: Position
): DocumentSymbol[] => {
  const cursorOffset: number = textDocument.offsetAt(position)

  const symbolsFound: Array<DocumentSymbol | null> = []

  const doc = parseDocument(textDocument.getText())

  visit(doc, (_, node) => {
    if (isNode(node) && node.range) {
      const range = node.range
      const nodeStart = range[0]
      const nodeEnd = range[2]
      const isCursorInsideNode =
        cursorOffset >= nodeStart && cursorOffset <= nodeEnd

      if (isCursorInsideNode) {
        symbolsFound.push(
          ...yamlNodeToDocumentSymbols(textDocument, node, range)
        )
      }
    }
  })
  const symbolStack = [
    ...(symbolsFound.filter(Boolean) as DocumentSymbol[])
  ].sort((a, b) => {
    const offA =
      textDocument.offsetAt(a.range.end) - textDocument.offsetAt(a.range.start)
    const offB =
      textDocument.offsetAt(b.range.end) - textDocument.offsetAt(b.range.start)

    return offB - offA // We want the tighter fits for last, so we can just pop them
  })

  return [...symbolStack]
}

export const symbolAt = (
  textDocument: TextDocument | undefined,
  position: Position
): DocumentSymbol | undefined => {
  if (!textDocument) {
    return
  }
  return symbolScopeAt(textDocument, position).pop()
}
