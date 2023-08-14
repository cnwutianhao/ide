import * as vscode from 'vscode';
import axios from 'axios';

interface SummonerSkill {
    id: string;
    name: string;
    description: string;
    summonerlevel: string;
    cooldown: string;
    gamemode: string;
    icon: string;
}

class SkillProvider implements vscode.TreeDataProvider<SummonerSkill> {
    private _onDidChangeTreeData = new vscode.EventEmitter<SummonerSkill | undefined>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    private skills: SummonerSkill[] = [];

    constructor() {
        this.loadSkills();
    }

    private async loadSkills() {
        try {
            const response = await axios.get('https://game.gtimg.cn/images/lol/act/img/js/summonerskillList/summonerskill_list.js');
            const data = response.data;
            if (data && data.summonerskill) {
                const allSkills = Object.values(data.summonerskill).map((skill: unknown) => skill as SummonerSkill);

                // 如果 name 的值一样，并且 description 的值也一样，就将 gamemode 的值合并
                const mergedSkills: SummonerSkill[] = [];
                allSkills.forEach(skill => {
                    const existingSkill = mergedSkills.find(s => s.name === skill.name && s.description === skill.description);
                    if (existingSkill) {
                        existingSkill.gamemode += `, ${skill.gamemode}`;
                    } else {
                        mergedSkills.push(skill);
                    }
                });

                this.skills = mergedSkills;
                this._onDidChangeTreeData.fire(undefined);
            }
        } catch (error) {
            vscode.window.showErrorMessage('召唤师技能数据加载失败，请稍后再试。');
            console.error(error);
        }
    }

    getChildren(element?: SummonerSkill): vscode.ProviderResult<SummonerSkill[]> {
        if (!element) {
            return this.skills.filter(skill => skill.name && skill.gamemode);
        }
        return [];
    }

    getTreeItem(element: SummonerSkill): vscode.TreeItem {
        const treeItem = new vscode.TreeItem(`${element.name}`, vscode.TreeItemCollapsibleState.None);
        treeItem.id = element.id;
        treeItem.contextValue = 'skill';
        treeItem.iconPath = vscode.Uri.parse(element.icon);
        treeItem.command = {
            title: 'Show Summoner Skill Details',
            command: 'showSummonerSkillDetails',
            arguments: [element],
        };
        return treeItem;
    }

    dispose() {
        this._onDidChangeTreeData.dispose();
    }
}

export function registerSkillTreeView(context: vscode.ExtensionContext) {
    const skillProvider = new SkillProvider();
    vscode.window.registerTreeDataProvider('lol_asst_skills', skillProvider);

    context.subscriptions.push(
        vscode.commands.registerCommand('showSummonerSkillDetails', (skill: SummonerSkill) => {
            const panel = vscode.window.createWebviewPanel(
                'skillDetails',
                `召唤师技能 - ${skill.name}`,
                vscode.ViewColumn.One,
                {}
            );

            panel.onDidDispose(() => {
                skillProvider.dispose();
            });

            panel.webview.html = `
            <!DOCTYPE html>
            <html>
            
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>${skill.name} Details</title>
            </head>
            
            <body>
              <h1>${skill.name}</h1>
              <img src="${skill.icon}" alt="${skill.name}" width="64" height="64">
              <p>${skill.description}</p>
              <p>召唤师等级要求：${skill.summonerlevel}</p>
              <p>冷却时间：${skill.cooldown} 秒</p>
              <p>适用游戏模式：${skill.gamemode}</p>
            </body>
            
            </html>
            `;
        })
    );
}
