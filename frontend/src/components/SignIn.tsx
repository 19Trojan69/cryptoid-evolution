interface SignInProps {
  onSignIn: () => void;
  onModalClose: () => void;
  disabled?: boolean;
}

const SignIn = ({ onSignIn, onModalClose, disabled }: SignInProps) => {
  return (
    <div className="signin-overlay">
      <div className="signin-modal" role="dialog" aria-modal="true" aria-labelledby="signin-title">
        <button className="close-button" onClick={onModalClose} aria-label="Close">×</button>
        <p className="eyebrow">SECURE ACCESS</p>
        <h2 id="signin-title">Connect your Pi wallet</h2>
        <p>Sign in to save your progress and access the power lab.</p>
        <div className="modal-actions">
          <button className="button button-primary" onClick={onSignIn} disabled={disabled}>Sign in with Pi</button>
          <button className="text-button" onClick={onModalClose}>Maybe later</button>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
