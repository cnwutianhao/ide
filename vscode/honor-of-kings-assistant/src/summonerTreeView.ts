import * as vscode from 'vscode';
import axios from 'axios';

interface Summoner {
    summoner_id: string;
    summoner_name: string;
    summoner_rank: string;
    summoner_description: string
}

class SummonerProvider implements vscode.TreeDataProvider<Summoner> {
    private _onDidChangeTreeData = new vscode.EventEmitter<Summoner | undefined>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    private summoners: Summoner[] = [];

    constructor() {
        this.loadSummoners();
    }

    private async loadSummoners() {
        try {
            const response = await axios.get('https://pvp.qq.com/web201605/js/summoner.json');
            const data = response.data;
            if (Array.isArray(data)) {
                this.summoners = data as Summoner[];
                this._onDidChangeTreeData.fire(undefined);
            }
        } catch (error) {
            vscode.window.showErrorMessage('召唤师技能数据加载失败，请稍后再试。');
            console.error(error);
        }
    }

    getChildren(element?: Summoner): vscode.ProviderResult<Summoner[]> {
        if (!element) {
            return this.summoners;
        }
        return [];
    }

    getTreeItem(element: Summoner): vscode.TreeItem {
        const treeItem = new vscode.TreeItem(
            `${element.summoner_name}`,
            vscode.TreeItemCollapsibleState.None
        );
        treeItem.id = element.summoner_id;
        treeItem.contextValue = 'summoner';
        treeItem.iconPath = vscode.Uri.parse(`https://game.gtimg.cn/images/yxzj/img201606/summoner/${element.summoner_id}.jpg`);
        treeItem.command = {
            title: 'Show HOK Summoner Details',
            command: 'showHokSummonerDetails',
            arguments: [element],
        };
        return treeItem;
    }

    dispose() {
        this._onDidChangeTreeData.dispose();
    }
}

export function registerSummonerTreeView(context: vscode.ExtensionContext) {
    const summonerProvider = new SummonerProvider();
    vscode.window.registerTreeDataProvider('hok_asst_summoners', summonerProvider);

    context.subscriptions.push(
        vscode.commands.registerCommand('showHokSummonerDetails', (summoner: Summoner) => {
            const panel = vscode.window.createWebviewPanel(
                'summonerDetails',
                `召唤师技能 - ${summoner.summoner_name}`,
                vscode.ViewColumn.One,
                {}
            );

            // 注册 Webview 面板关闭事件，释放资源
            panel.onDidDispose(() => {
                // 在面板关闭时执行资源释放操作
                summonerProvider.dispose();
            });

            panel.webview.html = `
            <!DOCTYPE html>
            <html>
            
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${summoner.summoner_name} Details</title>
            </head>
            
            <body>
                <h1>${summoner.summoner_name}</h1>
                <img src="https://game.gtimg.cn/images/yxzj/img201606/summoner/${summoner.summoner_id}.jpg" alt="${summoner.summoner_name}" width="90" height="106">
                <p>${summoner.summoner_rank}</p]>
                <p>${summoner.summoner_description}</p>
                <img src="https://game.gtimg.cn/images/yxzj/img201606/summoner/${summoner.summoner_id}-big.jpg" alt="${summoner.summoner_name}">
            </body>
            
            </html>
            `;
        })
    );
}