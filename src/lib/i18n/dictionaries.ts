export const dictionaries = {
  en: {
    nav: {
      dashboard: "Dashboard",
      newNote: "New Note",
      profile: "Profile",
      logOut: "Log Out",
      signIn: "Sign In",
      signUp: "Sign Up"
    },
    dashboard: {
      welcome: "Hello",
      stats_notes: "Total Notes",
      stats_ai: "AI Study Sets",
      stats_gaps: "Knowledge Gaps",
      empty_title: "Empty Library",
      create_btn: "Create New Note"
    },
    note: {
      generate_btn: "Generate AI",
      regenerate_btn: "Re-generate AI",
      outline: "Outline",
      flashcards: "Flashcards",
      quiz: "Quiz",
      weak_spots: "Weak Spots",
      chat: "Ask AI Buddy"
    },
    common: {
      back: "Back",
      save: "Save",
      loading: "Thinking...",
      error: "Something went wrong"
    }
  },
  vi: {
    nav: {
      dashboard: "Bảng điều khiển",
      newNote: "Ghi chú mới",
      profile: "Hồ sơ",
      logOut: "Đăng xuất",
      signIn: "Đăng nhập",
      signUp: "Đăng ký"
    },
    dashboard: {
      welcome: "Xin chào",
      stats_notes: "Tổng ghi chú",
      stats_ai: "Bộ học liệu AI",
      stats_gaps: "Lỗ hổng kiến thức",
      empty_title: "Thư viện trống",
      create_btn: "Tạo ghi chú mới"
    },
    note: {
      generate_btn: "Tạo học liệu AI",
      regenerate_btn: "Tạo lại bằng AI",
      outline: "Đề cương",
      flashcards: "Thẻ ghi nhớ",
      quiz: "Trắc nghiệm",
      weak_spots: "Lỗ hổng",
      chat: "Hỏi đáp AI"
    },
    common: {
      back: "Quay lại",
      save: "Lưu",
      loading: "Đang xử lý...",
      error: "Đã có lỗi xảy ra"
    }
  }
};

export type Language = "en" | "vi";
export type Dictionary = typeof dictionaries.en;
