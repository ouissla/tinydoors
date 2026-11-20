/* Creator accounts. Supabase owns email delivery, sessions and token refresh. */
(function () {
  const A = (window.Advent = window.Advent || {});
  const tr = A.I18n.t;
  const $ = (id) => document.getElementById(id);
  const auth = A.Auth = {
    mode: 'prototype', client: null, user: null, config: null, error: null,
    async signIn(email) {
      if (!this.client) throw new Error(tr("Sign-in is not available yet."));
      const { error } = await this.client.auth.signInWithOtp({
        email, options: { emailRedirectTo: new URL('auth.html?lang=' + A.I18n.locale, this.config.appUrl + '/').href },
      });
      if (error) throw error;
    },
    async signOut() {
      const { error } = await this.client.auth.signOut({ scope: 'local' });
      if (error) throw error;
      location.replace(A.I18n.url('editor.html?new'));
    },
    async session() {
      await this.ready;
      const { data, error } = await this.client.auth.getSession();
      if (error) throw error;
      if (!data.session) throw new Error(tr("Please sign in to save your calendar."));
      return data.session;
    },
    async request(path, options = {}) {
      const session = await this.session();
      const headers = new Headers(options.headers);
      headers.set('Authorization', 'Bearer ' + session.access_token);
      const response = await fetch(path, { ...options, headers });
      const body = await response.json();
      if (!response.ok) throw new Error(tr(body.error || "Could not complete that request."));
      return body;
    },
    // Sign-in is only asked for when it's needed (saving to an account, sharing, paying).
    prompt(reason) {
      if (reason) $('accountReason').textContent = reason;
      $('accountPanel').hidden = false;
      $('accountPanel').scrollIntoView({ behavior: 'smooth', block: 'center' });
      $('accountEmail').focus();
    },
  };
  auth.ready = (async () => {
    if (location.protocol === 'file:') return;
    const response = await fetch('/api/config', { signal: AbortSignal.timeout(10000), cache: 'no-store' });
    // Plain static-source previews retain the local prototype; an unhealthy Worker does not.
    if (response.status === 404) return;
    const config = await response.json();
    if (!response.ok) throw new Error(config.error || tr("Sign-in is temporarily unavailable. Please try again."));
    auth.mode = config.mode;
    auth.config = config;
    if (config.mode !== 'cloud') return;
    const { createClient } = await import('./vendor/supabase.js');
    auth.client = createClient(config.supabaseUrl, config.supabasePublishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit' },
    });
    const { data, error } = await auth.client.auth.getSession();
    if (error) throw error;
    auth.user = data.session?.user || null;
    auth.client.auth.onAuthStateChange((event, session) => {
      const previous = auth.user?.id;
      auth.user = session?.user || null;
      // Reload on account changes so no previous owner's calendar remains on screen.
      if (event === 'SIGNED_OUT' || (event === 'SIGNED_IN' && auth.user?.id !== previous)) {
        if (document.body.classList.contains('editor') && !document.body.classList.contains('auth-callback')) location.replace(A.I18n.url('editor.html'));
      }
    });
  })().catch((error) => { auth.error = error; throw error; });
  // Consumers await ready; attach a rejection handler before any asynchronous page boot.
  auth.ready.catch(() => {});

  if ($('accountPanel')) {
    let resendAt = 0, countdown, sending = false;
    const message = (text, isError = false) => {
      $('accountMessage').textContent = text;
      $('accountMessage').setAttribute('role', isError ? 'alert' : 'status');
    };
    const cooldown = () => {
      resendAt = Date.now() + 60000;
      clearInterval(countdown);
      const tick = () => {
        const seconds = Math.max(0, Math.ceil((resendAt - Date.now()) / 1000));
        $('sendMagicLink').disabled = seconds > 0;
        $('sendMagicLink').textContent = seconds > 0 ? tr('Send another link in {seconds}s', { seconds }) : tr("Send sign-in link");
        if (seconds <= 0) clearInterval(countdown);
      };
      tick(); countdown = setInterval(tick, 1000);
    };
    auth.ready.then(() => {
      $('accountPanel').hidden = true;
      $('accountSignIn').hidden = auth.mode !== 'cloud' || !!auth.user;
      if (auth.mode !== 'cloud') return;
      $('accountLoading').hidden = true;
      $('accountForm').hidden = !!auth.user;
      $('accountSignedIn').hidden = !auth.user;
      if (auth.user) {
        $('accountIdentity').textContent = auth.user.email;
        $('profileInitial').textContent = (auth.user.email || '?').charAt(0).toUpperCase();
        $('profileMenu').append($('accountMessage'));
      }
    }).catch(() => {
      $('accountPanel').hidden = false;
      $('accountLoading').hidden = true;
      message(tr("We couldn’t load sign-in. Please refresh and try again."), true);
    });
    $('accountSignIn').addEventListener('click', () => (auth.onSignInClick ? auth.onSignInClick() : auth.prompt()));
    $('accountClose').addEventListener('click', () => { $('accountPanel').hidden = true; });
    const profile = $('accountSignedIn');
    document.addEventListener('click', (event) => {
      if (profile.open && !profile.contains(event.target)) profile.open = false;
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && profile.open) {
        profile.open = false;
        $('profileToggle').focus();
      }
    });
    $('accountForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      if (sending || Date.now() < resendAt) return;
      sending = true;
      const button = $('sendMagicLink');
      button.disabled = true;
      button.textContent = tr("Sending…");
      message('');
      try {
        await auth.signIn($('accountEmail').value.trim());
        message(tr("Check your email for your sign-in link. You can open it on any device."));
        cooldown();
      } catch (error) {
        if (error.status === 429) {
          message(tr("Sign-in emails are temporarily limited. Please try again later."), true);
          cooldown();
        } else {
          message(tr("We couldn’t send that link. Check your email address and try again."), true);
          button.disabled = false; button.textContent = tr("Send sign-in link");
        }
      } finally {
        sending = false;
      }
    });
    $('signOut').addEventListener('click', async () => {
      $('signOut').disabled = true;
      try { await auth.signOut(); } catch { message(tr("Couldn’t sign out. Please try again."), true); $('signOut').disabled = false; }
    });
  }
})();
