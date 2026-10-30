# Color contrast audit (WCAG 2.1 AA)

Ratios are calculated with the WCAG 2.1 relative luminance formula from the exact hex values in `assets/css/styles.css`.

Thresholds: 4.5:1 for normal text, 3:1 for large text (24 px, or 18.7 px bold), 3:1 for UI component boundaries, focus indicators, and meaningful graphics (SC 1.4.11).

| Usage | Foreground | Background | Type | Ratio | Needed | Result |
|---|---|---|---|---|---|---|
| Body text on page | `#1d1a2b` | `#f4f4f8` | Normal text | 15.50:1 | 4.50:1 | Pass |
| Body text on cards | `#1d1a2b` | `#ffffff` | Normal text | 17.01:1 | 4.50:1 | Pass |
| Secondary text (hints, meta) on cards | `#4b4660` | `#ffffff` | Normal text | 8.96:1 | 4.50:1 | Pass |
| Secondary text on page background | `#4b4660` | `#f4f4f8` | Normal text | 8.17:1 | 4.50:1 | Pass |
| Header app name on header | `#ffffff` | `#34205c` | Large text | 13.93:1 | 3.00:1 | Pass |
| Header small text on header | `#ddd3f0` | `#34205c` | Normal text | 9.72:1 | 4.50:1 | Pass |
| Primary button label (default) | `#ffffff` | `#4c2a85` | Normal text | 10.62:1 | 4.50:1 | Pass |
| Primary button label (hover) | `#ffffff` | `#3d2070` | Normal text | 12.81:1 | 4.50:1 | Pass |
| Primary button label (active) | `#ffffff` | `#2c1554` | Normal text | 15.64:1 | 4.50:1 | Pass |
| Secondary / Add button label | `#4c2a85` | `#ffffff` | Normal text | 10.62:1 | 4.50:1 | Pass |
| Secondary button label on hover tint | `#4c2a85` | `#f0ebf8` | Normal text | 9.08:1 | 4.50:1 | Pass |
| Disabled button label | `#5f5973` | `#eceaf1` | Normal text | 5.57:1 | 4.50:1 | Pass |
| Link text on cards | `#4c2a85` | `#ffffff` | Normal text | 10.62:1 | 4.50:1 | Pass |
| Open seats text | `#1d6e4c` | `#ffffff` | Normal text | 6.20:1 | 4.50:1 | Pass |
| Low seats text | `#8a4b00` | `#ffffff` | Normal text | 6.80:1 | 4.50:1 | Pass |
| Full / error text on white | `#b3261e` | `#ffffff` | Normal text | 6.54:1 | 4.50:1 | Pass |
| Error text on error background | `#b3261e` | `#fdf1f0` | Normal text | 5.92:1 | 4.50:1 | Pass |
| Still working text on amber background | `#8a4b00` | `#fff6e8` | Normal text | 6.35:1 | 4.50:1 | Pass |
| Submit status text on plum tint | `#2c1554` | `#f0ebf8` | Normal text | 13.37:1 | 4.50:1 | Pass |
| Badge text (In my schedule) | `#2c1554` | `#e2d8f2` | Normal text | 11.43:1 | 4.50:1 | Pass |
| Week block label | `#ffffff` | `#4c2a85` | Normal text | 10.62:1 | 4.50:1 | Pass |
| Input and select border vs white | `#6f6985` | `#ffffff` | UI / graphic | 5.20:1 | 3.00:1 | Pass |
| Input border vs page background | `#6f6985` | `#f4f4f8` | UI / graphic | 4.74:1 | 3.00:1 | Pass |
| Error border vs white | `#b3261e` | `#ffffff` | UI / graphic | 6.54:1 | 3.00:1 | Pass |
| Focus outline (ink) vs white | `#1d1a2b` | `#ffffff` | UI / graphic | 17.01:1 | 3.00:1 | Pass |
| Focus outline (ink) vs page | `#1d1a2b` | `#f4f4f8` | UI / graphic | 15.50:1 | 3.00:1 | Pass |
| Focus outline vs primary button fill | `#1d1a2b` | `#4c2a85` | Focus ring | 1.60:1 | 3.00:1 | See note |
| Primary button fill vs white page | `#4c2a85` | `#ffffff` | UI / graphic | 10.62:1 | 3.00:1 | Pass |
| Checkbox / radio accent fill vs white | `#4c2a85` | `#ffffff` | UI / graphic | 10.62:1 | 3.00:1 | Pass |
| Open seat cell vs white (decorative, text repeats it) | `#2e8b62` | `#ffffff` | UI / graphic | 4.21:1 | 3.00:1 | Pass |
| Progress current step circle vs white | `#4c2a85` | `#ffffff` | UI / graphic | 10.62:1 | 3.00:1 | Pass |

## Notes

- **Every text pair passes AA, and most pass AAA (7:1).** The lowest text pair is the disabled button label at 5.57:1. WCAG exempts disabled controls, but the label stays readable because the disabled reason is something students need to read.
- **Focus ring next to a plum button (1.60:1):** the ring is drawn with a 3 px offset, so it never touches the button. What the eye compares is the ring against the page behind it, which is 17.01:1 on white and 15.50:1 on the page background. The ring is 3 px thick, which also meets the focus appearance guidance in WCAG 2.2 (SC 2.4.13).
- **Color is never the only signal.** Full sections use a dashed border, a × icon, and the words "Full. All 30 seats taken." Errors use an icon, a red edge bar, and text. The seat strip is hidden from screen readers because the seat text beside it says the same thing.
- **Automated check:** axe-core 4 ran on all four steps at desktop and phone widths and on the state gallery with WCAG 2.0, 2.1, and 2.2 AA rules. It reported zero violations, including zero color-contrast violations. See `keyboard-and-axe.md`.
- **Windows High Contrast / forced colors:** a `forced-colors: active` block swaps borders, focus rings, and seat cells to system colors so nothing disappears.
