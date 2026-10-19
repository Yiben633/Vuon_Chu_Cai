import { EmptyState } from "../../components/common/StatusStates.jsx";

const copy = {
  alphabet: ["Bảng chữ cái", "Prompt 09 sẽ nối grid 29 chữ với content/progress thật."],
  spelling: ["Rừng ghép vần", "Prompt 10 sẽ nối onset, rime, thanh và lookup spelling từ API."],
  story: ["Đầm kể chuyện", "Prompt 11 sẽ nối scene, hotspot và story completion."],
  quiz: ["Thử thách đố vui", "Prompt 12 sẽ nối câu hỏi theo session và reward backend."],
  rewards: ["Góc phần thưởng", "Prompt 14 sẽ nối ví, cây lớn và inventory thật."]
};

export function ChildSectionPage({ section }) {
  const [title, message] = copy[section] ?? copy.alphabet;
  return <EmptyState title={title} message={message} />;
}
