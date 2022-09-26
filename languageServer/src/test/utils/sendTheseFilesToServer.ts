import { TextDocument } from 'vscode-languageserver-textdocument'
import { URI } from 'vscode-uri'
import { client } from './setup-test-connections'

export const sendTheseFilesToServer = async (
  files: Array<{ mockPath: string; mockContents: string; languageId: string }>
) => {
  const filesToReturn: TextDocument[] = []

  for (const { mockPath, mockContents, languageId } of files) {
    const uri = URI.file(mockPath).toString()
    const textDocument = TextDocument.create(uri, languageId, 1, mockContents)
    filesToReturn.push(textDocument)
  }
  await client.sendRequest('initialTextDocuments', {
    textDocuments: filesToReturn.map(textDocument => {
      return {
        languageId: 'yaml',
        text: textDocument.getText(),
        uri: textDocument.uri,
        version: textDocument.version
      }
    })
  })

  return filesToReturn
}
