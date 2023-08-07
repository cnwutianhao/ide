import * as vscode from 'vscode';
import axios from 'axios';

interface Item {
    itemId: string;
    name: string;
    iconPath: string;
    price: string;
    description: string;
    maps: string[];
    plaintext: string;
    sell: string;
    total: string;
    into: string[];
    from: string;
    suitHeroId: string;
    tag: string;
    types: string[];
    keywords: string;
}

class ItemProvider implements vscode.TreeDataProvider<Item> {
    private _onDidChangeTreeData = new vscode.EventEmitter<Item | undefined>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    private items: Item[] = [];

    constructor() {
        this.loadItems();
    }

    private async loadItems() {
        try {
            const response = await axios.get('https://game.gtimg.cn/images/lol/act/img/js/items/items.js?ts=2794915');
            const data = response.data;
            if (data && data.items) {
                // 过滤掉 price 为 0 的数据
                this.items = data.items.filter((item: Item) => item.price !== "0");
                this._onDidChangeTreeData.fire(undefined);
            }
        } catch (error) {
            vscode.window.showErrorMessage('装备数据加载失败，请稍后再试。');
            console.error(error);
        }
    }

    getChildren(element?: Item): vscode.ProviderResult<Item[]> {
        if (!element) {
            return this.items;
        }
        return [];
    }

    getTreeItem(element: Item): vscode.TreeItem {
        const treeItem = new vscode.TreeItem(`${element.name}`);
        treeItem.id = element.itemId;
        treeItem.contextValue = 'item';
        treeItem.iconPath = vscode.Uri.parse(element.iconPath);
        treeItem.command = {
            title: 'Show LOL Item Details',
            command: 'showLolItemDetails',
            arguments: [element],
        };
        return treeItem;
    }

    dispose() {
        this._onDidChangeTreeData.dispose();
    }
}

export function registerItemTreeView(context: vscode.ExtensionContext) {
    const itemProvider = new ItemProvider();
    vscode.window.registerTreeDataProvider('lol_asst_items', itemProvider);

    context.subscriptions.push(
        vscode.commands.registerCommand('showLolItemDetails', (item: Item) => {
            const panel = vscode.window.createWebviewPanel(
                'itemDetails',
                `装备 - ${item.name}`,
                vscode.ViewColumn.One,
                {}
            );

            // 注册 Webview 面板关闭事件，释放资源
            panel.onDidDispose(() => {
                // 在面板关闭时执行资源释放操作
                itemProvider.dispose();
            });

            panel.webview.html = `
            <!DOCTYPE html>
            <html>

            <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${item.name} Details</title>
            </head>

            <body>
            <h1>${item.name}</h1>
            <img src="${item.iconPath}" alt="${item.name}" width="64" height="64">
            <p>${item.description}</p>
            <p>价格: ${item.price}</p>
            </body>

            </html>
            `;
        })
    );
}
