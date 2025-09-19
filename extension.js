const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// Logger 클래스
class Logger {
    constructor(channelName) {
        this.outputChannel = vscode.window.createOutputChannel(channelName);
    }
    
    info(message, ...args) {
        this.log('INFO', message, args);
    }
    
    warn(message, ...args) {
        this.log('WARN', message, args);
    }
    
    error(message, error) {
        this.log('ERROR', message, error ? [error] : []);
    }
    
    debug(message, ...args) {
        this.log('DEBUG', message, args);
    }
    
    log(level, message, args) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${level}: ${message}`;
        
        this.outputChannel.appendLine(logMessage);
        if (args.length > 0) {
            this.outputChannel.appendLine(`  Args: ${JSON.stringify(args, null, 2)}`);
        }
        
        console.log(logMessage, ...args);
    }
    
    show() {
        this.outputChannel.show();
    }
    
    dispose() {
        this.outputChannel.dispose();
    }
}

// Configuration Manager 클래스
class ConfigurationManager {
    constructor() {
        this.CONFIG_SECTION = 'teamGrassTracker';
    }
    
    getTarget() {
        const hasWorkspace = Array.isArray(vscode.workspace.workspaceFolders) && vscode.workspace.workspaceFolders.length > 0;
        return hasWorkspace ? vscode.ConfigurationTarget.Workspace : vscode.ConfigurationTarget.Global;
    }
    
    get teamMembers() {
        return vscode.workspace.getConfiguration(this.CONFIG_SECTION).get('teamMembers', []);
    }
    
    get targetRepository() {
        return vscode.workspace.getConfiguration(this.CONFIG_SECTION).get('targetRepository', '');
    }
    
    get teamTitle() {
        return vscode.workspace.getConfiguration(this.CONFIG_SECTION).get('teamTitle', 'Team Grass Tracker');
    }
    
    async addMember(member) {
        const members = [...this.teamMembers, member];
        await this.updateMembers(members);
    }
    
    async updateMember(githubName, updates) {
        const members = this.teamMembers.map(m => 
            m.githubName === githubName ? { ...m, ...updates } : m
        );
        await this.updateMembers(members);
    }
    
    async updateMemberByKey(key, updates) {
        const { authorEmail, githubName } = key || {};
        const members = this.teamMembers.map(m => {
            const match = (authorEmail && m.authorEmail && m.authorEmail === authorEmail)
                || (githubName && m.githubName && m.githubName === githubName);
            return match ? { ...m, ...updates } : m;
        });
        await this.updateMembers(members);
    }
    
    async removeMember(githubName) {
        const members = this.teamMembers.filter(m => m.githubName !== githubName);
        await this.updateMembers(members);
    }
    
    async removeMemberByKey(key) {
        const { authorEmail, githubName } = key || {};
        const members = this.teamMembers.filter(m => {
            const matchEmail = authorEmail && m.authorEmail && m.authorEmail === authorEmail;
            const matchGithub = githubName && m.githubName && m.githubName === githubName;
            return !(matchEmail || matchGithub);
        });
        await this.updateMembers(members);
    }
    
    async setRepository(repoPath) {
        await vscode.workspace.getConfiguration(this.CONFIG_SECTION)
            .update('targetRepository', repoPath, this.getTarget());
    }
    
    async updateMembers(members) {
        await vscode.workspace.getConfiguration(this.CONFIG_SECTION)
            .update('teamMembers', members, this.getTarget());
    }
}

// Git Service 클래스
class GitService {
    constructor(logger) {
        this.logger = logger;
    }
    
    async getCommitData(repoPath, author, year, month) {
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
    
    async getRepositoryAuthors(repoPath) {
        if (!this.isValidRepository(repoPath)) {
            return [];
        }
        
        try {
            const command = 'git log --format="%an" --since="3 months ago"';
            const result = execSync(command, {
                cwd: repoPath,
                encoding: 'utf8'
            });
            
            return [...new Set(result.split('\n').filter(author => author.trim()))];
        } catch (error) {
            this.logger.error('Failed to get repository authors', error);
            return [];
        }
    }
    
    isValidRepository(repoPath) {
        return fs.existsSync(repoPath) && fs.existsSync(path.join(repoPath, '.git'));
    }
    
    parseCommitData(gitOutput, year, month) {
        const dates = gitOutput.split('\n').filter(line => line.trim());
        const commitCounts = new Map();
        
        dates.forEach(date => {
            const count = commitCounts.get(date) || 0;
            commitCounts.set(date, count + 1);
        });
        
        const daysInMonth = new Date(year, month, 0).getDate();
        const result = [];
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            result.push({
                date: dateStr,
                count: commitCounts.get(dateStr) || 0
            });
        }
        
        return result;
    }
    
    getEmptyMonthData(year, month) {
        const daysInMonth = new Date(year, month, 0).getDate();
        const result = [];
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            result.push({ date: dateStr, count: 0 });
        }
        
        return result;
    }
}

// Team Grass Provider 클래스
class TeamGrassProvider {
    constructor(extensionUri, configManager, gitService, logger, context) {
        this.extensionUri = extensionUri;
        this.configManager = configManager;
        this.gitService = gitService;
        this.logger = logger;
        this.context = context;
        this.currentYear = new Date().getFullYear();
        this.currentMonth = new Date().getMonth() + 1;
        this._midnightTimer = null;
        this.scheduleMidnightRefresh();
    }
    
    resolveWebviewView(webviewView, context, token) {
        this._view = webviewView;
        
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.extensionUri]
        };
        
        this.updateWebview();
        
        webviewView.webview.onDidReceiveMessage(message => {
            this.handleMessage(message);
        });
    }
    
    refresh() {
        this.updateWebview();
    }
    
    async addMember() {
        try {
            const authorEmail = await vscode.window.showInputBox({
                prompt: '커밋에 찍히는 이메일을 입력하세요 (권장)',
                placeHolder: 'name@example.com',
                validateInput: (v) => (!v || /.+@.+\..+/.test(v)) ? undefined : '올바른 이메일 형식이 아닙니다.'
            });

            const githubName = await vscode.window.showInputBox({
                prompt: 'GitHub 사용자명 (선택, 이메일 미입력 시 사용)',
                placeHolder: 'github-username'
            });
            if (!authorEmail && !githubName) return; // 하나는 있어야 함

            const displayName = await vscode.window.showInputBox({
                prompt: '표시할 이름을 입력하세요',
                placeHolder: '홍길동',
                value: githubName || (authorEmail ? authorEmail.split('@')[0] : '')
            });
            if (!displayName) return;

            const colorHue = Math.floor(Math.random() * 360);

            await this.configManager.addMember({ authorEmail, githubName, displayName, colorHue });

            vscode.window.showInformationMessage(`✅ ${displayName}님이 팀에 추가되었습니다!`);
            this.refresh();
        } catch (err) {
            this.logger.error('Failed to add member', err);
            vscode.window.showErrorMessage('팀원을 저장하는 중 오류가 발생했습니다. 워크스페이스를 열었는지 확인하거나 설정 동기화를 확인하세요.');
        }
    }
    
    async selectRepository() {
        try {
            const folders = await vscode.window.showOpenDialog({
                canSelectFiles: false,
                canSelectFolders: true,
                canSelectMany: false,
                openLabel: 'Git 저장소 선택'
            });
            if (!folders || folders.length === 0) return;

            const selectedPath = folders[0].fsPath;
            await this.configManager.setRepository(selectedPath);
            vscode.window.showInformationMessage(`저장소가 설정되었습니다: ${path.basename(selectedPath)}`);
            this.refresh();
        } catch (err) {
            this.logger.error('Failed to set repository', err);
            vscode.window.showErrorMessage('저장소 설정 중 오류가 발생했습니다. 워크스페이스를 열었는지 확인해주세요.');
        }
    }
    
    async showAttendance() {
        const members = this.configManager.teamMembers;
        const repo = this.configManager.targetRepository;
        
        if (!repo || members.length === 0) {
            vscode.window.showWarningMessage('저장소와 팀원을 먼저 설정해주세요.');
            return;
        }
        
        const today = new Date().toISOString().split('T')[0];
        let report = `📋 ${today} 출석체크\n\n`;
        
        for (const member of members) {
            try {
                const author = member.authorEmail || member.githubName;
                const commits = await this.gitService.getCommitData(repo, author, 
                    new Date().getFullYear(), new Date().getMonth() + 1);
                const todayCommits = commits.find(c => c.date === today)?.count || 0;
                
                report += `${todayCommits > 0 ? '✅' : '❌'} ${member.displayName}: ${todayCommits}회\n`;
            } catch {
                report += `⚠️ ${member.displayName}: 확인 실패\n`;
            }
        }
        
        vscode.window.showInformationMessage(report);
    }
    
    async updateWebview() {
        if (!this._view) return;
        
        const members = this.configManager.teamMembers;
        const repo = this.configManager.targetRepository;
        const title = this.configManager.teamTitle;
        const todayKey = this.getTodayKey();
        const commentsByMember = this.getCommentsForDate(todayKey);
        
        const membersWithData = await Promise.all(
            members.map(async member => ({
                ...member,
                commitData: await this.gitService.getCommitData(
                    repo,
                    member.authorEmail || member.githubName,
                    this.currentYear,
                    this.currentMonth
                )
            }))
        );
        
        this._view.webview.html = this.getHtmlForWebview(membersWithData, repo, title, commentsByMember);
    }
    
    handleMessage(message) {
        switch (message.command) {
            case 'updateColor':
                this.configManager.updateMemberByKey(message.key, { colorHue: message.colorHue });
                this.refresh();
                break;
            case 'changeMonth':
                this.currentYear = message.year;
                this.currentMonth = message.month;
                this.updateWebview();
                break;
            case 'refresh':
                this.refresh();
                break;
            case 'selectRepository':
                this.selectRepository();
                break;
            case 'addMember':
                this.addMember();
                break;
            case 'showAttendance':
                this.showAttendance();
                break;
            case 'requestRemoveMember':
                (async () => {
                    const label = message.key?.authorEmail || message.key?.githubName || '이 멤버';
                    const yes = '삭제';
                    const no = '취소';
                    const picked = await vscode.window.showWarningMessage(`${label}을(를) 삭제할까요?`, { modal: true }, yes, no);
                    if (picked === yes) {
                        try {
                            await this.configManager.removeMemberByKey(message.key);
                            vscode.window.showInformationMessage('팀원을 삭제했습니다.');
                            this.refresh();
                        } catch (err) {
                            this.logger.error('Failed to remove member', err);
                            vscode.window.showErrorMessage('팀원 삭제 중 오류가 발생했습니다.');
                        }
                    }
                })();
                break;
            case 'addComment':
                (async () => {
                    try {
                        const todayKey = this.getTodayKey();
                        const memberKey = message.key?.authorEmail || message.key?.githubName || 'unknown';
                        const repo = this.configManager.targetRepository;

                        // If repo is set, sync to JSON file inside the repo; otherwise fallback to globalState
                        if (repo && this.gitService.isValidRepository(repo)) {
                            const all = this.readCommentsFile();
                            const dateBucket = all[todayKey] || {};
                            const list = dateBucket[memberKey] || [];
                            list.push(message.text);
                            dateBucket[memberKey] = list;
                            all[todayKey] = dateBucket;
                            this.writeCommentsFile(all);
                        } else {
                            const all = this.context.globalState.get('dailyComments', {});
                            const dateBucket = all[todayKey] || {};
                            const list = dateBucket[memberKey] || [];
                            list.push(message.text);
                            dateBucket[memberKey] = list;
                            all[todayKey] = dateBucket;
                            await this.context.globalState.update('dailyComments', all);
                        }
                        this.refresh();
                    } catch (err) {
                        this.logger.error('Failed to add comment', err);
                        vscode.window.showErrorMessage('댓글 저장 중 오류가 발생했습니다.');
                    }
                })();
                break;
            case 'removeMember':
                (async () => {
                    try {
                        await this.configManager.removeMemberByKey(message.key);
                        vscode.window.showInformationMessage('팀원을 삭제했습니다.');
                        this.refresh();
                    } catch (err) {
                        this.logger.error('Failed to remove member', err);
                        vscode.window.showErrorMessage('팀원 삭제 중 오류가 발생했습니다.');
                    }
                })();
                break;
        }
    }

    getTodayKey() {
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }
    
    getCommentsForDate(dateKey) {
        try {
            const repo = this.configManager.targetRepository;
            if (repo && this.gitService.isValidRepository(repo)) {
                const all = this.readCommentsFile();
                return all[dateKey] || {};
            }
        } catch (err) {
            this.logger.warn('Falling back to local comments due to read error', err?.message || err);
        }
        const localAll = this.context.globalState.get('dailyComments', {});
        return localAll[dateKey] || {};
    }
    
    scheduleMidnightRefresh() {
        if (this._midnightTimer) {
            clearTimeout(this._midnightTimer);
        }
        const now = new Date();
        const next = new Date(now);
        next.setHours(24, 0, 0, 0); // 다음 자정
        const ms = next.getTime() - now.getTime();
        this._midnightTimer = setTimeout(() => {
            this.refresh();
            this.scheduleMidnightRefresh();
        }, ms);
    }
    
    getHtmlForWebview(members, repo, title, commentsByMember) {
        const nonce = this.getNonce();
        const syncLabel = repo ? '• ☁ 댓글 동기화 켜짐' : '• ☁ 댓글 동기화 꺼짐';
        
        return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
    <title>${title}</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background: var(--vscode-editor-background);
            margin: 0;
            padding: 12px;
            font-size: 13px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 20px;
            padding: 12px;
            background: var(--vscode-editor-selectionBackground);
            border-radius: 6px;
        }
        
        .controls {
            display: flex;
            gap: 8px;
            margin-bottom: 16px;
            flex-wrap: wrap;
        }
        
        .btn {
            padding: 6px 12px;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        }
        
        .btn:hover {
            background: var(--vscode-button-hoverBackground);
        }
        
        .month-nav {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 12px;
            margin: 16px 0;
        }
        
        .member-card {
            margin-bottom: 20px;
            padding: 12px;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 6px;
            background: var(--vscode-editor-background);
        }
        
        .member-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 12px;
            gap: 8px;
        }
        
        .member-name { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .member-display { font-weight: bold; }
        .member-email { color: var(--vscode-descriptionForeground); font-weight: normal; overflow-wrap: anywhere; word-break: break-word; white-space: normal; }
        
        .stats {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
        }
        
        .calendar {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 2px;
            margin: 12px 0;
        }
        
        .calendar-header {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 2px;
            margin-bottom: 4px;
            font-size: 10px;
            text-align: center;
            color: var(--vscode-descriptionForeground);
        }
        
        .day {
            width: 16px;
            height: 16px;
            border-radius: 3px;
            border: 1px solid var(--vscode-panel-border);
            position: relative;
        }
        
        .color-control {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 8px;
        }
        
        .color-slider {
            flex: 1;
        }
        
        .color-preview {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            border: 1px solid var(--vscode-panel-border);
        }
        
        .empty-state {
            text-align: center;
            padding: 40px 20px;
            color: var(--vscode-descriptionForeground);
        }

        .comments {
            margin-top: 10px;
            border-top: 1px dashed var(--vscode-panel-border);
            padding-top: 10px;
        }
        .comments-title { font-weight: bold; margin-bottom: 6px; }
        .comment-list { list-style: none; padding-left: 0; margin: 6px 0; display: flex; flex-direction: column; gap: 4px; }
        .comment-item { font-size: 12px; color: var(--vscode-foreground); background: var(--vscode-editor-inactiveSelectionBackground); padding: 6px; border-radius: 4px; }
        .comment-input { display: flex; gap: 6px; }
        .comment-input input[type="text"] { flex: 1; padding: 6px; border-radius: 4px; border: 1px solid var(--vscode-panel-border); background: var(--vscode-editor-background); color: var(--vscode-foreground); }
        .comment-input .btn { padding: 6px 10px; }
    </style>
</head>
<body>
    <div class="header">
        <h2>${title}</h2>
        <div class="stats">📂 ${repo ? path.basename(repo) : '저장소 미설정'} • 👥 ${members.length}명 ${syncLabel}</div>
    </div>
    
    <div class="controls">
        <button class="btn" id="btnSelectRepository">📁 저장소 선택</button>
        <button class="btn" id="btnAddMember">👥 팀원 추가</button>
        <button class="btn" id="btnShowAttendance">📋 출석체크</button>
        <button class="btn" id="btnRefresh">🔄 새로고침</button>
    </div>
    
    ${members.length === 0 ? `
        <div class="empty-state">
            <h3>🌱 Team Grass Tracker</h3>
            <p>팀원을 추가하고 저장소를 설정해주세요!</p>
        </div>
    ` : `
        <div class="month-nav">
            <button class="btn" id="btnPrevMonth">←</button>
            <span id="monthDisplay">${this.currentYear}년 ${this.currentMonth}월</span>
            <button class="btn" id="btnNextMonth">→</button>
        </div>
        
