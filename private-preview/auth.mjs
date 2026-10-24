// Build-time guest fixture for this protected Preview; no storage or OAuth.
const noop = () => {};
const done = async () => {};
const guest = Object.freeze({
  user: null, canAdmin: false, adminMode: false, isAuthenticated: false,
  showSignIn: false, isLoading: false, authReady: true, authError: '',
  signIn: done, signOut: done, refreshSession: done,
  closeSignIn: noop, requireAuth: noop,
  setAdminPreview: async () => { throw new Error('Private preview is guest-only'); },
});
export const useAuth = () => guest;
