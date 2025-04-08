# AKT TV Panel UI

## Overview
This is a Vue 3 + TypeScript application that displays production status information in a TV panel format. It features real-time production data monitoring with automatic updates.

## Project Structure
```
cwlakt-tvpanel-ui
├── src
│   ├── assets
│   │   └── logo.svg
│   ├── components
│   │   └── TVPanel.vue
│   ├── config
│   │   └── config.json
│   ├── utils
│   │   ├── aktApi.ts
│   │   └── api.ts
│   ├── App.vue
│   └── main.ts
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Features
- Real-time production status display
- Daily production monitoring
- Auto-refresh every 60 seconds
- Responsive table layouts
- Production summary statistics
- Hourly production breakdown

## Prerequisites
- Node.js (version 12 or higher)
- npm (comes with Node.js)
- Backend API server running at https://localhost:44379

## Installation
1. Clone the repository:
   ```
   git clone https://github.com/yourusername/cwlakt-tvpanel-ui.git
   cd cwlakt-tvpanel-ui
   ```

2. Install dependencies:
   ```
   npm install
   ```

## Development
To start the development server:
```
npm run dev
```
The application will be available at http://localhost:8080

## Building for Production
To create a production build:
```
npm run build
```

## Configuration
API settings can be modified in:
- `src/config/config.json` for base configuration
- `vite.config.ts` for development proxy settings

## License
MIT License