import {
  CompletionItem,
  CompletionItemKind,
  TextDocumentPositionParams
} from 'vscode-languageserver/node'
import { BaseFeature } from './BaseFeature'

export class StageCompletions extends BaseFeature {
  protected setup(): void {
    this.connection?.onCompletion(
      (params: TextDocumentPositionParams): CompletionItem[] => {
        // eslint-disable-next-line no-useless-escape
        const stageNames = this.query({
          dvcYamls: '$.workspace[?(@.uri.match(/dvc.yaml$/))]',
          stages: '$.dvcYamls[*].parsed.stages.*~'
        }).getValue('stages') as string[]

        return stageNames.map(stage => {
          return {
            label: stage,
            kind: CompletionItemKind.Method
          }
        })
      }
    )
  }
}
