'use strict';
// Account verification enables read-only published cloud views. Local records are preserved.
(() => {
  const panel = document.createElement('div');
  panel.className = 'card';
  panel.id = 'accountPanel';
  panel.innerHTML = `<h2>Private account</h2>
    <p class="muted">Sign in to see your published games, team box scores and saved AI-assisted review. Local photos and notes stay on this device.</p>
    <form id="accountForm">
      <label for="accountEmail">Email</label>
      <input class="field" id="accountEmail" type="email" autocomplete="username" required maxlength="254">
      <label for="accountPassword">Password</label>
      <input class="field" id="accountPassword" type="password" autocomplete="current-password" required>
      <button class="button" id="accountSignIn" type="submit">Sign in</button>
    </form>
    <div id="accountIdentity" hidden><p id="accountWho"></p><p id="accountRole"></p>
      <button class="button secondary" id="accountSignOut" type="button">Sign out</button>
    </div>
    <p id="accountStatus" class="muted" role="status" aria-live="polite">Checking sign-in…</p>
    <p class="muted">Accounts are set up privately by your administrator. Signing out preserves local games, photos and reflections.</p>`;
  document.querySelector('#settings h1').after(panel);
  const el = id => document.getElementById(id);
  let client, generation = 0;
  function busy(value) {
    el('accountSignIn').disabled = value;
    el('accountSignOut').disabled = value;
  }
  function signedOut(message) {
    el('accountForm').hidden = false;
    el('accountIdentity').hidden = true;
    el('accountWho').textContent = '';
    el('accountRole').textContent = '';
    el('accountStatus').textContent = message;
  }
  async function checkAccount(session) {
    const current = ++generation;
    busy(true);
    if (!session) {
      window.familyCloud?.reset();
      signedOut('Not signed in. Your local records are unchanged.');
      busy(false); return;
    }
    window.familyCloud?.begin();
    el('accountForm').hidden = true;
    el('accountIdentity').hidden = false;
    el('accountWho').textContent = '';
    el('accountRole').textContent = '';
    el('accountStatus').textContent = 'Verifying family access…';
    try {
      const {data: verified, error: userError} = await client.auth.getUser();
      if (current !== generation) return;
      if (userError || !verified.user) throw Error('verification');
      el('accountWho').textContent = verified.user.email || 'Signed-in account';
      const {data: member, error} = await client.from('bj_members')
        .select('role,family_id,user_id').eq('user_id', verified.user.id).maybeSingle();
      if (current !== generation) return;
      if (error) throw Error('membership');
      if (!member || !['parent','player'].includes(member.role)) {
        el('accountStatus').textContent = 'Signed in, but family access has not been set up. Ask your administrator.';
        window.familyCloud?.fail('Your account has not been linked to a family yet.');
      } else {
        el('accountRole').textContent = member.role === 'parent' ? 'Parent / administrator' : 'Player';
        el('accountStatus').textContent = 'Family access verified. Open Home to see published records.';
        await window.familyCloud?.load(client,verified.user,member);
      }
    } catch {
      if (current === generation) window.familyCloud?.fail('Account verification failed. Reconnect or sign in again.');
      if (current === generation) el('accountStatus').textContent =
        'Could not verify access. Check your connection, or sign out and try again.';
    } finally { if (current === generation) busy(false); }
  }
  try {
    client = window.supabase.createClient(
      'https://zalqutkghkumtkkguati.supabase.co',
      'sb_publishable_fiFq7kmSlO56g_3EpC5USg_O7iCOY9T',
      {auth:{storage:sessionStorage,storageKey:'basketball-family-auth-v1',
        persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}}
    );
  } catch {
    signedOut('Account sign-in is unavailable. Local records are still available.');
    busy(true); return;
  }
  // Defer work outside the SDK auth callback to avoid its session lock.
  client.auth.onAuthStateChange((_event, session) => {
    setTimeout(() => { void checkAccount(session); }, 0);
  });
  el('accountForm').onsubmit = async event => {
    event.preventDefault(); busy(true);
    el('accountStatus').textContent = 'Signing in…';
    const password = el('accountPassword').value;
    el('accountPassword').value = '';
    try {
      const {error} = await client.auth.signInWithPassword({
        email:el('accountEmail').value.trim(),password
      });
      if (error) {
        signedOut('Sign-in failed. Check your email and password, then try again.');
        busy(false);
      }
    } catch {
      signedOut('Could not sign in. Check your connection and try again.');
      busy(false);
    }
  };
  el('accountSignOut').onclick = async () => {
    busy(true); ++generation;
    const {error} = await client.auth.signOut({scope:'local'});
    if (error) {
      el('accountStatus').textContent = 'Could not sign out. Reconnect and try again.';
      busy(false); return;
    }
    el('accountPassword').value = '';
    signedOut('Signed out. Your local records are unchanged.');
    busy(false);
  };
})();
