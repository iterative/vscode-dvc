import execa from 'execa'

export const runProcess = async ({
  file,
  args,
  cwd,
  env
}: {
  file: string
  args: string[]
  cwd: string
  env?: Record<string, string>
}): Promise<string> => {
  const { stdout } = await execa(file, args, {
    all: true,
    cwd,
    env,
    extendEnv: true
  })
  return stdout
}
