# NextGen Interview Prep Platform

## 🌟 Overview
This is a comprehensive, Full-Stack Mock Interview and Technical Preparation Platform built for Computer Science students and tech professionals. It features a modern, premium UI (glassmorphism), a rich feature set spanning from personalized mock tests to AI-powered interview questions, and a fully functional user-authentication system.

## 🚀 Key Features

### 1. Robust User Authentication & Profiles
*   **Secure Auth Flow:** Session-based authentication utilizing `express-session` with passwords securely hashed via `bcrypt`.
*   **Comprehensive Profiles:** Users can add a professional bio, list primary skills, set college/graduation details, and upload modern profile avatars.
*   **Video Introductions:** Users can upload self-introduction videos (up to 50MB) with strict Multer file validation to ensure only secure video formats are accepted.
*   **Resume Uploads:** Dedicated flow for users to upload their resumes (strictly PDF validated).

### 2. Dynamic Mock Test System
*   **Categorized Testing:** Tests can be dynamically populated based on a specific **subject** (e.g., DBMS, OS, Data Structures, OOPs) or **company filter** (e.g., Google, Amazon, TCS, Microsoft).
*   **Smart Scoring:** The backend engine features case-insensitive and whitespace-trimmed answer validation to provide a seamless and forgiving user experience.
*   **Performance Tracking:** A dashboard overview tracking the user's total tests taken, average score, last score, and best overall score natively built via MongoDB aggregations.

### 3. AI-Powered Interviewer
*   **Gemini AI Integration:** Utilizes Google's Generative AI (`gemini-2.5-flash`) via the `@google/generative-ai` SDK to dynamically formulate unique, high-quality technical interview queries for the user.
*   **Rate-Limited Security:** The AI route is rigorously protected by `express-rate-limit` to prevent API abuse and safely manage quota limits (max 10 requests per 15 minutes per IP).

### 4. Interactive Live Video Interviews
*   **Private Interview Rooms:** Dynamically generates unique, session-mapped room IDs (`Interview-{userId}-{timestamp}`) and funnels matched users into a live video-call environment interface.

### 5. Premium, Modern Frontend Architecture
*   **Aesthetics:** A completely custom UI featuring deep animated background gradients, responsive hover states, smooth CSS structural transitions, and floating glassmorphic (`backdrop-filter`) layout components.
*   **Typography:** Cleanly integrated with the `Poppins` web font for a highly readable and modernized interface.
*   **Secure Routing:** Protected HTML views (`/views`) are inherently separated from the public directory, completely patching standard Express static routing bypass attacks.

### 6. Platform Review & Rating System
*   **User Feedback Engine:** Users can transparently submit application reviews with 1-5 star ratings, allowing the backend to aggregate and serve average platform scores dynamically.

---

## 🛠️ Technology Stack

### Architecture & Backend Core
*   **Runtime:** Node.js
*   **Framework:** Express.js `^4.22.1`
*   **Session Management:** `express-session`
*   **Security layer:** `bcrypt` (Hashing), `express-rate-limit` (Middleware protection)
*   **Asset Processing:** `multer` (with deep Mime-type filtering for images/videos/pdfs)

### Database & Storage
*   **Database:** MongoDB
*   **ODM / Schemas:** Mongoose `^8.21.0`

### Client / Frontend
*   **Structure:** HTML5
*   **Styling:** Vanilla CSS3 (Custom CSS Variable system, Keyframe Animations, UI variables)
*   **Interactivity:** Vanilla JavaScript

### External Services & APIs
*   **Artificial Intelligence:** Google Generative AI API (`@google/generative-ai` `^0.24.1`)
