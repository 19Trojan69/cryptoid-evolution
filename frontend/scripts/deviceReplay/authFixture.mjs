// A settled guest identity lets the real GameEntry mount GamePage without
// contacting Pi or authenticating a player. False leaves its login gate up.
export function useIsolatedAuth() {
  return { authReady: true, isLoading: false, isAuthenticated: false, user: null, authError: '',
    signIn: async () => { throw new Error('No account in device test'); } };
}
export const ISOLATED_AUTH_SOURCE = `export const useAuth=${useIsolatedAuth.toString()};`;
