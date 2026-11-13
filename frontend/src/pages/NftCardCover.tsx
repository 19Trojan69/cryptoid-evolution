export default function NftCardCover({ number, label }: { number: string; label: string }) {
  return <div className="nft-card-cover">
    <div className="nft-card-cover-art" aria-hidden="true">◇</div>
    <span><strong>#{number}</strong><small>{label}</small></span>
  </div>;
}
