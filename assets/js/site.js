/* Small, dependency-free behaviour for each page. */
(function () {
  'use strict';
  document.documentElement.classList.add('js');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- landing: topology map ---------- */
  var topo = document.getElementById('topo');
  if (topo) {
    var readout = document.getElementById('readout');
    var initial = readout.innerHTML;
    var edges = Array.prototype.slice.call(topo.querySelectorAll('.edge, .cross'));
    var nodes = Array.prototype.slice.call(topo.querySelectorAll('.node'));

    function setReadout(title, text) {
      readout.innerHTML = '';
      var s = document.createElement('strong'); s.textContent = title;
      var t = document.createElement('span'); t.textContent = text;
      readout.appendChild(s); readout.appendChild(t);
    }

    function highlight(node) {
      var id = node.getAttribute('data-id');
      var lit = {}; lit[id] = true;
      if (id === 'me') {
        nodes.forEach(function (n) { if (n.classList.contains('hub')) lit[n.getAttribute('data-id')] = true; });
      }
      edges.forEach(function (e) {
        var a = e.getAttribute('data-a'), b = e.getAttribute('data-b');
        var on = a === id || b === id;
        // a leaf also lights the path back to me through its hub
        var hub = node.getAttribute('data-hub');
        if (hub && ((a === 'me' && b === hub))) on = true;
        e.classList.toggle('on', on);
        if (on) { lit[a] = true; lit[b] = true; }
      });
      nodes.forEach(function (n) { n.classList.toggle('on', !!lit[n.getAttribute('data-id')] && n.getAttribute('data-id') !== 'me'); });
      topo.classList.add('dim');
      setReadout(node.getAttribute('data-title'), node.getAttribute('data-text'));
    }

    function clear() {
      edges.forEach(function (e) { e.classList.remove('on'); });
      nodes.forEach(function (n) { n.classList.remove('on'); });
      topo.classList.remove('dim');
      readout.innerHTML = initial;
    }

    nodes.forEach(function (n) {
      n.addEventListener('mouseenter', function () { highlight(n); });
      n.addEventListener('focus', function () { highlight(n); });
      n.addEventListener('mouseleave', clear);
      n.addEventListener('blur', clear);
    });

    /* packets: a dot travels me → hub → project, now and then */
    if (!reduce) {
      var layer = document.getElementById('packets');
      var NS = 'http://www.w3.org/2000/svg';
      var spokes = edges.filter(function (e) { return e.getAttribute('data-a') === 'me'; });

      function pointsOf(line) {
        return [[+line.getAttribute('x1'), +line.getAttribute('y1')], [+line.getAttribute('x2'), +line.getAttribute('y2')]];
      }

      function send() {
        if (document.hidden) { setTimeout(send, 1200); return; }
        var spoke = spokes[Math.floor(Math.random() * spokes.length)];
        var hub = spoke.getAttribute('data-b');
        var outs = edges.filter(function (e) { return e.tagName === 'line' && e.getAttribute('data-a') === hub; });
        var leg = outs[Math.floor(Math.random() * outs.length)];
        var path = [pointsOf(spoke), pointsOf(leg)];
        var dot = document.createElementNS(NS, 'circle');
        dot.setAttribute('r', '3.5'); dot.setAttribute('class', 'packet');
        layer.appendChild(dot);
        var start = null, dur = 900;
        function step(ts) {
          if (start === null) start = ts;
          var t = (ts - start) / dur;
          var seg = t < 1 ? 0 : 1;
          var k = Math.min(1, t - seg);
          var p = path[seg];
          var e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
          dot.setAttribute('cx', p[0][0] + (p[1][0] - p[0][0]) * e);
          dot.setAttribute('cy', p[0][1] + (p[1][1] - p[0][1]) * e);
          if (t < 2) requestAnimationFrame(step);
          else { layer.removeChild(dot); setTimeout(send, 1400 + Math.random() * 1600); }
        }
        requestAnimationFrame(step);
      }
      setTimeout(send, 900);
    }
  }

  /* ---------- about: hops arrive one by one ---------- */
  var hops = document.querySelectorAll('.hop');
  if (hops.length) {
    if (reduce || !('IntersectionObserver' in window)) {
      hops.forEach(function (h) { h.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var i = Array.prototype.indexOf.call(hops, en.target);
          setTimeout(function () { en.target.classList.add('in'); }, Math.min(i, 4) * 90);
          io.unobserve(en.target);
        });
      }, { rootMargin: '0px 0px -40px 0px' });
      hops.forEach(function (h) { io.observe(h); });
      // never leave the timeline hidden if the observer doesn't fire
      setTimeout(function () { hops.forEach(function (h) { h.classList.add('in'); }); }, 1500);
    }
  }

  /* ---------- projects: filters + spec dialog ---------- */
  var sheetsEl = document.getElementById('sheets');
  if (sheetsEl) {
    var sheets = Array.prototype.slice.call(sheetsEl.querySelectorAll('.sheet'));
    var filters = Array.prototype.slice.call(document.querySelectorAll('.filter'));
    var count = document.getElementById('count');
    var dlg = document.getElementById('spec');
    var lastOpener = null;

    function applyFilter(f, push) {
      var shown = 0;
      sheets.forEach(function (s) {
        var ok = f === 'all' || s.getAttribute('data-area').split(' ').indexOf(f) > -1;
        s.hidden = !ok; if (ok) shown++;
      });
      filters.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-filter') === f)); });
      count.textContent = shown + (shown === 1 ? ' sheet' : ' sheets') + (f === 'all' ? '' : ' · ' + f);
      if (push) history.replaceState(null, '', f === 'all' ? location.pathname : '#' + f);
    }

    filters.forEach(function (b) {
      b.addEventListener('click', function () { applyFilter(b.getAttribute('data-filter'), true); });
    });

    function openSheet(sheet) {
      var tpl = sheet.querySelector('template').content;
      var meta = tpl.querySelector('[data-meta]').textContent.split('|');
      document.getElementById('spec-title').textContent = sheet.querySelector('.sheet-body strong').textContent;
      document.getElementById('spec-sheet').textContent = meta[3] + ' · ' + meta[0];
      var drawing = document.getElementById('spec-drawing');
      drawing.innerHTML = '';
      drawing.appendChild(sheet.querySelector('.drawing svg').cloneNode(true));
      var body = document.getElementById('spec-body');
      body.innerHTML = '';
      Array.prototype.forEach.call(tpl.children, function (c) {
        if (!c.hasAttribute('data-stack') && !c.hasAttribute('data-meta')) body.appendChild(c.cloneNode(true));
      });
      var stack = document.getElementById('spec-stack');
      stack.innerHTML = '';
      tpl.querySelector('[data-stack]').textContent.split('·').forEach(function (t) {
        var c = document.createElement('span'); c.className = 'chip'; c.textContent = t.trim(); stack.appendChild(c);
      });
      var mt = document.getElementById('spec-meta');
      mt.innerHTML = '';
      meta.forEach(function (m) { var s = document.createElement('span'); s.textContent = m; mt.appendChild(s); });
      lastOpener = sheet;
      history.replaceState(null, '', '#' + sheet.getAttribute('data-id'));
      if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    }

    function closeSheet() {
      if (dlg.open) dlg.close();
    }

    sheets.forEach(function (s) { s.addEventListener('click', function () { openSheet(s); }); });
    dlg.querySelector('[data-close]').addEventListener('click', closeSheet);
    dlg.addEventListener('click', function (e) { if (e.target === dlg) closeSheet(); });
    dlg.addEventListener('close', function () {
      var pressed = filters.filter(function (b) { return b.getAttribute('aria-pressed') === 'true'; })[0];
      var f = pressed ? pressed.getAttribute('data-filter') : 'all';
      history.replaceState(null, '', f === 'all' ? location.pathname : '#' + f);
      if (lastOpener) lastOpener.focus();
    });

    function fromHash() {
      var h = decodeURIComponent(location.hash.slice(1));
      if (!h) return;
      if (filters.some(function (b) { return b.getAttribute('data-filter') === h; })) { applyFilter(h, false); return; }
      var target = sheets.filter(function (s) { return s.getAttribute('data-id') === h; })[0];
      if (target) { target.scrollIntoView({ block: 'center' }); openSheet(target); }
    }
    fromHash();
  }

  /* ---------- connect: handshake + mailto ---------- */
  var form = document.getElementById('contact');
  if (form) {
    var shake = document.getElementById('shake');
    var status = document.getElementById('status');
    var TO = 'CS23BT069@iitdh.ac.in';
    var fName = document.getElementById('n'), fEmail = document.getElementById('e'), fMsg = document.getElementById('m');

    function light(step) {
      shake.querySelectorAll('[data-step]').forEach(function (el) {
        el.classList.toggle('lit', +el.getAttribute('data-step') <= step);
      });
    }
    function progress() {
      var n = fName.value.trim(), e = fEmail.value.trim(), m = fMsg.value.trim();
      light(n || e || m ? 1 : 0);
    }
    form.addEventListener('input', progress);

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var n = fName.value.trim(), e = fEmail.value.trim(), m = fMsg.value.trim();
      var missing = [];
      if (!n) missing.push('name');
      if (!e || !fEmail.checkValidity()) missing.push('a valid email');
      if (!m) missing.push('a message');
      if (missing.length) {
        status.textContent = 'RST · still need ' + missing.join(', ') + '.';
        (!n ? fName : (!e || !fEmail.checkValidity()) ? fEmail : fMsg).focus();
        return;
      }
      var subject = 'Hello from ' + n;
      var body = m + '\n\n— ' + n + '\nReply-to: ' + e;
      light(1);
      status.textContent = 'SYN sent · your email app should open now.';
      window.location.href = 'mailto:' + TO + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    });
  }
})();
