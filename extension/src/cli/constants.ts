import { Args as DvcArgs } from './dvc/constants'
import { Args as GitArgs } from './git/constants'

export type Args = DvcArgs | GitArgs
