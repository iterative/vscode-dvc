import { TextDocument } from 'vscode-languageserver-textdocument'
import { DefinitionParams, DefinitionRequest } from 'vscode-languageserver/node'
import { client } from './setup-test-connections'

export const requestDefinitions = async (
  textDocument: TextDocument,
  substring: string
) => {
  const text = textDocument.getText()
  const uri = textDocument.uri

  const symbolOffset = text.indexOf(substring)
  const position = textDocument.positionAt(symbolOffset)

  const params: DefinitionParams = {
    position,
    textDocument: {
      uri
    }
  }
  return await client.sendRequest(DefinitionRequest.type, params)
}
