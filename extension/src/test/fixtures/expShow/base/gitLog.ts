import expShowFixture from './output'
import { COMMITS_SEPARATOR } from '../../../../cli/git/constants'

const data = `${expShowFixture[1].rev}
github-actions[bot]
6 hours ago
refNames:tag: 0.9.3, origin/main, origin/HEAD, main
message:Update version and CHANGELOG for release (#4022)

Co-authored-by: Olivaw[bot] <olivaw@iterative.ai>${COMMITS_SEPARATOR}${expShowFixture[2].rev}
Julie G
6 hours ago
refNames:
message:Improve "Get Started" walkthrough (#4020)

* don't show walkthrough in sidebar welcome section
* move admonition in command palette walkthrough step${COMMITS_SEPARATOR}${expShowFixture[3].rev}
Matt Seddon
8 hours ago
refNames:
message:Add capabilities to text mentioning storage provider extensions (#4015)
`
export default data
