import { runProcess } from './processExecution'

describe('runProcess', () => {
  it('should be able to run a process', async () => {
    const output = await runProcess({
      executable: 'echo',
      args: ['some', 'text'],
      cwd: __dirname
    })
    expect(output).toEqual('some text')
  })

  it('should throw an empty error if the underlying process throws without stderr', async () => {
    await expect(
      runProcess({
        executable: 'echo1',
        args: ['I', 'deed'],
        cwd: __dirname
      })
    ).rejects.toBeFalsy()
  })

  it('should return the stderr if the process throws with stderr', async () => {
    await expect(
      runProcess({
        executable: 'read',
        args: ['-t', '0.1', '-p', 'Off we go to stderr'],
        cwd: __dirname
      })
    ).rejects.toBeTruthy()
  })
})
