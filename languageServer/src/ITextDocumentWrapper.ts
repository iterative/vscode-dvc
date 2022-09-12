import { Position } from 'vscode-languageserver-textdocument'
import { Document } from 'yaml'

export interface ITextDocumentWrapper {
  getYamlDocument(): Document
  offsetAt(position: Position): number
}
