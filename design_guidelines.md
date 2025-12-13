# Design Guidelines: Minecraft Bot Dashboard

## Design Approach
**System-Based Approach**: Gaming dashboard aesthetic inspired by Discord and modern developer tools, prioritizing readability and real-time data visualization. This is a utility-focused application where efficiency and clarity are paramount.

## Core Design Principles
- **Information clarity**: Clear visual hierarchy for status, logs, and controls
- **Gaming aesthetic**: Modern, tech-forward interface that fits the Minecraft/gaming context
- **Real-time focus**: Design elements that support live data streams and updates
- **Functional density**: Efficient use of space without overwhelming users

## Typography System

**Font Families** (via Google Fonts CDN):
- Primary: 'Inter' - Clean, modern sans-serif for UI elements and forms
- Monospace: 'JetBrains Mono' - For chat logs and technical data

**Type Scale**:
- Page Title: text-3xl font-bold
- Section Headers: text-xl font-semibold
- Subsection/Card Headers: text-lg font-medium
- Body Text: text-base font-normal
- Chat Logs/Technical: text-sm font-mono
- Captions/Meta: text-xs

## Layout System

**Spacing Units**: Use Tailwind units of 2, 4, 6, and 8 for consistency
- Component padding: p-4 to p-6
- Section margins: m-6 to m-8
- Card gaps: gap-4
- Form field spacing: space-y-4

**Grid Structure**:
- Main dashboard: Two-column layout (sidebar + main content)
- Sidebar: Fixed width ~280px (w-70)
- Main content: Flexible with max-w-7xl container
- Responsive: Stack to single column on mobile (md: breakpoint)

## Component Library

### Dashboard Layout
**Sidebar Navigation**:
- Fixed left sidebar with bot status at top
- Navigation items with icons (Heroicons)
- Connection status indicator (dot + text)
- Compact, vertical stack with space-y-2

**Main Content Area**:
- Header bar with page title and quick actions
- Grid layout for configuration cards (grid-cols-1 lg:grid-cols-2)
- Full-width chat log section at bottom

### Status Components
**Bot Status Card**:
- Prominent display with connection state (Connected/Disconnected/Connecting)
- Server info (IP, player count)
- Uptime counter
- Rounded corners (rounded-lg), elevated shadow

**Real-time Stats**:
- Small stat cards in grid (grid-cols-3 gap-4)
- Large number display with label below
- Compact, scannable layout

### Configuration Panel
**Form Layout**:
- Vertical form with clear labels above inputs
- Input groups with consistent spacing (space-y-4)
- Primary action button (Connect/Disconnect) prominent and full-width
- Secondary settings in collapsible accordion or tabs

**Input Fields**:
- Text inputs: Full-width with border, focus states
- Validation feedback inline below fields
- Helper text in muted, smaller font

### Chat Log Display
**Terminal-style Interface**:
- Full-width container with fixed height (h-96)
- Dark background surface to distinguish from main UI
- Monospace font for all chat content
- Auto-scroll to bottom for new messages
- Message format: [timestamp] username: message
- Scrollable overflow-y-auto

**Chat Controls**:
- Input bar at bottom of chat log
- Send button integrated with input field
- Quick command shortcuts as small chips/buttons above input

### Command Control Panel
**Button Grid**:
- Grid of action buttons (grid-cols-2 md:grid-cols-4 gap-3)
- Icon + text labels for clarity
- Grouped by category (Movement, Actions, Chat)
- Disabled states when bot is disconnected

### Cards & Containers
- All cards: rounded-lg with subtle shadow
- Consistent padding: p-6
- Header sections within cards: border-b with pb-4
- Card titles: text-lg font-semibold

## Icons
**Icon Library**: Heroicons (via CDN)
- Status indicators: check-circle, x-circle, arrow-path
- Navigation: home, cog, chat-bubble-left-right, command-line
- Actions: play, stop, paper-airplane, arrow-up
- Use outline variant for navigation, solid for status

## Visual Hierarchy
**Z-index Layers**:
- Base content: z-0
- Sidebar: z-10
- Modals/overlays: z-50

**Emphasis**:
- Connection status: Most prominent (larger font, bold)
- Primary actions: High contrast, larger buttons
- Chat log: Contained but scrollable focal point
- Configuration: Clear but secondary priority

## Responsive Behavior
- **Desktop (lg:)**: Two-column layout with sidebar
- **Tablet (md:)**: Sidebar collapses to hamburger menu
- **Mobile**: Single column, stacked layout, bottom navigation for key actions

## Images
This dashboard does not require hero images. All visual elements are functional UI components. Use small avatar/profile placeholders for bot identity (32x32px) in the sidebar header if desired.

## Component Specifications

**Navigation Height**: h-16 (64px)
**Sidebar Width**: w-70 (280px) on desktop
**Chat Log Height**: h-96 (384px), expandable
**Button Heights**: h-10 for standard, h-12 for primary actions
**Input Heights**: h-10 with py-2
**Card Min Height**: min-h-32 for stat cards

This design creates a functional, gaming-appropriate dashboard that prioritizes real-time data display and bot control while maintaining visual polish and usability.