        <div class="calendar-header">
            <div>일</div><div>월</div><div>화</div><div>수</div><div>목</div><div>금</div><div>토</div>
        </div>
        
        ${members.map(member => this.renderMember(member, commentsByMember)).join('')}
    `}
    
    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
        
        function selectRepository() { vscode.postMessage({ command: 'selectRepository' }); }
        function addMember() { vscode.postMessage({ command: 'addMember' }); }
        function showAttendance() { vscode.postMessage({ command: 'showAttendance' }); }
        function refresh() { vscode.postMessage({ command: 'refresh' }); }

        function changeMonth(direction) {
            let year = ${this.currentYear};
            let month = ${this.currentMonth};
            
            month += direction;
            if (month > 12) {
                month = 1;
                year++;
            } else if (month < 1) {
                month = 12;
                year--;
            }
            
            document.getElementById('monthDisplay').textContent = year + '년 ' + month + '월';
            vscode.postMessage({ command: 'changeMonth', year, month });
        }
        
        function updateColor(key, colorHue) {
            vscode.postMessage({ 
                command: 'updateColor', 
                key,
                colorHue: parseInt(colorHue) 
            });
        }

    // Attach event listeners to avoid inline handlers blocked by CSP
        (function init() {
            const $ = (id) => document.getElementById(id);
            const safe = (el, type, fn) => el && el.addEventListener(type, fn);

            safe($("btnSelectRepository"), 'click', selectRepository);
            safe($("btnAddMember"), 'click', addMember);
            safe($("btnShowAttendance"), 'click', showAttendance);
            safe($("btnRefresh"), 'click', refresh);
            safe($("btnPrevMonth"), 'click', () => changeMonth(-1));
            safe($("btnNextMonth"), 'click', () => changeMonth(1));

            document.querySelectorAll('.color-slider').forEach(input => {
                input.addEventListener('change', (e) => {
                    const target = e.currentTarget;
                    updateColor({
                        authorEmail: target.getAttribute('data-author-email') || undefined,
                        githubName: target.getAttribute('data-github-name') || undefined
                    }, target.value);
                });
            });

            document.querySelectorAll('.remove-member').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const target = e.currentTarget;
                    const key = {
                        authorEmail: target.getAttribute('data-author-email') || undefined,
                        githubName: target.getAttribute('data-github-name') || undefined
                    };
                    vscode.postMessage({ command: 'requestRemoveMember', key });
                });
            });

            document.querySelectorAll('.add-comment').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const target = e.currentTarget;
                    const container = target.closest('.comments');
                    const input = container.querySelector('input[type="text"]');
                    const text = (input?.value || '').trim();
                    if (!text) return;
                    const key = {
                        authorEmail: target.getAttribute('data-author-email') || undefined,
                        githubName: target.getAttribute('data-github-name') || undefined
                    };
                    vscode.postMessage({ command: 'addComment', key, text });
                    input.value = '';
                });
            });
        })();
    </script>
</body>
</html>`;
    }
    
    renderMember(member, commentsByMember) {
        const totalCommits = member.commitData.reduce((sum, day) => sum + day.count, 0);
        const activeDays = member.commitData.filter(day => day.count > 0).length;
        const maxCommits = Math.max(...member.commitData.map(day => day.count));
        
        const calendarCells = member.commitData.map((day, index) => {
            const intensity = maxCommits > 0 ? day.count / maxCommits : 0;
            const opacity = 0.1 + (intensity * 0.9);
            const color = `hsl(${member.colorHue}, 70%, 50%)`;
            
            return `<div class="day" style="background-color: ${color}; opacity: ${opacity};" 
                title="${day.date}: ${day.count}회 커밋"></div>`;
        }).join('');
        
        const keyId = member.authorEmail || member.githubName || 'unknown';
        const comments = (commentsByMember && commentsByMember[keyId]) || [];
        const commentsHtml = comments.length > 0
            ? `<ul class="comment-list">${comments.map(c => `<li class="comment-item">${c}</li>`).join('')}</ul>`
            : `<div class="comment-empty" style="color: var(--vscode-descriptionForeground); font-size: 12px;">아직 댓글이 없습니다. 첫 댓글을 남겨보세요!</div>`;

        return `
            <div class="member-card">
                <div class="member-header">
                            <div class="member-name">
                                <div class="member-display">${member.displayName}</div>
                                ${member.authorEmail ? `<div class="member-email">${member.authorEmail}</div>` : ''}
                            </div>
                    <div class="stats">📈 ${totalCommits}회 • 🔥 ${activeDays}일 • 🏆 최고 ${maxCommits}회</div>
                    <div class="member-actions">
                        <button class="btn btn-danger remove-member" data-author-email="${member.authorEmail || ''}" data-github-name="${member.githubName || ''}">삭제</button>
                    </div>
                </div>
                
                <div class="calendar">${calendarCells}</div>
                
                <div class="color-control">
                    <span>색상:</span>
                    <input type="range" class="color-slider" min="0" max="360" value="${member.colorHue}" data-github-name="${member.githubName || ''}" data-author-email="${member.authorEmail || ''}">
                    <div class="color-preview" style="background-color: hsl(${member.colorHue}, 70%, 50%);"></div>
                </div>

                <div class="comments">
                    <div class="comments-title">💬 오늘의 댓글</div>
                    ${commentsHtml}
                    <div class="comment-input" style="margin-top: 6px;">
                        <input type="text" placeholder="오늘의 한마디를 남겨주세요" />
                        <button class="btn add-comment" data-author-email="${member.authorEmail || ''}" data-github-name="${member.githubName || ''}">등록</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

    // ====== Comment Sync Helpers (Repo JSON) ======
    getCommentsFilePath() {
        const repo = this.configManager.targetRepository;
        if (!repo || !this.gitService.isValidRepository(repo)) return undefined;
        return path.join(repo, '.vscode', 'team-grass-comments.json');
    }

    ensureCommentsDir() {
        const repo = this.configManager.targetRepository;
        if (!repo || !this.gitService.isValidRepository(repo)) return;
        const dir = path.join(repo, '.vscode');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    readCommentsFile() {
        const filePath = this.getCommentsFilePath();
        if (!filePath) return {};
        try {
            if (!fs.existsSync(filePath)) return {};
            const txt = fs.readFileSync(filePath, 'utf8');
            if (!txt.trim()) return {};
            const data = JSON.parse(txt);
            return (data && typeof data === 'object') ? data : {};
        } catch (err) {
            this.logger.error('Failed to read comments file', err);
            return {};
        }
    }

    writeCommentsFile(all) {
        const filePath = this.getCommentsFilePath();
        if (!filePath) return;
        try {
            this.ensureCommentsDir();
            fs.writeFileSync(filePath, JSON.stringify(all, null, 2), 'utf8');
        } catch (err) {
            this.logger.error('Failed to write comments file', err);
            vscode.window.showWarningMessage('댓글 동기화 파일 저장에 실패했습니다. 로컬 저장소를 사용합니다.');
        }
    }
}

// viewType static 속성 추가
TeamGrassProvider.viewType = 'teamGrassTrackerView';

// Extension activation
async function activate(context) {
    const logger = new Logger('TeamGrassTracker');
    const configManager = new ConfigurationManager();
    const gitService = new GitService(logger);
    
    // WebView Provider 등록
    const provider = new TeamGrassProvider(context.extensionUri, configManager, gitService, logger, context);
    
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

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
