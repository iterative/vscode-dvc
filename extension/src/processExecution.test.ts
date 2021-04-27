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
})
