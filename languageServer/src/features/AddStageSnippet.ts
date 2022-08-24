/* eslint-disable no-template-curly-in-string */
import {
  CompletionItem,
  CompletionItemKind,
  CompletionRequest,
  InsertTextFormat,
  InsertTextMode
} from 'vscode-languageserver'
import { BaseFeature } from './BaseFeature'

export class AddStageSnippet extends BaseFeature {
  protected setup(): void {
    // This way we get type hints for out handlers
    this.connection?.onRequest(CompletionRequest.type, () =>
      this.suggestCommands()
    )
  }

  private suggestCommands(): CompletionItem[] {
    const commandItem: CompletionItem = {
      insertText: '${1:Stage name}:\n\tcmd: ${2:A command to run}',
      insertTextFormat: InsertTextFormat.Snippet,
      insertTextMode: InsertTextMode.adjustIndentation,

      kind: CompletionItemKind.Snippet,
      label: 'Add a stage'
    }
    return [commandItem]
  }
}
