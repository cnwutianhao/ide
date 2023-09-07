import * as vscode from 'vscode';
import axios from 'axios';

interface Job {
    jobId: string;
    name: string;
    traitId: string;
    introduce: string;
    alias: string;
    level: Record<string, string>;
    TFTID: string;
    characterid: string;
    imagePath: string;
    job_color_list: string;
}

class JobProvider implements vscode.TreeDataProvider<Job> {
    private _onDidChangeTreeData = new vscode.EventEmitter<Job | undefined>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    private jobs: Job[] = [];

    constructor() {
        this.loadJobs();
    }

    private async loadJobs() {
        try {
            const response = await axios.get('https://game.gtimg.cn/images/lol/act/img/tft/js/job.js');
            const data = response.data;
            if (data && data.data) {
                this.jobs = data.data.filter((job: Job) => job.characterid !== "");
                this._onDidChangeTreeData.fire(undefined);
            }
        } catch (error) {
            vscode.window.showErrorMessage('羁绊（职业）数据加载失败，请稍后再试。');
            console.error(error);
        }
    }

    getChildren(element?: Job): vscode.ProviderResult<Job[]> {
        if (!element) {
            return this.jobs;
        }
        return [];
    }

    getTreeItem(element: Job): vscode.TreeItem {
        const treeItem = new vscode.TreeItem(`${element.name}`);
        treeItem.id = element.TFTID;
        treeItem.contextValue = 'job';
        treeItem.iconPath = vscode.Uri.parse(element.imagePath);
        treeItem.command = {
            title: 'Show TFT Job Details',
            command: 'showTftJobDetails',
            arguments: [element],
        };
        return treeItem;
    }

    dispose() {
        this._onDidChangeTreeData.dispose();
    }
}

export function registerJobTreeView(context: vscode.ExtensionContext) {
    const jobProvider = new JobProvider();
    vscode.window.registerTreeDataProvider('tft_asst_job', jobProvider);

    context.subscriptions.push(
        vscode.commands.registerCommand('showTftJobDetails', async (job: Job) => {
            const panel = vscode.window.createWebviewPanel(
                'jobDetails',
                `羁绊（职业） - ${job.name}`,
                vscode.ViewColumn.One,
                {}
            );

            panel.onDidDispose(() => {
                jobProvider.dispose();
            });

            panel.webview.html = `
            <!DOCTYPE html>
            <html>

            <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${job.name} Details</title>
            </head>

            <body>
            <h1>${job.name}</h1>
            <img src="${job.imagePath}" alt="${job.name}" width="64" height="64">
            <br />${job.introduce}
            </body>

            </html>
            `;
        })
    );
}
