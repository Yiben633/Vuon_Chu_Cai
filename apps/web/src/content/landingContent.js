import { BookOpen, Leaf, ShieldCheck } from "lucide-react";
import { assets } from "../assets/assetRegistry.js";

export const publicNav = [
  { label: "Giới Thiệu", to: "/gioi-thieu" },
  { label: "Bảng Chữ Cái", to: "/be/bang-chu-cai" },
  { label: "Rừng Ghép Vần", to: "/be/ghep-van" },
  { label: "Góc Phụ Huynh", to: "/phu-huynh" }
];

export const pillars = [
  {
    title: "Chữ cái trong khu vườn",
    description: "Bé nhận diện chữ, nghe gợi ý và đi qua từng thẻ học với nhịp nhẹ nhàng.",
    icon: Leaf
  },
  {
    title: "Nội dung do server cấp",
    description: "Câu hỏi, đáp án, tiến độ và hạt dẻ đều được backend xác thực.",
    icon: ShieldCheck
  },
  {
    title: "Phụ huynh theo dõi rõ ràng",
    description: "Báo cáo dùng dữ liệu thật, tách chữ đã thấy và chữ đã thành thạo.",
    icon: BookOpen
  }
];

export const sampleLetters = [
  { symbol: "Ă", word: "ăn", group: "Nguyên âm" },
  { symbol: "Đ", word: "đèn", group: "Phụ âm" },
  { symbol: "Ơ", word: "ơ kìa", group: "Nguyên âm" },
  { symbol: "Q", word: "quạt", group: "Phụ âm" }
];

export const learningCards = [
  { title: "Bảng chữ cái", icon: assets.sprout, to: "/be/bang-chu-cai" },
  { title: "Rừng ghép vần", icon: assets.acorn, to: "/be/ghep-van" },
  { title: "Đầm kể chuyện", icon: assets.lotus, to: "/be/truyen" },
  { title: "Đố vui", icon: assets.apple, to: "/be/do-vui" }
];
