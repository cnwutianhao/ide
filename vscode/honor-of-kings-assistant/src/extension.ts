import * as vscode from 'vscode';
import { registerHeroTreeView } from './heroTreeView';
import { registerItemTreeView } from './itemTreeView';
import { registerRuneTreeView } from './runeTreeView';

export function activate(context: vscode.ExtensionContext) {
    registerHeroTreeView(context);
    registerItemTreeView(context);
    registerRuneTreeView(context);
}

export function deactivate() { }