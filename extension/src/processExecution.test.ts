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

  it('should throw an empty error if the underlying process throws without stderr', async () => {
    await expect(
      executeProcess({
        executable: 'echo1',
        args: ['I', 'deed'],
        cwd: __dirname
      })
    ).rejects.toBeFalsy()
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
