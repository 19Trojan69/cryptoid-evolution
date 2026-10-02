type Props = { amount: number; locale: string; testnet?: boolean };

// A font-independent pi glyph with the broad cap and curved legs of the
// supplied reference. Currency labels remain readable to screen readers.
export default function PiPrice({ amount, locale, testnet = false }: Props) {
  const formatted = amount.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return <span className="pi-price" aria-label={`${formatted} ${testnet ? "Test-Pi" : "Pi"}`}>
    <span className="pi-price-amount">{formatted} </span>
    <svg className="pi-price-symbol" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M7 3H92Q97 3 97 9V12Q97 17 92 17H79C77 36 75 62 80 77C82 84 87 86 95 82Q100 80 100 86V92Q100 96 96 97C80 102 69 96 65 85C60 71 61 43 64 17H38C38 43 36 73 29 95Q28 98 22 98H10Q5 98 7 93C16 70 20 43 20 17H7Q2 17 2 12V9Q2 3 7 3Z" />
    </svg>
    <span className="sr-only">Pi</span>
    {testnet && <span className="pi-price-test">Test</span>}
  </span>;
}
