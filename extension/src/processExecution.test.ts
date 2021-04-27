import { runProcess } from './processExecution'

describe('runProcess', () => {
  it('should be able to run a process', async () => {
    const output = await runProcess({
      file: 'echo',
      args: ['some', 'text'],
      cwd: __dirname
    })
    expect(output).toEqual('some text')
  })
})
