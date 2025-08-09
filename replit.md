# Overview

This is a full-stack invoice management system built with React, Express.js, and PostgreSQL. The application provides comprehensive functionality for managing customers, invoices, and invoice items with a modern Arabic-language interface using shadcn/ui components. The system features a dashboard with business analytics, customer management, and invoice creation/tracking capabilities.

## Recent Changes (January 2025)

- **Document Number Removal**: Removed document number field from monthly invoices (kept for commercial invoices)
- **Number Formatting**: Added real-time comma formatting for all price inputs (e.g., 30,000, 100,000, 1,000,000)
- **Tax Removal**: Completely removed tax calculations (17% VAT) from all invoice types
- **UI Improvements**: Created FormattedNumberInput component for consistent number formatting across the application

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **Layout**: Right-to-left (RTL) layout support for Arabic interface

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with JSON responses
- **Request Handling**: Express middleware for JSON parsing, URL encoding, and request logging
- **Error Handling**: Centralized error handling middleware
- **Development**: Hot reloading with Vite integration in development mode

## Data Storage
- **Database**: PostgreSQL with connection pooling via Neon serverless
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema**: Structured tables for customers, invoices, and invoice items
- **Migrations**: Drizzle Kit for database schema management
- **Validation**: Zod schemas derived from Drizzle table definitions

## Authentication and Authorization
- **Session Management**: Express sessions with PostgreSQL session store (connect-pg-simple)
- **Storage**: Session data persisted in PostgreSQL database
- **Security**: Session-based authentication with secure cookie configuration

## External Dependencies

- **Database**: Neon PostgreSQL serverless database
- **UI Components**: Radix UI primitives for accessible component foundation
- **Styling**: Tailwind CSS for utility-first styling approach
- **Icons**: Lucide React for consistent iconography
- **Date Handling**: date-fns for date manipulation and formatting
- **Development Tools**: Replit integration with cartographer plugin and runtime error overlay
- **Build Tools**: esbuild for server-side bundling, Vite for client-side development and building