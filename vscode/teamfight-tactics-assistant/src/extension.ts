import * as vscode from 'vscode';
import { registerChessTreeView } from './chessTreeView';
import { registerRaceTreeView } from './raceTreeView';
import { registerJobTreeView } from './jobTreeView';
import { registerEquipTreeView } from './equipTreeView';

export function activate(context: vscode.ExtensionContext) {
	registerChessTreeView(context);
	registerRaceTreeView(context);
	registerJobTreeView(context);
	registerEquipTreeView(context);
}

export function deactivate() { }
