import { createRef, useState } from "react";

// Unlike useRef(initialize()), do not repeat initialization on scene updates.
// React's lazy initializer creates one mutable ref object per mounted instance.
export function useInitialRef<T>(initialize: () => T): { current: T } {
  const [ref] = useState(() => {
    const initial = createRef<T>();
    initial.current = initialize();
    return initial as { current: T };
  });
  return ref;
}
