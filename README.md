# DVC Extension for Visual Studio Code

<!--- These will be broken until the repo is public --->
<!--- [![Continuous Integration](https://github.com/iterative/vscode-dvc/actions/workflows/continuous-integration.yml/badge.svg)](https://github.com/iterative/vscode-dvc/actions/workflows/continuous-integration.yml) --->
<!--- [![Cross-Platform Test](https://github.com/iterative/vscode-dvc/actions/workflows/cross-platform-test.yml/badge.svg)](https://github.com/iterative/vscode-dvc/actions/workflows/cross-platform-test.yml) --->
<!-- [![DVC CLI Output Test](https://github.com/iterative/vscode-dvc/actions/workflows/dvc-cli-output-test.yml/badge.svg)](https://github.com/iterative/vscode-dvc/actions/workflows/dvc-cli-output-test.yml) -->

[![Maintainability](https://api.codeclimate.com/v1/badges/fb243c31ea059c0038b2/maintainability)](https://codeclimate.com/repos/608b5886f52398018b00264c/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/fb243c31ea059c0038b2/test_coverage)](https://codeclimate.com/repos/608b5886f52398018b00264c/test_coverage)

A [Visual Studio Code](https://code.visualstudio.com/)
[extension](https://marketplace.visualstudio.com/VSCode) that aims to allow
users of all technical backgrounds to effectively use [DVC](https://dvc.org/).

## Current State

We want early adopter feedback! Please let us know what you like and don't like
about the extension. Feel free to reach out in this repository's
[issues](https://github.com/iterative/vscode-dvc/issues) or via any of the other
existing [support channels](https://dvc.org/support).

## Quick Start

- **Step 1.**
  [Install a supported version of DVC on your system](https://dvc.org/doc/install)
- **Step 2.**
  [Install the DVC extension for Visual Studio Code](https://code.visualstudio.com/docs/editor/extension-gallery).
- **Step 3.** See Walkthrough.

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

## Features

- [Command Palette](extension/resources/walkthrough/command-palette.md)
- [Source Control Management](extension/resources/walkthrough/source-control-management.md)
- [Tracked Resources](extension/resources/walkthrough/tracked-explorer.md)
- [DVC View Container](extension/resources/walkthrough/view-container.md)
- [Experiments Table](extension/resources/walkthrough/experiments-table.md)
- [Plots](extension/resources/walkthrough/plots.md)

### Debugging

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
