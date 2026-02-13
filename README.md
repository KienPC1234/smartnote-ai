# SmartNote AI 🧠✨

SmartNote AI is a powerful, AI-driven learning assistant designed to transform messy study notes, documents, and transcripts into structured, high-quality learning materials. Using advanced LLMs, it generates clear outlines, interactive flashcards, quizzes, and "neural insights" to help you master any subject faster.

## 🚀 Features

-   **AI-Powered Summarization:** Instantly generate clean, hierarchical Markdown outlines from any text.
-   **Interactive Flashcards:** Automatically create study decks with front-and-back cards using streaming JSON for instant feedback.
-   **Smart Quizzes:** Test your knowledge with AI-generated multiple-choice questions complete with detailed explanations.
-   **Knowledge Analysis (Weakspots):** Analyze your quiz results to identify specific areas where you need more focus.
-   **Neural Insights:** Deepen your understanding with "Devil's Advocate" perspectives, metaphors, and cross-topic connections.
-   **Study Buddy Chat:** A dedicated AI tutor for each note that understands your content and images.
-   **Multi-Format Support:** Process text, PDFs, Word documents (`.docx`), Excel sheets (`.xlsx`), and images (via OCR).
-   **Multi-Language Support:** Full i18n support (English & Vietnamese) with natural translations.
-   **Responsive Design:** A sleek, modern "Neobrutalism" UI that works beautifully on desktop and mobile.

## 🛠️ Tech Stack

-   **Framework:** [Next.js 15+](https://nextjs.org/) (App Router, React 19)
-   **Styling:** [Tailwind CSS 4](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)
-   **Database:** [SQLite](https://www.sqlite.org/) with [Prisma ORM](https://www.prisma.io/)
-   **Authentication:** [Auth.js (NextAuth v5)](https://authjs.dev/)
-   **AI Integration:** [Ollama Library](https://github.com/ollama/ollama-js) & OpenAI-compatible endpoints
-   **Content Processing:**
    -   `pdfjs-dist` (PDF extraction)
    -   `mammoth` (Word document processing)
    -   `tesseract.js` (OCR for images)
    -   `xlsx` (Excel parsing)
-   **State Management:** [Zustand](https://github.com/pmndrs/zustand)

## 📦 Getting Started

### Prerequisites

-   Node.js 18.x or higher
-   npm, yarn, or pnpm
-   [Ollama](https://ollama.com/) (Optional for local LLM usage)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/smartnote-ai.git
    cd smartnote-ai
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Copy `.env.example` to `.env` and fill in the values:
    ```bash
    cp .env.example .env
    ```

4.  **Initialize the database:**
    ```bash
    npx prisma migrate dev --name init
    ```

5.  **Run the development server:**
    ```bash
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📂 Project Structure

```text
src/
├── app/               # Next.js App Router (Pages & API)
│   ├── (protected)/   # Auth-guarded application routes
│   ├── (public)/      # Landing page and public routes
│   ├── api/           # Backend API endpoints
│   └── demo_video/    # Redirection route for demo
├── components/        # React components (UI, Logic, Layouts)
│   ├── ui/            # Shadcn UI reusable components
│   └── dashboard/     # Dashboard-specific components
├── lib/               # Shared utilities, AI clients, and constants
│   ├── auth.ts        # NextAuth configuration
│   ├── llm.ts         # Ollama/LLM client logic
│   ├── i18n/          # Internationalization dictionaries
│   └── prisma.ts      # Prisma client singleton
├── prisma/            # Database schema and migrations
└── public/            # Static assets
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 📧 Contact

Ha Tri Kien - [admin@fptoj.com](mailto:admin@fptoj.com)

---
*Built with ❤️ by the Sentinel Team.*
