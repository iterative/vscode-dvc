import { join } from 'path'
import type { ProcessOptions } from '../../../process/execution'

export const getOptions = (
  file: 'child' | 'background' | 'failed'
): ProcessOptions => ({
  args: [join(__dirname, `${file}.js`)],
  cwd: __dirname,
  executable: 'node'
})
