import { useEffect, useRef, useState } from 'react';
import { axiosClient } from '../lib/axiosClient';
import { useAdminLocale } from '../adminLocale';
import { shipSaveNetwork } from './shipFleet';

type Player = { uid: string; username: string; network: string; careerScore: number;
  bestRun: { score: number; level: number | null }; activeRun: boolean; accountDeletionAllowed: boolean;
  accountDeletionBlockedReason?: 'other-network' | 'not-configured' | null };
type Review = Player & { action: 'scores' | 'account'; token: string; expiresAt: string; scope: string };
const explanations: Record<string, string> = {
  player_not_found: 'Player not found.',
  ambiguous_player_name: 'Der Name ist nicht eindeutig. Bitte den vollständigen Pi-Namen verwenden.',
  finish_active_run_before_reset: 'Finish the active mission before deleting high scores.',
  other_network_account_present: 'This account contains data on the other network. This panel cannot delete that data.',
  owner_account_protected: 'Das Eigentümerkonto ist vor einer Accountlöschung geschützt.',
  player_review_expired_or_changed: 'Die Auswahl ist abgelaufen oder der Spielerstand hat sich geändert. Bitte erneut prüfen.',
  account_deletion_transaction_unavailable: 'Die sichere Accountlöschung ist derzeit nicht verfügbar. Es wurde nichts gelöscht.',
  account_deletion_not_enabled: 'Account deletion must be enabled on the server.',
};
function message(error: unknown) {
  const code = (error as { response?: { data?: { error?: string } } }).response?.data?.error || '';
  return explanations[code] || 'Die Aktion wurde nicht bestätigt. Bitte erneut prüfen.';
}
export default function AdminPlayers() {
  const { t } = useAdminLocale();
  const [username, setUsername] = useState(''), [players, setPlayers] = useState<Player[]>([]);
  const [selected, setSelected] = useState<Player | null>(null), [review, setReview] = useState<Review | null>(null);
  const [confirmation, setConfirmation] = useState(''), [requested, setRequested] = useState(false);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const generation = useRef(0);
  useEffect(() => () => { generation.current++; }, []);
  const resetReview = () => { setReview(null); setConfirmation(''); setRequested(false); };
  const find = async () => {
    const id = ++generation.current; setBusy(true); setError(''); setNotice(''); setPlayers([]); setSelected(null); resetReview();
    try {
      const { data } = await axiosClient.post<{ players: Player[] }>('/admin/players/find', { username, network: shipSaveNetwork });
      if (id !== generation.current) return;
      setPlayers(data.players); if (data.players.length === 1) setSelected(data.players[0]);
      if (!data.players.length) setNotice(t('Player not found.'));
    } catch (err) { if (id === generation.current) setError(t(message(err))); }
    finally { if (id === generation.current) setBusy(false); }
  };
  const prepare = async (action: 'scores' | 'account') => {
    if (!selected) return;
    const id = ++generation.current; setBusy(true); setError(''); setNotice(''); resetReview();
    try {
      const { data } = await axiosClient.post<Review>('/admin/players/prepare', {
        network: shipSaveNetwork, uid: selected.uid, username: selected.username, action,
      });
      if (id === generation.current) setReview(data);
    } catch (err) { if (id === generation.current) setError(t(message(err))); }
    finally { if (id === generation.current) setBusy(false); }
  };
  const execute = async () => {
    if (!review || confirmation !== review.username || !requested || busy) return;
    const id = ++generation.current; setBusy(true); setError(''); setNotice('');
    try {
      const { data } = await axiosClient.post<{ deleted: boolean }>('/admin/players/execute', {
        network: shipSaveNetwork, token: review.token, confirmUsername: confirmation, confirm: true,
        playerRequestedDeletion: review.action === 'account' && requested,
      });
      if (id !== generation.current) return;
      if (data.deleted !== true) throw Error('not confirmed');
      setNotice(t(review.action === 'scores' ? 'The high scores were deleted.' : 'The player account was deleted.'));
      resetReview(); setSelected(null); setPlayers([]);
    } catch (err) { if (id === generation.current) { setError(t(message(err))); resetReview(); } }
    finally { if (id === generation.current) setBusy(false); }
  };
  return <section className="admin-panel">
    <h2>{t('Manage players')}</h2>
    <p>{t('Network')}: <strong>{shipSaveNetwork}</strong></p>
    <form onSubmit={event => { event.preventDefault(); void find(); }}>
      <label>{t('Full Pi name')} <input value={username} maxLength={80} autoComplete="off" disabled={busy}
        onChange={event => { setUsername(event.target.value); setPlayers([]); setSelected(null); resetReview(); }} /></label>
      <button type="submit" className="admin-button" disabled={busy || !username.trim()}>{t('Find player')}</button>
    </form>
    {players.length > 1 && <fieldset className="admin-score-reset"><legend>{t('Select the correct player')}</legend>{players.map(player =>
      <label className="admin-score-confirm" key={player.uid}><input type="radio" name="admin-player" disabled={busy} checked={selected?.uid === player.uid}
        onChange={() => { setSelected(player); resetReview(); }} /> {player.username} · {player.uid.slice(-8)}</label>)}</fieldset>}
    {selected && <div>
      <h3>{selected.username}</h3>
      <p>{t('Career score')}: {selected.careerScore} · {t('Best run')}: {selected.bestRun.score}</p>
      {selected.activeRun && <p>{t('Finish the active mission before deleting high scores.')}</p>}
      <div className="admin-actions">
        <button type="button" className="admin-button" disabled={busy || selected.activeRun} onClick={() => { void prepare('scores'); }}>{t('Delete high scores')}</button>
        <button type="button" className="admin-button" disabled={busy || !selected.accountDeletionAllowed} onClick={() => { void prepare('account'); }}>{t('Delete entire account')}</button>
      </div>
      {!selected.accountDeletionAllowed && <p>{t(selected.accountDeletionBlockedReason === 'not-configured'
        ? 'Account deletion must be enabled on the server.' : 'This account contains data on the other network. This panel cannot delete that data.')}</p>}
    </div>}
    {review && <div className="admin-score-reset">
      <h3>{t(review.action === 'scores' ? 'Delete high scores on this network' : 'Permanently remove player account')}</h3>
      <p>{t(review.action === 'scores'
        ? 'Career score and best run will be deleted. Saved progress, ships and purchases are retained.'
        : 'This removes the account profile, saved games, leaderboard records, community content and sessions. Payment references are retained without a player link to prevent duplicate credits.')}</p>
      <label>{t('Re-enter the Pi name to confirm')} <input value={confirmation} disabled={busy} autoComplete="off"
        onChange={event => setConfirmation(event.target.value)} /></label>
      <label className="admin-score-confirm"><input type="checkbox" checked={requested} disabled={busy} onChange={event => setRequested(event.target.checked)} />
        {t(review.action === 'scores' ? 'I confirm deletion of the displayed high scores.' : 'The player requested deletion of their entire account.')}</label>
      <div className="admin-actions"><button type="button" className="admin-button" onClick={() => { void execute(); }}
        disabled={busy || !requested || confirmation !== review.username}>{t('Confirm deletion')}</button>
        <button type="button" className="admin-button" disabled={busy} onClick={resetReview}>{t('Cancel')}</button></div>
    </div>}
    {error && <p className="admin-error" role="alert">{error}</p>}
    <p role="status">{busy ? t('Checking permission…') : notice}</p>
  </section>;
}
