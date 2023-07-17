import { collectRemoteList, collectSubProjects } from './collect'
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

describe('collectSubProjects', () => {
  it('should return no sub-projects for a single root', () => {
    const subProjects = collectSubProjects([dvcDemoPath])
    expect(subProjects).toStrictEqual({ [dvcDemoPath]: [] })
  })

  it('should return no sub-projects for a sibling projects', () => {
    const projectA = join(dvcDemoPath, 'A')
    const projectB = join(dvcDemoPath, 'B')
    const subProjects = collectSubProjects([projectA, projectB])
    expect(subProjects).toStrictEqual({ [projectA]: [], [projectB]: [] })
  })

  it('should return sub-projects for a project with sub-projects', () => {
    const nestedProjectA = join(dvcDemoPath, 'A')
    const nestedProjectB = join(dvcDemoPath, 'B')
    const subProjects = collectSubProjects([
      dvcDemoPath,
      nestedProjectA,
      nestedProjectB
    ])
    expect(subProjects).toStrictEqual({
      [dvcDemoPath]: [nestedProjectA, nestedProjectB],
      [nestedProjectA]: [],
      [nestedProjectB]: []
    })
  })
})
