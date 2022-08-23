import { Position } from 'vscode-languageserver-textdocument'
import { Document } from 'yaml'

export interface IDvcTextDocument {
  getYamlDocument(): Document
  offsetAt(position: Position): number
}
