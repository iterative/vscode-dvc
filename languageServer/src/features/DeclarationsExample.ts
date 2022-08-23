import { Position } from 'vscode-languageserver'
import { BaseFeature } from './BaseFeature'

export class DeclarationsExample extends BaseFeature {
  protected setup(): void {
    this.connection?.onDeclaration(params => {
      this.setTextDocumentPositionParams(params)

      this.query({
        documentUri: '$.params.textDocument.uri',
        cursorPosition: '$.params.position',
        resolvedDocument:
          '$.workspace[?(@.uri === @root.documentUri[0])].parsed',
        strings: '$.resolvedDocument..*@string()'
      })

      const strings = this.getValue<string[]>('strings')
      const variableRefs = strings
        .map(str => /\${(.+)}/g.exec(str))
        .filter(Boolean)
        .map(value => value?.[1])
        .forEach(propertyPath =>
          this.query({
            [`matches_${propertyPath}`]: `$.workspace[?(@.parsed.${propertyPath})]`
          })
        )

      console.log(this.sandbox)

      this.dispose()
      return null
    })
  }
}
