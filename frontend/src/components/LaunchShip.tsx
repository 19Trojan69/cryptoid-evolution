// Reuse one original hull. This decoration creates no canvas, frame loop or audio.
export default function LaunchShip() {
  return <div className="launch-scene" aria-hidden="true">
    <div className="launch-orbit" />
    <div className="launch-trail" />
    <img src="/ships/evolution/ship_01_stage_1.png" width="256" height="256" alt="" className="launch-ship" />
    <span className="launch-coordinate">01 / ∞</span>
  </div>;
}
