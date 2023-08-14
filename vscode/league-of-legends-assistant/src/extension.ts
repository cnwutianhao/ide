import * as vscode from 'vscode';
import { registerHeroTreeView } from './heroTreeView';
import { registerItemTreeView } from './itemTreeView';
import { registerRuneTreeView } from './runeTreeView';
import { registerSkillTreeView } from './skillTreeView';

export function activate(context: vscode.ExtensionContext) {
	registerHeroTreeView(context);
	registerItemTreeView(context);
	registerRuneTreeView(context);
	registerSkillTreeView(context);
}

export function deactivate() { }
