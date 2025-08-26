import fs from 'fs';
import yaml from 'js-yaml';

/**
 * Represents the global configuration of Checkwise.
 */
export interface CheckwiseCfg {
  checklists: ChecklistRule[];
  options?: {
    label_filter?: string[];
    branch_pattern?: string;
    comment_header?: string;
  };
}

/**
 * Represents a checklist rule.
 */
export interface ChecklistRule {
  when: string[];      // Glob patterns of files to match
  require: string[];   // Required checklist items
  optional?: boolean;  // Whether the rule is optional
}

/**
 * Loads and validates the Checkwise YAML configuration.
 * @param path Path to the YAML file (default: .github/checkwise.yml)
 * @returns Typed CheckwiseCfg object
 * @throws Error if the file is missing, malformed, or invalid
 */
export function loadConfig(path = '.github/checkwise.yml'): CheckwiseCfg {
  let raw: any;
  try {
    const file = fs.readFileSync(path, 'utf8');
    raw = yaml.load(file);
  } catch (e: any) {
    if (e.code === 'ENOENT') {
      throw new Error(
        `Configuration file not found: "${path}". ` +
        `Create the file with your checklist rules or specify a different path with config-path.`
      );
    }
    if (e.name === 'YAMLException') {
      throw new Error(
        `YAML parsing error in "${path}": ${e.message}. ` +
        `Check the YAML syntax of the configuration file.`
      );
    }
    throw new Error(`Unable to read config YAML "${path}": ${e.message}`);
  }

  // Basic validation
  if (!raw || typeof raw !== 'object') {
    throw new Error(`Empty or invalid YAML config in "${path}". The file must contain a YAML object.`);
  }
  if (!raw.checklists) {
    throw new Error(`Config YAML in "${path}": missing "checklists" property. Example:\nchecklists:\n  - when: ["src/**/*.ts"]\n    require: ["Tests passed"]`);
  }
  if (!Array.isArray(raw.checklists)) {
    throw new Error(`Config YAML in "${path}": "checklists" must be an array. Found: ${typeof raw.checklists}`);
  }
  if (raw.checklists.length === 0) {
    throw new Error(`The "checklists" array is empty. Add at least one rule.`);
  }

  // Granular validation of rules
  for (const [i, rule] of raw.checklists.entries()) {
    const ruleContext = `Checklist rule #${i + 1} in "${path}"`;
    
    if (!rule || typeof rule !== 'object') {
      throw new Error(`${ruleContext}: must be an object. Found: ${typeof rule}`);
    }
    
    if (!rule.when) {
      throw new Error(`${ruleContext}: missing "when" property. Specify the glob patterns of the files to match.`);
    }
    if (!Array.isArray(rule.when)) {
      throw new Error(`${ruleContext}: "when" must be an array of glob patterns. Found: ${typeof rule.when}`);
    }
    if (rule.when.length === 0) {
      throw new Error(`${ruleContext}: "when" array is empty. Specify at least one glob pattern.`);
    }
    for (const [j, pattern] of rule.when.entries()) {
      if (typeof pattern !== 'string') {
        throw new Error(`${ruleContext}: pattern #${j + 1} in "when" must be a string. Found: ${typeof pattern}`);
      }
      if (pattern.trim().length === 0) {
        throw new Error(`${ruleContext}: pattern #${j + 1} in "when" is empty.`);
      }
    }
    
    if (!rule.require) {
      throw new Error(`${ruleContext}: missing "require" property. Specify the checklist items.`);
    }
    if (!Array.isArray(rule.require)) {
      throw new Error(`${ruleContext}: "require" must be an array of strings. Found: ${typeof rule.require}`);
    }
    if (rule.require.length === 0) {
      throw new Error(`${ruleContext}: "require" array is empty. Specify at least one checklist item.`);
    }
    for (const [j, item] of rule.require.entries()) {
      if (typeof item !== 'string') {
        throw new Error(`${ruleContext}: item #${j + 1} in "require" must be a string. Found: ${typeof item}`);
      }
      if (item.trim().length === 0) {
        throw new Error(`${ruleContext}: item #${j + 1} in "require" is empty.`);
      }
    }
    
    // Optional options validation
    if (rule.optional !== undefined && typeof rule.optional !== 'boolean') {
      throw new Error(`${ruleContext}: "optional" must be true/false. Found: ${typeof rule.optional}`);
    }
  }

  // Global options validation if present
  if (raw.options) {
    if (typeof raw.options !== 'object') {
      throw new Error(`Config YAML in "${path}": "options" must be an object. Found: ${typeof raw.options}`);
    }
    
    if (raw.options.label_filter !== undefined) {
      if (!Array.isArray(raw.options.label_filter)) {
        throw new Error(`Config YAML in "${path}": options.label_filter must be an array. Found: ${typeof raw.options.label_filter}`);
      }
      for (const [i, label] of raw.options.label_filter.entries()) {
        if (typeof label !== 'string') {
          throw new Error(`Config YAML in "${path}": options.label_filter[${i}] must be a string. Found: ${typeof label}`);
        }
      }
    }
    
    if (raw.options.branch_pattern !== undefined && typeof raw.options.branch_pattern !== 'string') {
      throw new Error(`Config YAML in "${path}": options.branch_pattern must be a string. Found: ${typeof raw.options.branch_pattern}`);
    }
    
    if (raw.options.comment_header !== undefined && typeof raw.options.comment_header !== 'string') {
      throw new Error(`Config YAML in "${path}": options.comment_header must be a string. Found: ${typeof raw.options.comment_header}`);
    }
  }

  return raw as CheckwiseCfg;
}