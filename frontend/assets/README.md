# Frontend asset intake

This directory is the client-side asset root for the Phaser MVP.

## Expected folders
- `tiles/`
- `units/`
- `markers/`
- `ui/`
- `effects/`
- `data/`
- `generated/images/`
- `generated/video/`

## Hermes / mmx workflow
When placeholder art or video is needed during apply, Hermes may generate assets with `mmx` and place them under `generated/images/` or `generated/video/`.

Battle/runtime code should not depend on hard-coded filenames outside the asset intake layer. If bespoke art replaces placeholders later, keep the same intake path or update only the intake mapping.
