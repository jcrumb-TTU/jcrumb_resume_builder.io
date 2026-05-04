# A Real Crummy Resume Generator

A desktop resume builder application developed for CSC 3100 at Tennessee
Technological University, Spring 2026.

Built with Electron, Node.js, Express, SQLite3, Bootstrap 5, and vanilla
JavaScript. AI resume feedback powered by Google Gemini 2.5 Flash.

---

## Prerequisites

- Node.js v18 or higher
- Download from https://nodejs.org

---

## Setup

### 1. Install dependencies

Run the following in the project root directory:

    npm install

This installs all packages and automatically copies Bootstrap, SweetAlert2,
FontAwesome, and jsPDF to their local directories via postinstall.js.

### 2. Configure environment

Copy .env.example to .env:

    cp .env.example .env   (macOS / Linux)
    copy .env.example .env (Windows)

Open the new .env file and replace your_gemini_api_key_here with a valid
Gemini API key. A free key can be obtained at:

    https://aistudio.google.com/apikey

Select the Gemini 2.5 Flash model when generating your key.
The free tier allows 10 requests per minute and 500 per day.

---

## Running the Application

Start normally:

    npm start

Start in development mode with DevTools open:

    npm run dev

---

## First Run Notes

- resume.db is created automatically on first run in the project root
- The .env file must never be committed to source control
- If port 3000 is already in use on your machine, change HTTP_PORT in .env

---

## Transferring to Another Machine

1. Zip the project folder excluding .git and node_modules
2. On the receiving machine install Node.js
3. Unzip the project
4. Run: npm install
5. Create a .env file with your GEMINI_API_KEY
6. Run: npm start

Include resume.db in the zip only if you wish to transfer existing resume
data to the new machine. If not included a fresh database is created
automatically on first run.

---

## Credits and Acknowledgements

Open the application and click the Credits button at the bottom of the
sidebar navigation to view full credits, library acknowledgements, and
setup instructions.

---

## Development Notes

This application was developed using AI-assisted tools across four phases:

- Phase 1: Initial architecture and core features generated using OpenAI
  Codex (GPT 5.4) with prompts crafted using Claude Sonnet 4.6
- Phases 2-4: Feature additions, bug fixes, and refinements generated
  using Claude Code running locally, with prompts crafted using
  Claude Sonnet 4.6

All development operated within the conventions defined in AGENT.md for
CSC 3100, Spring 2026 at Tennessee Technological University. All
AI-generated code was reviewed and approved by the student author
prior to commit.
