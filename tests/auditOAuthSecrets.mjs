// Read-only heuristic audit. Outputs locations only, never matching values.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
const repos = process.argv.slice(2);
const textPath = path => /(?:\.(?:java|ya?ml|properties|js|jsx|ts|tsx|json|xml|sh|ps1|txt|md)|(?:^|\/)\.?env(?:\.[\w-]+)?)$/i.test(path);
const findings = [];
function scan(repo, path, body, revision) {
  const fixture = /(?:src\/test\/|tests\/|example|sample|seed|mock)/i.test(path);
  body.split(/\r?\n/).forEach((line, index) => {
    let kind = /(?:AIza[\w-]{30,}|AKIA[A-Z0-9]{16}|gh[pousr]_[A-Za-z0-9]{30,}|EA[A-Za-z0-9]{80,})/.test(line) ? 'credential-format' : null;
    const match = line.match(/(?:app[-_]?secret|client[-_]?secret|api[-_]?key|jwt[-_]?secret|encryption[-_]?key|password|service[-_]?key)\s*[=:]\s*["']?([^\s"',;]+)/i);
    if (match && match[1].length >= 12 && !/(?:\$\{|process\.|System\.|getenv|env\.|fixture|private-|test|example|change|your|placeholder|localhost|redacted|<|\*\*)/i.test(match[1])) kind ??= 'literal-candidate';
    for (const fallback of line.matchAll(/\$\{([^:}]+):([^}]+)\}/g)) {
      if (/(?:SECRET|PASSWORD|API_KEY|ENCRYPTION_KEY|SERVICE_KEY)/.test(fallback[1])
          && fallback[2].length >= 8 && !/(?:fixture|private-|test|example|change|your|placeholder|redacted)/i.test(fallback[2])) kind = 'credential-default-candidate';
    }
    if (kind) findings.push({ repo, path, line: index + 1, revision, kind, fixture });
  });
}
for (const repo of repos) {
  const git = args => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  for (const path of git(['ls-files', '--cached', '--others', '--exclude-standard']).trim().split('\n').filter(textPath)) {
    try { scan(repo, path, fs.readFileSync(repo + '/' + path, 'utf8'), 'working-tree'); } catch {}
  }
  const objects = git(['rev-list', '--objects', '--all']).trim().split('\n').map(line => {
    const at = line.indexOf(' '); return { id: line.slice(0, at), path: line.slice(at + 1) };
  }).filter(item => /^[a-f0-9]{40}$/.test(item.id) && textPath(item.path));
  const sizes = execFileSync('git', ['-C', repo, 'cat-file', '--batch-check=%(objectname) %(objecttype) %(objectsize)'],
    { input: objects.map(item => item.id).join('\n') + '\n', encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 }).trim().split('\n');
  const eligible = [];
  for (let i = 0; i < objects.length; i++) {
    const [, type, size] = sizes[i].split(' ');
    if (type !== 'blob' || Number(size) > 1024 * 1024) continue;
    eligible.push(objects[i]);
  }
  for (let i = 0; i < eligible.length; i += 100) {
    const chunk = eligible.slice(i, i + 100);
    const result = execFileSync('git', ['-C', repo, 'cat-file', '--batch'], {
      input: chunk.map(item => item.id).join('\n') + '\n', maxBuffer: 110 * 1024 * 1024,
    });
    let offset = 0;
    for (const item of chunk) {
      const end = result.indexOf(10, offset);
      const size = Number(result.subarray(offset, end).toString('utf8').split(' ')[2]);
      offset = end + 1;
      scan(repo, item.path, result.subarray(offset, offset + size).toString('utf8'), item.id.slice(0, 12));
      offset += size + 1;
    }
  }
  console.log(JSON.stringify({ repo, historicalTextBlobsScanned: eligible.length }));
}
const grouped = new Map();
for (const item of findings) {
  const key = [item.repo, item.path, item.line, item.kind, item.fixture].join('|');
  const existing = grouped.get(key);
  if (existing) existing.versions++;
  else grouped.set(key, { ...item, versions: 1 });
}
console.log(JSON.stringify([...grouped.values()], null, 2));
