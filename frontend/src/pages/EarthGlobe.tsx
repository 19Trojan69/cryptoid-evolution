import { memo, type FC } from "react";

// Bundled, fixed Atlantic-facing globe: no clock, pixel projection or map service.
// Keep the paused prop compatible with the home and mission backdrops.
const EarthGlobe: FC<{ paused?: boolean }> = () => (
  <img className="earth-globe-image" src="/planets/earth.png" width={1254} height={1254} decoding="async" alt="" aria-hidden="true" draggable={false} />
);

export default memo(EarthGlobe);
