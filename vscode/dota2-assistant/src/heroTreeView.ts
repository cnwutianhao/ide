import * as vscode from 'vscode';
import axios from 'axios';

interface Hero {
    id: number;
    name: string;
    name_loc: string;
    name_english_loc: string;
    primary_attr: number;
    complexity: number;
}

interface Ability {
    id: number;
    name: string;
    name_loc: string;
    desc_loc: string;
}

class HeroProvider implements vscode.TreeDataProvider<Hero> {
    private _onDidChangeTreeData = new vscode.EventEmitter<Hero | undefined>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    private heroes: Hero[] = [];

    constructor() {
        this.loadHeroes();
    }

    private async loadHeroes() {
        try {
            const response = await axios.get('https://www.dota2.com/datafeed/herolist?language=schinese');
            const data = response.data.result.data;
            if (data && data.heroes) {
                this.heroes = data.heroes;
                this._onDidChangeTreeData.fire(undefined);
            }
        } catch (error) {
            vscode.window.showErrorMessage('英雄列表数据加载失败，请稍后再试。');
            console.error(error);
        }
    }

    getChildren(element?: Hero): vscode.ProviderResult<Hero[]> {
        if (!element) {
            return this.heroes;
        }
        return [];
    }

    getTreeItem(element: Hero): vscode.TreeItem {
        const treeItem = new vscode.TreeItem(`${element.name_loc}`, vscode.TreeItemCollapsibleState.None);
        treeItem.id = element.id.toString();
        treeItem.contextValue = 'hero';
        treeItem.iconPath = vscode.Uri.parse(`https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${element.name.replace('npc_dota_hero_', '')}.png`);
        treeItem.command = {
            title: 'Show Dota 2 Hero Details',
            command: 'showDota2HeroDetails',
            arguments: [element],
        };
        return treeItem;
    }
}

export function registerHeroTreeView(context: vscode.ExtensionContext) {
    const heroProvider = new HeroProvider();
    vscode.window.registerTreeDataProvider('dota_asst_heroes', heroProvider);

    context.subscriptions.push(
        vscode.commands.registerCommand('showDota2HeroDetails', async (hero: Hero) => {
            try {
                const response = await axios.get(`https://www.dota2.com/datafeed/herodata?language=schinese&hero_id=${hero.id}`);
                const heroData = response.data.result.data.heroes[0];

                const panel = vscode.window.createWebviewPanel(
                    'heroDetails',
                    `英雄 - ${hero.name_loc}`,
                    vscode.ViewColumn.One,
                    {}
                );

                const heroAbilities = heroData.abilities;

                const htmlContent = `
                <!DOCTYPE html>
                <html>
                
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>${heroData.name_loc} Details</title>
                </head>
                
                <body>
                  <h1>${heroData.name_loc}</h1>
                  <img src="https://cdn.cloudflare.steamstatic.com/apps/dota2/videos/dota_react/heroes/renders/${heroData.name.replace('npc_dota_hero_', '')}.png" style="max-width: 500px;">
                
                  <h2>背景</h2>
                  <p>${heroData.bio_loc}</p>
                  <p>${heroData.hype_loc}</p>
                  <p>${heroData.npe_desc_loc}</p>
                
                  <h2>技能</h2>
                  <ul>
                    ${heroAbilities.map((ability: Ability) => `
                    <li>
                      <img src="https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/abilities/${ability.name}.png" style="max-width: 80px;">
                      <h3>${ability.name_loc}</h3>
                      <p>${ability.desc_loc}</p>
                    </li>
                    `).join('')}
                  </ul>
                </body>
                
                </html>
                `;

                panel.webview.html = htmlContent;
            } catch (error) {
                vscode.window.showErrorMessage('英雄详情数据加载失败，请稍后再试。');
                console.error(error);
            }
        })
    );
}
