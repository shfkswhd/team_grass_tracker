import * as vscode from 'vscode';
import { GrassSVGGenerator, CommitData, UserConfig } from './svgGenerator';

export class ReadmeUpdater {
    private svgGenerator: GrassSVGGenerator;

    constructor() {
        this.svgGenerator = new GrassSVGGenerator();
    }

    public async updateReadmeWithGrassCalendar(users: UserConfig[]): Promise<void> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('워크스페이스 폴더를 찾을 수 없습니다.');
            return;
        }

        try {
            // 샘플 커밋 데이터 (나중에 실제 Git 데이터로 교체)
            const commitData: CommitData[] = Array.from({length: 30}, (_, i) => ({
                date: new Date(Date.now() - (29-i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                count: Math.floor(Math.random() * 5)
            }));

            let readmeContent = '# Team Grass Tracker\n\n알고리즘 문제 해결 팀 잔디 대결!\n\n';
            
            for (const user of users) {
                const svgContent = this.svgGenerator.generateSVG(commitData, user);
                readmeContent += `## ${user.name}\n\n${svgContent}\n\n`;
            }

            const readmeUri = vscode.Uri.joinPath(workspaceFolder.uri, 'README.md');
            const encoder = new TextEncoder();
            await vscode.workspace.fs.writeFile(readmeUri, encoder.encode(readmeContent));
            
            vscode.window.showInformationMessage('README.md가 업데이트되었습니다!');
        } catch (error) {
            vscode.window.showErrorMessage(`README 업데이트 실패: ${error}`);
        }
    }
}
