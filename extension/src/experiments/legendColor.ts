export abstract class ExperimentLegendColorTheme {
  private static readonly colors = Array.from(
    Array(5),
    (_, x) => `dvc.expLegend0${x + 1}`
  )

  /**
   * @returns color theme `id`
   */
  public static getByIndex(index: number): string {
    const i = ExperimentLegendColorTheme.getIndex(index)
    return ExperimentLegendColorTheme.colors[i]
  }

  /**
   * @returns calculated index of the theme color for the given index
   */
  public static getIndex(index: number): number {
    return (index + 1) % 5 === 0 ? 4 : ((index + 1) % 5) - 1
  }
}
