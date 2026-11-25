/* Job Sheets – embed helper for CRM pages.
   <script src="https://YOUR-HOST/embed.js"></script>
   const js = JobSheets.mount({ container:'#box', url:'https://YOUR-HOST/', ext:'CUSTOMER-123', onSaved:m=>console.log(m) });
   js.newDocument({client:'ACME Ltd', tel:'99123456'}); js.open(id,'edit'); js.search('12160'); */
(function (g) {
  function mount(o) {
    var host = typeof o.container === 'string' ? document.querySelector(o.container) : o.container;
    if (!host) throw new Error('JobSheets: container not found');
    var base = new URL(o.url, location.href), origin = base.origin, q = new URLSearchParams({ embed: '1' });
    if (o.ext) q.set('ext', o.ext);
    if (o.accent) q.set('accent', o.accent);
    if (o.hideNav) q.set('nav', '0');
    if (o.hideBar) q.set('bar', '0');
    if (o.docId) { q.set('doc', o.docId); if (o.docMode) q.set('mode', o.docMode); }
    else if (o.mode === 'new') { q.set('new', '1'); Object.keys(o.prefill || {}).forEach(function (k) { q.set(k, o.prefill[k]); }); }
    var f = document.createElement('iframe');
    f.src = origin + base.pathname + '?' + q.toString();
    f.style.cssText = 'width:100%;border:0;min-height:' + (o.minHeight || '600px');
    f.setAttribute('allow', 'fullscreen');
    host.appendChild(f);
    var ready = false, queue = [];
    function send(m) { if (f.contentWindow) f.contentWindow.postMessage(m, origin); }
    function later(m) { if (ready) send(m); else queue.push(m); }
    function sendSession(s) { if (s && s.access_token && s.refresh_token) send({ type: 'jobsheets:auth', access_token: s.access_token, refresh_token: s.refresh_token }); }
    function onMsg(e) {
      if (e.origin !== origin || e.source !== f.contentWindow) return;
      var m = e.data || {};
      if (!m.type || String(m.type).indexOf('jobsheets:') !== 0) return;
      var t = m.type.slice(10);
      if (t === 'height' && o.autoHeight !== false) f.style.height = m.height + 'px';
      if (t === 'auth-required' && o.session) Promise.resolve(typeof o.session === 'function' ? o.session() : o.session).then(sendSession);
      if (t === 'ready') { ready = true; queue.splice(0).forEach(send); }
      var cb = o['on' + t.charAt(0).toUpperCase() + t.slice(1).replace(/-(.)/g, function (_, c) { return c.toUpperCase(); })];
      if (cb) cb(m);
    }
    g.addEventListener('message', onMsg);
    return {
      frame: f,
      newDocument: function (prefill) { later({ type: 'jobsheets:new', prefill: prefill || {} }); },
      open: function (id, mode) { later({ type: 'jobsheets:open', id: id, mode: mode || 'view' }); },
      search: function (text, ext) { later({ type: 'jobsheets:search', q: text || '', ext: ext || '' }); },
      setSession: sendSession,
      destroy: function () { g.removeEventListener('message', onMsg); f.remove(); }
    };
  }
  g.JobSheets = { mount: mount };
})(window);
