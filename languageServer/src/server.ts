/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  InitializeParams,
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

// Create a simple text document manager.
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument)

let hasWorkspaceFolderCapability = false

connection.onRequest(() => null)

connection.onInitialize((params: InitializeParams) => {
  const capabilities = params.capabilities

  hasWorkspaceFolderCapability = !!(
    capabilities.workspace && !!capabilities.workspace.workspaceFolders
  )

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
    openClose: true,
    change: TextDocumentSyncKind.Full,
    willSave: false,
    willSaveWaitUntil: false,
    save: true
  }

  const serverCapabilities: ServerCapabilities = {
    textDocumentSync,
    completionProvider: {
      resolveProvider: true,
      triggerCharacters: ['.']
    },
    workspace: {
      workspaceFolders: {
        supported: true
      }
    },
    hoverProvider: true,
    signatureHelpProvider: {
      triggerCharacters,
      retriggerCharacters: triggerCharacters
    },
    declarationProvider: {
      documentSelector
    },
    definitionProvider: true,
    typeDefinitionProvider: true,
    implementationProvider: true,
    referencesProvider: true,
    documentHighlightProvider: true,
    documentSymbolProvider: true,
    codeActionProvider: true,
    codeLensProvider: {
      resolveProvider: true
    },
    documentLinkProvider: {
      resolveProvider: true
    },
    colorProvider: true,
    workspaceSymbolProvider: true,
    documentFormattingProvider: false,
    documentRangeFormattingProvider: false,
    documentOnTypeFormattingProvider: undefined,
    renameProvider: true,
    foldingRangeProvider: false,
    selectionRangeProvider: false,
    executeCommandProvider: {
      commands: supportedServerCommands
    },
    callHierarchyProvider: true,
    linkedEditingRangeProvider: false,
    semanticTokensProvider: undefined,
    monikerProvider: false,
    experimental: undefined
  }

  const result: InitializeResult = {
    capabilities: serverCapabilities
  }
  return result
})

connection.onInitialized(() => {
  if (hasWorkspaceFolderCapability) {
    connection.workspace.onDidChangeWorkspaceFolders(_event => {
      connection.console.log('Workspace folder change event received.')
    })
  }
})

for (const feature of features) {
  feature.create(documents, connection)
}

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection)

// Listen on the connection
connection.listen()
