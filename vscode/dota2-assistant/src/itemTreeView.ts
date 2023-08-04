import * as vscode from 'vscode';
import axios from 'axios';

interface Item {
    id: number;
    name: string;
    name_loc: string;
    name_english_loc: string;
    neutral_item_tier: number;
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
            const response = await axios.get('https://www.dota2.com/datafeed/itemlist?language=schinese');
            const data = response.data.result.data;
            if (data && data.itemabilities) {
                this.items = data.itemabilities.filter((item: Item) => item.name_loc !== "");
                this._onDidChangeTreeData.fire(undefined);
            }
        } catch (error) {
            vscode.window.showErrorMessage('物品列表数据加载失败，请稍后再试。');
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
        let iconName: string;

        if (element.name.startsWith('item_recipe_')) {
            iconName = 'recipe';
        } else {
            iconName = element.name.replace('item_', '');
        }

        const treeItem = new vscode.TreeItem(`${element.name_loc}`, vscode.TreeItemCollapsibleState.None);
        treeItem.id = element.id.toString();
        treeItem.contextValue = 'item';
        treeItem.iconPath = vscode.Uri.parse(`https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/${iconName}.png`);
        treeItem.command = {
            title: 'Show Dota 2 Item Details',
            command: 'showDota2ItemDetails',
            arguments: [element],
        };
        return treeItem;
    }
}

export function registerItemTreeView(context: vscode.ExtensionContext) {
    const itemProvider = new ItemProvider();
    vscode.window.registerTreeDataProvider('dota_asst_items', itemProvider);

    context.subscriptions.push(
        vscode.commands.registerCommand('showDota2ItemDetails', async (item: Item) => {
            try {
                const response = await axios.get(`https://www.dota2.com/datafeed/itemdata?language=schinese&item_id=${item.id}`);
                const itemData = response.data.result.data.items[0];

                const panel = vscode.window.createWebviewPanel(
                    'itemDetails',
                    `物品 - ${item.name_loc}`,
                    vscode.ViewColumn.One,
                    {}
                );

                const descLoc = itemData.desc_loc.replace('h1', 'h4');
                const replacedDesc = descLoc.replace(/%(\w+)%/g, (match: string, paramName: string) => {
                    const specialValue = itemData.special_values.find((value: { name: string, values_float: number[] }) => value.name.toLowerCase() === paramName.toLowerCase());
                    return specialValue ? specialValue.values_float[0].toString() : match;
                });

                let iconName: string;
                if (item.name.startsWith('item_recipe_')) {
                    iconName = 'recipe';
                } else {
                    iconName = item.name.replace('item_', '');
                }

                const htmlContent = `
                <!DOCTYPE html>
                <html>

                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>${itemData.name_loc} Details</title>
                </head>

                <body>
                  <h1>${itemData.name_loc}</h1>
                  <img src="https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/${iconName}.png">
                  <p>${replacedDesc}</p>
                  <p>${itemData.notes_loc.join('<br>')}</p>
                  <p>${itemData.lore_loc}</p>
                  <p>价格：${itemData.item_cost}</p>
                </body>

                </html>
                `;

                panel.webview.html = htmlContent;
            } catch (error) {
                vscode.window.showErrorMessage('物品详情数据加载失败，请稍后再试。');
                console.error(error);
            }
        })
    );
}
