(async function () {
  const auth = window.Advent.Auth;
  const params = new URLSearchParams(location.search);
  const fragment = new URLSearchParams(location.hash.slice(1));
  try {
    if (params.has('error') || fragment.has('error')) throw new Error('expired');
    await auth.ready;
    if (!auth.client) throw new Error('unconfigured');
    // Optional token-hash email template also works when opened in a different browser.
    const tokenHash = params.get('token_hash');
    if (tokenHash) {
      history.replaceState(null, '', 'auth.html');
      if (params.get('type') !== 'email') throw new Error('invalid');
      const { error } = await auth.client.auth.verifyOtp({ token_hash: tokenHash, type: 'email' });
      if (error) throw error;
    }
    const { data, error } = await auth.client.auth.getSession();
    if (error || !data.session) throw error || new Error('expired');
    history.replaceState(null, '', 'auth.html');
    location.replace('editor.html');
  } catch {
    // Never echo tokens or provider error text into the page.
    history.replaceState(null, '', 'auth.html');
    document.getElementById('authTitle').textContent = 'Let’s get you a fresh link';
    document.getElementById('authMessage').textContent = 'That sign-in link may have expired or already been used. Request a new one to open your calendars.';
    document.getElementById('authRetry').hidden = false;
  }
})();
