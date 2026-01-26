/**
 * CLIProxy Alias Command Handler
 *
 * Handles `ccs cliproxy alias` commands for managing model alias mappings.
 */

import { addProfileAlias, removeProfileAlias, listAllAliases } from '../cliproxy/sync';
import { initUI, header, subheader, color, dim, ok, fail, warn, info, table } from '../utils/ui';

interface AliasArgs {
  subcommand: 'add' | 'remove' | 'list' | 'help' | null;
  profile?: string;
  from?: string;
  to?: string;
}

/**
 * Parse alias command arguments.
 */
export function parseAliasArgs(args: string[]): AliasArgs {
  const rawCommand = args[0];

  if (!rawCommand || rawCommand === 'help' || args.includes('--help')) {
    return { subcommand: 'help' };
  }

  if (rawCommand === 'list' || rawCommand === 'ls') {
    return { subcommand: 'list', profile: args[1] };
  }

  if (rawCommand === 'add') {
    // ccs cliproxy alias add <profile> <from> <to>
    return {
      subcommand: 'add',
      profile: args[1],
      from: args[2],
      to: args[3],
    };
  }

  if (rawCommand === 'remove' || rawCommand === 'rm' || rawCommand === 'delete') {
    // ccs cliproxy alias remove <profile> <from>
    return {
      subcommand: 'remove',
      profile: args[1],
      from: args[2],
    };
  }

  return { subcommand: null };
}

/**
 * Show alias command help.
 */
async function showAliasHelp(): Promise<void> {
  await initUI();
  console.log('');
  console.log(header('Model Alias Management'));
  console.log('');
  console.log(subheader('Usage:'));
  console.log(`  ${color('ccs cliproxy alias', 'command')} <command> [args]`);
  console.log('');

  console.log(subheader('Commands:'));
  const commands: [string, string][] = [
    ['list [profile]', 'List all aliases (or for specific profile)'],
    ['add <profile> <from> <to>', 'Add model alias mapping'],
    ['remove <profile> <from>', 'Remove model alias mapping'],
  ];

  const maxLen = Math.max(...commands.map(([cmd]) => cmd.length));
  for (const [cmd, desc] of commands) {
    console.log(`  ${color(cmd.padEnd(maxLen + 2), 'command')} ${desc}`);
  }

  console.log('');
  console.log(subheader('Examples:'));
  console.log(`  ${dim('# List all aliases')}`);
  console.log(`  ${color('ccs cliproxy alias list', 'command')}`);
  console.log('');
  console.log(`  ${dim('# Add alias for GLM profile')}`);
  console.log(
    `  ${color('ccs cliproxy alias add glm claude-sonnet-4-20250514 glm-4.7-thinking', 'command')}`
  );
  console.log('');
  console.log(`  ${dim('# Remove alias')}`);
  console.log(`  ${color('ccs cliproxy alias remove glm claude-sonnet-4-20250514', 'command')}`);
  console.log('');
}

/**
 * Handle `ccs cliproxy alias list` command.
 */
async function handleAliasList(profile?: string): Promise<void> {
  await initUI();
  const allAliases = listAllAliases();

  if (Object.keys(allAliases).length === 0) {
    console.log(info('No model aliases configured'));
    console.log('');
    console.log('Add aliases with:');
    console.log(`  ${color('ccs cliproxy alias add <profile> <from> <to>', 'command')}`);
    console.log('');
    return;
  }

  // Filter to specific profile if provided
  const profiles = profile ? { [profile]: allAliases[profile] } : allAliases;

  if (profile && !allAliases[profile]) {
    console.log(warn(`No aliases found for profile: ${profile}`));
    console.log('');
    return;
  }

  console.log(header('Model Aliases'));
  console.log('');

  for (const [profileName, aliases] of Object.entries(profiles)) {
    if (!aliases || aliases.length === 0) continue;

    console.log(subheader(profileName));

    const rows = aliases.map((a) => [a.from, color('->', 'info'), a.to]);
    console.log(
      table(rows, { head: ['Claude Model', '', 'Target Model'], colWidths: [35, 4, 30] })
    );
    console.log('');
  }
}

/**
 * Handle `ccs cliproxy alias add` command.
 */
async function handleAliasAdd(profile: string, from: string, to: string): Promise<void> {
  await initUI();

  if (!profile || !from || !to) {
    console.log(fail('Missing required arguments'));
    console.log('');
    console.log('Usage:');
    console.log(`  ${color('ccs cliproxy alias add <profile> <from> <to>', 'command')}`);
    console.log('');
    console.log('Example:');
    console.log(
      `  ${color('ccs cliproxy alias add glm claude-sonnet-4-20250514 glm-4.7-thinking', 'command')}`
    );
    console.log('');
    process.exit(1);
  }

  addProfileAlias(profile, from, to);

  console.log(ok(`Added alias for ${profile}`));
  console.log(`  ${from} -> ${to}`);
  console.log('');
  console.log(info('Run sync to apply changes:'));
  console.log(`  ${color('ccs cliproxy sync', 'command')}`);
  console.log('');
}

/**
 * Handle `ccs cliproxy alias remove` command.
 */
async function handleAliasRemove(profile: string, from: string): Promise<void> {
  await initUI();

  if (!profile || !from) {
    console.log(fail('Missing required arguments'));
    console.log('');
    console.log('Usage:');
    console.log(`  ${color('ccs cliproxy alias remove <profile> <from>', 'command')}`);
    console.log('');
    process.exit(1);
  }

  const removed = removeProfileAlias(profile, from);

  if (!removed) {
    console.log(warn(`Alias not found: ${profile}/${from}`));
    console.log('');
    return;
  }

  console.log(ok(`Removed alias from ${profile}`));
  console.log(`  ${from}`);
  console.log('');
  console.log(info('Run sync to apply changes:'));
  console.log(`  ${color('ccs cliproxy sync', 'command')}`);
  console.log('');
}

/**
 * Handle `ccs cliproxy alias` command router.
 */
export async function handleAlias(args: string[]): Promise<void> {
  const parsed = parseAliasArgs(args);

  switch (parsed.subcommand) {
    case 'list':
      await handleAliasList(parsed.profile);
      break;

    case 'add':
      if (parsed.profile && parsed.from && parsed.to) {
        await handleAliasAdd(parsed.profile, parsed.from, parsed.to);
      } else {
        await handleAliasAdd('', '', ''); // Will show error message
      }
      break;

    case 'remove':
      if (parsed.profile && parsed.from) {
        await handleAliasRemove(parsed.profile, parsed.from);
      } else {
        await handleAliasRemove('', ''); // Will show error message
      }
      break;

    case 'help':
    default:
      await showAliasHelp();
      break;
  }
}
