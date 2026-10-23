import fs from 'node:fs/promises';
import path from 'node:path';
import prettier from 'prettier';
import { parsers } from 'prettier/plugins/babel';

// Prettier owns indentation; this final pass keeps dotted chains together.
function joinMemberAccess(source, ast) {
  const edits = [];
  function visit(node) {
    if (!node || typeof node !== 'object') {
      return;
    }
    if (
      ['MemberExpression', 'OptionalMemberExpression'].includes(node.type) &&
      !node.computed
    ) {
      const start = node.object.end;
      const end = node.property.start;
      const gap = source.slice(start, end);
      if (/^\s*\??\.\s*$/.test(gap) && /\s/.test(gap)) {
        edits.push({ start, end, text: gap.replace(/\s/g, '') });
      }
    }
    for (const [key, value] of Object.entries(node)) {
      if (['loc', 'extra', 'comments', 'tokens'].includes(key)) {
        continue;
      }
      if (Array.isArray(value)) {
        value.forEach(visit);
      } else if (value && typeof value === 'object') {
        visit(value);
      }
    }
  }
  visit(ast.program);
  for (const edit of edits.sort((left, right) => {
    return right.start - left.start;
  })) {
    source = source.slice(0, edit.start) + edit.text + source.slice(edit.end);
  }
  return source;
}

async function collect(directory) {
  const files = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    if (['node_modules', 'dist', '.git'].includes(entry.name)) {
      continue;
    }
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collect(file)));
    } else if (/\.(js|jsx|mjs|cjs)$/.test(file)) {
      files.push(file);
    }
  }
  return files;
}

const check = process.argv.includes('--check');
const files = [];
for (const directory of [
  'frontend',
  'web-panel',
  'backend',
  'shared',
  'api',
  'scripts',
]) {
  files.push(...(await collect(directory)));
}
let changed = 0;
for (const file of files) {
  const source = await fs.readFile(file, 'utf8');
  const config = await prettier.resolveConfig(file);
  let output = source;
  // Settle indentation around multiline call arguments after joining chains.
  for (let pass = 0; pass < 4; pass++) {
    const formatted = await prettier.format(output, {
      ...config,
      filepath: file,
    });
    const next = joinMemberAccess(
      formatted,
      await parsers.babel.parse(formatted),
    );
    if (next === output) {
      break;
    }
    output = next;
  }
  if (source !== output) {
    changed++;
    if (check) {
      console.error(`Needs formatting: ${file}`);
    } else {
      await fs.writeFile(file, output);
    }
  }
}
console.log(
  `${files.length} files checked; ${changed} ${check ? 'need formatting' : 'formatted'}.`,
);
if (check && changed) {
  process.exitCode = 1;
}
