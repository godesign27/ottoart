# Otto Art Commerce Platform

## Overview

This is a full-stack web application for an art commerce platform called "Otto Art". The application provides both an administrative interface for managing artworks, categories, and orders, as well as a public-facing website for browsing and purchasing art. Built with a modern React frontend and Express.js backend, the platform is designed to help artists showcase and sell their work online.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built using **React** with **TypeScript** and **Vite** as the build tool. Key architectural decisions include:

- **Component Library**: Uses Radix UI primitives with shadcn/ui components for consistent, accessible UI components
- **Styling**: Tailwind CSS for utility-first styling with CSS custom properties for theming
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state management and caching
- **Form Handling**: React Hook Form with Zod validation schemas
- **Theme System**: next-themes for dark/light mode support

The application follows a modular component structure with separate directories for admin and live site components, promoting code reusability and maintainability.

### Backend Architecture
The backend uses **Express.js** with **TypeScript** following a RESTful API design:

- **Database ORM**: Drizzle ORM for type-safe database operations with PostgreSQL
- **Schema Validation**: Zod schemas shared between frontend and backend for consistent data validation
- **Session Management**: Express sessions with PostgreSQL storage
- **API Structure**: RESTful endpoints organized by resource type (products, categories, orders, messages)
- **Error Handling**: Centralized error handling middleware
- **Development Tools**: Hot reloading with Vite integration for seamless development experience

### Data Storage Solutions
The application uses **PostgreSQL** as the primary database with the following key entities:

- **Users**: Artist/admin authentication and profile management
- **Products**: Artwork listings with categories, pricing, and metadata
- **Categories**: Hierarchical organization of artwork types
- **Tags**: Flexible tagging system for product classification
- **Orders**: E-commerce transaction management
- **Messages**: Customer contact form submissions
- **Site Settings**: Configurable site-wide settings

The database schema supports features like product variants, image galleries, inventory tracking, and order management.

### Authentication and Authorization
- Session-based authentication using Express sessions
- Role-based access control (admin vs. public users)
- Secure password handling and user management
- Protected admin routes and API endpoints

## External Dependencies

### UI and Styling
- **Radix UI**: Accessible, unstyled UI primitives for consistent component behavior
- **Tailwind CSS**: Utility-first CSS framework for rapid styling
- **Lucide React**: Icon library for consistent iconography
- **next-themes**: Theme switching functionality

### Database and ORM
- **@neondatabase/serverless**: PostgreSQL client optimized for serverless environments
- **Drizzle ORM**: Type-safe ORM with excellent TypeScript integration
- **drizzle-kit**: Database migration and introspection tools

### State Management and Data Fetching
- **TanStack React Query**: Server state management, caching, and synchronization
- **Zod**: Runtime type validation and schema definition

### Development and Build Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Static type checking for both frontend and backend
- **ESBuild**: Fast JavaScript bundler for production builds

### Form and UI Enhancement
- **React Hook Form**: Performant form library with minimal re-renders
- **class-variance-authority**: Utility for creating variant-based component APIs
- **clsx**: Conditional className utility

The platform is designed to be deployment-ready with support for both development and production environments, including proper build processes and static asset serving.