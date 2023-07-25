import * as vscode from 'vscode';
import axios from 'axios';

interface Hero {
    heroId: string;
    name: string;
    alias: string;
    title: string;
    roles: string[];
    attack: string;
    defense: string;
    magic: string;
    difficulty: string;
    iconUrl: string;
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
            const response = await axios.get('https://game.gtimg.cn/images/lol/act/img/js/heroList/hero_list.js?ts=2794914');
            const data = response.data;
            if (data && data.hero) {
                this.heroes = data.hero.map((hero: any) => ({
                    ...hero,
                    iconUrl: `https://game.gtimg.cn/images/lol/act/img/champion/${hero.alias}.png`
                }));
                this._onDidChangeTreeData.fire(undefined);
            }
        } catch (error) {
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
        const treeItem = new vscode.TreeItem(`${element.name} (${element.title})`);
        treeItem.id = element.heroId;
        treeItem.contextValue = 'hero';
        treeItem.iconPath = vscode.Uri.parse(element.iconUrl);
        treeItem.command = {
            title: 'Show Hero Details',
            command: 'showHeroDetails',
            arguments: [element],
        };
        return treeItem;
    }
}

export function registerHeroTreeView(context: vscode.ExtensionContext) {
    const heroProvider = new HeroProvider();
    vscode.window.registerTreeDataProvider('lol_asst_heroes', heroProvider);

    context.subscriptions.push(
        vscode.commands.registerCommand('showHeroDetails', async (hero: Hero) => {
            try {
                const response = await axios.get(`https://game.gtimg.cn/images/lol/act/img/js/hero/${hero.heroId}.js?ts=2794916`);
                const data = response.data;
                const heroDetails = data.hero;
                const skinDetails = data.skins;
                const panel = vscode.window.createWebviewPanel(
                    'heroDetails',
                    `英雄 - ${hero.name}`,
                    vscode.ViewColumn.One,
                    {}
                );

                // Create the HTML content of the webview panel with mainImg above shortBio
                const htmlContent = `
                <!DOCTYPE html>
                <html>
                
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>${hero.name} Details</title>
                </head>
                
                <body>
                    <h1>${hero.name}</h1>
                    <h2>${hero.title}</h2>
                    <img src="${skinDetails[0].mainImg}" alt="${hero.name} Icon" style="max-width: 300px;">
                    <p>${heroDetails.shortBio}</p>
                </body>
                
                </html>
                `;

                // Set the HTML content of the webview panel
                panel.webview.html = htmlContent;
            } catch (error) {
                console.error(error);
            }
        })
    );
}

export function activate(context: vscode.ExtensionContext) {
    registerHeroTreeView(context);
}