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
                const spellDetails = data.spells;
                const panel = vscode.window.createWebviewPanel(
                    'heroDetails',
                    `英雄 - ${hero.name}`,
                    vscode.ViewColumn.One,
                    {}
                );

                // 映射表将英文角色属性映射到对应的中文值
                const roleMapping = new Map<string, string>([
                    ['mage', '法师'],
                    ['fighter', '战士'],
                    ['tank', '坦克'],
                    ['assassin', '刺客'],
                    ['marksman', '射手'],
                    ['support', '辅助'],
                ]);

                // 在生成 HTML 内容时，将英雄属性替换为中文值
                const roles = heroDetails.roles.map((role: string) => roleMapping.get(role) || role).join('、');

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
                    <img src="${skinDetails[0].mainImg}" alt="${hero.name} Icon" style="max-width: 500px;">
                    <p>${heroDetails.shortBio}</p>
                    <hr>

                    <h3>版本</h3>
                    当前版本 ${data.version}
                    <br />更新时间 ${data.fileTime}
                    <hr>

                    <h3>基本信息</h3>
                    英雄属性 ${roles}
                    <br />生命值 ${parseFloat(heroDetails.hp).toFixed(3).replace(/\.?0+$/, '')}
                    <br />生命值回复 ${parseFloat(heroDetails.hpregen).toFixed(3).replace(/\.?0+$/, '')}
                    <br />魔法值 ${parseFloat(heroDetails.mp).toFixed(3).replace(/\.?0+$/, '')}
                    <br />魔法值回复 ${parseFloat(heroDetails.mpregen).toFixed(3).replace(/\.?0+$/, '')}
                    <br />移动速度 ${parseFloat(heroDetails.movespeed).toFixed(3).replace(/\.?0+$/, '')}
                    <br />攻击范围 ${parseFloat(heroDetails.attackrange).toFixed(3).replace(/\.?0+$/, '')}
                    <br />攻击力 ${parseFloat(heroDetails.attackdamage).toFixed(3).replace(/\.?0+$/, '')}
                    <br />攻击速度 ${parseFloat(heroDetails.attackspeed).toFixed(3).replace(/\.?0+$/, '')}
                    <br />护甲 ${parseFloat(heroDetails.armor).toFixed(3).replace(/\.?0+$/, '')}
                    <br />魔法抗性 ${parseFloat(heroDetails.spellblock).toFixed(3).replace(/\.?0+$/, '')}
                    <hr>

                    <h3>技能</h3>
                    ${spellDetails.map((spell: any) => {
                    // 将英文的 "passive" 转换为中文 "被动"
                    const spellKeyChinese = spell.spellKey === "passive" ? "被动" : spell.spellKey;
                    return `
                    <h4>${spell.name}（${spellKeyChinese}）</h4>
                    <img src="${spell.abilityIconPath}" alt="${spell.name} Icon" style="max-width: 100px;">
                    <p>${spell.description}</p>
                    `;
                    }).join('')}
                    <hr>

                    <h3>皮肤</h3>
                    ${skinDetails.map((skin: any) => {
                    // 检查 "chromasBelongId" 是否为 "0"，如果是则显示该皮肤图像
                    if (skin.chromasBelongId === "0") {
                    return `
                    <h4>${skin.name}</h4>
                    <img src="${skin.mainImg}" alt="${skin.name} Skin" style="max-width: 300px;">
                    `;
                    }
                    // 如果不满足条件，则返回空字符串，不显示该皮肤图像
                    return '';
                    }).join('')}
                    <hr>
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