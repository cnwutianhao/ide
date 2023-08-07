import * as vscode from 'vscode';
import axios from 'axios';

interface Rune {
    ming_id: string;
    ming_type: string;
    ming_grade: string;
    ming_name: string;
    ming_des: string;
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
            const response = await axios.get('https://pvp.qq.com/web201605/js/ming.json');
            const data = response.data;
            if (Array.isArray(data)) {
                this.runes = data as Rune[];
                this._onDidChangeTreeData.fire(undefined);
            }
        } catch (error) {
            vscode.window.showErrorMessage('铭文数据加载失败，请稍后再试。');
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
        const treeItem = new vscode.TreeItem(
            `${element.ming_name}`,
            vscode.TreeItemCollapsibleState.None
        );
        treeItem.id = element.ming_id;
        treeItem.contextValue = 'rune';
        treeItem.iconPath = vscode.Uri.parse(`https://game.gtimg.cn/images/yxzj/img201606/mingwen/${element.ming_id}.png`);
        treeItem.command = {
            title: 'Show HOK Rune Details',
            command: 'showHokRuneDetails',
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
    vscode.window.registerTreeDataProvider('hok_asst_runes', runeProvider);

    context.subscriptions.push(
        vscode.commands.registerCommand('showHokRuneDetails', (rune: Rune) => {
            const panel = vscode.window.createWebviewPanel(
                'runeDetails',
                `铭文 - ${rune.ming_name}`,
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
                <title>${rune.ming_name} Details</title>
            </head>
            
            <body>
                <h1>${rune.ming_name}</h1>
                <img src="https://game.gtimg.cn/images/yxzj/img201606/mingwen/${rune.ming_id}.png" alt="${rune.ming_name}" width="90" height="106">
                <p>${rune.ming_des}</p>
            </body>
            
            </html>
            `;
        })
    );
}
