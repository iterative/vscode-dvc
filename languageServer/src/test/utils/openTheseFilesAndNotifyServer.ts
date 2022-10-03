import { TextDocument } from 'vscode-languageserver-textdocument'
import { DidOpenTextDocumentNotification } from 'vscode-languageserver/node'
import { URI } from 'vscode-uri'
import { client } from './setup-test-connections'

export const openTheseFilesAndNotifyServer = async (
  files: Array<{ mockPath: string; mockContents: string; languageId: string }>
) => {
  const filesToReturn: TextDocument[] = []

  for (const { mockPath, mockContents, languageId } of files) {
    const uri = URI.file(mockPath).toString()
    const textDocument = TextDocument.create(uri, languageId, 1, mockContents)
    await client.sendNotification(DidOpenTextDocumentNotification.type, {
      textDocument: {
        languageId,
        text: textDocument.getText(),
        uri: textDocument.uri,
        version: textDocument.version
      }
    })
    filesToReturn.push(textDocument)
  }

  return filesToReturn
}
