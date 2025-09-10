const vscode = require('vscode');

function activate(context) {
    console.log('🌱 Team Grass Tracker extension is now active!');
    
    // 웹뷰 프로바이더 등록
    const provider = new GrassTrackerViewProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('teamGrassTrackerView', provider)
    );

    // 새로고침 명령 등록
    const refreshCommand = vscode.commands.registerCommand('teamGrassTracker.refresh', () => {
        provider.refresh();
        vscode.window.showInformationMessage('🌱 잔디 달력이 새로고침되었습니다!');
    });
    context.subscriptions.push(refreshCommand);

    // 확장 표시 명령 등록
    const showCommand = vscode.commands.registerCommand('teamGrassTracker.show', () => {
        vscode.window.showInformationMessage('🌱 Team Grass Tracker가 활성화되었습니다! Explorer 사이드바를 확인하세요.');
    });
    context.subscriptions.push(showCommand);
}

function deactivate() {}

class GrassTrackerViewProvider {
    constructor(extensionUri) {
        this._extensionUri = extensionUri;
    }

    resolveWebviewView(webviewView, context, _token) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    }

    refresh() {
        if (this._view) {
            this._view.webview.html = this._getHtmlForWebview(this._view.webview);
        }
    }

    _getHtmlForWebview(webview) {
        return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🌱 Team Grass Tracker</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            margin: 0;
            padding: 8px;
            font-size: 12px;
            line-height: 1.4;
        }

        .header {
            text-align: center;
            margin-bottom: 15px;
            padding: 8px;
            background-color: var(--vscode-editor-selectionBackground, #0366d625);
            border-radius: 4px;
            border: 1px solid var(--vscode-panel-border, #e1e4e8);
        }

        .header h2 {
            margin: 0;
            font-size: 16px;
            color: var(--vscode-foreground);
        }

        .month-nav {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 10px;
            margin-bottom: 15px;
        }

        .month-nav button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 4px 8px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 11px;
        }

        .month-nav button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }

        .month-display {
            font-weight: bold;
            font-size: 13px;
        }

        .user-section {
            margin-bottom: 20px;
            padding: 10px;
            border: 1px solid var(--vscode-panel-border, #e1e4e8);
            border-radius: 6px;
            background-color: var(--vscode-editor-background);
            width: 150px;
        }

        .user-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }

        .user-name {
            font-weight: bold;
            font-size: 13px;
        }

        .user-color-control {
            display: flex;
            align-items: center;
            gap: 5px;
            margin-bottom: 8px;
        }

        .user-color-control label {
            font-size: 10px;
            min-width: 25px;
        }

        .user-color-control input {
            width: 60px;
            height: 16px;
        }

        .color-preview {
            width: 20px;
            height: 16px;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 2px;
        }

        .calendar-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 2px;
            margin-bottom: 10px;
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

        .cell {
            width: 12px;
            height: 12px;
            border-radius: 2px;
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border, #e1e4e8);
            position: relative;
        }

        .comment-section {
            margin-top: 10px;
            padding: 8px;
            background-color: var(--vscode-editor-selectionBackground, #0366d615);
            border-radius: 4px;
            border: 1px solid var(--vscode-panel-border, #e1e4e8);
        }

        .comment-input {
            display: flex;
            gap: 5px;
            margin-bottom: 8px;
        }

        .comment-input input {
            flex: 1;
            padding: 4px 6px;
            border: 1px solid var(--vscode-input-border);
            border-radius: 3px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            font-size: 11px;
        }

        .comment-input button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 4px 8px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 10px;
        }

        .comment-input button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }

        .comment-list {
            max-height: 80px;
            overflow-y: auto;
        }

        .comment-item {
            margin-bottom: 4px;
            font-size: 10px;
            padding: 4px;
            background-color: var(--vscode-editor-background);
            border-radius: 3px;
            border: 1px solid var(--vscode-panel-border, #e1e4e822);
        }

        .comment-author {
            font-weight: bold;
            color: var(--vscode-symbolIcon-functionForeground, #0366d6);
        }

        .days-header {
            font-size: 9px;
            color: var(--vscode-descriptionForeground);
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>🌱 Team Grass Tracker</h2>
        <div class="subtitle">알고리즘 스터디 잔디 현황</div>
    </div>

    <!-- 월 네비게이션 -->
    <div class="month-nav">
        <button onclick="changeMonth(-1)">←</button>
        <span class="month-display" id="monthDisplay">2025년 9월</span>
        <button onclick="changeMonth(1)">→</button>
    </div>

    <div id="usersContainer"></div>

    <script>
        // OKLAB 색상 변환 함수들
        function oklab_to_linear_srgb(L, a, b) {
            let l_ = L + 0.3963377774 * a + 0.2158037573 * b;
            let m_ = L - 0.1055613458 * a - 0.0638541728 * b;
            let s_ = L - 0.0894841775 * a - 1.2914855480 * b;
            
            let l = l_*l_*l_;
            let m = m_*m_*m_;
            let s = s_*s_*s_;
            
            return [
                +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
                -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
                -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
            ];
        }

        function linear_srgb_to_rgb(r, g, b) {
            function f(x) {
                return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1/2.4) - 0.055;
            }
            return [f(r), f(g), f(b)];
        }

        function oklab_to_rgb(L, a, b) {
            let [r_linear, g_linear, b_linear] = oklab_to_linear_srgb(L, a, b);
            let [r, g, b_] = linear_srgb_to_rgb(r_linear, g_linear, b_linear);
            
            r = Math.max(0, Math.min(1, r));
            g = Math.max(0, Math.min(1, g));
            b_ = Math.max(0, Math.min(1, b_));
            
            return [Math.round(r * 255), Math.round(g * 255), Math.round(b_ * 255)];
        }

        function getGrassColor(colorPosition, intensity) {
            if (intensity === 0) {
                return 'var(--vscode-editor-background)';
            }
            
            const normalizedPosition = colorPosition / 100;
            const a = Math.cos(normalizedPosition * 2 * Math.PI) * 0.15;
            const b = Math.sin(normalizedPosition * 2 * Math.PI) * 0.15;
            
            const L = 0.3 + (intensity * 0.2);
            
            const [r, g, b_] = oklab_to_rgb(L, a, b);
            return \`rgb(\${r}, \${g}, \${b_})\`;
        }

        // 현재 표시 중인 년월
        let currentYear = 2025;
        let currentMonth = 9; // 9월 (0-based가 아님)
        
        // 댓글 시스템 (월별로 관리)
        let comments = {
            "2025-9": {
                "kimcoding": [
                    { author: "parkalgo", text: "야 너 왜 이렇게 잔디가 빈약해? 🌱", date: new Date('2025-09-01') },
                    { author: "leedebug", text: "김코딩님 오늘도 화이팅! 💪", date: new Date('2025-09-05') }
                ],
                "parkalgo": [
                    { author: "kimcoding", text: "파란색 잔디 이쁘네요 ㅋㅋ 👍", date: new Date('2025-09-03') },
                    { author: "leedebug", text: "알고 형님... 존경합니다... 🙏", date: new Date('2025-09-07') }
                ],
                "leedebug": [
                    { author: "kimcoding", text: "디버그는 진짜 열심히 하는구나 👨‍💻", date: new Date('2025-09-02') },
                    { author: "parkalgo", text: "빨간 잔디 무서워요 ㅠㅠ 🔥", date: new Date('2025-09-08') }
                ]
            }
        };
        
        // 샘플 사용자 데이터 (GitHub 이름 포함)
        let users = [
            {
                githubName: 'kimcoding',
                displayName: '김코딩',
                colorPosition: 25, // 초록 계열
            },
            {
                githubName: 'parkalgo',
                displayName: '박알고',
                colorPosition: 66, // 파랑 계열  
            },
            {
                githubName: 'leedebug',
                displayName: '이디버그',
                colorPosition: 0, // 빨강 계열
            },
            {
                githubName: 'choicode',
                displayName: '최코드',
                colorPosition: 83, // 보라 계열
            }
        ];

        // 샘플 커밋 데이터 생성 (더 현실적으로)
        function generateCommitData(githubName, year, month) {
            const daysInMonth = new Date(year, month, 0).getDate();
            const data = [];
            
            // 사용자별로 다른 패턴
            for (let day = 1; day <= daysInMonth; day++) {
                let commits = 0;
                const date = new Date(year, month - 1, day);
                const dayOfWeek = date.getDay();
                
                // 주말엔 좀 덜함
                const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.3 : 1;
                
                switch(githubName) {
                    case 'kimcoding':
                        commits = Math.random() < (0.7 * weekendFactor) ? Math.floor(Math.random() * 4) + 1 : 0;
                        break;
                    case 'parkalgo':
                        commits = Math.random() < (0.9 * weekendFactor) ? Math.floor(Math.random() * 6) + 1 : 0;
                        break;
                    case 'leedebug':
                        commits = Math.random() < (0.8 * weekendFactor) ? Math.floor(Math.random() * 5) + 1 : 0;
                        break;
                    case 'choicode':
                        commits = Math.random() < (0.6 * weekendFactor) ? Math.floor(Math.random() * 3) + 1 : 0;
                        break;
                }
                data.push(commits);
            }
            return data;
        }

        // 월 변경 함수
        function changeMonth(direction) {
            currentMonth += direction;
            if (currentMonth > 12) {
                currentMonth = 1;
                currentYear++;
            } else if (currentMonth < 1) {
                currentMonth = 12;
                currentYear--;
            }
            
            document.getElementById('monthDisplay').textContent = \`\${currentYear}년 \${currentMonth}월\`;
            renderAllUsers();
        }

        // 사용자별 달력 렌더링
        function renderUser(user) {
            const commitData = generateCommitData(user.githubName, currentYear, currentMonth);
            const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
            const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay();
            
            let html = \`
                <div class="user-section">
                    <div class="user-header">
                        <span class="user-name">\${user.displayName} (@\${user.githubName})</span>
                    </div>
                    
                    <div class="user-color-control">
                        <label>색상:</label>
                        <input type="range" min="0" max="100" value="\${user.colorPosition}" 
                               onchange="updateUserColor('\${user.githubName}', this.value)">
                        <div class="color-preview" style="background-color: \${getGrassColor(user.colorPosition, 0.5)}"></div>
                    </div>
                    
                    <div class="calendar-header days-header">
                        <div>일</div><div>월</div><div>화</div><div>수</div><div>목</div><div>금</div><div>토</div>
                    </div>
                    
                    <div class="calendar-grid">\`;

            // 빈 칸 추가 (월 시작 요일 맞추기)
            for (let i = 0; i < firstDayOfMonth; i++) {
                html += \`<div class="cell" style="visibility: hidden;"></div>\`;
            }

            // 날짜 칸들
            for (let day = 1; day <= daysInMonth; day++) {
                const commitCount = commitData[day - 1];
                const intensity = commitCount > 0 ? Math.min(commitCount / 4, 1) : 0;
                const color = getGrassColor(user.colorPosition, intensity);
                
                // 오늘 날짜 하이라이트
                const today = new Date();
                const isToday = (currentYear === today.getFullYear() && 
                               currentMonth === (today.getMonth() + 1) && 
                               day === today.getDate());
                const isTodayCell = isToday;
                
                html += \`<div class="cell" style="background-color: \${color}; \${isTodayCell ? 'border: 2px solid #ffeb3b; box-shadow: 0 0 4px #ffeb3b;' : ''}" 
                    title="\${day}일: \${commitCount}회\${isTodayCell ? ' (오늘)' : ''}"></div>\`;
            }
            
            html += \`</div>
                    <div class="comment-section">
                        <div class="comment-input">
                            <input type="text" placeholder="잔디 모욕하기..." maxlength="50" id="commentInput_\${user.githubName}">
                            <button onclick="addComment('\${user.githubName}')">💬</button>
                        </div>
                        <div class="comment-list" id="commentList_\${user.githubName}">\`;
            
            // 현재 월의 댓글만 표시
            const monthKey = \`\${currentYear}-\${currentMonth}\`;
            const userComments = (comments[monthKey] && comments[monthKey][user.githubName]) || [];
            userComments.forEach(comment => {
                html += \`<div class="comment-item">
                    <span class="comment-author">@\${comment.author}:</span> \${comment.text}
                </div>\`;
            });
            
            html += \`</div>
                    </div>
                </div>\`;
            
            return html;
        }

        // 모든 사용자 렌더링
        function renderAllUsers() {
            const container = document.getElementById('usersContainer');
            container.innerHTML = users.map(user => renderUser(user)).join('');
        }

        // 사용자 색상 변경
        function updateUserColor(githubName, newColorPosition) {
            const user = users.find(u => u.githubName === githubName);
            if (user) {
                user.colorPosition = parseInt(newColorPosition);
                renderAllUsers();
            }
        }

        // 댓글 추가 함수 (한 달 제한)
        function addComment(targetUser) {
            const input = document.getElementById(\`commentInput_\${targetUser}\`);
            const text = input.value.trim();
            
            if (text) {
                // 랜덤 작성자 선택 (타겟이 아닌 사용자 중에서)
                const authors = users.filter(u => u.githubName !== targetUser);
                const randomAuthor = authors[Math.floor(Math.random() * authors.length)];
                
                const monthKey = \`\${currentYear}-\${currentMonth}\`;
                if (!comments[monthKey]) {
                    comments[monthKey] = {};
                }
                if (!comments[monthKey][targetUser]) {
                    comments[monthKey][targetUser] = [];
                }
                
                comments[monthKey][targetUser].push({
                    author: randomAuthor.githubName,
                    text: text,
                    date: new Date()
                });
                
                input.value = '';
                renderAllUsers();
            }
        }

        // 전역 변수로 함수들 노출
        window.changeMonth = changeMonth;
        window.updateUserColor = updateUserColor;
        window.addComment = addComment;

        // 초기 렌더링
        renderAllUsers();
    </script>
</body>
</html>`;
    }
}

module.exports = {
    activate,
    deactivate
};
