# Change Log

All notable changes to this project will be documented in this file.

## [0.2.20] - 2022-05-26

### 🚀 New Features and Enhancements

- Make params and metrics colors more light-theme friendly [#1773](https://github.com/iterative/vscode-dvc/pull/1773) by [@rogermparent](https://github.com/rogermparent)
- Show empty state in experiments tree when there are no columns [#1777](https://github.com/iterative/vscode-dvc/pull/1777) by [@mattseddon](https://github.com/mattseddon)

### 🐛 Bug Fixes

- Add min-width to comparison table [#1770](https://github.com/iterative/vscode-dvc/pull/1770) by [@sroy3](https://github.com/sroy3)
- Prevent right clicking in plots webview even with non-filling content [#1774](https://github.com/iterative/vscode-dvc/pull/1774) by [@rogermparent](https://github.com/rogermparent)

### 🔨 Maintenance

- Cleanup of comparison table stories [#1771](https://github.com/iterative/vscode-dvc/pull/1771) by [@sroy3](https://github.com/sroy3)
- Fix height of timestamp cells [#1772](https://github.com/iterative/vscode-dvc/pull/1772) by [@rogermparent](https://github.com/rogermparent)
- Reduce duplication in get started components [#1766](https://github.com/iterative/vscode-dvc/pull/1766) by [@mattseddon](https://github.com/mattseddon)
- Make reusable WebviewWrapper component [#1775](https://github.com/iterative/vscode-dvc/pull/1775) by [@rogermparent](https://github.com/rogermparent)
- Watch all .dvc files for exp show updates [#1778](https://github.com/iterative/vscode-dvc/pull/1778) by [@mattseddon](https://github.com/mattseddon)

## [0.2.19] - 2022-05-25

### 🚀 New Features and Enhancements

- Improve experiments table empty states [#1755](https://github.com/iterative/vscode-dvc/pull/1755) by [@mattseddon](https://github.com/mattseddon)

### 🐛 Bug Fixes

- Mitigate Python extension rejecting ready promise [#1765](https://github.com/iterative/vscode-dvc/pull/1765) by [@mattseddon](https://github.com/mattseddon)

## [0.2.18] - 2022-05-24

### 🚀 New Features and Enhancements

- Improve user facing text for dvc.runQueuedExperiments [#1751](https://github.com/iterative/vscode-dvc/pull/1751) by [@mattseddon](https://github.com/mattseddon)
- Add manual refresh button to missing plots [#1754](https://github.com/iterative/vscode-dvc/pull/1754) by [@mattseddon](https://github.com/mattseddon)
- Add option to hide a column from the experiments table [#1756](https://github.com/iterative/vscode-dvc/pull/1756) by [@wolmir](https://github.com/wolmir)

### 🐛 Bug Fixes

- Prevent queued experiments from being selected via the experiments table [#1753](https://github.com/iterative/vscode-dvc/pull/1753) by [@mattseddon](https://github.com/mattseddon)
- Fix timing of comparison table renders [#1759](https://github.com/iterative/vscode-dvc/pull/1759) by [@mattseddon](https://github.com/mattseddon)
- Fix overflow of zoomed in plots not shown [#1763](https://github.com/iterative/vscode-dvc/pull/1763) by [@sroy3](https://github.com/sroy3)
- Fix drop target moving away when picking up an item [#1762](https://github.com/iterative/vscode-dvc/pull/1762) by [@sroy3](https://github.com/sroy3)

### 🔨 Maintenance

- Publish extension to Open VSX via publish action [#1758](https://github.com/iterative/vscode-dvc/pull/1758) by [@mattseddon](https://github.com/mattseddon)

## [0.2.17] - 2022-05-22

### 🚀 New Features and Enhancements

- Plot list virtualization [#1707](https://github.com/iterative/vscode-dvc/pull/1707) by [@sroy3](https://github.com/sroy3)
- Prevent native context menu from being invoked on webviews [#1736](https://github.com/iterative/vscode-dvc/pull/1736) by [@rogermparent](https://github.com/rogermparent)
- Rework experiment commands and context menus to vary based on whether experiments have checkpoints [#1738](https://github.com/iterative/vscode-dvc/pull/1738) by [@mattseddon](https://github.com/mattseddon)
- Rework experiment table context menus to vary based on whether or not experiments have checkpoints [#1739](https://github.com/iterative/vscode-dvc/pull/1739) by [@mattseddon](https://github.com/mattseddon)
- Make size of comparison table column more consistent [#1744](https://github.com/iterative/vscode-dvc/pull/1744) by [@sroy3](https://github.com/sroy3)
- Add drag and drop for experiment table column groups [#1729](https://github.com/iterative/vscode-dvc/pull/1729) by [@wolmir](https://github.com/wolmir)
- Show experiment names in comparison table headers (#1614) [#1730](https://github.com/iterative/vscode-dvc/pull/1730) by [@wolmir](https://github.com/wolmir)
- Add experiment icons to editor/title when params file is open [#1740](https://github.com/iterative/vscode-dvc/pull/1740) by [@mattseddon](https://github.com/mattseddon)
- Remove extra padding in plots [#1749](https://github.com/iterative/vscode-dvc/pull/1749) by [@sroy3](https://github.com/sroy3)

### 🐛 Bug Fixes

- Fix pinning missing plot [#1742](https://github.com/iterative/vscode-dvc/pull/1742) by [@sroy3](https://github.com/sroy3)

### 🔨 Maintenance

- Mock VS Code before importing modules in scheduled cli output test [#1737](https://github.com/iterative/vscode-dvc/pull/1737) by [@mattseddon](https://github.com/mattseddon)
- Mock VS Code before importing modules in venv setup [#1747](https://github.com/iterative/vscode-dvc/pull/1747) by [@mattseddon](https://github.com/mattseddon)
- Remove can select many property from selection trees [#1748](https://github.com/iterative/vscode-dvc/pull/1748) by [@mattseddon](https://github.com/mattseddon)
- Make deeply nested experiments table test fixture static [#1745](https://github.com/iterative/vscode-dvc/pull/1745) by [@mattseddon](https://github.com/mattseddon)
- Add eslint-plugin-etc for no-commented-out-code rule [#1750](https://github.com/iterative/vscode-dvc/pull/1750) by [@mattseddon](https://github.com/mattseddon)

## [0.2.16] - 2022-05-18

### 🚀 New Features and Enhancements

- Add plots selection quick pick [#1701](https://github.com/iterative/vscode-dvc/pull/1701) by [@mattseddon](https://github.com/mattseddon)
- Add get started component to plots webview [#1718](https://github.com/iterative/vscode-dvc/pull/1718) by [@mattseddon](https://github.com/mattseddon)
- Add codicons to welcome view buttons [#1717](https://github.com/iterative/vscode-dvc/pull/1717) by [@mattseddon](https://github.com/mattseddon)
- Improve plots welcome view when there are no plots [#1722](https://github.com/iterative/vscode-dvc/pull/1722) by [@mattseddon](https://github.com/mattseddon)
- Update view container welcome views [#1728](https://github.com/iterative/vscode-dvc/pull/1728) by [@mattseddon](https://github.com/mattseddon)
- Add experiment run reset to menus [#1719](https://github.com/iterative/vscode-dvc/pull/1719) by [@mattseddon](https://github.com/mattseddon)
- Bypass filters on missing values (for queued experiments) [#1732](https://github.com/iterative/vscode-dvc/pull/1732) by [@mattseddon](https://github.com/mattseddon)

### 🐛 Bug Fixes

- Prevent infinite loop when trying to open plots [#1727](https://github.com/iterative/vscode-dvc/pull/1727) by [@mattseddon](https://github.com/mattseddon)
- Fix experiment stop button [#1731](https://github.com/iterative/vscode-dvc/pull/1731) by [@mattseddon](https://github.com/mattseddon)

### 🔨 Maintenance

- Rearrange internals of base workspace webviews [#1706](https://github.com/iterative/vscode-dvc/pull/1706) by [@mattseddon](https://github.com/mattseddon)

## [0.2.15] - 2022-05-13

### 🚀 New Features and Enhancements

- Use contributed colors for some webview colors [#1697](https://github.com/iterative/vscode-dvc/pull/1697) by [@rogermparent](https://github.com/rogermparent)

### 🐛 Bug Fixes

- Do not reset deferred property when consumers are still waiting [#1695](https://github.com/iterative/vscode-dvc/pull/1695) by [@mattseddon](https://github.com/mattseddon)
- Add placeholder when image is missing from comparison table data [#1699](https://github.com/iterative/vscode-dvc/pull/1699) by [@mattseddon](https://github.com/mattseddon)

### 🔨 Maintenance

- Move init command from tracked tree into the extension [#1696](https://github.com/iterative/vscode-dvc/pull/1696) by [@mattseddon](https://github.com/mattseddon)
- Add create release pr workflow [#1685](https://github.com/iterative/vscode-dvc/pull/1685) by [@mattseddon](https://github.com/mattseddon)

## [0.2.14] - 2022-05-12

### Initial Release
