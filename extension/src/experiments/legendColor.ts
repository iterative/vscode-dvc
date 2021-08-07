import { ThemeColor } from 'vscode'

export abstract class LegendColor {
  private static readonly colors = Array.from(
    Array(5),
    (_, x) => `dvc.expLegend0${x + 1}`
  )

  public static getByIndex(index: number): ThemeColor {
    const i = (index + 1) % 5 === 0 ? 4 : ((index + 1) % 5) - 1
    return new ThemeColor(LegendColor.colors[i])
  }

  public static getIdByIndex(index: number): string {
    const i = (index + 1) % 5 === 0 ? 4 : ((index + 1) % 5) - 1
    return LegendColor.colors[i]
  }
}
