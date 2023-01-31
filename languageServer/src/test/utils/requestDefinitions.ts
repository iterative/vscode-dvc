import { TextDocument } from 'vscode-languageserver-textdocument'
import { DefinitionParams, DefinitionRequest } from 'vscode-languageserver/node'
import { client } from './setup-test-connections'

export const requestDefinitions = async (
  textDocument: TextDocument,
  substring: string,
  offset = 0
) => {
  const text = textDocument.getText()
  const uri = textDocument.uri

  const symbolOffset = text.indexOf(substring)

  const { character, line } = textDocument.positionAt(symbolOffset)

  const params: DefinitionParams = {
    position: { character: character + offset, line },
    textDocument: {
      uri
    }
  }
  return await client.sendRequest(DefinitionRequest.type, params)
}
