import { collectRemoteList } from './collect'
import { dvcDemoPath } from '../test/util'
import { join } from '../test/util/path'

describe('collectRemoteList', () => {
  it('should return the expected data structure', async () => {
    const mockedRoot = join('some', 'other', 'root')
    const remoteList = await collectRemoteList(
      [dvcDemoPath, 'mockedOtherRoot', mockedRoot],
      root =>
        Promise.resolve(
          {
            [dvcDemoPath]:
              'storage s3://dvc-public/remote/mnist-vscode\nbackup gdrive://appDataDir\nurl  https://remote.dvc.org/mnist-vscode',
            mockedOtherRoot: '',
            [mockedRoot]: undefined
          }[root]
        )
    )
    expect(remoteList).toStrictEqual({
      [dvcDemoPath]: {
        backup: 'gdrive://appDataDir',
        storage: 's3://dvc-public/remote/mnist-vscode',
        url: 'https://remote.dvc.org/mnist-vscode'
      },
      mockedOtherRoot: undefined,
      [mockedRoot]: undefined
    })
  })
})
