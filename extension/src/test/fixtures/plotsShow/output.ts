import { sep } from 'path'
import { basePlotsUrl } from '../../util'
import { getData, getMinimalData } from '.'

export const minimalPlotsShowFixture = getMinimalData(basePlotsUrl, sep)
export const plotsShowFixture = getData(basePlotsUrl, sep)
