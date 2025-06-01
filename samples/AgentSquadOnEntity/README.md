# Agent Squad Entity UI

A modern React TypeScript application for document workflow management featuring a multi-step process for document creation, review, and finalization.

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**

### Installation

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd AgentSquadOnEntity
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start the development server:**

   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:5173` (or the port shown in your terminal)

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## 📋 Project Overview

Agent Squad Entity UI is a document workflow management system that guides users through a structured 4-step process:

1. **Requirements Gathering** - Collect and define document requirements
2. **Document Draft** - Create initial document version
3. **Document Review** - Stakeholder review and feedback incorporation
4. **Final Document** - Approved and ready-to-execute document

## 🏗️ Architecture

### Technology Stack

- **Frontend Framework:** React 18 with TypeScript
- **Build Tool:** Vite 5.x
- **Styling:** Tailwind CSS 3.x
- **Icons:** React Icons
- **Development:** Hot Module Replacement (HMR) via Vite

### Project Structure

``` text
src/
├── components/          # React components
│   ├── App.tsx         # Main application component
│   ├── NavBar.tsx      # Top navigation bar
│   ├── StepsBar.tsx    # Step indicator/navigation
│   ├── ChatPane.tsx    # Left sidebar chat interface
│   ├── EntityPane.tsx  # Center pane for document display
│   ├── FindingsPane.tsx # Right sidebar for findings/notes
│   └── Logo.tsx        # Application logo component
├── utils/              # Utility functions
│   └── botColors.ts    # Color utilities for bot/agent theming
├── main.tsx           # Application entry point
└── index.css          # Global styles and Tailwind imports
```

### Component Architecture

#### Main Layout Components

1. **App.tsx** - Root component managing:
   - State for active step (0-3)
   - Mobile overlay states for responsive design
   - Layout orchestration

2. **NavBar.tsx** - Top navigation with:
   - Application branding
   - User actions/settings

3. **StepsBar.tsx** - Step indicator showing:
   - Current progress (1-4)
   - Navigation between steps

#### Core Functional Components

1. **EntityPane.tsx** - Central document viewer:
   - Displays step-specific content
   - Markdown-like content rendering
   - Document status indicators
   - Export/download functionality

2. **ChatPane.tsx** - Communication interface:
   - Real-time chat or messaging
   - Agent/bot interactions
   - Context-aware conversations

3. **FindingsPane.tsx** - Analysis and notes:
   - Document findings
   - Review comments
   - Stakeholder feedback

### State Management

The application uses React's built-in state management:

- `activeStep` - Controls which step (0-3) is currently displayed
- `mobileChatOpen` - Manages mobile chat overlay visibility
- `mobileFindingsOpen` - Manages mobile findings overlay visibility

### Responsive Design

- **Desktop (≥640px):** Three-pane layout with all components visible
- **Mobile (<640px):**
  - Single-pane layout with Entity view primary
  - Slide-out overlays for Chat and Findings
  - Touch-friendly navigation strips

## 🎨 Styling

### Tailwind CSS Configuration

The project uses Tailwind CSS with custom configuration including:

- Custom color schemes for primary, accent, and neutral colors
- Responsive breakpoints
- Typography utilities
- Custom component classes

### Design System

- **Primary Colors:** Used for main navigation and headers
- **Accent Colors:** Used for status indicators and highlights  
- **Neutral Colors:** Used for content and backgrounds
- **Typography:** Balanced text with proper hierarchy

## 🔧 Development

### Adding New Components

1. Create component file in `src/components/`
2. Follow TypeScript interface patterns
3. Use Tailwind classes for styling
4. Implement responsive design patterns

### Modifying Step Content

Document content for each step is defined in `EntityPane.tsx` in the `stepContent` array. Each step object contains:

- `title` - Step display name
- `content` - Markdown-like content string

### Color Theming

Bot/agent colors are managed in `src/utils/botColors.ts` for consistent theming across chat interfaces.

## 📱 Mobile Considerations

- Touch-friendly interface elements
- Swipe gestures for navigation
- Optimized overlay animations
- Accessible mobile navigation

## 🚨 Troubleshooting

### Common Issues

1. **Port already in use:**

   ```bash
   # Kill process on port 5173
   npx kill-port 5173
   npm run dev
   ```

2. **Dependencies not installing:**

   ```bash
   # Clear cache and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Build fails:**

   ```bash
   # Check TypeScript errors
   npx tsc --noEmit
   ```

## 🧪 Testing

Currently, the project does not include automated tests. Consider adding:

- Unit tests with Jest/Vitest
- Component tests with React Testing Library
- E2E tests with Playwright or Cypress

## 📈 Performance

- Vite provides fast development builds
- Code splitting via dynamic imports
- Optimized production builds
- Responsive image loading

## 🤝 Contributing

1. Create feature branch from main
2. Follow existing code patterns
3. Ensure TypeScript compliance
4. Test on both desktop and mobile
5. Submit pull request with clear description

## 📄 License

[Add your license information here]

## 🔗 Additional Resources

- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/) 