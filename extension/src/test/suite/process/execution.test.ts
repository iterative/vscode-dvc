import process from 'process'
import { describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { executeProcess, processExists } from '../../../process/execution'

suite('Process Manager Test Suite', () => {
  describe('executeProcess', () => {
    it('should be able to run a process', async () => {
      const output = await executeProcess({
        args: ['some', 'text'],
        cwd: __dirname,
        executable: 'echo'
      })
      expect(output).to.match(/some.*text/)
    })

    it('should return the stderr if the process throws with stderr', async () => {
      await expect(
        executeProcess({
          args: ['me', 'outside'],
          cwd: __dirname,
          executable: 'find'
        })
      ).to.be.eventually.rejected
    })
  })

  describe('processExists', () => {
    it('should return true if the process exists', async () => {
      expect(await processExists(process.pid)).to.be.true
    })
    it('should return false if it does not', async () => {
      expect(await processExists(-123.321)).to.be.false
    })
  })
})
