import { TextDocument } from 'vscode-languageserver-textdocument'
import {
  CompletionParams,
  CompletionRequest,
  Position
} from 'vscode-languageserver/node'
import { client } from './setup-test-connections'

export const requestCompletions = async (textDocument: TextDocument) => {
  const uri = textDocument.uri

  const params: CompletionParams = {
    position: Position.create(1, 1),
    textDocument: {
      uri
    }
  }
  return await client.sendRequest(CompletionRequest.type, params)
}
