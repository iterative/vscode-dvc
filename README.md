# DVC Extension for Visual Studio Code

<!--- These will be broken until the repo is public --->
<!--- [![Continuous Integration](https://github.com/iterative/vscode-dvc/actions/workflows/continuous-integration.yml/badge.svg)](https://github.com/iterative/vscode-dvc/actions/workflows/continuous-integration.yml) --->
<!--- [![Cross-Platform Test](https://github.com/iterative/vscode-dvc/actions/workflows/cross-platform-test.yml/badge.svg)](https://github.com/iterative/vscode-dvc/actions/workflows/cross-platform-test.yml) --->
<!-- [![DVC CLI Output Test](https://github.com/iterative/vscode-dvc/actions/workflows/dvc-cli-output-test.yml/badge.svg)](https://github.com/iterative/vscode-dvc/actions/workflows/dvc-cli-output-test.yml) -->
[![Maintainability](https://api.codeclimate.com/v1/badges/fb243c31ea059c0038b2/maintainability)](https://codeclimate.com/repos/608b5886f52398018b00264c/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/fb243c31ea059c0038b2/test_coverage)](https://codeclimate.com/repos/608b5886f52398018b00264c/test_coverage)

This [extension] integrates [DVC features] right into the popular [VS Code IDE],
allowing users of all backgrounds to use DVC.

> **Note**: We want early adopter feedback!  
> Please let us know what you like and don't like about the extension. Feel free
> to open [issues in this repo] or reach out via [DVC support] channels.

[extension]: https://marketplace.visualstudio.com/VSCode
[dvc features]: https://dvc.org/doc/start
[vs code ide]: https://code.visualstudio.com/
[issues in this repo]: https://github.com/iterative/vscode-dvc/issues
[dvc support]: https://dvc.org/support

## What it does (extension features)

The DVC Extension augments and adds several [Views], adds special [Editors].
Furthermore it exposes these and other DVC functions in the [Command Palette].
Specifically:

- It provides _Editors_ to manage [Experiments][exp-view] and display
  [Plots][plots-view] as _Tabs_ in the IDE.
- Adds a [DVC Tracked] panel to the _Explorer_ view. This shows a tree of the
  data that DVC is tracking, with real-time file/dir [states] and options to
  [synchronize] them (from/to remote storage).
- Adds a [DVC panel] to the _Source Control_ view to list the [workspace
  status]. You can [restore] or reset project versions (based on the current Git
  `HEAD` commit) as well as [manage new and existing data] from here.
- Adds a brand-new [DVC View]
  (<img src="docs/dvc.png" alt="DVC icon" height="1em"/> in the Activity Bar)
  with panels to visualize and manage [DVC Experiments].
- Registers several [commands] in the _Command Palette_.
- Includes a [DVC channel] for the _Output_ panel (useful for
  [debugging](#debugging)). 

[views]: https://code.visualstudio.com/docs/getstarted/userinterface#_views
[editors]:
  https://code.visualstudio.com/docs/getstarted/userinterface#_open-editors
[command palette]:
  https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette

[exp-view]: extension/resources/walkthrough/experiments-table.md
[plots-view]: extension/resources/walkthrough/plots.md
[dvc tracked]: extension/resources/walkthrough/tracked-explorer.md
[dvc panel]: extension/resources/walkthrough/source-control-management.md
[dvc view]: extension/resources/walkthrough/view-container.md
[command palette]: extension/resources/walkthrough/command-palette.md
[dvc output]: #

## Quick Start

- **Step 1.**
  [Install a supported version of DVC on your system](https://dvc.org/doc/install)
- **Step 2.**
  [Install the DVC extension for Visual Studio Code](https://code.visualstudio.com/docs/editor/extension-gallery).
- **Step 3.** See Walkthrough.

### Learn more about DVC (Data Version Control)

View [more resources](extension/resources/walkthrough/dvc-learn-more.md).

## Configuration

<!-- TODO -->

See the .vscode/ dir.

## Useful commands

Open the Command Palette (`F1` or ⇧⌃P on Windows/Linux or ⇧⌘P on macOS) and type
in one of the following commands:

| Command                    | Description                                                                                                                 |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `DVC: Get Started`         | Open the extension's walkthrough. Which details all of the current features and provides links to extra learning resources. |
| `View: Show DVC`           | Open the extension's view container.                                                                                        |
| `DVC: Setup The Workspace` | Activate the extension's workspace setup wizard.                                                                            |
| `DVC: Show Experiments`    | Show an interactive version of DVC's `exp show` [command](https://dvc.org/doc/command-reference/exp/show).                  |
| `DVC: Show Plots`          | Show an interactive version of DVC's `plots diff` [command](https://dvc.org/doc/command-reference/plots/diff).              |

## Debugging

### The DVC Extension

Please see the DVC [channel] in the IDE's _Output_ panel to see the underlying
DVC commands being run, as wel as their error output. Feel free to share this
with us via [DVC support].

[channel]:
  https://code.visualstudio.com/api/extension-capabilities/common-capabilities#output-channel

### Your DVC project

Due to the way DVC pipelines run scripts of any language from the command line,
users must debug pipeline scripts (e.g. `train.py`) standalone in whatever way
debuggers are run on the base language - this is standard for debugging DVC
pipelines, and most scripts are capable of running outside of DVC.

## Contributing

See development docs and contributing guidelines in
[CONTRIBUTING.md](CONTRIBUTING.md)

## Data and telemetry

The DVC Extension for Visual Studio Code collects usage data and sends it to
Azure to help improve our products and services. This extension respects the
`telemetry.enableTelemetry` setting which you can learn more about at
https://code.visualstudio.com/docs/supporting/faq#_how-to-disable-telemetry-reporting.
