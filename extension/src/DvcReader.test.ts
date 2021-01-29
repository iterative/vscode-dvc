import path from 'path'

import { inferDefaultOptions } from './DvcReader'

const extensionDirectory = path.resolve(__dirname, '..')

test('Inferring default options on a directory without .env', async () => {
  expect(await inferDefaultOptions(extensionDirectory)).toEqual({
    bin: 'dvc',
    cwd: extensionDirectory
  })
})
