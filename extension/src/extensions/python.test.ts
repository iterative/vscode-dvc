import { extensions } from 'vscode'
import {
  getPythonBinPath,
  getOnDidChangePythonExecutionDetails,
  VscodePython
} from './python'
import { executeProcess } from '../processExecution'

jest.mock('vscode')
jest.mock('../processExecution')

const mockedExecuteProcess = jest.mocked(executeProcess)

const mockedExtensions = jest.mocked(extensions)
const mockedGetExtension = jest.fn()
mockedExtensions.getExtension = mockedGetExtension

const mockedReady = jest.fn()
const mockedOnDidChangeExecutionDetails = jest.fn()
let mockedExecCommand: string[] | undefined

const mockedSettings = {
  getExecutionDetails: () => ({
    execCommand: mockedExecCommand
  }),
  onDidChangeExecutionDetails: mockedOnDidChangeExecutionDetails
}

const mockedVscodePythonAPI = {
  ready: mockedReady,
  settings: mockedSettings
} as unknown as VscodePython

const mockedVscodePython = {
  activate: () => Promise.resolve(mockedVscodePythonAPI)
}

beforeEach(() => {
  jest.resetAllMocks()
  mockedGetExtension.mockReturnValueOnce(mockedVscodePython)
})

describe('getPythonBinPath', () => {
  const mockedPythonBinPath = '/some/path/to/python'
  mockedExecCommand = [mockedPythonBinPath]

  it('should return the python path even if the python ready promise rejects', async () => {
    mockedReady.mockRejectedValueOnce(undefined)
    mockedExecuteProcess.mockResolvedValueOnce(mockedPythonBinPath)

    const pythonBinPath = await getPythonBinPath()

    expect(pythonBinPath).toStrictEqual(mockedPythonBinPath)
  })

  it('should return the python path if the python extension initializes as expected', async () => {
    mockedReady.mockResolvedValueOnce(undefined)
    mockedExecuteProcess.mockResolvedValueOnce(mockedPythonBinPath)

    const pythonBinPath = await getPythonBinPath()

    expect(pythonBinPath).toStrictEqual(mockedPythonBinPath)
  })
})

describe('getOnDidChangePythonExecutionDetails', () => {
  it('should return the listener if the python ready promise rejects', async () => {
    mockedReady.mockRejectedValueOnce(undefined)

    const listener = await getOnDidChangePythonExecutionDetails()

    expect(listener).toBe(mockedOnDidChangeExecutionDetails)
  })

  it('should return the listener if the python extension initializes as expected', async () => {
    mockedReady.mockResolvedValueOnce(undefined)

    const listener = await getOnDidChangePythonExecutionDetails()

    expect(listener).toBe(mockedOnDidChangeExecutionDetails)
  })
})
