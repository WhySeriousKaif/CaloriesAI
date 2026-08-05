import { forwardRef, type ComponentRef } from 'react';
import { Pressable as RNPressable, type PressableProps } from 'react-native';

/**
 * `Pressable` with React Native's real `style` / `children` callback APIs intact.
 *
 * Why this exists
 * ---------------
 * `babel.config.js` sets `jsxImportSource`, so every JSX element in the app is
 * created through react-native-css-interop's `wrapJSX`. That wrapper swaps any
 * component registered with `cssInterop()` — `Pressable` among them — for an
 * interop version whose whole job is to resolve `className` into `style`.
 *
 * Because the mapping is `{ className: "style" }`, the interop treats `style` as
 * *its* output prop: it computes a value and merges it over the incoming props
 * (`props = { ...props, ...possiblyAnimatedProps }`). It knows how to merge an
 * object or an array, but React Native also allows `style` to be a **function**
 * of `{ pressed }` — and that shape it cannot merge, so it is silently dropped.
 *
 * The symptom is nasty because it is invisible on web (react-native-web takes a
 * different code path): on device the element renders with *no* styling at all,
 * which is why onboarding's option cards lost their borders and every primary
 * button lost its background while looking perfect in a browser.
 *
 * `cssInterop={false}` is the interop's own documented opt-out. `wrapJSX` reads
 * it, skips the component swap, and deletes the prop before it reaches
 * `Pressable`, so nothing leaks through to the native view.
 *
 * The trade-off: `className` does not work on this component. That costs us
 * nothing — the app styles exclusively with `StyleSheet` and `constants/design`.
 *
 * Use this everywhere instead of importing `Pressable` from `react-native`.
 */

// `cssInterop` is consumed by the JSX wrapper above React's element creation, so
// it is deliberately absent from `PressableProps`. Spreading a pre-cast object
// keeps the opt-out at the one place it is explained.
const CSS_INTEROP_OPT_OUT = { cssInterop: false } as object as PressableProps;

export const Pressable = forwardRef<ComponentRef<typeof RNPressable>, PressableProps>(
  function Pressable(props, ref) {
    return <RNPressable ref={ref} {...props} {...CSS_INTEROP_OPT_OUT} />;
  }
);

export type { PressableProps };
