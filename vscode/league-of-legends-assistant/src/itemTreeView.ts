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

function extractRarityLegendary(text: string): string | null {
    const regex = /<rarityLegendary>(.*?)<\/rarityLegendary>/;
    const match = text.match(regex);
    return match ? match[1] : null;
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
                this.items = data.items;
                this._onDidChangeTreeData.fire(undefined);
            }
        } catch (error) {
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
        // 装备名称接口返回的有可能带 Html 标签，所以在显示时做一下处理
        const rarityLegendaryText = extractRarityLegendary(element.name);
        const displayName = rarityLegendaryText || element.name;

        const treeItem = new vscode.TreeItem(`${displayName}`);
        treeItem.id = element.itemId;
        treeItem.contextValue = 'item';
        treeItem.iconPath = vscode.Uri.parse(element.iconPath);
        treeItem.command = {
            title: 'Show Item Details',
            command: 'showItemDetails',
            arguments: [element],
        };
        return treeItem;
    }
}

export function registerItemTreeView(context: vscode.ExtensionContext) {
    const itemProvider = new ItemProvider();
    vscode.window.registerTreeDataProvider('lol_asst_items', itemProvider);

    context.subscriptions.push(
        vscode.commands.registerCommand('showItemDetails', (item: Item) => {
            // 装备名称接口返回的有可能带 Html 标签，所以在显示时做一下处理
            const itemTitle = extractRarityLegendary(item.name) || item.name;

            const panel = vscode.window.createWebviewPanel(
                'itemDetails',
                `装备 - ${itemTitle}`,
                vscode.ViewColumn.One,
                {}
            );

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
            </body>

            </html>
            `;
        })
    );
}
