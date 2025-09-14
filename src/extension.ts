import * as vscode from 'vscode';
import { TeamGrassProvider } from './providers/TeamGrassProvider';
import { ConfigurationManager } from './services/ConfigurationManager';
import { GitService } from './services/GitService';
import { Logger } from './utils/Logger';

export async function activate(context: vscode.ExtensionContext) {
    const logger = new Logger('TeamGrassTracker');
    const configManager = new ConfigurationManager();
    const gitService = new GitService(logger);
    
    // WebView Provider 등록
    const provider = new TeamGrassProvider(context.extensionUri, configManager, gitService, logger);
    
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(TeamGrassProvider.viewType, provider),
        
        // Commands
        vscode.commands.registerCommand('teamGrassTracker.refresh', () => provider.refresh()),
        vscode.commands.registerCommand('teamGrassTracker.addMember', () => provider.addMember()),
        vscode.commands.registerCommand('teamGrassTracker.selectRepository', () => provider.selectRepository()),
        vscode.commands.registerCommand('teamGrassTracker.attendanceCheck', () => provider.showAttendance()),
        
        // Configuration watcher
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('teamGrassTracker')) {
                provider.refresh();
            }
        })
    );
    
    logger.info('Team Grass Tracker activated successfully');
}

export function deactivate() {}
