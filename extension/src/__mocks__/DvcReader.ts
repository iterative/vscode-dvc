import { ExperimentsRepoJSONOutput } from '../DvcReader'
const mockReader: any = jest.createMockFromModule('../DvcReader.ts')

import complexExampleData from 'dvc-vscode-webview/src/stories/complex-experiments-output.json'

const getExperiments: () => Promise<ExperimentsRepoJSONOutput> = async () => {
  return complexExampleData
}

const runExperiment = async () => {
  return 'We should probably test this output'
}

mockReader.getExperiments.mockImplementation(getExperiments)

mockReader.runExperiment.mockImplementation(runExperiment)

module.exports = mockReader
