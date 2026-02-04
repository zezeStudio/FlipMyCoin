# Coin Flip Simulator - Blueprint

## Overview

This document outlines the development of a lightweight, SEO-optimized coin flip simulator website based on the provided Product Requirements Document (PRD). The primary goal is to create a fast, reliable, and user-friendly tool for making quick random decisions, with a monetization strategy centered around Google AdSense.

## Style, Design, and Features

### Design Principles
- **Minimalist & Modern:** Clean, uncluttered interface focusing on the core functionality.
- **Fast & Responsive:** A loading speed under 1 second and a seamless experience on all devices (mobile, desktop).
- **Intuitive UX:** The user's journey is straightforward: land on the page, click a button, and see the result instantly.
- **Visual Feedback:** A satisfying 3D coin flip animation provides immediate and engaging feedback.

### Core Features (MVP)
- **Instant Coin Flip:** A single "Flip Now" button to initiate the coin toss.
- **3D Animation:** A visually appealing 3D rotation effect for the coin.
- **Clear Result Display:** Prominently displayed result (Heads or Tails).
- **SEO-Optimized Content:** The landing page includes text content based on keywords like "coin flip simulator," "heads or tails generator," etc., to attract organic traffic.
- **AdSense Integration:** Strategically placed ad slots to maximize revenue without disrupting the user experience.

### Technology Stack
- **Frontend:** Next.js (for performance and SEO benefits)
- **Styling:** Tailwind CSS (for rapid, utility-first styling)
- **Analytics:** Google Analytics (to be integrated)

#### Image Optimization Best Practices
- **Next.js Image Component Updates:** Replaced deprecated `layout` and `objectFit` props with `fill` prop and `style={{ objectFit: 'cover' }}`.
- **LCP Optimization:** Added `loading="eager"` to the primary (heads) image to prioritize loading for Largest Contentful Paint (LCP) elements.
- **Responsive Sizing:** Implemented `sizes="(max-width: 768px) 100vw, 256px"` for images using the `fill` prop to provide optimal image sources based on viewport size.
- **Removed Text Overlay from Coin Component (Current Design):** `choice1Label` and `choice2Label` display is now entirely removed from the `Coin.tsx` component. The `Coin` component solely displays the coin image, addressing the request for "no text inside the image" and a preference for no text on the coin face.
- **Correct Coin Face Display (Simplified Visibility Control):** Reverted opacity-based visibility control. The `Coin.tsx` component strictly relies on the 3D CSS (`transform` and `backface-visibility`) for showing the correct coin face during and after a flip. `overflow-hidden` was moved from the rotating element to its direct parent to avoid potential rendering conflicts with 3D transforms.

### UX 강화 기능 계획

다음 기능들을 점진적으로 구현하여 사용자 경험을 강화합니다.

*   **사용자 선택지 커스터마이징:**
    *   기본 'Heads/Tails' 대신 사용자가 원하는 라벨(예: 'Yes/No', 'A/B')을 입력하고 동전 던지기 결과에 반영합니다.
    *   `pages/index.tsx`에 라벨 입력 필드를 추가하고, `flipCoin` 로직을 수정하여 커스텀 라벨을 사용하도록 합니다.
    *   `Coin.tsx` 컴포넌트의 이미지 표시는 Heads/Tails 고정, 결과 텍스트와 히스토리에서만 커스텀 라벨 사용.

*   **최근 결과 히스토리:**
    *   마지막 10~20번의 동전 던지기 결과를 시각적으로(아이콘 또는 텍스트) 표시합니다.
    *   `pages/index.tsx`에 결과를 저장할 상태를 추가하고, 이를 표시할 `History.tsx` 컴포넌트를 구현합니다.

*   **연속 던지기 / 배치 던지기:**
    *   사용자가 10회, 50회, 100회 등 한 번에 여러 번 동전을 던질 수 있는 기능을 제공합니다.
    *   `pages/index.tsx`에 배치 던지기 버튼과 로직을 추가하고, `flipCoin` 로직을 재활용하여 구현합니다。
*   **애니메이션 업그레이드:**
    *   동전 회전 속도에 무작위성을 추가하여 매번 다른 시각적 재미를 제공합니다.
    *   `Coin.tsx`의 `transition` 속성 및 `transform` 값에 무작위 값을 적용합니다. (사운드 효과는 CLI 에이전트 환경의 제약으로 현재 구현 범위에서 제외합니다.)

*   **통계 시각화 (차트/그래프):**
    *   통계 섹션의 데이터를 막대 그래프 등으로 시각화하여 사용자가 결과를 직관적으로 이해할 수 있도록 돕습니다.

## Plan for Current Request: Language Translation and Ad Placeholder Removal

1.  **[COMPLETED]** `blueprint.md` 파일을 현재 요청에 맞춰 업데이트합니다.
2.  **[COMPLETED]** `pages/index.tsx`에서 "Ad Placeholder" 코드를 제거합니다.
3.  **[COMPLETED]** `pages/index.tsx`에 있는 모든 한국어 UI 텍스트를 영어로 번역합니다.
4.  **[COMPLETED]** `components/Coin.tsx`에 있는 모든 한국어 UI 텍스트를 영어로 번역합니다.
5.  **[COMPLETED]** `components/History.tsx`에 있는 모든 한국어 UI 텍스트를 영어로 번역합니다.
6.  **[COMPLETED]** `components/FlipChart.tsx`에 있는 모든 한국어 UI 텍스트를 영어로 번역합니다.
7.  **[SKIPPED]** `npm run lint -- --fix`를 실행하여 린팅 문제를 해결합니다. (Lint script not found in package.json)
8.  **[COMPLETED]** `npm run build`를 실행하여 프로젝트가 오류 없이 빌드되는지 확인합니다.

## Plan for Current Request: Remove Privacy Policy Link

1.  **[COMPLETED]** `blueprint.md` 파일을 현재 요청에 맞춰 업데이트합니다.
2.  **[COMPLETED]** `pages/index.tsx`에서 "Privacy Policy" 링크를 제거합니다.
3.  **[COMPLETED]** `npm run build`를 실행하여 프로젝트가 오류 없이 빌드되는지 확인합니다.
