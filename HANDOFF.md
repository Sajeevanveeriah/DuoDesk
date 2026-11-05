# DuoDesk handoff

Develop a cross-device desktop-sharing application derived from TwinDesk.

## Work at 5 November 2026

Source baseline: [main at f9dd53a3](https://github.com/Sajeevanveeriah/DuoDesk/commit/f9dd53a3cac439110ddb6da2f0738ec6457d29d0). Use the linked revision to distinguish these changes from later work.

- Fix Android permission and API compatibility errors with release lint enabled ([f9dd53a3](https://github.com/Sajeevanveeriah/DuoDesk/commit/f9dd53a3cac439110ddb6da2f0738ec6457d29d0), 01 Nov 2026).
- Allow independent desktop validation builds while retaining release APK bundling ([4a68a054](https://github.com/Sajeevanveeriah/DuoDesk/commit/4a68a054b516e9caf17ef3da84ffd15dd630f54b), 01 Nov 2026).

## Resume here

Start with the packaging and signing gaps in TASKS.md. A successful build is only one step towards installation and a two-device interaction test. The upstream root README has a recorded policy restriction on release-documentation edits.

GitHub showed no open pull requests or issues at this revision. Check the [work queue](https://github.com/Sajeevanveeriah/DuoDesk/pulls) and any local changes before choosing a task.

## Files and checks

[README.md](README.md), [TASKS.md](TASKS.md), [docs/compatibility.md](docs/compatibility.md), [website/README.md](website/README.md).

Local commands declared in [package.json](package.json): `npm run test`. Record the command and result against the revision tested.

GitHub returned no check results for this source revision. Runtime verification is unconfirmed in this snapshot.

## Next handoff

When pausing, replace the dated snapshot with the active branch or revision, what changed, the checks actually run and their results, and the first unfinished action. Record any blocker or decision the next person needs. Keep private data and credentials out of this file.
