# Change Log

All notable changes to this project will be documented in this file.

## [0.5.25] - 2022-12-09

### 🔨 Maintenance

- Improve stability of e2e tests for new VS Code release [#2897](https://github.com/iterative/vscode-dvc/pull/2897) by [@mattseddon](https://github.com/mattseddon)
- Move from vsce to @vscode/vsce [#2895](https://github.com/iterative/vscode-dvc/pull/2895) by [@mattseddon](https://github.com/mattseddon)
- Update demo project [#2899](https://github.com/iterative/vscode-dvc/pull/2899) by [@mattseddon](https://github.com/mattseddon)
- Update demo project and latest tested CLI version (2.37.0) [#2908](https://github.com/iterative/vscode-dvc/pull/2908) by [@mattseddon](https://github.com/mattseddon)

## [0.5.24] - 2022-12-07

### 🚀 New Features and Enhancements

- Stabilise colors of running experiments [#2877](https://github.com/iterative/vscode-dvc/pull/2877) by [@mattseddon](https://github.com/mattseddon)
- Move workspace changes indicator from bullet onto text [#2890](https://github.com/iterative/vscode-dvc/pull/2890) by [@mattseddon](https://github.com/mattseddon)

### 🐛 Bug Fixes

- Update data when an event is fired for a parent directory (events grouped in Codespaces) [#2892](https://github.com/iterative/vscode-dvc/pull/2892) by [@mattseddon](https://github.com/mattseddon)
- Prevent toggle selection of checkpoint experiment running in the workspace [#2888](https://github.com/iterative/vscode-dvc/pull/2888) by [@mattseddon](https://github.com/mattseddon)

### 🔨 Maintenance

- Make the Get Started webview a class [#2874](https://github.com/iterative/vscode-dvc/pull/2874) by [@sroy3](https://github.com/sroy3)
- Add resolution for decode-uri-component [#2884](https://github.com/iterative/vscode-dvc/pull/2884) by [@julieg18](https://github.com/julieg18)
- Update demo project to lastest commit [#2891](https://github.com/iterative/vscode-dvc/pull/2891) by [@mattseddon](https://github.com/mattseddon)
- Remove running checkpoint experiment workspace race condition code from plots [#2882](https://github.com/iterative/vscode-dvc/pull/2882) by [@mattseddon](https://github.com/mattseddon)
- Extract workspace constant [#2889](https://github.com/iterative/vscode-dvc/pull/2889) by [@mattseddon](https://github.com/mattseddon)

## [0.5.23] - 2022-12-05

### 🚀 New Features and Enhancements

- Improve table header DnD [#2876](https://github.com/iterative/vscode-dvc/pull/2876) by [@shcheklein](https://github.com/shcheklein)

### 🔨 Maintenance

- Watch workspace and filter results before calling for data updates [#2872](https://github.com/iterative/vscode-dvc/pull/2872) by [@mattseddon](https://github.com/mattseddon)

## [0.5.22] - 2022-12-01

### 🚀 New Features and Enhancements

- Add webview for when dvc is not available or not initialized [#2861](https://github.com/iterative/vscode-dvc/pull/2861) by [@sroy3](https://github.com/sroy3)
- Add loading state for sections and images to plots webview [#2865](https://github.com/iterative/vscode-dvc/pull/2865) by [@mattseddon](https://github.com/mattseddon)

### 🔨 Maintenance

- Update demo project and latest tested CLI version (2.36.0) [#2869](https://github.com/iterative/vscode-dvc/pull/2869) by [@mattseddon](https://github.com/mattseddon)

## [0.5.21] - 2022-12-01

### 🚀 New Features and Enhancements

- Add progress ring to plots ribbon while data is loading [#2841](https://github.com/iterative/vscode-dvc/pull/2841) by [@mattseddon](https://github.com/mattseddon)
- Open plots in split view when request sent from table [#2864](https://github.com/iterative/vscode-dvc/pull/2864) by [@mattseddon](https://github.com/mattseddon)

### 🔨 Maintenance

- Separate comparison table and plot ribbon revision orders [#2859](https://github.com/iterative/vscode-dvc/pull/2859) by [@mattseddon](https://github.com/mattseddon)
- Do not snapshot story with progress rings [#2862](https://github.com/iterative/vscode-dvc/pull/2862) by [@mattseddon](https://github.com/mattseddon)
- Match VS Code version of @types/node [#2863](https://github.com/iterative/vscode-dvc/pull/2863) by [@mattseddon](https://github.com/mattseddon)

## [0.5.20] - 2022-11-29

### 🐛 Bug Fixes

- Do not process CLI errors thrown by plots diff [#2852](https://github.com/iterative/vscode-dvc/pull/2852) by [@mattseddon](https://github.com/mattseddon)
- Fix plots file watchers (diff output key is not always a file) [#2854](https://github.com/iterative/vscode-dvc/pull/2854) by [@mattseddon](https://github.com/mattseddon)

## [0.5.19] - 2022-11-29

### 🐛 Bug Fixes

- Fix aspect ratio of multi view plots [#2833](https://github.com/iterative/vscode-dvc/pull/2833) by [@sroy3](https://github.com/sroy3)
- Fix the number of available revisions for multi view plots [#2836](https://github.com/iterative/vscode-dvc/pull/2836) by [@sroy3](https://github.com/sroy3)

### 🔨 Maintenance

- Reduce renovate noise [#2826](https://github.com/iterative/vscode-dvc/pull/2826) by [@mattseddon](https://github.com/mattseddon)
- Delay creation of plots to remove optional logic [#2832](https://github.com/iterative/vscode-dvc/pull/2832) by [@mattseddon](https://github.com/mattseddon)
- Update multi source test fixture to contain the expected revisions (branch revision not name) [#2837](https://github.com/iterative/vscode-dvc/pull/2837) by [@mattseddon](https://github.com/mattseddon)
- Remove auto-merge component from renovate config (does not work) [#2838](https://github.com/iterative/vscode-dvc/pull/2838) by [@mattseddon](https://github.com/mattseddon)

## [0.5.18] - 2022-11-24

### 🚀 New Features and Enhancements

- Resizing plots horizontally [#2747](https://github.com/iterative/vscode-dvc/pull/2747) by [@sroy3](https://github.com/sroy3)

### 🔨 Maintenance

- Update demo project and latest tested CLI version (2.34.3) [#2819](https://github.com/iterative/vscode-dvc/pull/2819) by [@mattseddon](https://github.com/mattseddon)
- Update demo project and latest tested CLI version (2.35.1) [#2824](https://github.com/iterative/vscode-dvc/pull/2824) by [@mattseddon](https://github.com/mattseddon)
- Add resolution for fastify [#2823](https://github.com/iterative/vscode-dvc/pull/2823) by [@mattseddon](https://github.com/mattseddon)

## [0.5.17] - 2022-11-23

### 🚀 New Features and Enhancements

- Match the way that undefined/numeric experiment column values are shown in the table in tooltips and quick picks [#2813](https://github.com/iterative/vscode-dvc/pull/2813) by [@mattseddon](https://github.com/mattseddon)

### 🔨 Maintenance

- Update demo project to be on latest commit [#2799](https://github.com/iterative/vscode-dvc/pull/2799) by [@mattseddon](https://github.com/mattseddon)
- Fix scheduled CLI output test by updating expected demo project output [#2818](https://github.com/iterative/vscode-dvc/pull/2818) by [@mattseddon](https://github.com/mattseddon)
- Match open webviews welcome view button titles with command palette actions [#2820](https://github.com/iterative/vscode-dvc/pull/2820) by [@mattseddon](https://github.com/mattseddon)

## [0.5.16] - 2022-11-22

### 🚀 New Features and Enhancements

- Update walkthrough images [#2802](https://github.com/iterative/vscode-dvc/pull/2802) by [@mattseddon](https://github.com/mattseddon)

### 🐛 Bug Fixes

- Patch experiment with checkpoints not having a name [#2805](https://github.com/iterative/vscode-dvc/pull/2805) by [@mattseddon](https://github.com/mattseddon)
- Stabilize plot paths [#2811](https://github.com/iterative/vscode-dvc/pull/2811) by [@mattseddon](https://github.com/mattseddon)

### 🔨 Maintenance

- Fix webview test warnings [#2806](https://github.com/iterative/vscode-dvc/pull/2806) by [@mattseddon](https://github.com/mattseddon)

## [0.5.15] - 2022-11-18

### 🐛 Bug Fixes

- Check availability and compatibility on DVC projects in multi root workspaces [#2795](https://github.com/iterative/vscode-dvc/pull/2795) by [@sroy3](https://github.com/sroy3)

## [0.5.14] - 2022-11-18

### 🐛 Bug Fixes

- Load projects inside multi-root workspaces [#2791](https://github.com/iterative/vscode-dvc/pull/2791) by [@sroy3](https://github.com/sroy3)

## [0.5.13] - 2022-11-17

### 🐛 Bug Fixes

- Fix map on undefined is path doesn't exist in rev [#2785](https://github.com/iterative/vscode-dvc/pull/2785) by [@shcheklein](https://github.com/shcheklein)

### 🔨 Maintenance

- Add resolution for loader-utils [#2783](https://github.com/iterative/vscode-dvc/pull/2783) by [@mattseddon](https://github.com/mattseddon)

## [0.5.12] - 2022-11-16

### 🚀 New Features and Enhancements

- Highlight row when context menu is active [#2763](https://github.com/iterative/vscode-dvc/pull/2763) by [@shcheklein](https://github.com/shcheklein)
- Make plots ribbon sticky on scroll [#2759](https://github.com/iterative/vscode-dvc/pull/2759) by [@shcheklein](https://github.com/shcheklein)
- Add "views" section to sidebar [#2760](https://github.com/iterative/vscode-dvc/pull/2760) by [@julieg18](https://github.com/julieg18)

### 🔨 Maintenance

- Update scheduled CLI test to match expected demo project output [#2753](https://github.com/iterative/vscode-dvc/pull/2753) by [@mattseddon](https://github.com/mattseddon)

## [0.5.11] - 2022-11-10

### 🚀 New Features and Enhancements

- Update the DVC: Get Started / Plots Dashboard [#2573](https://github.com/iterative/vscode-dvc/pull/2573) by [@maxagin](https://github.com/maxagin)

### 🐛 Bug Fixes

- Fix exp tree tooltips and quick pick selection ignoring columns with falsy values [#2745](https://github.com/iterative/vscode-dvc/pull/2745) by [@julieg18](https://github.com/julieg18)
- Check hidden status when getting first three exp table column order [#2738](https://github.com/iterative/vscode-dvc/pull/2738) by [@julieg18](https://github.com/julieg18)
- Use JSON5 library to parse non-standard JSON [#2750](https://github.com/iterative/vscode-dvc/pull/2750) by [@mattseddon](https://github.com/mattseddon)

### 🔨 Maintenance

- Fix unit tests for non en-US timezones [#2748](https://github.com/iterative/vscode-dvc/pull/2748) by [@mattseddon](https://github.com/mattseddon)

## [0.5.10] - 2022-11-02

### 🚀 New Features and Enhancements

- Add tooltips to experiments tree [#2706](https://github.com/iterative/vscode-dvc/pull/2706) by [@julieg18](https://github.com/julieg18)

### 🔨 Maintenance

- Update demo project to be on latest commit [#2720](https://github.com/iterative/vscode-dvc/pull/2720) by [@mattseddon](https://github.com/mattseddon)

## [0.5.9] - 2022-11-02

### 🚀 New Features and Enhancements

- Improve exp selection quick pick details [#2711](https://github.com/iterative/vscode-dvc/pull/2711) by [@julieg18](https://github.com/julieg18)

### 🐛 Bug Fixes

- Fixes infinite loop in plots when workspace only is selected [#2715](https://github.com/iterative/vscode-dvc/pull/2715) by [@shcheklein](https://github.com/shcheklein)

## [0.5.8] - 2022-10-31

### 🚀 New Features and Enhancements

- Add experiment details when selecting exps for plots [#2670](https://github.com/iterative/vscode-dvc/pull/2670) by [@julieg18](https://github.com/julieg18)
- Changing images with code to code snippets [#2588](https://github.com/iterative/vscode-dvc/pull/2588) by [@maxagin](https://github.com/maxagin)

### 🐛 Bug Fixes

- Fix missing exp selection quick pick details on inital extension render [#2694](https://github.com/iterative/vscode-dvc/pull/2694) by [@julieg18](https://github.com/julieg18)
- Fix scheduled CLI output test by moving TEMP_DIR outside of Git repository [#2697](https://github.com/iterative/vscode-dvc/pull/2697) by [@mattseddon](https://github.com/mattseddon)

### 🔨 Maintenance

- bump latest DVC tested version to 2.31.0 [#2677](https://github.com/iterative/vscode-dvc/pull/2677) by [@shcheklein](https://github.com/shcheklein)

## [0.5.7] - 2022-10-22

### 🐛 Bug Fixes

- Set CLI as available for project initialization purposes [#2661](https://github.com/iterative/vscode-dvc/pull/2661) by [@mattseddon](https://github.com/mattseddon)

## [0.5.6] - 2022-10-21

### 🐛 Bug Fixes

- Do not toggle plot section on tooltip click [#2642](https://github.com/iterative/vscode-dvc/pull/2642) by [@sroy3](https://github.com/sroy3)
- Update packages to fix d3-color vulnerability [#2650](https://github.com/iterative/vscode-dvc/pull/2650) by [@sroy3](https://github.com/sroy3)
- Update packages to fix minimatch vulnerability [#2651](https://github.com/iterative/vscode-dvc/pull/2651) by [@sroy3](https://github.com/sroy3)
- Update packages to fix terser vulnerability [#2652](https://github.com/iterative/vscode-dvc/pull/2652) by [@sroy3](https://github.com/sroy3)

### 🔨 Maintenance

- Do not run build twice in CI [#2634](https://github.com/iterative/vscode-dvc/pull/2634) by [@mattseddon](https://github.com/mattseddon)
- Add revisions to scheduled plots diff demo repo test (required for submodule to behave like a git repo) [#2639](https://github.com/iterative/vscode-dvc/pull/2639) by [@mattseddon](https://github.com/mattseddon)
- Rearrange exp show fixtures [#2635](https://github.com/iterative/vscode-dvc/pull/2635) by [@mattseddon](https://github.com/mattseddon)
- Add survival exp show test fixture [#2638](https://github.com/iterative/vscode-dvc/pull/2638) by [@mattseddon](https://github.com/mattseddon)
- Remove undici yarn resolution [#2654](https://github.com/iterative/vscode-dvc/pull/2654) by [@sroy3](https://github.com/sroy3)

## [0.5.5] - 2022-10-20

### 🚀 New Features and Enhancements

- Update table drag and drop implementation  [#2566](https://github.com/iterative/vscode-dvc/pull/2566) by [@julieg18](https://github.com/julieg18)
- Plots improve section tooltips copy and style [#2622](https://github.com/iterative/vscode-dvc/pull/2622) by [@shcheklein](https://github.com/shcheklein)

### 🐛 Bug Fixes

- Do not toggle plot section when clicking a link [#2632](https://github.com/iterative/vscode-dvc/pull/2632) by [@sroy3](https://github.com/sroy3)
- Only patch workspace only calls to plots diff [#2629](https://github.com/iterative/vscode-dvc/pull/2629) by [@mattseddon](https://github.com/mattseddon)

### 🔨 Maintenance

- Add util for identifying ValueTree type [#2619](https://github.com/iterative/vscode-dvc/pull/2619) by [@mattseddon](https://github.com/mattseddon)
- Switch CI test coverage to use stable build [#2623](https://github.com/iterative/vscode-dvc/pull/2623) by [@mattseddon](https://github.com/mattseddon)
- Upload vsix as part of publish action [#2615](https://github.com/iterative/vscode-dvc/pull/2615) by [@mattseddon](https://github.com/mattseddon)
- Improve max table depth test [#2621](https://github.com/iterative/vscode-dvc/pull/2621) by [@julieg18](https://github.com/julieg18)
- Add webpack dummy build as a lint step [#2626](https://github.com/iterative/vscode-dvc/pull/2626) by [@wolmir](https://github.com/wolmir)
- Fix integration test suite after hook [#2628](https://github.com/iterative/vscode-dvc/pull/2628) by [@mattseddon](https://github.com/mattseddon)
- Make the plot sizes use numbers underneath [#2563](https://github.com/iterative/vscode-dvc/pull/2563) by [@sroy3](https://github.com/sroy3)
- Demo project as a submodule [#2624](https://github.com/iterative/vscode-dvc/pull/2624) by [@sroy3](https://github.com/sroy3)
- Split standardize path into two functions [#2627](https://github.com/iterative/vscode-dvc/pull/2627) by [@mattseddon](https://github.com/mattseddon)

## [0.5.4] - 2022-10-18

### 🐛 Bug Fixes

- Account for null being an object in workspace change data collection [#2617](https://github.com/iterative/vscode-dvc/pull/2617) by [@mattseddon](https://github.com/mattseddon)

## [0.5.3] - 2022-10-17

### 🚀 New Features and Enhancements

- Add actions to experiment cell hint tooltips [#2606](https://github.com/iterative/vscode-dvc/pull/2606) by [@mattseddon](https://github.com/mattseddon)
- Update experiment table icons to use --vscode-descriptionForeground and use --vscode-editorLightBulb-foreground for selected stars [#2604](https://github.com/iterative/vscode-dvc/pull/2604) by [@mattseddon](https://github.com/mattseddon)

### 🐛 Bug Fixes

- Fix experiment table changes collection bug [#2598](https://github.com/iterative/vscode-dvc/pull/2598) by [@mattseddon](https://github.com/mattseddon)

### 🔨 Maintenance

- Use stable version of VS Code for e2e tests (again) [#2611](https://github.com/iterative/vscode-dvc/pull/2611) by [@mattseddon](https://github.com/mattseddon)
- Standardize dvc root paths as they come into the system [#2597](https://github.com/iterative/vscode-dvc/pull/2597) by [@mattseddon](https://github.com/mattseddon)

## [0.5.2] - 2022-10-16

### 🚀 New Features and Enhancements

- Use error foreground for status bar item color if CLI unavailable [#2587](https://github.com/iterative/vscode-dvc/pull/2587) by [@mattseddon](https://github.com/mattseddon)
- Change experiments table circle to radio button [#2553](https://github.com/iterative/vscode-dvc/pull/2553) by [@mattseddon](https://github.com/mattseddon)
- Add hints into experiment table row action tooltips [#2567](https://github.com/iterative/vscode-dvc/pull/2567) by [@mattseddon](https://github.com/mattseddon)

### 🐛 Bug Fixes

- Revert moving experiment names to right in table's experiment column (maintain heirarchy) [#2594](https://github.com/iterative/vscode-dvc/pull/2594) by [@mattseddon](https://github.com/mattseddon)
- Follow directions in the VS Code API docs for relative paths [#2590](https://github.com/iterative/vscode-dvc/pull/2590) by [@mattseddon](https://github.com/mattseddon)

### 🔨 Maintenance

- Fix failing CI vscode test [#2580](https://github.com/iterative/vscode-dvc/pull/2580) by [@julieg18](https://github.com/julieg18)
- Update CODEOWNERS [#2595](https://github.com/iterative/vscode-dvc/pull/2595) by [@mattseddon](https://github.com/mattseddon)

## [0.5.1] - 2022-10-12

### 🐛 Bug Fixes

- Account for dvc yaml potentially not having a train stage [#2571](https://github.com/iterative/vscode-dvc/pull/2571) by [@mattseddon](https://github.com/mattseddon)

## [0.5.0] - 2022-10-11

### 🚀 New Features and Enhancements

- Display failed experiments [#2535](https://github.com/iterative/vscode-dvc/pull/2535) by [@mattseddon](https://github.com/mattseddon)
- Improve max table depth feature [#2538](https://github.com/iterative/vscode-dvc/pull/2538) by [@julieg18](https://github.com/julieg18)

### 🔨 Maintenance

- Bump min DVC version to 2.30.0 (Use status from exp show) [#2521](https://github.com/iterative/vscode-dvc/pull/2521) by [@mattseddon](https://github.com/mattseddon)
- Remove stale developer roadmap from README [#2561](https://github.com/iterative/vscode-dvc/pull/2561) by [@mattseddon](https://github.com/mattseddon)

## [0.4.13] - 2022-10-10

### 🐛 Bug Fixes

- Fix UX of extension using fallback global CLI when Python extension is active [#2544](https://github.com/iterative/vscode-dvc/pull/2544) by [@mattseddon](https://github.com/mattseddon)

### 🔨 Maintenance

- Add test for setting table header depth [#2525](https://github.com/iterative/vscode-dvc/pull/2525) by [@julieg18](https://github.com/julieg18)
- Consolidate version checking into CLI discovery file [#2552](https://github.com/iterative/vscode-dvc/pull/2552) by [@mattseddon](https://github.com/mattseddon)

## [0.4.12] - 2022-10-06

### 🔨 Maintenance

- Bump min tested version of DVC to 2.29.0 [#2536](https://github.com/iterative/vscode-dvc/pull/2536) by [@mattseddon](https://github.com/mattseddon)

## [0.4.11] - 2022-10-05

### 🚀 New Features and Enhancements

- Allow experiment table column depth below 3 [#2482](https://github.com/iterative/vscode-dvc/pull/2482) by [@julieg18](https://github.com/julieg18)
- Update table header context menu  [#2517](https://github.com/iterative/vscode-dvc/pull/2517) by [@julieg18](https://github.com/julieg18)

### 🐛 Bug Fixes

- Fix comparison table row path chevron being cut [#2533](https://github.com/iterative/vscode-dvc/pull/2533) by [@sroy3](https://github.com/sroy3)
- Render flexible confusion matrices as expected [#2523](https://github.com/iterative/vscode-dvc/pull/2523) by [@mattseddon](https://github.com/mattseddon)
- Fix size of flexible confusion matrix [#2531](https://github.com/iterative/vscode-dvc/pull/2531) by [@mattseddon](https://github.com/mattseddon)

### 🔨 Maintenance

- Move types from reader into new contract file [#2520](https://github.com/iterative/vscode-dvc/pull/2520) by [@mattseddon](https://github.com/mattseddon)
- Switch e2e tests back to insiders build [#2526](https://github.com/iterative/vscode-dvc/pull/2526) by [@mattseddon](https://github.com/mattseddon)

## [0.4.10] - 2022-09-29

### 🐛 Bug Fixes

- Turn off language server again [#2505](https://github.com/iterative/vscode-dvc/pull/2505) by [@mattseddon](https://github.com/mattseddon)

### 🔨 Maintenance

- Use a variable for tooltip delays [#2500](https://github.com/iterative/vscode-dvc/pull/2500) by [@sroy3](https://github.com/sroy3)

## [0.4.9] - 2022-09-29

### 🚀 New Features and Enhancements

- Render flexible plots [#2403](https://github.com/iterative/vscode-dvc/pull/2403) by [@mattseddon](https://github.com/mattseddon)
- Add flexible plots legends to plots tree [#2452](https://github.com/iterative/vscode-dvc/pull/2452) by [@mattseddon](https://github.com/mattseddon)

### 🐛 Bug Fixes

- Cleanup after drag and drop [#2481](https://github.com/iterative/vscode-dvc/pull/2481) by [@sroy3](https://github.com/sroy3)
- Fix comparison table row copy button [#2489](https://github.com/iterative/vscode-dvc/pull/2489) by [@sroy3](https://github.com/sroy3)
- Remove erroneous shape from vertical on hover line when shape dimension is added [#2486](https://github.com/iterative/vscode-dvc/pull/2486) by [@mattseddon](https://github.com/mattseddon)
- Add tooltip to comparison table row path [#2490](https://github.com/iterative/vscode-dvc/pull/2490) by [@sroy3](https://github.com/sroy3)
- Make the comparison table row path take available space [#2491](https://github.com/iterative/vscode-dvc/pull/2491) by [@sroy3](https://github.com/sroy3)

### 🔨 Maintenance

- Do not walk unnecessary keys in truncate titles [#2487](https://github.com/iterative/vscode-dvc/pull/2487) by [@mattseddon](https://github.com/mattseddon)
- Bump min tested version of DVC to 2.28.0 [#2488](https://github.com/iterative/vscode-dvc/pull/2488) by [@mattseddon](https://github.com/mattseddon)
- Stabilize e2e tests [#2493](https://github.com/iterative/vscode-dvc/pull/2493) by [@mattseddon](https://github.com/mattseddon)

## [0.4.8] - 2022-09-26

### 🚀 New Features and Enhancements

- Send initial YAML and JSON files right after language client starts (2/3) [#2445](https://github.com/iterative/vscode-dvc/pull/2445) by [@wolmir](https://github.com/wolmir)

### 🐛 Bug Fixes

- Add webpack to languageServer [#2469](https://github.com/iterative/vscode-dvc/pull/2469) by [@wolmir](https://github.com/wolmir)
- Check for global install of CLI after python install not found [#2462](https://github.com/iterative/vscode-dvc/pull/2462) by [@mattseddon](https://github.com/mattseddon)
- Account for exp show returning extra data in CLI output tests [#2463](https://github.com/iterative/vscode-dvc/pull/2463) by [@mattseddon](https://github.com/mattseddon)

### 🔨 Maintenance

- Remove coverage for prettier [#2470](https://github.com/iterative/vscode-dvc/pull/2470) by [@sroy3](https://github.com/sroy3)
- Add tests for column depth configuration [#2471](https://github.com/iterative/vscode-dvc/pull/2471) by [@julieg18](https://github.com/julieg18)

## [0.4.7] - 2022-09-25

### 🚀 New Features and Enhancements

- Add config for updating max amount of table head layers [#2436](https://github.com/iterative/vscode-dvc/pull/2436) by [@julieg18](https://github.com/julieg18)

### 🐛 Bug Fixes

- Turn off language server until it is fixed [#2460](https://github.com/iterative/vscode-dvc/pull/2460) by [@mattseddon](https://github.com/mattseddon)

### 🔨 Maintenance

- Move remaining data update watchers to RelativePatterns [#2451](https://github.com/iterative/vscode-dvc/pull/2451) by [@mattseddon](https://github.com/mattseddon)

## [0.4.6] - 2022-09-23

### 🚀 New Features and Enhancements

- Language Server with Definitions Only [#2408](https://github.com/iterative/vscode-dvc/pull/2408) by [@wolmir](https://github.com/wolmir)
- Multiple commits in the experiments table [#2392](https://github.com/iterative/vscode-dvc/pull/2392) by [@sroy3](https://github.com/sroy3)

### 🐛 Bug Fixes

- Update `view/title` commands to account for VS Code change [#2439](https://github.com/iterative/vscode-dvc/pull/2439) by [@mattseddon](https://github.com/mattseddon)

## [0.4.5] - 2022-09-21

### 🔨 Maintenance

- Bump min tested version of DVC to 2.26.2 [#2428](https://github.com/iterative/vscode-dvc/pull/2428) by [@mattseddon](https://github.com/mattseddon)
- Bump min tested version of DVC to 2.27.2 [#2440](https://github.com/iterative/vscode-dvc/pull/2440) by [@mattseddon](https://github.com/mattseddon)

## [0.4.4] - 2022-09-18

### 🚀 New Features and Enhancements

- Remove extra background color from the table view [#2425](https://github.com/iterative/vscode-dvc/pull/2425) by [@shcheklein](https://github.com/shcheklein)

### 🐛 Bug Fixes

- Update table hints [#2413](https://github.com/iterative/vscode-dvc/pull/2413) by [@julieg18](https://github.com/julieg18)
- Exclude queued experiments from select experiments for plots quick pick [#2410](https://github.com/iterative/vscode-dvc/pull/2410) by [@mattseddon](https://github.com/mattseddon)

### 🔨 Maintenance

- Move vega title truncation into the extension [#2396](https://github.com/iterative/vscode-dvc/pull/2396) by [@mattseddon](https://github.com/mattseddon)
- Use webpack's development mode to build webview for testing [#2404](https://github.com/iterative/vscode-dvc/pull/2404) by [@mattseddon](https://github.com/mattseddon)
- Remove unused SVGs [#2409](https://github.com/iterative/vscode-dvc/pull/2409) by [@mattseddon](https://github.com/mattseddon)

## [0.4.3] - 2022-09-13

### 🚀 New Features and Enhancements

- Move experiment table context menus to right-start [#2377](https://github.com/iterative/vscode-dvc/pull/2377) by [@mattseddon](https://github.com/mattseddon)
- Update cell hint styles and context menu position [#2384](https://github.com/iterative/vscode-dvc/pull/2384) by [@julieg18](https://github.com/julieg18)
- Add plotting actions to experiments table context menu [#2388](https://github.com/iterative/vscode-dvc/pull/2388) by [@mattseddon](https://github.com/mattseddon)
- Update selected row foreground [#2391](https://github.com/iterative/vscode-dvc/pull/2391) by [@julieg18](https://github.com/julieg18)

### 🐛 Bug Fixes

- Ensure table indicators do not overlap with experiment column title [#2376](https://github.com/iterative/vscode-dvc/pull/2376) by [@mattseddon](https://github.com/mattseddon)
- Fix overflowing comparison table texts [#2381](https://github.com/iterative/vscode-dvc/pull/2381) by [@sroy3](https://github.com/sroy3)

## [0.4.2] - 2022-09-12

### 🚀 New Features and Enhancements

- Update row styles [#2351](https://github.com/iterative/vscode-dvc/pull/2351) by [@julieg18](https://github.com/julieg18)
- Update table indicators and chevrons/stars styles [#2367](https://github.com/iterative/vscode-dvc/pull/2367) by [@julieg18](https://github.com/julieg18)

### 🐛 Bug Fixes

- Ensure welcome screen is not shown when only one column is provided [#2363](https://github.com/iterative/vscode-dvc/pull/2363) by [@mattseddon](https://github.com/mattseddon)
- Fix zoomed in plot overflow [#2366](https://github.com/iterative/vscode-dvc/pull/2366) by [@sroy3](https://github.com/sroy3)
- Truncate all long titles inside of plots [#2365](https://github.com/iterative/vscode-dvc/pull/2365) by [@sroy3](https://github.com/sroy3)

## [0.4.1] - 2022-09-09

### 🚀 New Features and Enhancements

- Match tooltip styles to VS Code [#2353](https://github.com/iterative/vscode-dvc/pull/2353) by [@mattseddon](https://github.com/mattseddon)

### 🐛 Bug Fixes

- Make first cell text contents selectable [#2341](https://github.com/iterative/vscode-dvc/pull/2341) by [@julieg18](https://github.com/julieg18)
- Truncate long plot titles [#2344](https://github.com/iterative/vscode-dvc/pull/2344) by [@sroy3](https://github.com/sroy3)
- Keep cursor on `col-resize` on table column resize [#2356](https://github.com/iterative/vscode-dvc/pull/2356) by [@julieg18](https://github.com/julieg18)
- Always show context menu on right click [#2355](https://github.com/iterative/vscode-dvc/pull/2355) by [@mattseddon](https://github.com/mattseddon)
- Dismiss tooltip/context menus on Escape [#2354](https://github.com/iterative/vscode-dvc/pull/2354) by [@mattseddon](https://github.com/mattseddon)

### 🔨 Maintenance

- Consolidate use of decoration providers with tree views [#2330](https://github.com/iterative/vscode-dvc/pull/2330) by [@mattseddon](https://github.com/mattseddon)
- Move DVC Tracked tree into repository directory structure [#2331](https://github.com/iterative/vscode-dvc/pull/2331) by [@mattseddon](https://github.com/mattseddon)
- Group Source Control Management files [#2332](https://github.com/iterative/vscode-dvc/pull/2332) by [@mattseddon](https://github.com/mattseddon)
- Switch from jest from ts-jest to swc [#2333](https://github.com/iterative/vscode-dvc/pull/2333) by [@mattseddon](https://github.com/mattseddon)
- Remove extra sending of data to webview on change of star selection [#2346](https://github.com/iterative/vscode-dvc/pull/2346) by [@mattseddon](https://github.com/mattseddon)

## [0.4.0] - 2022-09-04

### 🚀 New Features and Enhancements

- Use new data status command [#2091](https://github.com/iterative/vscode-dvc/pull/2091) by [@mattseddon](https://github.com/mattseddon)
- Give option to sort or filter by Created timestamp [#2293](https://github.com/iterative/vscode-dvc/pull/2293) by [@mattseddon](https://github.com/mattseddon)
- Improve table column resizing styles [#2305](https://github.com/iterative/vscode-dvc/pull/2305) by [@julieg18](https://github.com/julieg18)
- Refine data status consumption [#2151](https://github.com/iterative/vscode-dvc/pull/2151) by [@mattseddon](https://github.com/mattseddon)
- Consume unknown from data status [#2267](https://github.com/iterative/vscode-dvc/pull/2267) by [@mattseddon](https://github.com/mattseddon)
- Remove retries from reader (all commands now lockless) [#2300](https://github.com/iterative/vscode-dvc/pull/2300) by [@mattseddon](https://github.com/mattseddon)
- Show data status errors in DVC Tracked tree [#2301](https://github.com/iterative/vscode-dvc/pull/2301) by [@mattseddon](https://github.com/mattseddon)

### 🐛 Bug Fixes

- Account for exp show returning an empty object [#2280](https://github.com/iterative/vscode-dvc/pull/2280) by [@mattseddon](https://github.com/mattseddon)
- Fix drag leave of top and bottom sections [#2320](https://github.com/iterative/vscode-dvc/pull/2320) by [@sroy3](https://github.com/sroy3)
- Fix bugs in table styles [#2316](https://github.com/iterative/vscode-dvc/pull/2316) by [@julieg18](https://github.com/julieg18)

### 🔨 Maintenance

- Bump min version of DVC to 2.21.0 (data status) [#2266](https://github.com/iterative/vscode-dvc/pull/2266) by [@mattseddon](https://github.com/mattseddon)
- Bump min version of DVC to 2.23.0 (--with-dirs removed from data status) [#2299](https://github.com/iterative/vscode-dvc/pull/2299) by [@mattseddon](https://github.com/mattseddon)
- Bump min version of DVC to 2.24.0 (patch windows paths in data status) [#2314](https://github.com/iterative/vscode-dvc/pull/2314) by [@mattseddon](https://github.com/mattseddon)

## [0.3.26] - 2022-08-31

### 🚀 New Features and Enhancements

- Comparison table rows drag and drop [#2271](https://github.com/iterative/vscode-dvc/pull/2271) by [@sroy3](https://github.com/sroy3)

### 🐛 Bug Fixes

- Only drag rows not single imagges [#2304](https://github.com/iterative/vscode-dvc/pull/2304) by [@sroy3](https://github.com/sroy3)

## [0.3.25] - 2022-08-30

### 🚀 New Features and Enhancements

- Rename "Timestamp" column label to "Created" [#2269](https://github.com/iterative/vscode-dvc/pull/2269) by [@julieg18](https://github.com/julieg18)
- Review when plot sections should collapse [#2285](https://github.com/iterative/vscode-dvc/pull/2285) by [@sroy3](https://github.com/sroy3)
- Improve table styles [#2289](https://github.com/iterative/vscode-dvc/pull/2289) by [@julieg18](https://github.com/julieg18)

### 🐛 Bug Fixes

- Show empty state when final comparison plot is de-selected [#2290](https://github.com/iterative/vscode-dvc/pull/2290) by [@mattseddon](https://github.com/mattseddon)
- Make the first cells of selected rows sticky [#2294](https://github.com/iterative/vscode-dvc/pull/2294) by [@julieg18](https://github.com/julieg18)

### 🔨 Maintenance

- Make column `parentPath` optional [#2272](https://github.com/iterative/vscode-dvc/pull/2272) by [@julieg18](https://github.com/julieg18)
- Remove leftover file for section renaming [#2284](https://github.com/iterative/vscode-dvc/pull/2284) by [@sroy3](https://github.com/sroy3)
- Dispatch publish extension action on merge of update version and CHANGELOG for release PR [#2292](https://github.com/iterative/vscode-dvc/pull/2292) by [@mattseddon](https://github.com/mattseddon)

## [0.3.24] - 2022-08-26

### 🚀 New Features and Enhancements

- Make timestamp column hideable and draggable [#2239](https://github.com/iterative/vscode-dvc/pull/2239) by [@julieg18](https://github.com/julieg18)

### 🔨 Maintenance

- Split up `Cell.tsx` and `Row.tsx` files [#2264](https://github.com/iterative/vscode-dvc/pull/2264) by [@julieg18](https://github.com/julieg18)

## [0.3.23] - 2022-08-25

### 🚀 New Features and Enhancements

- Add commit and share experiment command to the palette [#2259](https://github.com/iterative/vscode-dvc/pull/2259) by [@mattseddon](https://github.com/mattseddon)

### 🐛 Bug Fixes

- Display the smoothness slider correctly [#2257](https://github.com/iterative/vscode-dvc/pull/2257) by [@sroy3](https://github.com/sroy3)

### 🔨 Maintenance

- Bump min tested DVC version to 2.20.1 [#2261](https://github.com/iterative/vscode-dvc/pull/2261) by [@mattseddon](https://github.com/mattseddon)

## [0.3.22] - 2022-08-24

### 🚀 New Features and Enhancements

- Add Git cli calls into output channel [#2225](https://github.com/iterative/vscode-dvc/pull/2225) by [@mattseddon](https://github.com/mattseddon)
- Add commit and share experiment to context menus [#2237](https://github.com/iterative/vscode-dvc/pull/2237) by [@mattseddon](https://github.com/mattseddon)
- Switch experiment sharing to progress api [#2245](https://github.com/iterative/vscode-dvc/pull/2245) by [@mattseddon](https://github.com/mattseddon)

### 🐛 Bug Fixes

- Show spinner in the status bar when extension is running Git [#2249](https://github.com/iterative/vscode-dvc/pull/2249) by [@mattseddon](https://github.com/mattseddon)

### 🔨 Maintenance

- Replace vary with modify in variable names [#2227](https://github.com/iterative/vscode-dvc/pull/2227) by [@mattseddon](https://github.com/mattseddon)
- Remove experiments from star/unstar text in experiments table [#2228](https://github.com/iterative/vscode-dvc/pull/2228) by [@mattseddon](https://github.com/mattseddon)
- Rename DVC CLI files and classes [#2226](https://github.com/iterative/vscode-dvc/pull/2226) by [@mattseddon](https://github.com/mattseddon)
- Add test utils for dealing with private class methods [#2233](https://github.com/iterative/vscode-dvc/pull/2233) by [@mattseddon](https://github.com/mattseddon)
- Move integration test files into new structure [#2236](https://github.com/iterative/vscode-dvc/pull/2236) by [@mattseddon](https://github.com/mattseddon)
- Split up `TableHeader.tsx`  [#2250](https://github.com/iterative/vscode-dvc/pull/2250) by [@julieg18](https://github.com/julieg18)
- Add CHANGELOG to prettierignore [#2246](https://github.com/iterative/vscode-dvc/pull/2246) by [@mattseddon](https://github.com/mattseddon)

## [0.3.21] - 2022-08-21

### 🚀 New Features and Enhancements

- Add a copy button for comparison table rows [#2216](https://github.com/iterative/vscode-dvc/pull/2216) by [@sroy3](https://github.com/sroy3)
- Share an experiment from context menus [#2219](https://github.com/iterative/vscode-dvc/pull/2219) by [@mattseddon](https://github.com/mattseddon)
- Share an experiment from command palette [#2221](https://github.com/iterative/vscode-dvc/pull/2221) by [@mattseddon](https://github.com/mattseddon)

### 🐛 Bug Fixes

- Disable selection on resize [#2214](https://github.com/iterative/vscode-dvc/pull/2214) by [@sroy3](https://github.com/sroy3)
- Update cell hover styles [#2198](https://github.com/iterative/vscode-dvc/pull/2198) by [@julieg18](https://github.com/julieg18)

## [0.3.20] - 2022-08-18

### 🚀 New Features and Enhancements

- Show min tested version in toast warning message [#2209](https://github.com/iterative/vscode-dvc/pull/2209) by [@mattseddon](https://github.com/mattseddon)

### 🐛 Bug Fixes

- Fix sticky workspace row obscuring branch [#2212](https://github.com/iterative/vscode-dvc/pull/2212) by [@mattseddon](https://github.com/mattseddon)
- Make drop zones larger when dragging in the same section [#2206](https://github.com/iterative/vscode-dvc/pull/2206) by [@sroy3](https://github.com/sroy3)

## [0.3.19] - 2022-08-18

### 🚀 New Features and Enhancements

- Update table styles [#2133](https://github.com/iterative/vscode-dvc/pull/2133) by [@julieg18](https://github.com/julieg18)

### 🐛 Bug Fixes

- Improve table styles [#2197](https://github.com/iterative/vscode-dvc/pull/2197) by [@julieg18](https://github.com/julieg18)
- Do not retry CLI process when unexpected error is received [#2200](https://github.com/iterative/vscode-dvc/pull/2200) by [@mattseddon](https://github.com/mattseddon)
- Handle newly introduced deps (before dvc commit) [#2202](https://github.com/iterative/vscode-dvc/pull/2202) by [@mattseddon](https://github.com/mattseddon)
- Fix experiment table live updates in non-checkpoint experiments [#2203](https://github.com/iterative/vscode-dvc/pull/2203) by [@mattseddon](https://github.com/mattseddon)
- Fix partially hidden header context menus [#2204](https://github.com/iterative/vscode-dvc/pull/2204) by [@julieg18](https://github.com/julieg18)

### 🔨 Maintenance

- Bump min tested DVC version to 2.18.1 [#2207](https://github.com/iterative/vscode-dvc/pull/2207) by [@mattseddon](https://github.com/mattseddon)

## [0.3.18] - 2022-08-15

### 🚀 New Features and Enhancements

- Left align timestamp column text [#2191](https://github.com/iterative/vscode-dvc/pull/2191) by [@julieg18](https://github.com/julieg18)
- Add select python interpreter option to setup workspace toast message [#2186](https://github.com/iterative/vscode-dvc/pull/2186) by [@mattseddon](https://github.com/mattseddon)

### 🐛 Bug Fixes

- Handle dep being added under the current commit [#2187](https://github.com/iterative/vscode-dvc/pull/2187) by [@mattseddon](https://github.com/mattseddon)

## [0.3.17] - 2022-08-14

### 🚀 New Features and Enhancements

- Add option to filter experiments to starred [#2164](https://github.com/iterative/vscode-dvc/pull/2164) by [@mattseddon](https://github.com/mattseddon)
- Add option to sort by starred experiments [#2169](https://github.com/iterative/vscode-dvc/pull/2169) by [@mattseddon](https://github.com/mattseddon)
- Add shortcut to filter experiments to starred [#2170](https://github.com/iterative/vscode-dvc/pull/2170) by [@mattseddon](https://github.com/mattseddon)
- Add shortcut to sort experiments by starred [#2171](https://github.com/iterative/vscode-dvc/pull/2171) by [@mattseddon](https://github.com/mattseddon)

### 🐛 Bug Fixes

- Larger drop zones when dragging a plot to another section [#2180](https://github.com/iterative/vscode-dvc/pull/2180) by [@sroy3](https://github.com/sroy3)

### 🔨 Maintenance

- Rename experiments columns tree test file [#2168](https://github.com/iterative/vscode-dvc/pull/2168) by [@mattseddon](https://github.com/mattseddon)
- Revert end to end tests back to insiders [#2173](https://github.com/iterative/vscode-dvc/pull/2173) by [@mattseddon](https://github.com/mattseddon)

## [0.3.16] - 2022-08-10

### 🚀 New Features and Enhancements

- Links in section description tooltips [#2140](https://github.com/iterative/vscode-dvc/pull/2140) by [@sroy3](https://github.com/sroy3)
- Retain plot order when toggling off/on [#2147](https://github.com/iterative/vscode-dvc/pull/2147) by [@mattseddon](https://github.com/mattseddon)
- All plots sections visible [#2145](https://github.com/iterative/vscode-dvc/pull/2145) by [@sroy3](https://github.com/sroy3)

### 🐛 Bug Fixes

- Patch e2e tests [#2143](https://github.com/iterative/vscode-dvc/pull/2143) by [@mattseddon](https://github.com/mattseddon)
- Remove drop target when leaving a section [#2149](https://github.com/iterative/vscode-dvc/pull/2149) by [@sroy3](https://github.com/sroy3)

### 🔨 Maintenance

- Split up `Table.tsx` [#2165](https://github.com/iterative/vscode-dvc/pull/2165) by [@julieg18](https://github.com/julieg18)

## [0.3.15] - 2022-08-03

### 🚀 New Features and Enhancements

- Hide remove all buttons from trees when there is nothing to remove [#2131](https://github.com/iterative/vscode-dvc/pull/2131) by [@mattseddon](https://github.com/mattseddon)
- Plot experiments in the order they were selected [#2137](https://github.com/iterative/vscode-dvc/pull/2137) by [@mattseddon](https://github.com/mattseddon)

### 🔨 Maintenance

- Update CODEOWNERS [#2132](https://github.com/iterative/vscode-dvc/pull/2132) by [@mattseddon](https://github.com/mattseddon)

## [0.3.14] - 2022-08-02

### 🐛 Bug Fixes

- Block users from attempting to run concurrent SCM commands [#2128](https://github.com/iterative/vscode-dvc/pull/2128) by [@mattseddon](https://github.com/mattseddon)

### 🔨 Maintenance

- Redux for experiments table drag and drop [#2097](https://github.com/iterative/vscode-dvc/pull/2097) by [@sroy3](https://github.com/sroy3)
- Upgrade vsce [#2108](https://github.com/iterative/vscode-dvc/pull/2108) by [@mattseddon](https://github.com/mattseddon)
- Table data in redux [#2112](https://github.com/iterative/vscode-dvc/pull/2112) by [@sroy3](https://github.com/sroy3)
- Keep old reference in the state if they have not changed [#2114](https://github.com/iterative/vscode-dvc/pull/2114) by [@sroy3](https://github.com/sroy3)
- Upgrade wdio-vscode-service [#2124](https://github.com/iterative/vscode-dvc/pull/2124) by [@mattseddon](https://github.com/mattseddon)
- Simplify drag and drop integrations [#2126](https://github.com/iterative/vscode-dvc/pull/2126) by [@sroy3](https://github.com/sroy3)

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
- Fix `yarn build` by reverting "chore(deps): update dependency vsce to v2.9.3" [#2101](https://github.com/iterative/vscode-dvc/pull/2101) by [@julieg18](https://github.com/julieg18)
- Undo failed release attempt by reverting "Update version and CHANGELOG for release" [#2104](https://github.com/iterative/vscode-dvc/pull/2104) by [@julieg18](https://github.com/julieg18)

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
