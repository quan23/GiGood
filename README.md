# GiGood - Technology Stack Description

## Overview

GiGood is a mobile-first job connection platform built using a modern client-server architecture.

The system separates the mobile application and backend responsibilities:

- The mobile application handles UI, user interaction, navigation, and client-side state.
- The backend handles business logic, authentication, API processing, and database operations.
- The database stores users, jobs, applications, conversations, and system data.

The architecture is designed for:

- Fast development
- Easy maintenance
- AI-assisted coding
- Scalability
- Minimal unnecessary complexity

==================================================
FRONTEND STACK (MOBILE APPLICATION)
==================================================

## Framework

Expo + React Native

Purpose:
The mobile application is developed using React Native through the Expo ecosystem.

Expo provides:

- Cross-platform Android and iOS development
- Single codebase
- Fast development cycle
- Hot reload
- Easy device testing through Expo Go
- Access to native device features without manual native setup

Architecture:

Expo Application
|
|
React Native Components
|
|
Android / iOS Native Layer

---

## Programming Language

TypeScript

Purpose:
TypeScript is used as the primary frontend language.

Benefits:

- Type safety
- Better autocomplete
- Easier debugging
- Cleaner large-scale project structure

Used for:

- Components
- API models
- Navigation types
- Application state
- Data validation

---

## Navigation

Expo Router

Purpose:
File-based navigation system for React Native.

Instead of manually configuring navigation, screens are organized by folders and files.

Example:

app/

index.tsx
Home screen

login.tsx
Login screen

profile.tsx
Profile screen

jobs/

    index.tsx
        Job listing

    [id].tsx
        Job detail page

Benefits:

- Simple routing
- Less boilerplate
- Easier page management
- Supports deep linking

---

## UI Styling

NativeWind

Purpose:
TailwindCSS-style styling for React Native.

Allows writing UI using utility classes.

Example:

className="bg-blue-500 rounded-xl p-5"

Benefits:

- Faster UI development
- Consistent design system
- Easier AI code generation
- Less styling boilerplate

---

## Component Architecture

Custom reusable component system.

Structure:

src/

components/

    Button
    Input
    Card
    Modal
    JobCard
    UserAvatar
    Loading

Purpose:

- Reusable UI
- Consistent design
- Easier feature development

---

## API Communication

Axios

Purpose:
Handles communication between Expo and ASP.NET Core backend.

Architecture:

Mobile App

      |
      |
      HTTP Request

      |
      |

ASP.NET Core Web API

Responsibilities:

- Send API requests
- Receive responses
- Attach authentication tokens
- Handle API errors

Example:

GET
/api/jobs

POST
/api/auth/login

---

## State Management

Zustand

Purpose:
Lightweight global state management.

Used for:

- Logged-in user
- Authentication state
- User preferences
- Temporary application state

Example:

User Store:

{
userId,
username,
role,
token
}

Benefits:

- Simple
- Minimal boilerplate
- Faster than complex state systems

---

## Server Data Management

TanStack React Query

Purpose:
Manages API data inside the application.

Used for:

- API caching
- Loading states
- Refetching
- Synchronizing backend data

Example:

Open app

    |
    |

Request jobs

    |
    |

Cache response

    |
    |

Instant reload later

Benefits:

- Cleaner API handling
- Better performance
- Less duplicated code

---

## Secure Storage

Expo SecureStore

Purpose:
Securely store sensitive local data.

Used for:

- JWT tokens
- Login sessions
- User credentials

Flow:

Backend Token

      |

Expo SecureStore

      |

Mobile Application

==================================================
BACKEND STACK
==================================================

## Framework

ASP.NET Core Web API

Purpose:
Backend service responsible for:

- Business logic
- Authentication
- Authorization
- Database operations
- API endpoints

Architecture:

Expo Mobile App

        |
        |
        REST API

        |
        |

ASP.NET Core API

        |
        |

Entity Framework Core

        |
        |

SQL Server

---

## Programming Language

C#

Used for:

- Controllers
- Services
- Models
- Database logic
- Authentication

---

## API Architecture

REST API

The backend exposes endpoints consumed by the mobile application.

Authentication:

POST

/api/auth/register

POST

/api/auth/login

Jobs:

GET

/api/jobs

GET

/api/jobs/{id}

POST

/api/jobs/create

Applications:

POST

/api/applications/apply

GET

/api/applications/user

---

## Database ORM

Entity Framework Core

Purpose:
Database communication layer.

Responsibilities:

- Map C# classes to database tables
- Handle queries
- Manage migrations
- Maintain relationships

Example:

C# Model:

Job

{
Id
Title
Description
Salary
}

Database:

Jobs Table

---

## Database

SQL Server

Stores:

Users

Account

{
Id
Name
Email
PasswordHash
Role
}

Jobs

{
Id
Title
Description
Salary
Location
EmployerId
}

Applications

{
Id
JobId
UserId
Status
CreatedDate
}

==================================================
AUTHENTICATION
==================================================

JWT Authentication

Purpose:
Secure communication between mobile app and backend.

Flow:

User Login

    |

Backend verifies account

    |

Generate JWT Token

    |

Mobile stores token

    |

Token sent with API requests

Request:

Authorization:
Bearer TOKEN

==================================================
REAL-TIME FEATURES
==================================================

SignalR

Purpose:
Real-time communication.

Possible features:

- Chat
- Notifications
- Application status updates

Architecture:

User A

Expo

|

SignalR Hub

|

Expo

User B

==================================================
FILE STORAGE
==================================================

Used for:

- Profile pictures
- CV files
- Job images

Flow:

Expo

    |

Multipart Upload

    |

ASP.NET API

    |

Storage

Possible future upgrades:

- Azure Blob Storage
- Cloud storage

==================================================
DEVELOPMENT TOOLS
==================================================

Frontend:

- VS Code
- Node.js
- Expo CLI
- TypeScript

Backend:

- Visual Studio / Rider
- .NET SDK
- SQL Server
- Swagger

==================================================
FINAL SYSTEM ARCHITECTURE
==================================================

                 GiGood Mobile App


              Expo + React Native

                     |

              Expo Router

                     |

              Axios API Layer

                     |

              ASP.NET Core API

                     |

           Entity Framework Core

                     |

                SQL Server

Additional Services:

- JWT Authentication
- SignalR
- Secure Storage
- React Query
- Zustand
- NativeWind

==================================================
DEVELOPMENT PHILOSOPHY
==================================================

The stack prioritizes:

- Fast implementation
- Minimum setup complexity
- AI-assisted development
- Clean separation of frontend/backend
- Easy debugging
- Future scalability

The frontend focuses on user experience and rapid iteration.

The backend handles security, business rules, and data management.
