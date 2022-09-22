import { createConnection, ProposedFeatures } from 'vscode-languageserver/node'
import { LanguageServer } from './LanguageServer'

const dvcLanguageServer = new LanguageServer()

const connection = createConnection(ProposedFeatures.all)

dvcLanguageServer.listen(connection)
