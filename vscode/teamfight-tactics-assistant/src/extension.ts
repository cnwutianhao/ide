import * as vscode from 'vscode';
import { registerChessTreeView } from './chessTreeView';

export function activate(context: vscode.ExtensionContext) {
	registerChessTreeView(context);
}

export function deactivate() { }
