# First Step School Platform

A comprehensive web application for creating, managing, and completing interactive educational assignments. Built with React, TypeScript, and Vite, featuring Supabase for authentication and data storage.

## Features

### Gallery
- **Assignment Gallery**
  - Browse available assignments
  - Filter by categories and topics
  - Preview assignment details
  - Quick access to popular assignments
  - Rating and review system

### Assignment Management
- **Assignment Creation and Management**
  - Create custom assignments with multiple exercise types
  - Set assignment parameters (time limits, attempts allowed)
  - Organize assignments by categories/topics
  - Share assignments via unique links
  - Track completion status and student progress

- **Exercise Types**
organ  1. **Matching Exercises** (`MatchingExercise.tsx`, `EnhancedMatchingExercise.tsx`)
     - Pair related items
     - Support for text-to-text matching
     - Audio-enhanced matching capability
     - Drag-and-drop interface
     - Real-time validation

  2. **Ordering Exercises** (`OrderingExercise.tsx`)
     - Arrange items in correct sequence
     - Drag-and-drop reordering
     - Support for custom ordering criteria
     - Progress tracking
     - Instant feedback

  3. **Multiple Choice Questions** (`MultipleChoiceExercise.tsx`)
     - Single and multiple correct answers
     - Custom scoring options
     - Randomized answer options
     - Explanation support for answers
     - Visual feedback on selection

  4. **Completion Exercises** (`CompletionExercise.tsx`)
     - Fill-in-the-blank style questions
     - Support for multiple correct answers
     - Case sensitivity options
     - Hint system
     - Pattern matching for answers

### User System

- **Authentication** (`SupabaseAuthContext.tsx`)
  - Email/password authentication
  - Social login integration
  - Anonymous user support
  - Session management
  - Password reset functionality

- **User Dashboard** (`UserDashboardPage.tsx`)
  - Personal progress tracking
  - Assignment completion history
  - Performance analytics
  - Upcoming assignments view
  - Certificate management

- **Organization Management**
  - Create and manage organizations
  - User role management
  - Assignment sharing within organizations
  - Organization-specific analytics
  - Custom branding options

### Components and Layout

- **Layout Components**
  - **Header** (`Header.tsx`)
    - Navigation menu
    - User profile access
    - Organization switcher
    - Notification system

  - **Footer** (`Footer.tsx`)
    - Site links
    - Legal information
    - Contact details
    - Social media links

  - **Layout** (`Layout.tsx`)
    - Responsive design
    - Sidebar navigation
    - Content area management
    - Loading states

### Additional Features

- **Certificate System** (`CertificateTemplate.tsx`, `CertificateViewer.tsx`)
  - Custom certificate generation
  - PDF export capability
  - Template customization
  - Verification system
  - Bulk certificate generation

- **Audio Features** (`AudioPlayer.tsx`, `AudioRecorder.tsx`)
  - Audio recording for assignments
  - Playback controls
  - Format conversion
  - Volume normalization
  - Waveform visualization

- **Progress Tracking**
  - **Progress Display** (`ProgressDisplay.tsx`)
    - Visual progress indicators
    - Completion percentages
    - Time tracking
    - Performance metrics

  - **Celebration Overlay** (`CelebrationOverlay.tsx`)
    - Achievement animations
    - Success messages
    - Score display
    - Share options

- **Database Integration**
  - **Migration System** (`organizationMigration.ts`, `runMigrations.ts`)
    - Schema versioning
    - Data migration tools
    - Rollback capability
    - Migration logging

  - **Services**
    - Assignment service
    - User progress service
    - Organization service
    - Storage service

## Tech Stack

- **Frontend**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Styling**:
  - Tailwind CSS
  - Custom CSS modules
  - Responsive design system
- **Authentication**: Supabase Auth
- **Database**: Supabase with PostgreSQL
- **State Management**: React Context API
- **Routing**: React Router v6+
- **Testing**: Jest + React Testing Library

## Project Structure

```
src/
├── components/
│   ├── admin/         # Admin dashboard and management
│   │   ├── AdminDashboard.tsx
│   │   ├── AssignmentForm.tsx
│   │   └── QuestionForm.tsx
│   ├── assignments/   # Assignment-related components
│   │   ├── AssignmentList.tsx
│   │   ├── PlayAssignment.tsx
│   │   └── ProgressDisplay.tsx
│   ├── auth/         # Authentication components
│   ├── certificates/ # Certificate generation
│   ├── exercises/    # Exercise components
│   ├── layout/       # Layout components
│   ├── pages/        # Page components
│   └── user/         # User-related components
├── context/          # React context providers
├── hooks/            # Custom React hooks
├── lib/
│   ├── auth/         # Authentication utilities
│   ├── db/          # Database operations
│   ├── services/    # Business logic services
│   └── utils/       # Utility functions
└── types/           # TypeScript type definitions
```

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and configure your environment variables
4. Start the development server:
   ```bash
   npm run dev
   ```

## Development

- **Build**: `npm run build`
- **Preview**: `npm run preview`
- **Type Check**: `npm run typecheck`
- **Lint**: `npm run lint`

## Environment Variables

Create a `.env` file with the following variables:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database Schema

### Tables
1. **assignments**
   - id: uuid PRIMARY KEY
   - title: text
   - description: text
   - created_at: timestamp
   - updated_at: timestamp
   - organization_id: uuid (foreign key)

2. **exercises**
   - id: uuid PRIMARY KEY
   - assignment_id: uuid (foreign key)
   - type: text (matching/ordering/multiple-choice/completion)
   - content: jsonb
   - order: integer

3. **user_progress**
   - id: uuid PRIMARY KEY
   - user_id: uuid
   - assignment_id: uuid
   - status: text
   - score: numeric
   - completed_at: timestamp

4. **organizations**
   - id: uuid PRIMARY KEY
   - name: text
   - settings: jsonb
   - created_at: timestamp

## Database Migrations

The project includes database migrations for setting up the required tables and schemas. Run migrations using:

```bash
npm run migrate
```

## API Services

### Assignment Service
- createAssignment
- updateAssignment
- deleteAssignment
- getAssignmentById
- listAssignments
- shareAssignment

### User Progress Service
- updateProgress
- getProgress
- generateCertificate
- listCompletedAssignments

### Organization Service
- createOrganization
- updateOrganization
- addUserToOrganization
- removeUserFromOrganization

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
