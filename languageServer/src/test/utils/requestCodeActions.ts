import { TextDocument } from 'vscode-languageserver-textdocument'
import {
  CodeActionContext,
  CodeActionParams,
  CodeActionRequest,
  Position,
  Range
} from 'vscode-languageserver/node'
import { client } from './setup-test-connections'

export const requestCodeActions = (textDocument: TextDocument) => {
  const uri = textDocument.uri

  const params: CodeActionParams = {
    context: CodeActionContext.create([]),
    range: Range.create(Position.create(3, 7), Position.create(8, 20)),
    textDocument: {
      uri
    }
  }
  return client.sendRequest(CodeActionRequest.type, params)
}
