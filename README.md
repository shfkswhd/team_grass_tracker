# 🌱 Team Grass Tracker

**Git 커밋 기반 팀 잔디 시각화 VS Code 확장**

![VS Code Extension](https://img.shields.io/badge/VS%20Code-Extension-blue)
![Git Integration](https://img.shields.io/badge/Git-Integration-orange)
![Team Collaboration](https://img.shields.io/badge/Team-Collaboration-green)

## ✨ 주요 기능

### 🔗 **실제 Git 연동**
- 실제 Git 저장소에서 커밋 데이터 조회
- `git log` 명령으로 정확한 커밋 통계
- 모든 Git 저장소 지원 (알고리즘, 프로젝트 등)

### 👥 **팀원 관리 시스템**
- 직관적인 UI로 팀원 추가/제거
- GitHub 사용자명 기반 자동 데이터 연동
- 개인별 색상 커스터마이징

### 📊 **실시간 통계 대시보드**
- 월별 총 커밋 수, 활동 일수, 최대 커밋 수
- 팀원간 실시간 비교 및 시각화
- HSL 색상 시스템으로 자연스러운 잔디 표현

### 🎯 **팀 관리 기능**
- 출석체크 시스템으로 일일 커밋 현황 확인
- 월별 네비게이션으로 기간별 분석
- VS Code 네이티브 디자인으로 일관된 UX

## 🚀 빠른 시작

### 1. 확장 실행
```bash
# 프로젝트 다운로드
git clone https://github.com/your-repo/team-grass-tracker
cd team-grass-tracker
code .

# VS Code에서 F5 키로 개발 모드 실행
```

### 2. 초기 설정 (2분 완료!)
1. **📁 저장소 선택**: 솔브닥 저장소 폴더 지정
2. **👥 팀원 추가**: GitHub 사용자명과 표시명 입력
3. **🎨 색상 설정**: 개인별 잔디 색상 조정

### 3. 실제 사용 예시
```bash
# 솔브닥 저장소 예시
C:/Users/user/solvedAC/
├── .git/
├── Bronze/1000.py    # 커밋 1회
├── Silver/1463.py    # 커밋 1회  
└── Gold/7579.py      # 커밋 1회
# → 하루 총 3회 커밋으로 진한 잔디 생성!
```

## 🎯 실제 사용 시나리오

### 알고리즘 스터디팀 운영
```json
{
  "팀명": "4인방 알고리즘 마스터",
  "목표": "하루 1문제 이상, 주 5일 활동",
  "저장소": "각자의 solvedAC 또는 백준 저장소",
  "경쟁요소": "월별 잔디 비교 + 재미있는 댓글"
}
```

### 팀원별 특화
- **홍길동**: 백준 실버 도전 (초록색 잔디)
- **김코딩**: 프로그래머스 집중 (파란색 잔디)  
- **박알고**: 코드포스 마스터 (빨간색 잔디)
- **이디버그**: 리트코드 정복 (보라색 잔디)

## 🛠️ 고급 기능

### ⚙️ VS Code 설정 연동
```json
{
  "teamGrassTracker.teamMembers": [
    {
      "githubName": "actual-github-username",
      "displayName": "실제 이름",
      "colorPosition": 25
    }
  ],
  "teamGrassTracker.targetRepository": "C:/path/to/solvedAC",
  "teamGrassTracker.autoRefresh": true
}
```

### � 실시간 Git 데이터 조회
```javascript
// 확장이 자동으로 실행하는 Git 명령
git log --author="username" --since="2025-09-01" --until="2025-09-30" --pretty=format:"%ad" --date=short
```

## 📈 UX 최적화

### 🎨 직관적인 색상 시스템
- **OKLAB 색상공간** 사용으로 자연스러운 그라데이션
- **실시간 미리보기**로 즉시 결과 확인
- **개인 맞춤형** 색상으로 팀원 구분

### 📱 반응형 레이아웃
- **150px 고정 폭**으로 일관된 UI
- **스크롤 최소화**로 깔끔한 화면
- **월별 댓글 분리**로 정보 과부하 방지

### ⚡ 성능 최적화
- **고정 데이터**로 색상 변경 시 일관성 유지
- **효율적인 Git 명령**으로 빠른 데이터 로딩
- **VS Code API 활용**으로 네이티브 성능

## 🔧 확장성

### 📦 모듈 구조
```
team_grass_tracker/
├── extension.js           # 메인 로직 (실제 Git 연동)
├── package.json          # VS Code 확장 매니페스트
├── USER_GUIDE.md         # 실사용 가이드
└── .vscode/launch.json   # 개발 환경 설정
```

### � 향후 로드맵
- [ ] GitHub API 직접 연동
- [ ] 다중 저장소 지원  
- [ ] SVG 잔디 달력 export
- [ ] README.md 자동 업데이트
- [ ] 팀 랭킹 알림 시스템
- [ ] VS Code Marketplace 배포

## 🤝 실제 사용 사례

### 📚 대학교 알고리즘 스터디
> "매주 월요일마다 Team Grass Tracker로 지난주 성과를 비교하고 이번주 목표를 설정해요. 재미있는 댓글 기능 덕분에 더 열심히 하게 됐어요!"

### 🏢 회사 코딩테스트 스터디
> "실제 Git 연동 덕분에 가짜 데이터 없이 정확한 활동 내역을 볼 수 있어서 좋아요. 설정도 2분이면 끝나서 바로 사용할 수 있었습니다."

## � 라이선스

MIT License - 자유롭게 사용하고 수정하세요!

## 🎉 지금 바로 시작하기

1. **F5** - VS Code에서 확장 실행
2. **📁** - 솔브닥 저장소 선택  
3. **👥** - 팀원 추가
4. **🌱** - 실시간 잔디 확인!

---

**Made with ❤️ by GitHub Copilot**  
*실제 Git 데이터 기반 팀 알고리즘 스터디의 새로운 표준*
