# Change Log

All notable changes to this project will be documented in this file.

## [0.2.22] - 2022-06-03

### 🚀 New Features and Enhancements

- Add legend to zoomed in plots [#1794](https://github.com/iterative/vscode-dvc/pull/1794) by [@mattseddon](https://github.com/mattseddon)
- Close modal on Escape [#1811](https://github.com/iterative/vscode-dvc/pull/1811) by [@sroy3](https://github.com/sroy3)
- Add position:sticky to Experiment table head [#1805](https://github.com/iterative/vscode-dvc/pull/1805) by [@rogermparent](https://github.com/rogermparent)
- Experiment table open to the side [#1796](https://github.com/iterative/vscode-dvc/pull/1796) by [@wolmir](https://github.com/wolmir)
- Add experiments from plots ribbon [#1798](https://github.com/iterative/vscode-dvc/pull/1798) by [@sroy3](https://github.com/sroy3)
- Add support view to DVC container [#1817](https://github.com/iterative/vscode-dvc/pull/1817) by [@mattseddon](https://github.com/mattseddon)
- Add multi-select push and pull to tracked explorer tree [#1809](https://github.com/iterative/vscode-dvc/pull/1809) by [@mattseddon](https://github.com/mattseddon)
- Add multi-select remove to experiments tree [#1810](https://github.com/iterative/vscode-dvc/pull/1810) by [@mattseddon](https://github.com/mattseddon)
- Make Experiments Table Experiments Column Sticky [#1825](https://github.com/iterative/vscode-dvc/pull/1825) by [@rogermparent](https://github.com/rogermparent)

### 🐛 Bug Fixes

- Use vscode tree.tableColumnsBorder to add contrast in light themes [#1803](https://github.com/iterative/vscode-dvc/pull/1803) by [@wolmir](https://github.com/wolmir)
- Fix experiment names overflowing from plots ribbon [#1821](https://github.com/iterative/vscode-dvc/pull/1821) by [@sroy3](https://github.com/sroy3)
- Accomodate params that are lists [#1818](https://github.com/iterative/vscode-dvc/pull/1818) by [@mattseddon](https://github.com/mattseddon)
- Watch all dvc.yamls for changes to plots [#1822](https://github.com/iterative/vscode-dvc/pull/1822) by [@mattseddon](https://github.com/mattseddon)

### 🔨 Maintenance

- Update extension description for the marketplace [#1807](https://github.com/iterative/vscode-dvc/pull/1807) by [@mattseddon](https://github.com/mattseddon)
- Rename experiments model queue folder to experiments model modify [#1819](https://github.com/iterative/vscode-dvc/pull/1819) by [@mattseddon](https://github.com/mattseddon)
- Remove revision filtering from comparison table icon menu [#1823](https://github.com/iterative/vscode-dvc/pull/1823) by [@sroy3](https://github.com/sroy3)
- Replace firstCell with experimentCell [#1824](https://github.com/iterative/vscode-dvc/pull/1824) by [@rogermparent](https://github.com/rogermparent)

## [0.2.21] - 2022-06-01

### 🚀 New Features and Enhancements

- plots: meaningful section default names [#1789](https://github.com/iterative/vscode-dvc/pull/1789) by [@shcheklein](https://github.com/shcheklein)
- Render more rows while virtualizing plots [#1795](https://github.com/iterative/vscode-dvc/pull/1795) by [@sroy3](https://github.com/sroy3)
- Update walkthrough [#1792](https://github.com/iterative/vscode-dvc/pull/1792) by [@mattseddon](https://github.com/mattseddon)
- Update README [#1793](https://github.com/iterative/vscode-dvc/pull/1793) by [@mattseddon](https://github.com/mattseddon)
- Switch list-selection icon to list-filter [#1800](https://github.com/iterative/vscode-dvc/pull/1800) by [@mattseddon](https://github.com/mattseddon)
- Add plots ribbon to show and remove experiments [#1785](https://github.com/iterative/vscode-dvc/pull/1785) by [@sroy3](https://github.com/sroy3)

### 🐛 Bug Fixes

- Fix push/pull directory from DVC tracked tree [#1781](https://github.com/iterative/vscode-dvc/pull/1781) by [@mattseddon](https://github.com/mattseddon)
- Fix not in cache and deleted decorations for directory contents [#1783](https://github.com/iterative/vscode-dvc/pull/1783) by [@mattseddon](https://github.com/mattseddon)
- Correctly drop cached plots data whenever moving between branches and commits [#1804](https://github.com/iterative/vscode-dvc/pull/1804) by [@mattseddon](https://github.com/mattseddon)

### 🔨 Maintenance

- Add deps and outs to exp show test fixture [#1780](https://github.com/iterative/vscode-dvc/pull/1780) by [@mattseddon](https://github.com/mattseddon)

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
