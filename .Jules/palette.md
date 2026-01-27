## 2024-05-22 - Input Component Limitation
**Learning:** The `Input` component does not support internal icons or addons, requiring manual wrapping and absolute positioning for features like password toggles.
**Action:** When adding icons to inputs, wrap in `relative` container and use `absolute` positioning with `pr-10` on the input to prevent text overlap.
