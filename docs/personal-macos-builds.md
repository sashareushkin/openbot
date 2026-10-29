# Personal macOS builds

Use `bun run package:personal:mac` for the personal fork. The Git worktree must be clean, including
untracked files, so the build can be tied to its source commit.
The command builds for the current Mac architecture with the existing fork profile, excludes source
maps, disables signing and notarization, and verifies the package before it is kept. It does not
install an app or change a user profile. Official desktop application updates remain disabled on macOS.

Each successful build gets a local annotated Git tag named
`personal-macos-<UTC timestamp>-<commit>`. `BUILD-INFO` records its full commit, branch and tag.
The tag identifies source, not an archive of the app or user data. Do not move or reuse tags. Push
the tag and attach a verified archive to the matching GitHub Release when publishing is authorized.
GitHub Releases are for manual downloads until signing and a separate update design are available.

Completed builds are stored under `dist/personal-macos/`. After a successful build, the script keeps
the newest two completed managed builds. It never cleans other `dist` folders. A running old build is
kept until a later run, so more than two may remain temporarily. Failed builds do not remove previous
builds. The old `dist/fork-isolated` and `dist/fork-no-sourcemaps` builds predate this workflow and
are not managed by it. Preserve them until two managed builds have been verified, then remove them
when no process uses them.

Tags, commits, and GitHub release artifacts are separate: keeping two local apps does not delete old
tags or releases. No update server or GitHub Release is created by this command.
