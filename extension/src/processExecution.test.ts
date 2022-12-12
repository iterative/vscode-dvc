import process from 'process'
import { executeProcess, processExists } from './processExecution'

describe('executeProcess', () => {
  it('should be able to run a process', async () => {
    const output = await executeProcess({
      args: ['some', 'text'],
      cwd: __dirname,
      executable: 'echo'
    })
    expect(output).toMatch(/some.*text/)
  })

  it('should return the stderr if the process throws with stderr', async () => {
    await expect(
      executeProcess({
        args: ['me', 'outside'],
        cwd: __dirname,
        executable: 'find'
      })
    ).rejects.toBeTruthy()
  })
})

describe('processExists', () => {
  it('should return true if the process exists', async () => {
    expect(await processExists(process.pid)).toBe(true)
  })
  it('should return false if it does not', async () => {
    expect(await processExists(-123.321)).toBe(false)
  })
})
