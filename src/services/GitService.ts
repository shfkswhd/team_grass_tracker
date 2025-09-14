import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../utils/Logger';

export interface CommitData {
    date: string;
    count: number;
}

export class GitService {
    constructor(private logger: Logger) {}
    
    async getCommitData(repoPath: string, author: string, year: number, month: number): Promise<CommitData[]> {
        if (!this.isValidRepository(repoPath)) {
            throw new Error(`Invalid repository: ${repoPath}`);
        }
        
        const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
        const endDate = new Date(year, month, 0);
        const endDateStr = `${year}-${month.toString().padStart(2, '0')}-${endDate.getDate().toString().padStart(2, '0')}`;
        
        try {
            const command = `git log --author="${author}" --since="${startDate}" --until="${endDateStr}" --pretty=format:"%ad" --date=short`;
            
            const result = execSync(command, {
                cwd: repoPath,
                encoding: 'utf8',
                stdio: ['pipe', 'pipe', 'ignore']
            });
            
            return this.parseCommitData(result, year, month);
        } catch (error) {
            this.logger.error(`Failed to get commit data for ${author}`, error);
            return this.getEmptyMonthData(year, month);
        }
    }
    
    async getRepositoryAuthors(repoPath: string): Promise<string[]> {
        if (!this.isValidRepository(repoPath)) {
            return [];
        }
        
        try {
            const command = 'git log --format="%an" --since="3 months ago" | sort | uniq';
            const result = execSync(command, {
                cwd: repoPath,
                encoding: 'utf8'
            });
            
            return result.split('\n').filter(author => author.trim());
        } catch (error) {
            this.logger.error('Failed to get repository authors', error);
            return [];
        }
    }
    
    private isValidRepository(path: string): boolean {
        return fs.existsSync(path) && fs.existsSync(`${path}/.git`);
    }
    
    private parseCommitData(gitOutput: string, year: number, month: number): CommitData[] {
        const dates = gitOutput.split('\n').filter(line => line.trim());
        const commitCounts = new Map<string, number>();
        
        dates.forEach(date => {
            const count = commitCounts.get(date) || 0;
            commitCounts.set(date, count + 1);
        });
        
        const daysInMonth = new Date(year, month, 0).getDate();
        const result: CommitData[] = [];
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            result.push({
                date: dateStr,
                count: commitCounts.get(dateStr) || 0
            });
        }
        
        return result;
    }
    
    private getEmptyMonthData(year: number, month: number): CommitData[] {
        const daysInMonth = new Date(year, month, 0).getDate();
        const result: CommitData[] = [];
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            result.push({ date: dateStr, count: 0 });
        }
        
        return result;
    }
}
