import { createConnection, ProposedFeatures } from 'vscode-languageserver/node'
import { LanguageServer } from './languageServer'

const languageServer = new LanguageServer()

const connection = createConnection(ProposedFeatures.all)

languageServer.listen(connection)
