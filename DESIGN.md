# duodesk-development design reference

The colours, type, spacing and components in use in this project, read from its stylesheets and components on 10 November 2026. Read this before interface work and update it when the styles change.

## Stack

| Package | Version |
|---|---|
| electron | ^44.7.0 |

## Style sources

| File | Characters of CSS |
|---|---|
| linux/mesh/app.css | 25142 |
| windows/mesh/app.css | 25127 |
| linux/app.css | 22131 |
| windows/app.css | 22115 |
| mac/mesh/control.css | 21513 |
| mac/control.css | 20096 |
| mac/mesh/control-pages.css | 14922 |
| website/public/style.css | 14384 |
| shared/phonehub.css | 14364 |
| mac/control-pages.css | 13703 |
| linux/app-pages.css | 12317 |
| windows/app-pages.css | 12282 |

The 12 largest of 33 files that hold CSS are listed.

## Colour

Custom properties that hold colours:

| Token | Value | Defined in |
|---|---|---|
| --accent | #0a84ff | linux/app.css, linux/mesh/app.css, windows/app.css and 1 more |
| --accent-soft | rgba(10, 132, 255, 0.12) | linux/app.css, linux/mesh/app.css, windows/app.css and 1 more |
| --content | #f2f2f5 | linux/app.css, linux/mesh/app.css, windows/app.css and 1 more |
| --card | #ffffff | linux/app.css, linux/mesh/app.css, windows/app.css and 1 more |
| --line | rgba(0, 0, 0, 0.08) | linux/app.css, linux/mesh/app.css, windows/app.css and 1 more |
| --row-line | rgba(0, 0, 0, 0.06) | linux/app.css, linux/mesh/app.css, windows/app.css and 1 more |
| --text | #1d1d1f | linux/app.css, linux/mesh/app.css, windows/app.css and 1 more |
| --muted | #6e6e73 | linux/app.css, linux/mesh/app.css, windows/app.css and 1 more |
| --faint | #a1a1a6 | linux/app.css, linux/mesh/app.css, windows/app.css and 1 more |
| --good | #30b94d | linux/app.css, linux/mesh/app.css, windows/app.css and 1 more |
| --warn | #e8a10c | linux/app.css, linux/mesh/app.css, windows/app.css and 1 more |
| --bad | #e5373a | linux/app.css, linux/mesh/app.css, windows/app.css and 1 more |
| --idle | #a1a1a6 | linux/app.css, linux/mesh/app.css, windows/app.css and 1 more |
| --control | #ffffff | linux/app.css, linux/mesh/app.css, windows/app.css and 1 more |
| --control-line | rgba(0, 0, 0, 0.14) | linux/app.css, linux/mesh/app.css, windows/app.css and 1 more |
| --track-off | rgba(0, 0, 0, 0.12) | linux/app.css, linux/mesh/app.css, windows/app.css and 1 more |
| --nav-hover | rgba(0, 0, 0, 0.05) | linux/app.css, linux/mesh/app.css, windows/app.css and 1 more |
| --sidebar | #e9e9ee | linux/app.css, linux/mesh/app.css, windows/app.css and 1 more |
| --fa-dev | color-mix(in srgb, var(--text) 74%, var(--content)) | linux/app.css, linux/mesh/app.css, windows/app.css and 1 more |
| --fa-scr | color-mix(in srgb, var(--fa1) 24%, var(--card)) | linux/app.css, linux/mesh/app.css, windows/app.css and 1 more |
| --bar | #1c1c1e | linux/phoneview.css, mac/phoneview.css, windows/phoneview.css |
| --text | #f5f5f7 | linux/phoneview.css, mac/phoneview.css, windows/phoneview.css |
| --muted | #98989d | linux/phoneview.css, mac/phoneview.css, windows/phoneview.css |
| --hover | rgba(255, 255, 255, 0.1) | linux/phoneview.css, mac/phoneview.css, windows/phoneview.css |
| --accent | #0a84ff | mac/control.css, mac/mesh/control.css |
| --accent-soft | rgba(10, 132, 255, 0.12) | mac/control.css, mac/mesh/control.css |
| --content | #f2f2f5 | mac/control.css, mac/mesh/control.css |
| --card | #ffffff | mac/control.css, mac/mesh/control.css |
| --line | rgba(0, 0, 0, 0.08) | mac/control.css, mac/mesh/control.css |
| --row-line | rgba(0, 0, 0, 0.06) | mac/control.css, mac/mesh/control.css |
| --text | #1d1d1f | mac/control.css, mac/mesh/control.css |
| --muted | #6e6e73 | mac/control.css, mac/mesh/control.css |
| --faint | #a1a1a6 | mac/control.css, mac/mesh/control.css |
| --good | #30b94d | mac/control.css, mac/mesh/control.css |
| --warn | #e8a10c | mac/control.css, mac/mesh/control.css |
| --bad | #e5373a | mac/control.css, mac/mesh/control.css |
| --idle | #a1a1a6 | mac/control.css, mac/mesh/control.css |
| --control | #ffffff | mac/control.css, mac/mesh/control.css |
| --control-line | rgba(0, 0, 0, 0.14) | mac/control.css, mac/mesh/control.css |
| --track-off | rgba(0, 0, 0, 0.12) | mac/control.css, mac/mesh/control.css |
| --nav-hover | rgba(0, 0, 0, 0.05) | mac/control.css, mac/mesh/control.css |
| --fa-dev | color-mix(in srgb, var(--text) 74%, var(--content)) | mac/control.css, mac/mesh/control.css |
| --fa-scr | color-mix(in srgb, var(--fa1) 24%, var(--card)) | mac/control.css, mac/mesh/control.css |
| --accent | #9cb9ed | shared/duodesk.css |
| --bg | #0d1018 | shared/duodesk.css |
| --card | rgba(29,34,48,.7) | shared/duodesk.css |
| --text | #e9edf6 | shared/duodesk.css |
| --muted | #a0aabd | shared/duodesk.css |
| --line | rgba(196,211,244,.12) | shared/duodesk.css |
| --control | #252e40 | shared/duodesk.css |
| --control-line | #48536a | shared/duodesk.css |
| --track-off | #394359 | shared/duodesk.css |
| --dd-violet | #8f82ba | shared/duodesk.css |
| --text | #1d1d1f | shared/phonehub.css |
| --muted | #6e6e73 | shared/phonehub.css |
| --card | #ffffff | shared/phonehub.css |
| --line | rgba(0, 0, 0, 0.08) | shared/phonehub.css |
| --track-off | rgba(0, 0, 0, 0.1) | shared/phonehub.css |
| --good | #30b94d | shared/phonehub.css |
| --bad | #e5373a | shared/phonehub.css |
| --accent | #0a84ff | shared/phonehub.css |
| --control | #f2f2f5 | shared/phonehub.css |
| --content | #18181a | shared/ui-device.css |
| --card | #232326 | shared/ui-device.css |
| --sidebar | #1c1c1f | shared/ui-device.css |
| --line | rgba(255, 255, 255, 0.075) | shared/ui-device.css |
| --row-line | rgba(255, 255, 255, 0.055) | shared/ui-device.css |
| --muted | #a3a3a8 | shared/ui-device.css |
| --faint | #77777c | shared/ui-device.css |
| --control | #2e2e32 | shared/ui-device.css |
| --control-line | rgba(255, 255, 255, 0.09) | shared/ui-device.css |
| --track-off | rgba(255, 255, 255, 0.14) | shared/ui-device.css |
| --nav-hover | rgba(255, 255, 255, 0.055) | shared/ui-device.css |
| --bg | #090d14 | website/public/style.css |
| --panel | #141b25 | website/public/style.css |
| --line | #ffffff16 | website/public/style.css |
| --text | #e8edf2 | website/public/style.css |
| --muted | #9aa7b7 | website/public/style.css |
| --mint | #b9dad8 | website/public/style.css |

