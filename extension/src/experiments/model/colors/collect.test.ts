import { copyOriginalColors } from '.'
import { collectColors } from './collect'

const generateExperimentNameList = (n: number): string[] =>
  Array.from({ length: n }, (_, i) => `exp-${i + 1}`)

const [firstColor, secondColor, thirdColor] = copyOriginalColors()

describe('collectColors', () => {
  it('should assign the correct colors to the correct experiments', () => {
    const { assigned } = collectColors(
      [
        '4fb124aebddb2adf1545030907687fa9a4c80e70',
        '42b8736b08170529903cd203a1f40382a4b4a8cd',
        '1ba7bcd6ce6154e72e18b155475663ecbbd1f49d'
      ],
      new Map(),
      copyOriginalColors()
    )
    expect(assigned).toStrictEqual(
      new Map([
        ['1ba7bcd6ce6154e72e18b155475663ecbbd1f49d', thirdColor],
        ['4fb124aebddb2adf1545030907687fa9a4c80e70', firstColor],
        ['42b8736b08170529903cd203a1f40382a4b4a8cd', secondColor]
      ])
    )
  })

  it('should return the original list of colors if no experiment ids are provided', () => {
    const { available } = collectColors([], new Map(), copyOriginalColors())
    expect(available).toStrictEqual(copyOriginalColors())
  })

  it('should return the original colors list if all existing experiments are removed', () => {
    const { assigned, available } = collectColors(
      [],
      new Map([
        ['4fb124aebddb2adf1545030907687fa9a4c80e70', firstColor],
        ['42b8736b08170529903cd203a1f40382a4b4a8cd', secondColor],
        ['1ba7bcd6ce6154e72e18b155475663ecbbd1f49d', thirdColor]
      ]),
      []
    )
    expect(assigned).toStrictEqual(new Map())
    expect(available).toStrictEqual(copyOriginalColors())
  })

  it('should add the colors of experiments which are no longer found back into the color list', () => {
    const originalColorsList = copyOriginalColors()

    const { assigned, available } = collectColors(
      [],
      new Map([
        ['4fb124aebddb2adf1545030907687fa9a4c80e70', firstColor],
        ['42b8736b08170529903cd203a1f40382a4b4a8cd', secondColor],
        ['1ba7bcd6ce6154e72e18b155475663ecbbd1f49d', thirdColor]
      ]),
      originalColorsList.slice(3)
    )
    expect(assigned).toStrictEqual(new Map())
    expect(available).toStrictEqual(originalColorsList)
  })

  it('should return the original assigned and available colors given the same info', () => {
    const originalColorsList = copyOriginalColors()
    const originalAssigned = new Map([
      ['1ba7bcd6ce6154e72e18b155475663ecbbd1f49d', thirdColor],
      ['4fb124aebddb2adf1545030907687fa9a4c80e70', firstColor],
      ['42b8736b08170529903cd203a1f40382a4b4a8cd', secondColor]
    ])

    const originalAvailable = originalColorsList.slice(2)

    const { assigned, available } = collectColors(
      [
        '1ba7bcd6ce6154e72e18b155475663ecbbd1f49d',
        '4fb124aebddb2adf1545030907687fa9a4c80e70',
        '42b8736b08170529903cd203a1f40382a4b4a8cd'
      ],
      originalAssigned,
      originalAvailable
    )
    expect(assigned).toStrictEqual(originalAssigned)
    expect(available).toStrictEqual(originalAvailable)
  })

  it('should not assign any color after exhausting the list', () => {
    const experimentNames = generateExperimentNameList(151)

    const { assigned, available } = collectColors(
      experimentNames,
      new Map(),
      copyOriginalColors()
    )

    expect(available).toStrictEqual([])

    for (let i = 1; i < 8; i++) {
      expect(assigned.get(`exp-${i}`)).toBeDefined()
    }

    for (let i = 8; i < 152; i++) {
      expect(assigned.get(`exp-${i}`)).toBeUndefined()
    }
  })
})
