import * as vscode from 'vscode';
import axios from 'axios';

interface Item {
    item_id: number;
    item_name: string;
    item_type: number;
    price: number;
    total_price: number;
    des1: string;
    des2?: string;
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
            const response = await axios.get('https://pvp.qq.com/web201605/js/item.json');
            const data = response.data;
            if (Array.isArray(data)) {
                this.items = data as Item[];
                this._onDidChangeTreeData.fire(undefined);
            }
        } catch (error) {
            vscode.window.showErrorMessage('局内道具数据加载失败，请稍后再试。');
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
        const treeItem = new vscode.TreeItem(
            `${element.item_name}`,
            vscode.TreeItemCollapsibleState.None
        );
        treeItem.id = element.item_id.toString();
        treeItem.contextValue = 'item';
        treeItem.iconPath = vscode.Uri.parse(`https://game.gtimg.cn/images/yxzj/img201606/itemimg/${element.item_id}.jpg`);
        treeItem.command = {
            title: 'Show HOK Item Details',
            command: 'showHokItemDetails',
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
    vscode.window.registerTreeDataProvider('hok_asst_items', itemProvider);

    context.subscriptions.push(
        vscode.commands.registerCommand('showHokItemDetails', (item: Item) => {
            const panel = vscode.window.createWebviewPanel(
                'itemDetails',
                `局内道具 - ${item.item_name}`,
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
                <title>${item.item_name} Details</title>
            </head>
            
            <body>
                <h1>${item.item_name}</h1>
                <img src="https://game.gtimg.cn/images/yxzj/img201606/itemimg/${item.item_id}.jpg" alt="${item.item_name}" width="87" height="87">
                <p>${item.des1}</p>
                ${item.des2 ? `<p>${item.des2}</p>` : ''}
                <p>售价: ${item.price}</p>
                <p>总价: ${item.total_price}</p>
            </body>
            
            </html>
            `;
        })
    );
}
