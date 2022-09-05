import { Logger } from './logger'

jest.mock('console', () => {
  const actualModule = jest.requireActual('console')
  return {
    __esModule: true,
    ...actualModule
  }
})

describe('Logger', () => {
  describe('error', () => {
    it('should be able to write an error to the console', () => {
      const error = 'I wrong'
      const logSpy = jest.spyOn(console, 'error').mockReturnValueOnce(undefined)
      Logger.error(error)
      expect(logSpy).toHaveBeenCalledWith(error)
    })
  })

  describe('warn', () => {
    it('should be able to write a warning to the console', () => {
      const warn = 'I may be wrong'
      const logSpy = jest.spyOn(console, 'warn').mockReturnValueOnce(undefined)
      Logger.warn(warn)
      expect(logSpy).toHaveBeenCalledWith(warn)
    })
  })

  describe('info', () => {
    it('should be able to write info to the console', () => {
      const info = 'I am information'
      const logSpy = jest.spyOn(console, 'info').mockReturnValueOnce(undefined)
      Logger.info(info)
      expect(logSpy).toHaveBeenCalledWith(info)
    })
  })

  describe('log', () => {
    it('should be able to log to the console', () => {
      const log = 'I am probably something that helps you debug'
      const logSpy = jest.spyOn(console, 'log').mockReturnValueOnce(undefined)
      Logger.log(log)
      expect(logSpy).toHaveBeenCalledWith(log)
    })
  })
})