Literal colour values used most in the stylesheets:

| Value | Uses |
|---|---|
| #fff | 156 |
| #0a84ff | 31 |
| #48484a | 28 |
| #8e8e93 | 24 |
| #f5f5f7 | 24 |
| #5e5ce6 | 21 |
| #1d1d1f | 19 |
| #a1a1a6 | 19 |
| rgba(0, 0, 0, 0.35) | 17 |
| rgba(0, 0, 0, 0.12) | 16 |
| rgba(0, 0, 0, 0.3) | 16 |
| #000 | 14 |
| #5ac8fa | 13 |
| #ffffff | 13 |
| rgba(255, 255, 255, 0.06) | 13 |
| rgba(255, 255, 255, 0.8) | 13 |
| #6c6c70 | 12 |
| rgba(0, 0, 0, 0.18) | 12 |

## Type

Font sources:

- @font-face DeskMono (shared/duodesk.css)
- @font-face DuoDesk (mac/dmg/background.html)
- @font-face Manrope (shared/duodesk.css)
- @font-face Manrope (website/public/style.css)
- @font-face Mono (website/public/style.css)

Font stacks declared:

| font-family | Uses |
|---|---|
| Manrope | 2 |
| "Bitstream Vera Sans", "DejaVu Sans", Tahoma, Geneva, Arial, Sans-serif | 1 |
| "Bitstream Vera Sans Mono", "DejaVu Sans Mono", Courier, "Liberation Mono", Monospace | 1 |
| DuoDesk | 1 |
| DeskMono | 1 |
| Manrope,system-ui,sans-serif | 1 |
| inherit | 1 |
| ui-monospace, "SF Mono", Menlo, monospace | 1 |

