import type { CSSProperties } from "react";
import { BLOCKS_PER_CHAIN } from "./networkChain";
const CHAIN_BINARY = "1011010001101001110001010011011010101100".repeat(4);

export default function BlockchainProgress ({ blocks, saved = false }: { blocks: number; saved?: boolean }) { return (
  <div className={`blockchain-progress${saved ? " blockchain-progress-saved" : ""}`} role="img" aria-label={`${blocks} of ${BLOCKS_PER_CHAIN} network blocks linked`}>
    <div className="blockchain-halo" aria-hidden="true" />
    <div className="blockchain-route" aria-hidden="true">
      {[0, 1].map(row => <div className={`blockchain-block-row blockchain-row-${row ? "bottom" : "top"}`} key={row}>
        {Array.from({ length: row ? 4 : 5 }, (_, offset) => {
          const index = offset + (row ? 5 : 0);
          return <div className="blockchain-step" key={index}>
            <i className={`blockchain-node${index < blocks ? " active" : ""}${index === blocks - 1 ? " newest" : ""}`}>
            <span className="blockchain-cube-rotor" style={{ "--cube-period": `${7.2 - index * .5}s` } as CSSProperties}>
              <span className="blockchain-cube-body">
              {['front', 'back', 'left', 'right', 'top', 'bottom'].map(face => <span key={face} className={`blockchain-cube-face cube-face-${face}`} />)}
              </span>
            </span>
            </i>
            {offset < (row ? 3 : 4) && <span className={`blockchain-link${index + 1 < blocks ? " active" : ""}`}><i /></span>}
          </div>;
        })}
      </div>)}
      <span className={`blockchain-vertical-link${blocks > 5 ? " active" : ""}`} />
    </div>
    <div className="blockchain-binary" aria-hidden="true"><div className="blockchain-binary-track"><span>{CHAIN_BINARY}</span><span>{CHAIN_BINARY}</span></div></div>
  </div>
);
}
