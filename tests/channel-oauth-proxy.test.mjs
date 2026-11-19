import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import https from 'node:https';
import { PassThrough, Readable } from 'node:stream';
import test from 'node:test';
import proxy from '../api/proxy.js';

function requestThroughProxy(t, url, extraHeaders, failure = false) {
  let upstreamRequest;
  t.mock.method(https, 'request', (options, handleResponse) => {
    upstreamRequest = options;
    const request = new PassThrough();
    request.setTimeout = () => {};
    request.once('finish', () => {
      if (failure) {
        request.emit('error', new Error('upstream unreachable'));
        return;
      }
      const response = Readable.from(['{"data":{"status":"READY"}}']);
      response.statusCode = 200;
      response.headers = { 'content-type': 'application/json' };
      handleResponse(response);
    });
    return request;
  });

  const req = Readable.from([]);
  req.url = url;
  req.method = 'GET';
  req.headers = { cookie: 'oauth_binding=test', ...extraHeaders };
  return new Promise(resolve => {
    let body = '';
    const headers = {};
    const res = Object.assign(new EventEmitter(), {
      setHeader(name, value) { headers[name] = value; },
      writeHead(status, values) { this.statusCode = status; Object.assign(headers, values); },
      write(chunk) { body += chunk; return true; },
      end() {
        this.writableEnded = true;
        resolve({ status: this.statusCode, headers, body, upstreamRequest });
      },
    });
    proxy(req, res);
  });
}

for (const provider of ['meta', 'instagram']) {
  test(provider + ' callback forwards browser binding, then redirects without provider fields', async t => {
    const path = 'v1/integrations/' + provider + '/callback';
    const response = await requestThroughProxy(t, '/api/proxy?__proxy_path=' + path + '&state=state-test&code=code-test', {
      accept: 'text/html,application/xhtml+xml',
      'sec-fetch-mode': 'navigate',
    });
    assert.equal(response.upstreamRequest.path, '/api/' + path + '?state=state-test&code=code-test');
    assert.equal(response.upstreamRequest.headers.cookie, 'oauth_binding=test');
    assert.equal(response.status, 303);
    assert.equal(response.headers.Location, '/creator/social-accounts?oauth=return');
    assert.equal(response.headers['Cache-Control'], 'no-store');
    assert.equal(response.headers['Referrer-Policy'], 'no-referrer');
    assert.equal(response.body, '');
  });
}

test('API requests retain the existing JSON callback contract', async t => {
  const response = await requestThroughProxy(t, '/api/v1/integrations/meta/callback?state=test', {
    accept: 'application/json',
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.Location, undefined);
  assert.equal(JSON.parse(response.body).data.status, 'READY');
});

test('ordinary browser API navigation is left alone', async t => {
  const response = await requestThroughProxy(t, '/api/v1/creators/portal/accounts', { accept: 'text/html' });
  assert.equal(response.status, 200);
  assert.equal(response.headers.Location, undefined);
});

test('browser returns to the portal when the callback upstream fails', async t => {
  const response = await requestThroughProxy(t, '/api/v1/integrations/meta/callback?error=access_denied', {
    accept: 'text/html',
  }, true);
  assert.equal(response.status, 303);
  assert.equal(response.headers.Location, '/creator/social-accounts?oauth=return');
});
