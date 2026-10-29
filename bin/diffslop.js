#!/usr/bin/env node
import { auditGitDiff, auditAllFiles, formatReport, formatJson } from '../lib/index.js';

function parseArgs(args) {
  const options = {
    since: 'origin/main',
    staged: false,
    all: false,
    maxIndex: null,
    failOnSlop: false,
    json: false,
    quiet: false,
    help: false,
    version: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--version' || arg === '-v') {
      options.version = true;
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '--quiet' || arg === '-q') {
      options.quiet = true;
    } else if (arg === '--staged') {
      options.staged = true;
    } else if (arg === '--all') {
      options.all = true;
    } else if (arg === '--fail-on-slop') {
      options.failOnSlop = true;
      options.maxIndex = 0;
    } else if (arg === '--since') {
      options.since = args[++i];
    } else if (arg.startsWith('--since=')) {
      options.since = arg.slice(8);
    } else if (arg === '--max-index') {
      options.maxIndex = parseFloat(args[++i]);
    } else if (arg.startsWith('--max-index=')) {
      options.maxIndex = parseFloat(arg.slice(12));
    }
  }

  return options;
}

function showHelp() {
  console.log(`
  diffslop — Catch AI agent slop and weakened tests in your git diff

  USAGE
    $ npx diffslop [options]

  OPTIONS
    --since <ref>       Git ref to diff against (default: origin/main or HEAD~1)
    --staged            Audit staged git changes (for pre-commit hooks)
    --all               Audit all tracked source files in the repository
    --max-index <n>     Exit with code 1 if Slop Index exceeds n% (0-100)
    --fail-on-slop      Fail on any detected slop (alias for --max-index 0)
    --json              Print structured JSON result to stdout
    --quiet, -q         Suppress non-error output
    --version, -v       Show version
    --help, -h          Show help

  EXAMPLES
    $ npx diffslop                        # audit changes against origin/main
    $ npx diffslop --staged               # pre-commit check on staged diff
    $ npx diffslop --fail-on-slop         # strict CI gate: 0 tolerance
    $ npx diffslop --json | jq .slopIndex # inspect metric programmatically
`);
}

function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  if (options.version) {
    console.log('0.1.1');
    process.exit(0);
  }

  let result;
  if (options.all) {
    result = auditAllFiles();
  } else {
    result = auditGitDiff({
      since: options.since,
      staged: options.staged
    });
  }

  if (options.json) {
    console.log(formatJson(result));
  } else if (!options.quiet) {
    console.log(formatReport(result));
  }

  // Check exit thresholds
  if (options.maxIndex !== null) {
    if (result.slopIndex > options.maxIndex) {
      if (!options.json && !options.quiet) {
        console.error(`  FAIL: Slop Index ${result.slopIndex}% exceeds allowable threshold of ${options.maxIndex}%\n`);
      }
      process.exit(1);
    }
  }

  process.exit(0);
}

main();
