(async function () {
  const A = window.Advent;
  const tr = A.I18n.t;
  const auth = A.Auth;
  const params = new URLSearchParams(location.search);
  const fragment = new URLSearchParams(location.hash.slice(1));
  try {
    if (params.has('error') || fragment.has('error')) throw new Error('expired');
    await auth.ready;
    if (!auth.client) throw new Error('unconfigured');
    // Optional token-hash email template also works when opened in a different browser.
    const tokenHash = params.get('token_hash');
    if (tokenHash) {
      history.replaceState(null, '', A.I18n.url('auth.html'));
      if (params.get('type') !== 'email') throw new Error('invalid');
      const { error } = await auth.client.auth.verifyOtp({ token_hash: tokenHash, type: 'email' });
      if (error) throw error;
    }
    const { data, error } = await auth.client.auth.getSession();
    if (error || !data.session) throw error || new Error('expired');
    history.replaceState(null, '', A.I18n.url('auth.html'));
    location.replace(A.I18n.url('editor.html'));
  } catch {
    // Never echo tokens or provider error text into the page.
    history.replaceState(null, '', A.I18n.url('auth.html'));
    document.getElementById('authTitle').textContent = tr("Let’s get you a fresh link");
    document.getElementById('authMessage').textContent = tr("That sign-in link may have expired or already been used. Request a new one to open your calendars.");
    document.getElementById('authRetry').hidden = false;
  }
})();