Font sizes declared:

| font-size | Uses |
|---|---|
| 12px | 108 |
| 13px | 54 |
| 11px | 54 |
| 14px | 26 |
| 22px | 17 |
| 20px | 15 |
| 24px | 13 |
| 16px | 13 |
| 10px | 12 |
| 18px | 8 |
| 21px | 7 |
| 15px | 7 |

## Spacing and layout

| Media query | Uses |
|---|---|
| (prefers-reduced-motion: reduce) | 23 |
| (prefers-color-scheme: dark) | 8 |
| (prefers-color-scheme: light) | 6 |
| (max-width: 900px) | 5 |
| (max-width: 860px) | 3 |
| (max-width: 700px) | 1 |
| (max-width: 760px) | 1 |
| (max-width: 680px) | 1 |

| max-width | Uses |
|---|---|
| 100% | 21 |
| 560px | 9 |
| 520px | 7 |
| 280px | 6 |
| 150px | 6 |
| 580px | 6 |

## Shape and depth

| border-radius | Uses |
|---|---|
| 6px | 70 |
| 50% | 56 |
| 10px | 40 |
| 2px | 30 |
| 8px | 28 |
| 4px | 21 |
| 9px | 20 |

| box-shadow | Uses |
|---|---|
| var(--shadow) | 35 |
| 0 0 0 3px var(--accent-soft) | 31 |
| 0 0 8px rgba(48, 185, 77, 0.35) | 6 |
| inset 0 0 0 1px rgba(0, 0, 0, 0.1) | 6 |
| inset 0 0 0 1.5px rgba(0, 0, 0, 0.35) | 6 |

## Other tokens

Custom properties for type, spacing, shadow and motion:

| Token | Value | Defined in |
|---|---|---|
| --shadow | 0 0.5px 1.5px rgba(0, 0, 0, 0.12) | linux/app.css, linux/mesh/app.css, windows/app.css and 1 more |
| --ease | cubic-bezier(0.2, 0.8, 0.2, 1) | linux/app.css, linux/mesh/app.css, windows/app.css and 1 more |
| --spring | cubic-bezier(0.34, 1.4, 0.64, 1) | linux/app.css, linux/mesh/app.css, windows/app.css and 1 more |
| --fa1 | var(--accent) | linux/app.css, linux/mesh/app.css, windows/app.css and 1 more |
| --fa2 | var(--accent) | linux/app.css, linux/mesh/app.css, windows/app.css and 1 more |
| --shadow | 0 0.5px 1.5px rgba(0, 0, 0, 0.12) | mac/control.css, mac/mesh/control.css |
| --ease | cubic-bezier(0.2, 0.8, 0.2, 1) | mac/control.css, mac/mesh/control.css |
| --spring | cubic-bezier(0.34, 1.4, 0.64, 1) | mac/control.css, mac/mesh/control.css |
| --fa1 | var(--accent) | mac/control.css, mac/mesh/control.css |
| --fa2 | var(--accent) | mac/control.css, mac/mesh/control.css |

89 of 196 custom property definitions are listed; the rest are in the files under Style sources.

## Brand files

- website/public/logo.svg
