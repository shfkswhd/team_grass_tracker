import * as vscode from 'vscode';
import { ReadmeUpdater } from './readmeUpdater';

export function activate(context: vscode.ExtensionContext) {
    console.log('Team Grass Tracker extension is now active!');

    // 웹뷰 프로바이더 등록
    const provider = new GrassTrackerViewProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('teamGrassTracker', provider)
    );

    // README 업데이터
    const readmeUpdater = new ReadmeUpdater();

    // 새로고침 명령 등록
    const refreshCommand = vscode.commands.registerCommand('teamGrassTracker.refresh', () => {
        provider.refresh();
    });
    context.subscriptions.push(refreshCommand);

    // README 업데이트 명령 등록
    const updateReadmeCommand = vscode.commands.registerCommand('teamGrassTracker.updateReadme', async () => {
        const users = [
            { name: 'User1', color: { L: 0.8, a: -0.4, b: 0.2 } },
            { name: 'User2', color: { L: 0.7, a: 0.4, b: 0.2 } }
        ];
        await readmeUpdater.updateReadmeWithGrassCalendar(users);
    });
    context.subscriptions.push(updateReadmeCommand);
}

export function deactivate() {}

class GrassTrackerViewProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;

    constructor(private readonly _extensionUri: vscode.Uri) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // 웹뷰에서 메시지 받기
        webviewView.webview.onDidReceiveMessage((message: any) => {
            switch (message.type) {
                case 'colorChanged':
                    vscode.window.showInformationMessage(`색상이 변경되었습니다: ${message.color}`);
                    break;
            }
        });
    }

    public refresh() {
        if (this._view) {
            this._view.webview.html = this._getHtmlForWebview(this._view.webview);
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        // 샘플 커밋 데이터 (나중에 실제 Git 데이터로 교체)
        const commitData = Array.from({length: 30}, () => Math.floor(Math.random() * 5));
        
        return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Team Grass Tracker</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 10px;
            margin: 0;
        }
        .calendar {
            display: grid;
            grid-template-columns: repeat(7, 16px);
            grid-auto-rows: 16px;
            gap: 2px;
            padding: 10px 0;
            width: max-content;
        }
        .cell {
            width: 16px;
            height: 16px;
            border-radius: 3px;
            box-sizing: border-box;
            border: 1px solid var(--vscode-widget-border);
            transition: background 0.2s;
        }
        .cell:hover {
            border: 1px solid var(--vscode-focusBorder);
        }
        .controls {
            margin-bottom: 15px;
        }
        .controls label {
            display: block;
            margin: 5px 0;
            font-size: 12px;
        }
        .controls input[type="range"] {
            width: 100%;
            margin: 2px 0;
        }
        .color-buttons {
            margin: 10px 0;
        }
        .color-buttons button {
            margin: 2px;
            padding: 4px 8px;
            border: 1px solid var(--vscode-button-border);
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border-radius: 3px;
            cursor: pointer;
            font-size: 11px;
        }
        .color-buttons button:hover {
            background: var(--vscode-button-hoverBackground);
        }
        .color-preview {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 1px solid var(--vscode-widget-border);
            border-radius: 3px;
            vertical-align: middle;
            margin-left: 5px;
        }
    </style>
</head>
<body>
    <h3>잔디 달력</h3>
    <div class="controls">
        <label>L(밝기): <input type="range" id="LSlider" min="0" max="1" step="0.01" value="0.8"></label>
        <label>a(녹색~빨강): <input type="range" id="aSlider" min="-1" max="1" step="0.01" value="0.1"></label>
        <label>b(파랑~노랑): <input type="range" id="bSlider" min="-1" max="1" step="0.01" value="0.1"></label>
        <span class="color-preview" id="colorPreview"></span>
    </div>
    <div class="color-buttons">
        <button id="btnGreen">녹색</button>
        <button id="btnRed">빨강</button>
        <button id="btnBlue">파랑</button>
        <button id="btnYellow">노랑</button>
    </div>
    <div class="calendar" id="calendar"></div>

    <script>
        const vscode = acquireVsCodeApi();
        const commitData = ${JSON.stringify(commitData)};
        const maxCommit = Math.max(...commitData);

        let L = parseFloat(document.getElementById('LSlider').value);
        let a = parseFloat(document.getElementById('aSlider').value);
        let b = parseFloat(document.getElementById('bSlider').value);

        // OKLAB 변환 함수들 (기존과 동일)
        function srgbToLinear(c) {
            return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        }

        function linearToSrgb(c) {
            return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1/2.4) - 0.055;
        }

        function oklabToRgb(L, a, b) {
            let l = L + 0.3963377774*a + 0.2158037573*b;
            let m = L - 0.1055613458*a - 0.0638541728*b;
            let s = L - 0.0894841775*a - 1.2914855480*b;

            l = l*l*l;
            m = m*m*m;
            s = s*s*s;

            let r = +4.0767416621*l - 3.3077115913*m + 0.2309699292*s;
            let g = -1.2684380046*l + 2.6097574011*m - 0.3413193965*s;
            let b_ = -0.0041960863*l - 0.7034186147*m + 1.7076147010*s;

            r = linearToSrgb(r);
            g = linearToSrgb(g);
            b_ = linearToSrgb(b_);

            return {
                r: Math.max(0, Math.min(255, Math.round(r * 255))),
                g: Math.max(0, Math.min(255, Math.round(g * 255))),
                b: Math.max(0, Math.min(255, Math.round(b_ * 255)))
            };
        }

        function oklabToHex(L, a, b) {
            const rgb = oklabToRgb(L, a, b);
            return '#' + [rgb.r, rgb.g, rgb.b].map(x => x.toString(16).padStart(2, '0')).join('');
        }

        function renderCalendar() {
            const cal = document.getElementById('calendar');
            cal.innerHTML = '';
            for(let i=0; i<commitData.length; i++) {
                const intensity = commitData[i] / (maxCommit || 1);
                
                const baseChroma = Math.sqrt(a*a + b*b);
                const chromaMultiplier = 0.3 + 0.7 * intensity;
                const lightnessMultiplier = 0.4 + 0.6 * intensity;
                
                const newA = a * chromaMultiplier;
                const newB = b * chromaMultiplier;
                const newL = L * lightnessMultiplier;
                
                const color = oklabToHex(newL, newA, newB);
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.style.background = color;
                cell.title = \`\${i+1}일: \${commitData[i]}회\`;
                cal.appendChild(cell);
            }
            document.getElementById('colorPreview').style.background = oklabToHex(L, a, b);
            
            // VS Code에 색상 변경 알림
            vscode.postMessage({
                type: 'colorChanged',
                color: oklabToHex(L, a, b)
            });
        }

        // 이벤트 리스너들
        document.getElementById('LSlider').addEventListener('input', e => {
            L = parseFloat(e.target.value);
            renderCalendar();
        });
        document.getElementById('aSlider').addEventListener('input', e => {
            a = parseFloat(e.target.value);
            renderCalendar();
        });
        document.getElementById('bSlider').addEventListener('input', e => {
            b = parseFloat(e.target.value);
            renderCalendar();
        });

        // 대표 색상 버튼들
        document.getElementById('btnGreen').onclick = function() {
            L = 0.8; a = -0.4; b = 0.2;
            document.getElementById('LSlider').value = L;
            document.getElementById('aSlider').value = a;
            document.getElementById('bSlider').value = b;
            renderCalendar();
        };
        document.getElementById('btnRed').onclick = function() {
            L = 0.7; a = 0.4; b = 0.2;
            document.getElementById('LSlider').value = L;
            document.getElementById('aSlider').value = a;
            document.getElementById('bSlider').value = b;
            renderCalendar();
        };
        document.getElementById('btnBlue').onclick = function() {
            L = 0.6; a = 0.0; b = -0.4;
            document.getElementById('LSlider').value = L;
            document.getElementById('aSlider').value = a;
            document.getElementById('bSlider').value = b;
            renderCalendar();
        };
        document.getElementById('btnYellow').onclick = function() {
            L = 0.9; a = -0.1; b = 0.5;
            document.getElementById('LSlider').value = L;
            document.getElementById('aSlider').value = a;
            document.getElementById('bSlider').value = b;
            renderCalendar();
        };

        renderCalendar();
    </script>
</body>
</html>`;
    }
}
