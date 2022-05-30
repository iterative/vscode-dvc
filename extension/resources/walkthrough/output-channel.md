# Output Channel

All `DVC` CLI commands generate two entries in this extension's dedicated output
channel.

The first shows the command has started. The second is to signify that it has
completed.

The completion entry will show:

- The outcome of the command (COMPLETED / FAILED).
- Any non-zero exit codes.
- The length of time that each command took to run (ms).
- Any error message provided by the CLI.
