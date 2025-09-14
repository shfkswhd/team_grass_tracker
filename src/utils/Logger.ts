import * as vscode from 'vscode';

export class Logger {
    private outputChannel: vscode.OutputChannel;
    
    constructor(channelName: string) {
        this.outputChannel = vscode.window.createOutputChannel(channelName);
    }
    
    info(message: string, ...args: any[]): void {
        this.log('INFO', message, args);
    }
    
    warn(message: string, ...args: any[]): void {
        this.log('WARN', message, args);
    }
    
    error(message: string, error?: any): void {
        this.log('ERROR', message, error ? [error] : []);
    }
    
    debug(message: string, ...args: any[]): void {
        this.log('DEBUG', message, args);
    }
    
    private log(level: string, message: string, args: any[]): void {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${level}: ${message}`;
        
        this.outputChannel.appendLine(logMessage);
        if (args.length > 0) {
            this.outputChannel.appendLine(`  Args: ${JSON.stringify(args, null, 2)}`);
        }
        
        console.log(logMessage, ...args);
    }
    
    show(): void {
        this.outputChannel.show();
    }
    
    dispose(): void {
        this.outputChannel.dispose();
    }
}
