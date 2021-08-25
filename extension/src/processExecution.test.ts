import { executeProcess } from './processExecution'

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
