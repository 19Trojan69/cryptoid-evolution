// CSS-only activity feedback. Readiness and the next action stay with the caller.
export default function LoadingStripes() {
  return <div className="launch-status" aria-hidden="true"><i /><i /><i /></div>;
}
