import { createConnection, ProposedFeatures } from 'vscode-languageserver/node'
import { DvcLanguageServer } from './DvcLanguageServer'

const dvcLanguageServer = new DvcLanguageServer()

const connection = createConnection(ProposedFeatures.all)

dvcLanguageServer.listen(connection)
