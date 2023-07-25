import * as vscode from 'vscode';
import { registerHeroTreeView } from './heroTreeView';
import { registerItemTreeView } from './itemTreeView';

export function activate(context: vscode.ExtensionContext) {
	registerHeroTreeView(context);
	registerItemTreeView(context);
}

export function deactivate() { }
