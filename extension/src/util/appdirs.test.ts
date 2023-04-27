import { join } from 'path'
import { getDVCAppDir, getIterativeAppDir } from './appdirs'
import { getProcessPlatform } from '../env'

const mockedUserConfigDir = require('appdirs').userConfigDir
const mockedGetProcessPlatform = jest.mocked(getProcessPlatform)
const mockedJoin = jest.mocked(join)

jest.mock('appdirs', () => ({ userConfigDir: jest.fn() }))
jest.mock('../env')
jest.mock('path')

beforeEach(() => {
  jest.resetAllMocks()
})

describe('getIterativeAppDir', () => {
  it('should return the correct path for non-windows platforms', () => {
    mockedJoin.mockImplementation((...paths: string[]) => paths.join('/'))
    const mockedAppDir = '/app/dir'
    mockedUserConfigDir.mockImplementationOnce((path: string) =>
      join(mockedAppDir, path)
    )
    expect(getIterativeAppDir()).toStrictEqual(mockedAppDir + '/' + 'iterative')
  })
  it('should return the correct path on Windows', () => {
    mockedJoin.mockImplementation((...paths: string[]) => paths.join('\\'))
    mockedGetProcessPlatform.mockReturnValueOnce('win32')
    const mockedAppDir = 'C:\\app\\dir'
    mockedUserConfigDir.mockImplementationOnce((path: string) =>
      join(mockedAppDir, path)
    )
    expect(getIterativeAppDir()).toStrictEqual(
      join(mockedAppDir + '\\' + 'iterative')
    )
  })
})

describe('getDVCAppDir', () => {
  it('should return the correct path for non-windows platforms', () => {
    mockedJoin.mockImplementation((...paths: string[]) => paths.join('/'))
    const mockedAppDir = '/app/dir'
    mockedUserConfigDir.mockImplementationOnce((path: string) =>
      join(mockedAppDir, path)
    )
    expect(getDVCAppDir()).toStrictEqual(mockedAppDir + '/' + 'dvc')
  })
  it('should return the correct path on Windows', () => {
    mockedJoin.mockImplementationOnce((...paths: string[]) => paths.join('\\'))
    mockedGetProcessPlatform.mockReturnValueOnce('win32')
    const mockedAppDir = 'C:\\app\\dir'
    mockedUserConfigDir.mockImplementationOnce((path: string) =>
      join(mockedAppDir, path)
    )
    expect(getDVCAppDir()).toStrictEqual(
      join(mockedAppDir + '\\' + 'iterative' + 'dvc')
    )
  })
})
