# Interactive Assignments Platform

A comprehensive web application for creating, managing, and completing interactive educational assignments. Built with React, TypeScript, and Vite, featuring Supabase for authentication and data storage.

## Features

- **Assignment Management**
  - Create and manage interactive assignments
  - Multiple exercise types supported:
    - Matching exercises
    - Ordering exercises
    - Multiple choice questions
    - Completion exercises
  - Share assignments with students
  - Track student progress

- **User Management**
  - Supabase authentication integration
  - User dashboard with progress tracking
  - Anonymous user registration support
  - Organization-based user management

- **Exercise Types**
  - Enhanced matching exercises with audio support
  - Ordering exercises for sequence-based learning
  - Multiple choice questions
  - Completion exercises
  - Interactive feedback and scoring

- **Additional Features**
  - Certificate generation and viewing
  - Audio recording and playback capabilities
  - Progress tracking and celebration overlays
  - Organization management
  - Database status monitoring
  - Image upload functionality

## Tech Stack

- **Frontend**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: Supabase
- **State Management**: React Context
- **Routing**: React Router

## Project Structure

```
src/
├── components/
│   ├── admin/         # Admin dashboard and management
│   ├── assignments/   # Assignment-related components
│   ├── auth/         # Authentication components
│   ├── certificates/ # Certificate generation
│   ├── exercises/    # Various exercise types
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

## Database Migrations

The project includes database migrations for setting up the required tables and schemas. Run migrations using:

```bash
npm run migrate
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request
