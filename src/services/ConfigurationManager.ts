import * as vscode from 'vscode';

export interface TeamMember {
    githubName: string;
    displayName: string;
    colorHue: number; // 0-360도
}

export class ConfigurationManager {
    private readonly CONFIG_SECTION = 'teamGrassTracker';
    
    get teamMembers(): TeamMember[] {
        return vscode.workspace.getConfiguration(this.CONFIG_SECTION).get('teamMembers', []);
    }
    
    get targetRepository(): string {
        return vscode.workspace.getConfiguration(this.CONFIG_SECTION).get('targetRepository', '');
    }
    
    get teamTitle(): string {
        return vscode.workspace.getConfiguration(this.CONFIG_SECTION).get('teamTitle', 'Team Grass Tracker');
    }
    
    async addMember(member: TeamMember): Promise<void> {
        const members = [...this.teamMembers, member];
        await this.updateMembers(members);
    }
    
    async updateMember(githubName: string, updates: Partial<TeamMember>): Promise<void> {
        const members = this.teamMembers.map(m => 
            m.githubName === githubName ? { ...m, ...updates } : m
        );
        await this.updateMembers(members);
    }
    
    async removeMember(githubName: string): Promise<void> {
        const members = this.teamMembers.filter(m => m.githubName !== githubName);
        await this.updateMembers(members);
    }
    
    async setRepository(path: string): Promise<void> {
        await vscode.workspace.getConfiguration(this.CONFIG_SECTION)
            .update('targetRepository', path, vscode.ConfigurationTarget.Workspace);
    }
    
    private async updateMembers(members: TeamMember[]): Promise<void> {
        await vscode.workspace.getConfiguration(this.CONFIG_SECTION)
            .update('teamMembers', members, vscode.ConfigurationTarget.Workspace);
    }
}
