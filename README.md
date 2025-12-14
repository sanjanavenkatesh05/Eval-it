# Eval-it

Eval-it (GitGrade) is a powerful tool for analyzing GitHub repositories using Google's Gemini API. It provides instant deep-dive analysis, compliance checks, and actionable roadmaps for any public repository.

## Features

### 📊 Comprehensive Metrics
Get a weighted score and detailed breakdown of the repository's health, quality, and maintainability.
![Repository Metrics](images/Screenshot%202025-12-14%20145826.png)

### 🗺️ Interactive Roadmap
Generate a step-by-step visual roadmap for understanding, contributing to, or improving the codebase.
![Roadmap](images/Screenshot%202025-12-14%20145836.png)

### 📂 Deep Exploration
Explore the codebase with a file tree or an interactive graph visualization to understand dependencies and structure.

**File Explorer:**
![File Explorer](images/Screenshot%202025-12-14%20145848.png)

**Graph View:**
![Graph View](images/Screenshot%202025-12-14%20145857.png)

## Try it yourself 
Link: https://eval-it.vercel.app/

## Run Locally

**Prerequisites:** Node.js

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment:**
   Set the `GEMINI_API_KEY` in `.env.local` to your Gemini API key.

3. **Run the app:**
   ```bash
   npm run dev
   ```
