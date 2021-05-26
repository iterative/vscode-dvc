import { executeProcess } from './processExecution'

describe('executeProcess', () => {
  it('should be able to run a process', async () => {
    const output = await executeProcess({
      executable: 'echo',
      args: ['some', 'text'],
      cwd: __dirname
    })
    expect(output).toEqual('some text')
  })

  it('should return the stderr if the process throws with stderr', async () => {
    await expect(
      executeProcess({
        executable: 'find',
        args: ['me', 'outside'],
        cwd: __dirname
      })
    ).rejects.toBeTruthy()
  })
})
