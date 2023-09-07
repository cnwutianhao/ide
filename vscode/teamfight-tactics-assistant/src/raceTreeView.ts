import * as vscode from 'vscode';
import axios from 'axios';

interface Race {
    raceId: string;
    name: string;
    traitId: string;
    introduce: string;
    alias: string;
    level: Record<string, string>;
    TFTID: string;
    characterid: string;
    imagePath: string;
    race_color_list: string;
}

class RaceProvider implements vscode.TreeDataProvider<Race> {
    private _onDidChangeTreeData = new vscode.EventEmitter<Race | undefined>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    private races: Race[] = [];

    constructor() {
        this.loadRaces();
    }

    private async loadRaces() {
        try {
            const response = await axios.get('https://game.gtimg.cn/images/lol/act/img/tft/js/race.js');
            const data = response.data;
            if (data && data.data) {
                this.races = data.data.map((race: any) => ({
                    ...race,
                    iconUrl: race.imagePath
                }));
                this._onDidChangeTreeData.fire(undefined);
            }
        } catch (error) {
            vscode.window.showErrorMessage('羁绊（特质）数据加载失败，请稍后再试。');
            console.error(error);
        }
    }

    getChildren(element?: Race): vscode.ProviderResult<Race[]> {
        if (!element) {
            return this.races;
        }
        return [];
    }

    getTreeItem(element: Race): vscode.TreeItem {
        const treeItem = new vscode.TreeItem(`${element.name}`);
        treeItem.id = element.TFTID;
        treeItem.contextValue = 'race';
        treeItem.iconPath = vscode.Uri.parse(element.imagePath);
        treeItem.command = {
            title: 'Show TFT Race Details',
            command: 'showTftRaceDetails',
            arguments: [element],
        };
        return treeItem;
    }

    dispose() {
        this._onDidChangeTreeData.dispose();
    }
}

export function registerRaceTreeView(context: vscode.ExtensionContext) {
    const raceProvider = new RaceProvider();
    vscode.window.registerTreeDataProvider('tft_asst_race', raceProvider);

    context.subscriptions.push(
        vscode.commands.registerCommand('showTftRaceDetails', async (race: Race) => {
            const panel = vscode.window.createWebviewPanel(
                'raceDetails',
                `羁绊（特质） - ${race.name}`,
                vscode.ViewColumn.One,
                {}
            );

            panel.onDidDispose(() => {
                raceProvider.dispose();
            });

            panel.webview.html = `
            <!DOCTYPE html>
            <html>

            <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${race.name} Details</title>
            </head>

            <body>
            <h1>${race.name}</h1>
            <img src="${race.imagePath}" alt="${race.name}" width="64" height="64">
            <br />${race.introduce}
            </body>

            </html>
            `;
        })
    );
}
