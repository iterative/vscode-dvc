import { CommitData } from './webview/contract'
import {
  EXPERIMENT_WORKSPACE_ID,
  ExpRange,
  ExpShowOutput,
  ExpState
} from '../cli/dvc/contract'
import { COMMITS_SEPARATOR } from '../cli/git/constants'

const formatCommitMessage = (commit: string) => {
  const lines = commit.split('\n').filter(Boolean)
  return `${lines[0]}${lines.length > 1 ? ' ...' : ''}`
}

const addDetailsToRevision = (
  acc: ExpShowOutput,
  out:
    | (ExpState & {
        experiments?: ExpRange[] | null | undefined
      })
    | undefined,
  branch: string,
  commit: CommitData | undefined
) => {
  if (!out) {
    return
  }
  acc.push({
    ...out,
    branch,
    commit,
    description: commit ? formatCommitMessage(commit.message) : undefined
  })
}

const collectCommitData = (
  acc: { [sha: string]: CommitData },
  commit: string
) => {
  const [sha, author, date, refNamesWithKey] = commit
    .split('\n')
    .filter(Boolean)

  if (!sha) {
    return
  }

  const commitData: CommitData = {
    author: author || '',
    date: date || '',
    message: (commit.match(/\nmessage:(.+)/s) || [])[1] || '',
    tags: []
  }

  if (refNamesWithKey) {
    const refNames = refNamesWithKey.slice('refNames:'.length)
    commitData.tags = refNames
      .split(', ')
      .filter(item => item.startsWith('tag: '))
      .map(item => item.slice('tag: '.length))
  }
  acc[sha] = commitData
}

const collectCommitsData = (output: string): { [sha: string]: CommitData } => {
  const acc: { [sha: string]: CommitData } = {}

  for (const commit of output.split(COMMITS_SEPARATOR)) {
    collectCommitData(acc, commit)
  }
  return acc
}

export const combineOutputs = (
  currentBranch: string,
  expShow: ExpShowOutput,
  gitLog: string,
  order: { branch: string; sha: string }[]
): ExpShowOutput => {
  const commits = collectCommitsData(gitLog)

  const outputByRev: {
    [rev: string]: ExpState & {
      experiments?: ExpRange[] | null | undefined
    }
  } = {}
  for (const out of expShow) {
    outputByRev[out.rev] = out
  }

  const acc: ExpShowOutput = [
    { ...outputByRev[EXPERIMENT_WORKSPACE_ID], branch: currentBranch }
  ]
  for (const { branch, sha } of order) {
    addDetailsToRevision(acc, outputByRev[sha], branch, commits[sha])
  }

  return acc
}
