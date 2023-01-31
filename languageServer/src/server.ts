import { createConnection, ProposedFeatures } from 'vscode-languageserver/node'
import { LanguageServer } from './languageServer'

const dvcLanguageServer = new LanguageServer()

const connection = createConnection(ProposedFeatures.all)

dvcLanguageServer.listen(connection)
