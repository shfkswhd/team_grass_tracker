# 🌱 Team Grass Tracker

알고리즘 스터디 팀을 위한 GitHub 잔디(커밋) 시각화 VS Code 확장입니다.

## ✨ 주요 기능

### 📊 팀 잔디 비교
- 4명의 팀원 잔디를 동시에 비교 가능
- 각자 개성있는 색상으로 구분 (OKLAB 색상 시스템)
- 월별 네비게이션으로 과거 기록 확인

### 🎨 개인 맞춤 색상
- 각 사용자가 자신만의 잔디 색상 선택 가능
- 자연스러운 그라데이션으로 커밋 활동량 표시
- 실시간 색상 미리보기

### 💬 팀 소통 기능
- 월별 댓글 시스템으로 팀원들과 소통
- 사용자별 색상이 적용된 댓글 상자
- 잔디 격려/모욕 메시지 기능

## 🚀 설치 및 사용법

### 1. 개발 모드로 실행
```bash
# 프로젝트 폴더에서
code .
# F5 키를 눌러 Extension Development Host 실행
```

### 2. VS Code에서 사용
1. 좌측 Activity Bar에서 🌱 아이콘 클릭
2. Team Grass Tracker 사이드바 확인
3. 색상 슬라이더로 개인 색상 조정
4. ← → 버튼으로 월별 이동
5. 💬 버튼으로 팀원에게 댓글 작성

## 📁 프로젝트 구조

```
team_grass_tracker/
├── extension.js           # 메인 확장 로직
├── package.json          # 확장 매니페스트
├── grass_calendar_sample.html  # 독립 실행 데모
├── oklab.js             # OKLAB 색상 변환 유틸리티
└── .vscode/
    └── launch.json      # 개발 환경 설정
```

## 🛠️ 기술 스택

- **VS Code Extension API**: 사이드바 통합
- **OKLAB 색상공간**: 자연스러운 색상 그라데이션
- **HTML/CSS/JavaScript**: 웹뷰 렌더링
- **Git Integration**: 실제 커밋 데이터 연동 (개발 예정)

## 🎯 사용 시나리오

### 알고리즘 스터디 팀
```
팀원들: 김코딩, 박알고, 이디버그, 최코드
목표: 매일 알고리즘 문제 풀고 커밋하기
```

### 주요 활용법
1. **월별 비교**: 누가 가장 꾸준히 했는지 확인
2. **색상 개성화**: 각자 좋아하는 색으로 잔디 표시
3. **팀 소통**: 서로 격려하거나 모욕(?!)하며 동기부여
4. **실시간 모니터링**: 코딩하면서 사이드바로 팀 현황 확인

## 🔧 향후 개발 계획

- [ ] 실제 Git 저장소 연동
- [ ] GitHub API 통합
- [ ] README.md 자동 업데이트
- [ ] SVG 잔디 달력 생성
- [ ] 다중 저장소 지원
- [ ] 팀 랭킹 시스템

## 📝 라이선스

MIT License

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch
3. Commit your Changes
4. Push to the Branch
5. Open a Pull Request

---

**만든이**: GitHub Copilot 🤖  
**목적**: 팀 알고리즘 스터디의 재미와 동기부여! 🌱💪
