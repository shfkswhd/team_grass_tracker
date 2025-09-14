const fs = require('fs');
const path = require('path');

interface CommitData {
    date: string;
    count: number;
}

interface UserConfig {
    name: string;
    color: { L: number; a: number; b: number };
}

class GrassSVGGenerator {
    private oklabToRgb(L: number, a: number, b: number): { r: number; g: number; b: number } {
        let l = L + 0.3963377774*a + 0.2158037573*b;
        let m = L - 0.1055613458*a - 0.0638541728*b;
        let s = L - 0.0894841775*a - 1.2914855480*b;

        l = l*l*l;
        m = m*m*m;
        s = s*s*s;

        let r = +4.0767416621*l - 3.3077115913*m + 0.2309699292*s;
        let g = -1.2684380046*l + 2.6097574011*m - 0.3413193965*s;
        let b_ = -0.0041960863*l - 0.7034186147*m + 1.7076147010*s;

        r = this.linearToSrgb(r);
        g = this.linearToSrgb(g);
        b_ = this.linearToSrgb(b_);

        return {
            r: Math.max(0, Math.min(255, Math.round(r * 255))),
            g: Math.max(0, Math.min(255, Math.round(g * 255))),
            b: Math.max(0, Math.min(255, Math.round(b_ * 255)))
        };
    }

    private linearToSrgb(c: number): number {
        return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1/2.4) - 0.055;
    }

    private oklabToHex(L: number, a: number, b: number): string {
        const rgb = this.oklabToRgb(L, a, b);
        return '#' + [rgb.r, rgb.g, rgb.b].map(x => x.toString(16).padStart(2, '0')).join('');
    }

    public generateSVG(commitData: CommitData[], userConfig: UserConfig, width: number = 400): string {
        const cellSize = 12;
        const gap = 2;
        const cols = 7;
        const rows = Math.ceil(commitData.length / cols);
        const svgWidth = cols * (cellSize + gap) - gap;
        const svgHeight = rows * (cellSize + gap) - gap + 30; // 제목 공간
        
        const maxCommit = Math.max(...commitData.map(d => d.count));
        
        let svgContent = `<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">`;
        svgContent += `<text x="10" y="20" font-family="Arial, sans-serif" font-size="14" fill="#333">${userConfig.name}의 잔디</text>`;
        
        commitData.forEach((data, index) => {
            const row = Math.floor(index / cols);
            const col = index % cols;
            const x = col * (cellSize + gap);
            const y = row * (cellSize + gap) + 30;
            
            const intensity = data.count / (maxCommit || 1);
            const chromaMultiplier = 0.3 + 0.7 * intensity;
            const lightnessMultiplier = 0.4 + 0.6 * intensity;
            
            const newA = userConfig.color.a * chromaMultiplier;
            const newB = userConfig.color.b * chromaMultiplier;
            const newL = userConfig.color.L * lightnessMultiplier;
            
            const color = this.oklabToHex(newL, newA, newB);
            
            svgContent += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${color}" stroke="#ddd" stroke-width="1" rx="2">`;
            svgContent += `<title>${data.date}: ${data.count}회</title>`;
            svgContent += `</rect>`;
        });
        
        svgContent += `</svg>`;
        return svgContent;
    }

    public updateReadme(svgContent: string, userName: string): void {
        const readmePath = path.join(process.cwd(), 'README.md');
        let readmeContent = '';
        
        if (fs.existsSync(readmePath)) {
            readmeContent = fs.readFileSync(readmePath, 'utf-8');
        } else {
            readmeContent = '# Team Grass Tracker\n\n';
        }
        
        const startMarker = `<!-- GRASS_START_${userName} -->`;
        const endMarker = `<!-- GRASS_END_${userName} -->`;
        
        const newSection = `${startMarker}\n${svgContent}\n${endMarker}`;
        
        if (readmeContent.includes(startMarker)) {
            // 기존 섹션 교체
            const regex = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`, 'g');
            readmeContent = readmeContent.replace(regex, newSection);
        } else {
            // 새 섹션 추가
            readmeContent += '\n\n' + newSection;
        }
        
        fs.writeFileSync(readmePath, readmeContent, 'utf-8');
        console.log(`README.md updated for user: ${userName}`);
    }
}

export { GrassSVGGenerator, CommitData, UserConfig };
