import { TextDocument } from 'vscode-languageserver-textdocument'
import { JsonHelper } from './jsonHelper'
import { PlainTextHelper } from './plainTextHelper'
import { YamlHelper } from './yamlHelper'

export const createLanguageHelper = (textDocument: TextDocument) => {
  const language = textDocument.languageId

  if (language === 'yaml') {
    return new YamlHelper(textDocument)
  }

  if (language === 'json') {
    return new JsonHelper(textDocument)
  }

  return new PlainTextHelper(textDocument)
}
