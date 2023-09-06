import * as vscode from 'vscode';
import axios from 'axios';

interface Chess {
    chessId: string;
    title: string;
    displayName: string;
    raceIds: string;
    jobIds: string;
    price: string;
    skillName: string;
    skillType: string;
    skillImage: string;
    skillIntroduce: string;
    skillDetail: string;
    life: string;
    magic: string;
    startMagic: string;
    armor: string;
    spellBlock: string;
    attackMag: string;
    attack: string;
    attackSpeed: string;
    attackRange: string;
    crit: string;
    originalImage: string;
    lifeMag: string;
    TFTID: string;
    illustrate: string;
    recEquip: string;
    proStatus: string;
    hero_EN_name: string;
    races: string;
    jobs: string;
    attackData: string;
    lifeData: string;
}

class ChessProvider implements vscode.TreeDataProvider<Chess> {
    private _onDidChangeTreeData = new vscode.EventEmitter<Chess | undefined>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    private chesses: Chess[] = [];

    constructor() {
        this.loadChesses();
    }

    private async loadChesses() {
        try {
            const response = await axios.get('https://game.gtimg.cn/images/lol/act/img/tft/js/chess.js');
            const data = response.data;
            if (data && data.data) {
                this.chesses = data.data.map((chess: any) => ({
                    ...chess,
                    iconUrl: `https://game.gtimg.cn/images/lol/act/img/tft/champions/${chess.TFTID}.png`
                }));
                this._onDidChangeTreeData.fire(undefined);
            }
        } catch (error) {
            vscode.window.showErrorMessage('英雄数据加载失败，请稍后再试。');
            console.error(error);
        }
    }

    getChildren(element?: Chess): vscode.ProviderResult<Chess[]> {
        if (!element) {
            return this.chesses;
        }
        return [];
    }

    getTreeItem(element: Chess): vscode.TreeItem {
        const treeItem = new vscode.TreeItem(`${element.title} ${element.displayName}`);
        treeItem.id = element.TFTID;
        treeItem.contextValue = 'chess';
        treeItem.iconPath = vscode.Uri.parse(`https://game.gtimg.cn/images/lol/act/img/tft/champions/${element.TFTID}.png`);
        treeItem.command = {
            title: 'Show TFT Chess Details',
            command: 'showTftChessDetails',
            arguments: [element],
        };
        return treeItem;
    }

    dispose() {
        this._onDidChangeTreeData.dispose();
    }
}

export function registerChessTreeView(context: vscode.ExtensionContext) {
    const chessProvider = new ChessProvider();
    vscode.window.registerTreeDataProvider('tft_asst_chess', chessProvider);

    context.subscriptions.push(
        vscode.commands.registerCommand('showTftChessDetails', async (chess: Chess) => {
            const panel = vscode.window.createWebviewPanel(
                'chessDetails',
                `英雄 - ${chess.title} ${chess.displayName}`,
                vscode.ViewColumn.One,
                {}
            );

            panel.onDidDispose(() => {
                chessProvider.dispose();
            });

            panel.webview.html = `
            <!DOCTYPE html>
            <html>
            
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${chess.title} ${chess.displayName} Details</title>
            </head>
            
            <body>
                <h1>${chess.title}</h1>
                <h2>${chess.displayName}</h2>
                <img src="https://game.gtimg.cn/images/lol/tftstore/s9/624x318/${chess.TFTID}.jpg"
                    alt="${chess.title} ${chess.displayName} Icon" style="max-width: 500px;">
                <hr>
            
                <h3>英雄技能</h3>
                <h4>${chess.skillName}</h4>
                <img src="${chess.skillImage}" alt="${chess.skillName} Icon" style="max-width: 100px;">
                <br />类型：${chess.skillType}
                <br />描述：${chess.skillDetail}
                <hr>
            
                <h3>属性</h3>
                <br />生命：${chess.lifeData}
                <br />护甲：${chess.armor}
                <br />魔抗：${chess.spellBlock}
                <br />物攻：${chess.attackData}
                <br />攻速：${chess.attackSpeed}
                <br />暴击率：${chess.crit}%
                <br />攻击距离：${chess.attackRange}
                <br />初始法力值：${chess.startMagic}
                <br />法力值：${chess.magic}
                <hr>
            
                <h3>费用</h3>
                <br />${chess.price}金币
                <hr>
            
                <h3>羁绊</h3>
                <br />特质：${chess.races}
                <br />职业：${chess.jobs}
                <hr>
            </body>
            
            </html>
            `;
        })
    );
}