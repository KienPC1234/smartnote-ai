# SmartNote AI 🧠✨

SmartNote AI is a powerful, AI-driven learning assistant designed to transform messy study notes, documents, and transcripts into structured, high-quality learning materials. Using advanced LLMs, it generates clear outlines, interactive flashcards, quizzes, and "neural insights" to help you master any subject faster.

## 🚀 Features

-   **AI-Powered Summarization:** Instantly generate clean, hierarchical Markdown outlines from any text.
-   **Interactive Flashcards:** Automatically create study decks with front-and-back cards, difficulty levels, and tags.
-   **Smart Quizzes:** Test your knowledge with AI-generated multiple-choice questions complete with detailed explanations.
-   **Neural Insights:** Deepen your understanding with "Devil's Advocate" perspectives, metaphors, and cross-topic connections.
-   **Multi-Format Support:** Process text, PDFs, Word documents (`.docx`), Excel sheets (`.xlsx`), and even images (via OCR).
-   **Multi-Language Support:** Full i18n support for global users.
-   **Robust Authentication:** Secure login via Google OAuth or traditional Email/Password credentials.
-   **Responsive Design:** A sleek, modern "Neobrutalism" UI that works beautifully on desktop and mobile.

## 🛠️ Tech Stack

-   **Framework:** [Next.js 15+](https://nextjs.org/) (App Router, React 19)
-   **Styling:** [Tailwind CSS 4](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)
-   **Database:** [SQLite](https://www.sqlite.org/) with [Prisma ORM](https://www.prisma.io/)
-   **Authentication:** [Auth.js (NextAuth v5)](https://authjs.dev/)
-   **AI Integration:** [Ollama](https://ollama.com/) & OpenAI-compatible endpoints
-   **Content Processing:**
    -   `pdfjs-dist` (PDF extraction)
    -   `mammoth` (Word document processing)
    -   `tesseract.js` (OCR for images)
    -   `xlsx` (Excel parsing)
-   **State Management:** [Zustand](https://github.com/pmndrs/zustand)
-   **Deployment:** Optimized for Vercel or any Node.js environment.

## 📦 Getting Started

### Prerequisites

-   Node.js 18.x or higher
-   npm, yarn, or pnpm
-   (Optional) [Ollama](https://ollama.com/) running locally for AI features

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
    Create a `.env` file in the root directory and add the following:
    ```env
    # App
    NEXTAUTH_URL=http://localhost:3000
    NEXTAUTH_SECRET=your_random_secret_here

    # Google OAuth (Optional)
    GOOGLE_CLIENT_ID=your_google_client_id
    GOOGLE_CLIENT_SECRET=your_google_client_secret

    # Database
    DATABASE_URL="file:./dev.db"

    # AI (OpenAI-compatible or Ollama)
    FPT_OJ_BASE_URL=https://ai.fptoj.com/v1
    FPT_OJ_API_KEY=your_api_key_here
    LLM_MODEL=llama3.1:8b
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
│   └── api/           # Backend API endpoints (AI, Notes, Auth)
├── components/        # React components (UI, Logic, Layouts)
│   └── ui/            # Shadcn UI reusable components
├── lib/               # Shared utilities, AI clients, and constants
│   ├── auth.ts        # NextAuth configuration
│   ├── llm.ts         # LLM interaction logic
│   └── prisma.ts      # Prisma client singleton
├── prisma/            # Database schema and migrations
└── public/            # Static assets
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📧 Contact

Ha Tri Kien - [admin@fptoj.com](mailto:admin@fptoj.com)

Project Link: [https://github.com/KienPC1234/smartnote-ai](https://github.com/KienPC1234/smartnote-ai)

---
*Built with ❤️ by the Sentinel Team.*
