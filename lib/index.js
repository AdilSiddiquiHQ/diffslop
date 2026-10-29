// Public JavaScript API for diffslop.
export {
  auditGitDiff,
  auditRawDiff,
  auditParsedDiff,
  auditAllFiles,
  RULES,
  RULE_MAP
} from './engine.js';

export {
  parseDiff,
  getDiff,
  isTestFile,
  isSourceFile
} from './gitdiff.js';

export {
  formatReport,
  formatJson,
  makeProgressBar
} from './report.js';
