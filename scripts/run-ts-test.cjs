const fs = require('fs');
const path = require('path');
const Module = require('module');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');

function resolveTs(request, parentFilename) {
  if (request.startsWith('@/')) {
    return path.join(repoRoot, request.slice(2)) + '.ts';
  }
  if (request.startsWith('.')) {
    const base = path.resolve(path.dirname(parentFilename), request);
    for (const candidate of [base, `${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts')]) {
      if (fs.existsSync(candidate)) return candidate;
    }
  }
  return null;
}

require.extensions['.ts'] = function loadTs(module, filename) {
  const source = fs.readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
    },
    fileName: filename,
  }).outputText;
  module._compile(output, filename);
};

const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function patchedResolveFilename(request, parent, isMain, options) {
  if (parent?.filename) {
    const resolved = resolveTs(request, parent.filename);
    if (resolved) return resolved;
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

for (const file of fs.readdirSync(path.join(repoRoot, 'tests')).filter((name) => name.endsWith('.test.ts')).sort()) {
  require(path.join(repoRoot, 'tests', file));
}
