import axios, { AxiosError, AxiosHeaders } from 'axios';
import { installSessionRequestDiagnostics } from '../../frontend/src/lib/sessionRequestDiagnostics.ts';
export const PI_ACCESS_TOKEN_KEY = 'isolated-unused-token';
export const ADMIN_TEST_HEADER = 'x-isolated-unused';
export const getBaseURL = () => '/api';
export async function deviceReply(config) {
  const method = String(config.method || 'get').toUpperCase();
  const path = config.url;
  let data;
  if (method === 'GET' && path === '/hangar/catalog') data = { offers: [] };
  else if (method === 'GET' && path === '/leaderboard/top') data = { leaders: [], network: 'testnet' };
  else {
    const response = { data: { error: 'isolated_guest_test_denied' }, status: 403,
      statusText: 'Forbidden', headers: new AxiosHeaders(), config };
    throw new AxiosError('Isolated guest test denied', 'ERR_BAD_REQUEST', config, undefined, response);
  }
  return { data, status: 200, statusText: 'OK', headers: new AxiosHeaders(), config };
}
export const axiosClient = axios.create({ baseURL: '/api', adapter: deviceReply });
installSessionRequestDiagnostics(axiosClient);
