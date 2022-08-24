import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  TextDocumentSyncKind,
  InitializeResult,
  ServerCapabilities,
  TextDocumentSyncOptions
} from 'vscode-languageserver/node'

import { TextDocument } from 'vscode-languageserver-textdocument'
import { triggerCharacters } from './triggerCharacters'
import { supportedServerCommands } from './commands'
import { features } from './features'

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all)

const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument)

connection.onRequest(() => null)

connection.onInitialize(() => {
  const documentSelector = [
    {
      language: 'yaml'
    },
    {
      pattern: '**/*.{dvc,dvc.lock}'
    },
    {
      language: 'json'
    },
    {
      language: 'toml'
    },
    {
      language: 'python'
    }
  ]

  const textDocumentSync: Required<TextDocumentSyncOptions> = {
    change: TextDocumentSyncKind.Full,
    openClose: true,
    save: true,
    willSave: false,
    willSaveWaitUntil: false
  }

  const serverCapabilities: ServerCapabilities = {
    completionProvider: {
      resolveProvider: true,
      triggerCharacters: ['.']
    },
    declarationProvider: {
      documentSelector
    },
    definitionProvider: true,
    codeActionProvider: true,
    documentHighlightProvider: true,
    codeLensProvider: {
      resolveProvider: true
    },
    hoverProvider: true,
    colorProvider: true,
    implementationProvider: true,
    documentFormattingProvider: false,
    textDocumentSync,
    documentLinkProvider: {
      resolveProvider: true
    },
    workspace: {
      workspaceFolders: {
        supported: true
      }
    },
    documentOnTypeFormattingProvider: undefined,
    signatureHelpProvider: {
      triggerCharacters,
      retriggerCharacters: triggerCharacters
    },
    documentRangeFormattingProvider: false,
    callHierarchyProvider: true,
    typeDefinitionProvider: true,
    documentSymbolProvider: true,
    referencesProvider: true,
    executeCommandProvider: {
      commands: supportedServerCommands
    },
    experimental: undefined,
    foldingRangeProvider: false,
    linkedEditingRangeProvider: false,
    monikerProvider: false,
    renameProvider: true,
    workspaceSymbolProvider: true,
    selectionRangeProvider: false,
    semanticTokensProvider: undefined
  }

  const result: InitializeResult = {
    capabilities: serverCapabilities
  }
  return result
})

for (const feature of features) {
  feature.create(documents, connection)
}

documents.listen(connection)

connection.listen()
