import {
  DocumentSymbol,
  SymbolKind,
  Range,
  Location
} from 'vscode-languageserver/node'
import {
  Document,
  isNode,
  isPair,
  isScalar,
  Pair,
  parseDocument,
  Scalar,
  Node,
  visit
} from 'yaml'
import { BaseLanguageHelper } from './baseLanguageHelper'
import * as RegExes from './regexes'

export class YamlHelper extends BaseLanguageHelper<Document> {
  protected rootNode!: Document

  protected findEnclosingSymbols(offset: number): DocumentSymbol[] {
    const symbolsFound: Array<DocumentSymbol> = []

    visit(this.rootNode, (_, node) => {
      if (isNode(node) && node.range) {
        const range = node.range
        const nodeStart = range[0]
        const nodeEnd = range[2]
        const nodeContainsTheOffset = offset >= nodeStart && offset <= nodeEnd

        if (nodeContainsTheOffset) {
          symbolsFound.push(...this.yamlNodeToDocumentSymbols(node, range))
        }
      }
    })

    return symbolsFound
  }

  protected parse(source: string) {
    return parseDocument(source)
  }

  protected getPropertyLocation(
    pathArray: Array<string | number>
  ): Location | null {
    const node = this.rootNode.getIn(pathArray, true)

    if (isNode(node) && node.range) {
      const [nodeStart, , nodeEnd] = node.range
      const start = this.positionAt(nodeStart)
      const end = this.positionAt(nodeEnd)
      const range = Range.create(start, end)
      return Location.create(this.textDocument.uri, range)
    }

    return null
  }

  protected toJSON(): unknown {
    return this.rootNode.toJS()
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

  private yamlScalarNodeToDocumentSymbols(
    node: Scalar,
    [nodeStart, valueEnd, nodeEnd]: [number, number, number]
  ) {
    const nodeValue = `${node.value}`

    let symbolKind: SymbolKind = SymbolKind.String

    if (/\.[A-Za-z]+$/.test(nodeValue)) {
      symbolKind = SymbolKind.File
    }

    const children: DocumentSymbol[] = []

    const variableTemplateSymbols = [
      ...this.getTemplateExpressionSymbolsInsideScalar(nodeValue, nodeStart)
    ]

    if (variableTemplateSymbols.length > 0) {
      children.push(...variableTemplateSymbols)
    } else {
      const propertyPathSymbols = this.extractPropertyPathSymbolsFrom(
        nodeValue,
        nodeStart
      )
      children.push(...propertyPathSymbols)
    }

    const symbolsSoFar: DocumentSymbol[] = [
      DocumentSymbol.create(
        nodeValue,
        undefined,
        symbolKind,
        Range.create(this.positionAt(nodeStart), this.positionAt(nodeEnd)),
        Range.create(this.positionAt(nodeStart), this.positionAt(valueEnd))
      ),
      ...children
    ]

    return symbolsSoFar
  }

  private extractPropertyPathSymbolsFrom(text: string, startIndex: number) {
    const symbols: DocumentSymbol[] = []
    const pathLikeSegments = text.matchAll(RegExes.propertyPathLike)

    for (const path of pathLikeSegments) {
      const matchIndex = path.index ?? 0

      symbols.push(
        ...this.getSymbolsFromPropertyPath(path[0], startIndex + matchIndex)
      )
    }

    return symbols
  }

  private getSymbolsFromPropertyPath(pathSegment: string, startIndex: number) {
    const templateSymbols: DocumentSymbol[] = []
    const symbols = pathSegment.matchAll(RegExes.alphadecimalWords)

    const jsonPath: string[] = [] // Safe to assume, based on https://dvc.org/doc/user-guide/project-structure/dvcyaml-files#vars

    for (const templateSymbol of symbols) {
      const symbolName = templateSymbol[0]
      const symbolJsonPath = [...jsonPath, symbolName]
      const symbolStart = (templateSymbol.index ?? 0) + startIndex
      const symbolEnd = symbolStart + templateSymbol[0].length
      const symbolRange = Range.create(
        this.positionAt(symbolStart),
        this.positionAt(symbolEnd)
      )

      templateSymbols.push(
        DocumentSymbol.create(
          templateSymbol[0],
          symbolJsonPath.join('.'),
          SymbolKind.Property,
          symbolRange,
          symbolRange
        )
      )

      jsonPath.push(symbolName)
    }

    return templateSymbols
  }

  private getTemplateExpressionSymbolsInsideScalar(
    scalarValue: string,
    nodeOffset: number
  ) {
    const templateSymbols: DocumentSymbol[] = []

    const matches = scalarValue.matchAll(RegExes.variableTemplates)

    for (const match of matches) {
      const expression = match[1]
      const matchOffset = match.index || 0
      const expressionOffset: number = nodeOffset + matchOffset + 2 // To account for the '${'

      templateSymbols.push(
        ...this.extractPropertyPathSymbolsFrom(expression, expressionOffset)
      )
    }

    return templateSymbols
  }
}
