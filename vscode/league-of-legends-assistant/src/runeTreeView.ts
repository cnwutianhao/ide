import * as vscode from 'vscode';
import axios from 'axios';

interface Rune {
    id: string;
    name: string;
    icon: string;
    tooltip: string;
    shortdesc: string;
    longdesc: string;
    slotLabel: string;
    styleName: string;
}

class RuneProvider implements vscode.TreeDataProvider<Rune> {
    private _onDidChangeTreeData = new vscode.EventEmitter<Rune | undefined>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    private runes: Rune[] = [];

    constructor() {
        this.loadRunes();
    }

    private async loadRunes() {
        try {
            const response = await axios.get('https://game.gtimg.cn/images/lol/act/img/js/runeList/rune_list.js');
            const data = response.data;
            if (data && data.rune) {
                this.runes = Object.values(data.rune).map((rune: unknown) => rune as Rune);
                this._onDidChangeTreeData.fire(undefined);
            }
        } catch (error) {
            vscode.window.showErrorMessage('符文数据加载失败，请稍后再试。');
            console.error(error);
        }
    }

    getChildren(element?: Rune): vscode.ProviderResult<Rune[]> {
        if (!element) {
            return this.runes;
        }
        return [];
    }

    getTreeItem(element: Rune): vscode.TreeItem {
        const treeItem = new vscode.TreeItem(`${element.name}`, vscode.TreeItemCollapsibleState.None);
        treeItem.id = element.id;
        treeItem.contextValue = 'rune';
        treeItem.iconPath = vscode.Uri.parse(element.icon);
        treeItem.command = {
            title: 'Show LOL Rune Details',
            command: 'showLolRuneDetails',
            arguments: [element],
        };
        return treeItem;
    }

    dispose() {
        this._onDidChangeTreeData.dispose();
    }
}

export function registerRuneTreeView(context: vscode.ExtensionContext) {
    const runeProvider = new RuneProvider();
    vscode.window.registerTreeDataProvider('lol_asst_runes', runeProvider);

    context.subscriptions.push(
        vscode.commands.registerCommand('showLolRuneDetails', (rune: Rune) => {
            const panel = vscode.window.createWebviewPanel(
                'runeDetails',
                `符文 - ${rune.name}`,
                vscode.ViewColumn.One,
                {}
            );

            // 注册 Webview 面板关闭事件，释放资源
            panel.onDidDispose(() => {
                // 在面板关闭时执行资源释放操作
                runeProvider.dispose();
            });

            panel.webview.html = `
            <!DOCTYPE html>
            <html>
            
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>${rune.name} Details</title>
            </head>
            
            <body>
              <h1>${rune.name}</h1>
              <img src="${rune.icon}" alt="${rune.name}" width="64" height="64">
              ${rune.longdesc
                    ? `<p>${rune.longdesc}</p>`
                    : `<p>${rune.tooltip}</p>`
                }
            </body>
            
            </html>
            `;
        })
    );
}
