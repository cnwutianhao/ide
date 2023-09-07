import * as vscode from 'vscode';
import axios from 'axios';

interface Equip {
    equipId: string;
    type: string;
    name: string;
    effect: string;
    keywords: string;
    formula: string;
    imagePath: string;
    TFTID: string;
    jobId: string;
    raceId: string;
    proStatus: string;
    isShow: string;
    englishName: string;
}

class EquipProvider implements vscode.TreeDataProvider<Equip> {
    private _onDidChangeTreeData = new vscode.EventEmitter<Equip | undefined>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    private equips: Equip[] = [];

    constructor() {
        this.loadEquips();
    }

    private async loadEquips() {
        try {
            const response = await axios.get('https://game.gtimg.cn/images/lol/act/img/tft/js/equip.js');
            const data = response.data;
            if (data && data.data) {
                this.equips = data.data.filter((equip: Equip) => equip.isShow !== "0");
                this._onDidChangeTreeData.fire(undefined);
            }
        } catch (error) {
            vscode.window.showErrorMessage('装备数据加载失败，请稍后再试。');
            console.error(error);
        }
    }

    getChildren(element?: Equip): vscode.ProviderResult<Equip[]> {
        if (!element) {
            return this.equips;
        }
        return [];
    }

    getTreeItem(element: Equip): vscode.TreeItem {
        const treeItem = new vscode.TreeItem(`${element.name}`);
        treeItem.id = element.TFTID;
        treeItem.contextValue = 'equip';
        treeItem.iconPath = vscode.Uri.parse(element.imagePath);
        treeItem.command = {
            title: 'Show TFT Equip Details',
            command: 'showTftEquipDetails',
            arguments: [element],
        };
        return treeItem;
    }

    dispose() {
        this._onDidChangeTreeData.dispose();
    }
}

export function registerEquipTreeView(context: vscode.ExtensionContext) {
    const equipProvider = new EquipProvider();
    vscode.window.registerTreeDataProvider('tft_asst_equip', equipProvider);

    context.subscriptions.push(
        vscode.commands.registerCommand('showTftEquipDetails', async (equip: Equip) => {
            const panel = vscode.window.createWebviewPanel(
                'equipDetails',
                `装备 - ${equip.name}`,
                vscode.ViewColumn.One,
                {}
            );

            panel.onDidDispose(() => {
                equipProvider.dispose();
            });

            panel.webview.html = `
            <!DOCTYPE html>
            <html>

            <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${equip.name} Details</title>
            </head>

            <body>
            <h1>${equip.name}</h1>
            <img src="${equip.imagePath}" alt="${equip.name}" width="64" height="64">
            <p>${equip.effect}</p>
            </body>

            </html>
            `;
        })
    );
}
