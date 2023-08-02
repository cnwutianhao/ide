import * as vscode from 'vscode';
import axios from 'axios';
import * as iconv from 'iconv-lite';

interface Hero {
    ename: number;
    cname: string;
    title: string;
    pay_type: number;
    new_type: number;
    hero_type: number;
    hero_type2?: number;
    skin_name: string;
    moss_id: number;
    avatarUrl: string;
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
            const response = await axios.get('https://pvp.qq.com/web201605/js/herolist.json');
            const data = response.data;
            if (Array.isArray(data)) {
                this.heroes = data.map((hero: Hero) => {
                    hero.avatarUrl = `https://game.gtimg.cn/images/yxzj/img201606/heroimg/${hero.ename}/${hero.ename}-smallskin-1.jpg`;
                    return hero;
                });
                this._onDidChangeTreeData.fire(undefined);
            }
        } catch (error) {
            vscode.window.showErrorMessage('英雄数据加载失败，请稍后再试。');
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
        const treeItem = new vscode.TreeItem(`${element.cname} ${this.getPayTypeText(element.pay_type)}`, vscode.TreeItemCollapsibleState.None);
        treeItem.id = element.ename.toString();
        treeItem.contextValue = 'hero';
        treeItem.iconPath = vscode.Uri.parse(element.avatarUrl);
        treeItem.command = {
            title: 'Show Hero Details',
            command: 'showHeroDetails',
            arguments: [element],
        };
        return treeItem;
    }

    private getPayTypeText(payType: number): string {
        if (payType === 10) {
            return '（本周免费）';
        } else if (payType === 11) {
            return '（新手推荐）';
        }
        return '';
    }
}

export function registerHeroTreeView(context: vscode.ExtensionContext) {
    const heroProvider = new HeroProvider();
    vscode.window.registerTreeDataProvider('hok_asst_heroes', heroProvider);

    context.subscriptions.push(
        vscode.commands.registerCommand('showHeroDetails', async (hero: Hero) => {
            try {
                const response = await axios.get(`https://pvp.qq.com/web201605/herodetail/m/${hero.ename}.html`, {
                    responseType: 'arraybuffer', // Get response as ArrayBuffer
                });

                const heroDetailsHtmlBuffer = response.data;
                const heroDetailsHtml = iconv.decode(heroDetailsHtmlBuffer, 'gbk');
                const strippedHeroDetailsHtml = heroDetailsHtml
                    .replace(/<div class="logo_cont">[\s\S]*?<\/div>/gi, '')
                    .replace(/<div class="share-guide">[\s\S]*?<\/div>/gi, '')
                    .replace(/<div class="hero-cover">[\s\S]*?<\/div>/gi, '')
                    .replace(/src="\/\//g, 'src="https://')
                    .replace(/<a\b[^>]*>(.*?)<\/a>/gi, '');

                const panel = vscode.window.createWebviewPanel(
                    'heroDetails',
                    `英雄 - ${hero.cname}`,
                    vscode.ViewColumn.One,
                    {}
                );

                panel.webview.html = strippedHeroDetailsHtml;
            } catch (error) {
                vscode.window.showErrorMessage('无法加载英雄详情。');
                console.error(error);
            }
        })
    );
}
