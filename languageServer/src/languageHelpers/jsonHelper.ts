import { findNodeAtLocation, getNodeValue, Node, parseTree } from 'jsonc-parser'
import { DocumentSymbol, Location, Range } from 'vscode-languageserver'
import { BaseLanguageHelper } from './baseLanguageHelper'

export class JsonHelper extends BaseLanguageHelper<Node> {
  protected parse(source: string) {
    return parseTree(source)
  }

  protected findEnclosingSymbols(): DocumentSymbol[] {
    return []
  }

  protected getPropertyLocation(
    pathArray: Array<string | number>
  ): Location | null {
    const node = this.rootNode && findNodeAtLocation(this.rootNode, pathArray)

    if (!node) {
      return null
    }
    const nodeSrcIndex = node.offset
    const nodeSrcLength = node.length
    const nodeEnd = nodeSrcIndex + nodeSrcLength
    const start = this.positionAt(nodeSrcIndex)
    const end = this.positionAt(nodeEnd)
    const range = Range.create(start, end)
    return Location.create(this.textDocument.uri, range)
  }

  protected toJSON(): unknown {
    return this.rootNode ? getNodeValue(this.rootNode) : undefined
  }
}
