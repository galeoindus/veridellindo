# Veri pose assets

Veri is Veridellindo's botanical companion character. The WebP files in this
folder share the same translucent green/teal seed body, two leaf sprouts,
expressive eyes, small hands and feet. Every file includes an alpha channel and
is optimized for web delivery (roughly 51–55 KB per pose).

| File | Intended use | Suggested interface state |
|---|---|---|
| `veri-welcome.webp` | Large homepage / new-chat greeting | First visit or empty conversation |
| `veri-idle.webp` | Small neutral assistant avatar | Default / waiting |
| `veri-wave.webp` | Friendly greeting and re-engagement | Welcome back / acknowledgement |
| `veri-think.webp` | Thinking expression | Research, retrieval or model wait |
| `veri-explain.webp` | Open-hand explaining pose | Streaming / explaining an answer |
| `veri-warm.webp` | Gentle closed-hand smile | Completed answer / answer signature |
| `veri-celebrate.webp` | Eyes closed, hands raised | Successful image generation / celebration |
| `veri-listen.webp` | Attentive, listening pose | Stopped, retry or recovery state |
| `veri-joy.webp` | Full joyful expression | Optional positive feedback state |

## Implementation rules

- Preserve transparent backgrounds and the entire leaf/hand/foot silhouette.
- Use `object-fit: contain`; do not crop the character into a circular avatar.
- Keep the supplied Veridellindo brand mark separate. Veri is a companion, not a
  replacement logo, favicon, app icon or product name.
- Add cache-busting query strings from the current build ID when referring to
  these files from HTML or JavaScript.
- Respect `prefers-reduced-motion`; never rely on animation alone to communicate
  request state.
