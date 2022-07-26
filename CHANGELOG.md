# Change Log

All notable changes to this project will be documented in this file.

## [0.3.13] - 2022-07-26

### 🚀 New Features and Enhancements

- Add conditional shadow to sticky experiments column [#2062](https://github.com/iterative/vscode-dvc/pull/2062) by [@julieg18](https://github.com/julieg18)
- Highlight experiments with errors [#2072](https://github.com/iterative/vscode-dvc/pull/2072) by [@mattseddon](https://github.com/mattseddon)
- Comparison table drag and drop feedback [#2064](https://github.com/iterative/vscode-dvc/pull/2064) by [@sroy3](https://github.com/sroy3)
- Change the style of the comparison drag and drop feedback [#2077](https://github.com/iterative/vscode-dvc/pull/2077) by [@sroy3](https://github.com/sroy3)
- Style the ghost image of the comparison table dragged item [#2088](https://github.com/iterative/vscode-dvc/pull/2088) by [@sroy3](https://github.com/sroy3)

### 🐛 Bug Fixes

- Move divider to top of group in experiments table context menu [#2083](https://github.com/iterative/vscode-dvc/pull/2083) by [@mattseddon](https://github.com/mattseddon)
- Fix cell tooltip position on table column resize [#2087](https://github.com/iterative/vscode-dvc/pull/2087) by [@julieg18](https://github.com/julieg18)

### 🔨 Maintenance

- Standardize how the webviews access icons [#2079](https://github.com/iterative/vscode-dvc/pull/2079) by [@mattseddon](https://github.com/mattseddon)
- Add more resolutions for security advisories in dev dependencies [#2082](https://github.com/iterative/vscode-dvc/pull/2082) by [@mattseddon](https://github.com/mattseddon)
- Refactor experiments column conditional shadow logic [#2085](https://github.com/iterative/vscode-dvc/pull/2085) by [@julieg18](https://github.com/julieg18)
- Add getParentelem helper for tests [#2086](https://github.com/iterative/vscode-dvc/pull/2086) by [@sroy3](https://github.com/sroy3)
- Avoid name clashing when naming redux objects [#2095](https://github.com/iterative/vscode-dvc/pull/2095) by [@sroy3](https://github.com/sroy3)
- Do not use turbo cache on main [#2098](https://github.com/iterative/vscode-dvc/pull/2098) by [@mattseddon](https://github.com/mattseddon)

## [0.3.12] - 2022-07-20

### 🚀 New Features and Enhancements

- Add selected for plotting indicator to experiments webview [#2065](https://github.com/iterative/vscode-dvc/pull/2065) by [@mattseddon](https://github.com/mattseddon)

### 🐛 Bug Fixes

- Introduce the latest DVC version extension is tested with [#2067](https://github.com/iterative/vscode-dvc/pull/2067) by [@shcheklein](https://github.com/shcheklein)

### 🔨 Maintenance

- Move some App.test.tsx helpers to utils [#2056](https://github.com/iterative/vscode-dvc/pull/2056) by [@wolmir](https://github.com/wolmir)
- Exclude integration and e2e test folders from unit test discovery [#2061](https://github.com/iterative/vscode-dvc/pull/2061) by [@mattseddon](https://github.com/mattseddon)

## [0.3.11] - 2022-07-19

### 🚀 New Features and Enhancements

- Conditional sticky table head shadows [#2010](https://github.com/iterative/vscode-dvc/pull/2010) by [@rogermparent](https://github.com/rogermparent)
- Show middle state badges for running, starred and checked sub-rows [#2004](https://github.com/iterative/vscode-dvc/pull/2004) by [@wolmir](https://github.com/wolmir)
- Highlight changed hashes for Deps columns [#2029](https://github.com/iterative/vscode-dvc/pull/2029) by [@wolmir](https://github.com/wolmir)

### 🔨 Maintenance

- Minor Storybook config touch-ups [#2015](https://github.com/iterative/vscode-dvc/pull/2015) by [@rogermparent](https://github.com/rogermparent)
- Add wdio-vscode-service folder to prettierignore [#2023](https://github.com/iterative/vscode-dvc/pull/2023) by [@mattseddon](https://github.com/mattseddon)
- Ignore packages in Renovate config [#2021](https://github.com/iterative/vscode-dvc/pull/2021) by [@mattseddon](https://github.com/mattseddon)
- Increase timeout of scheduled CLI test [#2025](https://github.com/iterative/vscode-dvc/pull/2025) by [@mattseddon](https://github.com/mattseddon)
- Remove webview message handling from experiments [#2026](https://github.com/iterative/vscode-dvc/pull/2026) by [@mattseddon](https://github.com/mattseddon)
- Remove webview message handling from plots [#2027](https://github.com/iterative/vscode-dvc/pull/2027) by [@mattseddon](https://github.com/mattseddon)
- Upgrade Python dependencies [#2024](https://github.com/iterative/vscode-dvc/pull/2024) by [@mattseddon](https://github.com/mattseddon)
- Change type of cell value as a step towards consolidation [#2054](https://github.com/iterative/vscode-dvc/pull/2054) by [@wolmir](https://github.com/wolmir)
- Move experiments webview message sending into WebviewMessages [#2030](https://github.com/iterative/vscode-dvc/pull/2030) by [@mattseddon](https://github.com/mattseddon)
- Move plots webview message sending into WebviewMessages [#2033](https://github.com/iterative/vscode-dvc/pull/2033) by [@mattseddon](https://github.com/mattseddon)
- Extract set active editor context from experiments [#2038](https://github.com/iterative/vscode-dvc/pull/2038) by [@mattseddon](https://github.com/mattseddon)
- Do not update trees on star update [#2042](https://github.com/iterative/vscode-dvc/pull/2042) by [@mattseddon](https://github.com/mattseddon)

## [0.3.10] - 2022-07-14

### 🐛 Bug Fixes

- Fix checkbox selection issues [#1986](https://github.com/iterative/vscode-dvc/pull/1986) by [@wolmir](https://github.com/wolmir)
- Fix non-standard data type tooltips and add tests [#1991](https://github.com/iterative/vscode-dvc/pull/1991) by [@rogermparent](https://github.com/rogermparent)

### 🔨 Maintenance

- Add stability days to Renovate config [#1992](https://github.com/iterative/vscode-dvc/pull/1992) by [@mattseddon](https://github.com/mattseddon)
- Add e2e tests (wdio-vscode-service) [#1993](https://github.com/iterative/vscode-dvc/pull/1993) by [@mattseddon](https://github.com/mattseddon)
- Add matchLanguages to Renovate config [#1998](https://github.com/iterative/vscode-dvc/pull/1998) by [@mattseddon](https://github.com/mattseddon)
- Add internalChecksFilter to Renovate config [#2001](https://github.com/iterative/vscode-dvc/pull/2001) by [@mattseddon](https://github.com/mattseddon)
- Fix race condition in manual plot refresh (M1 macs) [#2011](https://github.com/iterative/vscode-dvc/pull/2011) by [@mattseddon](https://github.com/mattseddon)
- Remove flaky test from unit test suite [#2014](https://github.com/iterative/vscode-dvc/pull/2014) by [@mattseddon](https://github.com/mattseddon)
- Switch from matchLanguages to matchManagers in Renovate Config [#2012](https://github.com/iterative/vscode-dvc/pull/2012) by [@mattseddon](https://github.com/mattseddon)
- Add e2e tests into CI [#2002](https://github.com/iterative/vscode-dvc/pull/2002) by [@mattseddon](https://github.com/mattseddon)
- Add end to end test for SCM and file decorations [#2013](https://github.com/iterative/vscode-dvc/pull/2013) by [@mattseddon](https://github.com/mattseddon)
- Add Julie to CODEOWNERS [#2018](https://github.com/iterative/vscode-dvc/pull/2018) by [@mattseddon](https://github.com/mattseddon)

## [0.3.9] - 2022-07-06

### 🚀 New Features and Enhancements

- Small table cell tooltip changes [#1967](https://github.com/iterative/vscode-dvc/pull/1967) by [@rogermparent](https://github.com/rogermparent)

### 🐛 Bug Fixes

- Fix plot colors [#1988](https://github.com/iterative/vscode-dvc/pull/1988) by [@rogermparent](https://github.com/rogermparent)

### 🔨 Maintenance

- Increase timeout of integration tests again [#1970](https://github.com/iterative/vscode-dvc/pull/1970) by [@mattseddon](https://github.com/mattseddon)
- More dependency updates [#1969](https://github.com/iterative/vscode-dvc/pull/1969) by [@mattseddon](https://github.com/mattseddon)
- Use create root to instantiate React apps [#1971](https://github.com/iterative/vscode-dvc/pull/1971) by [@mattseddon](https://github.com/mattseddon)

## [0.3.8] - 2022-07-03

### 🚀 New Features and Enhancements

- Only pull selected files if they include the invoked path [#1963](https://github.com/iterative/vscode-dvc/pull/1963) by [@mattseddon](https://github.com/mattseddon)
- Implement checkbox selection [#1964](https://github.com/iterative/vscode-dvc/pull/1964) by [@wolmir](https://github.com/wolmir)

### 🔨 Maintenance

- Prime the repository for Renovate [#1959](https://github.com/iterative/vscode-dvc/pull/1959) by [@mattseddon](https://github.com/mattseddon)
- Improve quick start in README [#1962](https://github.com/iterative/vscode-dvc/pull/1962) by [@mattseddon](https://github.com/mattseddon)
- Upgrade React to v18 [#1965](https://github.com/iterative/vscode-dvc/pull/1965) by [@mattseddon](https://github.com/mattseddon)

## [0.3.7] - 2022-06-30

### 🚀 New Features and Enhancements

- Star experiments in table [#1950](https://github.com/iterative/vscode-dvc/pull/1950) by [@wolmir](https://github.com/wolmir)

### 🐛 Bug Fixes

- Patch plots for branches containing path separators [#1949](https://github.com/iterative/vscode-dvc/pull/1949) by [@mattseddon](https://github.com/mattseddon)
- Show DVC roots in tracked tree when there is more than one DVC project in the workspace [#1951](https://github.com/iterative/vscode-dvc/pull/1951) by [@mattseddon](https://github.com/mattseddon)
- Show DVC root in tracked tree if there is only a single project nested inside of the workspace [#1952](https://github.com/iterative/vscode-dvc/pull/1952) by [@mattseddon](https://github.com/mattseddon)
- Show errors when interacting with the CLI from the experiments webview or tree [#1953](https://github.com/iterative/vscode-dvc/pull/1953) by [@mattseddon](https://github.com/mattseddon)

### 🔨 Maintenance

- Simplify import of icons [#1941](https://github.com/iterative/vscode-dvc/pull/1941) by [@sroy3](https://github.com/sroy3)
- Adding Redux to plots [#1832](https://github.com/iterative/vscode-dvc/pull/1832) by [@sroy3](https://github.com/sroy3)
- Remove clear data action [#1945](https://github.com/iterative/vscode-dvc/pull/1945) by [@sroy3](https://github.com/sroy3)
- Use Redux for drag and drop state [#1944](https://github.com/iterative/vscode-dvc/pull/1944) by [@sroy3](https://github.com/sroy3)

## [0.3.6] - 2022-06-20

### 🐛 Bug Fixes

- Fix DVC cwd for Windows [#1921](https://github.com/iterative/vscode-dvc/pull/1921) by [@mattseddon](https://github.com/mattseddon)

## [0.3.5] - 2022-06-17

### 🚀 New Features and Enhancements

- Show filtered counts whenever a filter is active [#1913](https://github.com/iterative/vscode-dvc/pull/1913) by [@mattseddon](https://github.com/mattseddon)
- Improve reset the workspace SCM command [#1915](https://github.com/iterative/vscode-dvc/pull/1915) by [@mattseddon](https://github.com/mattseddon)

### 🔨 Maintenance

- Fix (local) intermittent test failures [#1909](https://github.com/iterative/vscode-dvc/pull/1909) by [@mattseddon](https://github.com/mattseddon)
- Fix test timeout failures [#1914](https://github.com/iterative/vscode-dvc/pull/1914) by [@mattseddon](https://github.com/mattseddon)
- Remove getState from Repository [#1916](https://github.com/iterative/vscode-dvc/pull/1916) by [@mattseddon](https://github.com/mattseddon)

## [0.3.4] - 2022-06-16

### 🐛 Bug Fixes

- Revert "Improve reset the workspace SCM command" [#1910](https://github.com/iterative/vscode-dvc/pull/1910) by [@mattseddon](https://github.com/mattseddon)

## [0.3.3] - 2022-06-15

### 🚀 New Features and Enhancements

- Improve reset the workspace SCM command [#1900](https://github.com/iterative/vscode-dvc/pull/1900) by [@mattseddon](https://github.com/mattseddon)
- Add global sort and filter indicators to the Experiments Table webview [#1872](https://github.com/iterative/vscode-dvc/pull/1872) by [@rogermparent](https://github.com/rogermparent)

### 🐛 Bug Fixes

- Fix Windows repo file watcher using RelativePattern [#1905](https://github.com/iterative/vscode-dvc/pull/1905) by [@sroy3](https://github.com/sroy3)

### 🔨 Maintenance

- Upgrade @vscode/test-electron [#1901](https://github.com/iterative/vscode-dvc/pull/1901) by [@mattseddon](https://github.com/mattseddon)
- Remove unused SVGs [#1899](https://github.com/iterative/vscode-dvc/pull/1899) by [@mattseddon](https://github.com/mattseddon)

## [0.3.2] - 2022-06-14

### 🐛 Bug Fixes

- hotfix: VS Code badges in README [#1894](https://github.com/iterative/vscode-dvc/pull/1894) by [@jorgeorpinel](https://github.com/jorgeorpinel)

## [0.3.1] - 2022-06-14

### 🚀 New Features and Enhancements

- Decorate filtered experiments/checkpoints in the experiments tree [#1871](https://github.com/iterative/vscode-dvc/pull/1871) by [@mattseddon](https://github.com/mattseddon)
- Add (manual) refresh plots command to tree and palette [#1868](https://github.com/iterative/vscode-dvc/pull/1868) by [@mattseddon](https://github.com/mattseddon)
- Add shadow to table head [#1835](https://github.com/iterative/vscode-dvc/pull/1835) by [@rogermparent](https://github.com/rogermparent)
- Show table header context menu on left click (as well as right) [#1878](https://github.com/iterative/vscode-dvc/pull/1878) by [@mattseddon](https://github.com/mattseddon)
- Swap codicons for Reset and Run/Resume experiment [#1880](https://github.com/iterative/vscode-dvc/pull/1880) by [@mattseddon](https://github.com/mattseddon)
- Review and update the walkthrough [#1876](https://github.com/iterative/vscode-dvc/pull/1876) by [@shcheklein](https://github.com/shcheklein)

### 🐛 Bug Fixes

- Pass extra args to Reset and Run command [#1879](https://github.com/iterative/vscode-dvc/pull/1879) by [@mattseddon](https://github.com/mattseddon)

### 🔨 Maintenance

- Add banner (and alternative) to resources folder [#1877](https://github.com/iterative/vscode-dvc/pull/1877) by [@mattseddon](https://github.com/mattseddon)

## [0.3.0] - 2022-06-10

### 🚀 New Features and Enhancements

- Sort and Filter indicators for the Experiments Table [#1760](https://github.com/iterative/vscode-dvc/pull/1760) by [@wolmir](https://github.com/wolmir)
- Add filtered counts to Filter By tree [#1866](https://github.com/iterative/vscode-dvc/pull/1866) by [@mattseddon](https://github.com/mattseddon)
- Setup workspace config: change copy to be more explicit [#1865](https://github.com/iterative/vscode-dvc/pull/1865) by [@shcheklein](https://github.com/shcheklein)

### 🐛 Bug Fixes

- Use primary button color as accent color [#1859](https://github.com/iterative/vscode-dvc/pull/1859) by [@sroy3](https://github.com/sroy3)
- Explicitly set icons in DVC Tracked tree [#1869](https://github.com/iterative/vscode-dvc/pull/1869) by [@mattseddon](https://github.com/mattseddon)

### 🔨 Maintenance

- Remove preview tag from marketplace listing [#1860](https://github.com/iterative/vscode-dvc/pull/1860) by [@mattseddon](https://github.com/mattseddon)
- Add init to command palette when there is no DVC project in the workspace [#1861](https://github.com/iterative/vscode-dvc/pull/1861) by [@mattseddon](https://github.com/mattseddon)
- Upgrade dev dependencies and resolutions (security) [#1864](https://github.com/iterative/vscode-dvc/pull/1864) by [@mattseddon](https://github.com/mattseddon)
- Bump min required version of DVC to new release [#1867](https://github.com/iterative/vscode-dvc/pull/1867) by [@mattseddon](https://github.com/mattseddon)

## [0.2.25] - 2022-06-08

### 🐛 Bug Fixes

- Ensure file exists before trying to write JSON [#1856](https://github.com/iterative/vscode-dvc/pull/1856) by [@mattseddon](https://github.com/mattseddon)

### 🔨 Maintenance

- Remove plot section rename feature [#1855](https://github.com/iterative/vscode-dvc/pull/1855) by [@sroy3](https://github.com/sroy3)

## [0.2.24] - 2022-06-07

### 🚀 New Features and Enhancements

- Add cross-product uuid to all telemetry events [#1619](https://github.com/iterative/vscode-dvc/pull/1619) by [@mattseddon](https://github.com/mattseddon)
- Add tooltip with the meaning of each plot section [#1851](https://github.com/iterative/vscode-dvc/pull/1851) by [@sroy3](https://github.com/sroy3)

### 🐛 Bug Fixes

- Decouple ribbon from comparison table revisions [#1844](https://github.com/iterative/vscode-dvc/pull/1844) by [@mattseddon](https://github.com/mattseddon)
- Suppress context menus, hide run buttons and show stop button when an experiment is running [#1848](https://github.com/iterative/vscode-dvc/pull/1848) by [@mattseddon](https://github.com/mattseddon)
- Add dep prefix to experiments table tooltip [#1853](https://github.com/iterative/vscode-dvc/pull/1853) by [@mattseddon](https://github.com/mattseddon)

### 🔨 Maintenance

- Faster virtualization tests [#1846](https://github.com/iterative/vscode-dvc/pull/1846) by [@sroy3](https://github.com/sroy3)
- Add CODEOWNERS file [#1852](https://github.com/iterative/vscode-dvc/pull/1852) by [@sroy3](https://github.com/sroy3)

## [0.2.23] - 2022-06-07

### 🚀 New Features and Enhancements

- Use copy button component for the plots ribbon experiments [#1812](https://github.com/iterative/vscode-dvc/pull/1812) by [@sroy3](https://github.com/sroy3)
- Plots ribbon copy button to the right [#1831](https://github.com/iterative/vscode-dvc/pull/1831) by [@sroy3](https://github.com/sroy3)
- Add deps to experiment table and columns tree [#1830](https://github.com/iterative/vscode-dvc/pull/1830) by [@mattseddon](https://github.com/mattseddon)
- Update description shown above experiments tree [#1841](https://github.com/iterative/vscode-dvc/pull/1841) by [@mattseddon](https://github.com/mattseddon)

### 🐛 Bug Fixes

- Listen for extensions being installed/unistalled to avoid race condition when both this extension and ms-python.python are installed during startup [#1839](https://github.com/iterative/vscode-dvc/pull/1839) by [@mattseddon](https://github.com/mattseddon)
- Watch all dvc.locks for changes to plots [#1840](https://github.com/iterative/vscode-dvc/pull/1840) by [@mattseddon](https://github.com/mattseddon)
- Reduce the spacing between ribbon elements [#1842](https://github.com/iterative/vscode-dvc/pull/1842) by [@sroy3](https://github.com/sroy3)
- Fix the height of the buttons in the ribbon [#1843](https://github.com/iterative/vscode-dvc/pull/1843) by [@sroy3](https://github.com/sroy3)

### 🔨 Maintenance

- Add storybook design addon [#1828](https://github.com/iterative/vscode-dvc/pull/1828) by [@rogermparent](https://github.com/rogermparent)
- Add Storybook preview styles that allow for sticky header/column [#1834](https://github.com/iterative/vscode-dvc/pull/1834) by [@rogermparent](https://github.com/rogermparent)

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
