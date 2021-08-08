import { padNumber } from '../util'

/**
 * @static
 */
export abstract class ExperimentLegendThemeColor {
  static readonly colorCount = 50
  private static readonly colorThemeIds = Array.from(
    Array(ExperimentLegendThemeColor.colorCount),
    (_, x) => {
      const numDigit = `${ExperimentLegendThemeColor.colorCount}`.length
      return `dvc.expLegend${padNumber(x, numDigit)}`
    }
  )

  /**
   * @returns color theme `id`
   */
  public static getThemeId(index: number): string {
    const i = ExperimentLegendThemeColor.getColorIndex(index)
    return ExperimentLegendThemeColor.colorThemeIds[i]
  }

  /**
   * @returns calculated index of the theme color for the given index
   */
  public static getColorIndex(index: number): number {
    if (index === 0) {
      return 0
    }

    return index % ExperimentLegendThemeColor.colorCount === 0
      ? ExperimentLegendThemeColor.colorCount
      : Math.abs(index % ExperimentLegendThemeColor.colorCount)
  }
}
