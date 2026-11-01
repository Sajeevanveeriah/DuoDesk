# DuoDesk compatibility contract

Baseline: TwinDesk `7c57646fa146108f5d0b000ef08893c9c5ebbc4e`. Written before the DuoDesk rebrand. Display names, artwork and product copy may change; the identifiers below must remain unless a separate, tested migration changes them atomically. An old name in this allowlist is intentional, not a missed rebrand.

## Licence and attribution

Keep `LICENSE`, existing copyright headers and `THIRD_PARTY_NOTICES`. Retain inukaasith, Erdoğan Yeşil, Beamer/Kalkman Code, DeskPad/Khaos Tian, ViGEmClient and scrcpy attribution wherever present. Add DuoDesk modification notices instead of replacing upstream authors. About must credit TwinDesk and link its source. Licence notices and source links are not product-brand defects.

## All devices

- Wire protocol version 1; TCP 47800 control/files, UDP 47801 discovery and adb mDNS UDP 5353. Keep dynamic media/ADB port negotiation.
- Pairing label `macshare-sas-v1`, nonce/commit/SAS calculation and pin/token semantics. Preserve all protocol message names and JSON field keys, including `macId`, `macName`, OS values, `pair.*`, `kvm.*`, `k.*`, `clip.*`, `fclip.*`, `file.*`, `rtc.*`, `rtc2.*`, `hello` and `welcome`.
- BLE UUIDs `b7f30001` through `b7f30006` with suffix `-2c4e-4d1a-9a57-3e8c2f6d0a91`, GATT characteristics and pipe operation names.
- Native helper JSON-line commands/events and flags: for example `kvmConfig`, `capture`, `place`, `armReturn`, `screens`, `inject`, `releaseAll`, `edge`, `return`, `captureEnded`, `ready`; Linux multi's `sideList` remains distinct from array encoding.
- Existing preload global `macshare` and IPC names remain coupled to current renderer/main code. Add constrained methods deliberately rather than global-renaming the API.
- Existing settings/identity schemas, token/certificate values and pairing import bookkeeping. Never regenerate keys as a side effect of changing the display name.

## Windows

- npm identity `macshare-win`; app/AUMID `org.macshare.windows`.
- User-data folder `MacShare`; files `settings.json`, `multi.json`, `device.json`, `pairing.json`, `paired.json`, `pairings.json`, `paired-mesh.json`, `identity/identity.pfx`, `identity/identity.pass`.
- `twindesk:` deep links and their actions/query fields.
- `macshare-winhelper.exe`, `macshare-winhelper-multi.exe`, `macshare-calls.exe`; helper/calls package identity and executable references.
- Virtual-camera executable/DLL names, CLSID `{36D4122A-6D38-4C6A-B622-E9DD756F6C5D}` and ProgramData `TwinDesk/vcam` installation path.
- Scheduled tasks `\MacShare\Extend on` and `\MacShare\Extend off`, historical firewall-rule names in migration/uninstall handling, and installed registry/system integrations. Changing visible installer title does not authorise removing old integrations.

## macOS

- `MacShare` userData folder and `MACSHARE_PROFILE` override.
- `macshare://` desktop links and pc-app/send semantics, plus `twindesk://pair` Android QR links.
- Bundle IDs `org.macshare.mac`, `org.macshare.mac.helper`, `org.macshare.mac.calls`, `org.macshare.mac.share`; existing login label, camera extension ID and application groups.
- `macshare-helper`, `macshare-helper-multi`, `macshare-dockstub`, `macshare-calls`, `MacShareShare`, `twindesk-camera`, `twindesk-vcam` executable names and paths.
- `settings.json`, `paired.json`, `hosts.json`, `multi.json`, `paired-mesh.json`, `hosts-mesh.json`, `identity/key.pem`, `identity/cert.pem` and schemas.
- Virtual display vendor/product/serial values; virtual camera device/stream UUIDs. Preserve signing identity for updates where available; a different signature can reset OS permissions.

## Linux

- npm identity `macshare-linux`; app ID `org.macshare.linux`; installed command `twindesk`, desktop files `twindesk.desktop`/`twindesk-mac-*.desktop`, AUR `twindesk-bin` conflicts/provides compatibility.
- `MacShare` userData folder; Windows-like settings/pairing filenames above, with Linux identity files `identity/key.pem` and `identity/cert.pem`.
- `macshare-linuxhelper`, `macshare-linuxhelper-multi`, `twindesk-wifiap`, `twindesk-vcam`, `twindesk-pad`, `twindesk-connector`.
- Samba `MacShare` share/account names, polkit action `org.twindesk.linux.connector`, `/etc/modules-load.d/twindesk-uinput.conf`, `70-twindesk-uinput.rules`, camera module/config/device identities and installed helper paths.

## Android

- Application ID/namespace `com.twindesk.android`, component/alias class names, provider authorities `${applicationId}.files` and `${applicationId}.pcshare`, signature identity. Both standard/full flavours keep the same ID and signing key. A different key cannot update an upstream-signed APK merely by retaining its ID.
- SharedPreferences `twindesk`, keys including `deviceId`, `hosts`, `sync.<hostId>` and feature preferences; AndroidKeyStore alias `twindesk-share`.
- `twindesk://pair` and query keys `id`, `p`, `a`, `k`, `n`; broadcast actions `com.twindesk.android.*`; shortcut category `com.twindesk.android.SHARE_TARGET`; notification channel IDs.
- Historical external-storage directories and existing URI/grant semantics remain until a deliberate migration exists.

## Controlled changes

Product name, UI strings, About copy, logo/icons and new release asset names become DuoDesk. GitHub update endpoints must change to the DuoDesk repository, with matching asset selectors. Do not send DuoDesk users to upstream updates. Preserve upstream source URLs in credits. Existing app/package/protocol identifiers are retained even when their names differ from the product.

These constraints are based on inspected owning source and the platform assessment reports. They do not prove interoperability; pairing old/new devices, upgrade retention, signatures and installed integrations still need runtime tests.
