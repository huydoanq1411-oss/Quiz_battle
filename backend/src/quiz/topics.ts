import type { CefrLevel, VocabularyEntry } from './english-learning-bank';

export const TOPICS = ['travel', 'work', 'life'] as const;
export type Topic = typeof TOPICS[number];

// Four distinct meanings per level keep distractors inside the selected topic.
const BANK: Record<Topic, Record<CefrLevel, string>> = {
  travel: {
    A1: 'bus|xe buýt;train|tàu hỏa;map|bản đồ;ticket|vé',
    A2: 'luggage|hành lý;journey|chuyến đi;passport|hộ chiếu;booking|đặt chỗ',
    B1: 'destination|điểm đến;departure|sự khởi hành;accommodation|chỗ ở;itinerary|lịch trình',
    B2: 'excursion|chuyến tham quan;layover|thời gian quá cảnh;hospitality|sự hiếu khách;landmark|địa danh nổi bật',
    C1: 'ecotourism|du lịch sinh thái;seclusion|sự biệt lập;expedition|chuyến thám hiểm;quarantine|sự cách ly',
    C2: 'wanderlust|niềm khao khát du lịch;circumnavigation|hành trình vòng quanh thế giới;sojourn|lần lưu trú ngắn;peripatetic|hay di chuyển',
  },
  work: {
    A1: 'job|công việc;desk|bàn làm việc;boss|sếp;office|văn phòng',
    A2: 'meeting|cuộc họp;salary|tiền lương;colleague|đồng nghiệp;company|công ty',
    B1: 'deadline|hạn chót;promotion|sự thăng chức;interview|buổi phỏng vấn;contract|hợp đồng',
    B2: 'negotiation|sự đàm phán;recruitment|sự tuyển dụng;productivity|năng suất;stakeholder|bên liên quan',
    C1: 'delegation|sự ủy quyền;remuneration|thù lao;procurement|hoạt động thu mua;redundancy|việc cắt giảm nhân sự',
    C2: 'entrepreneurship|tinh thần khởi nghiệp;fiduciary|thuộc trách nhiệm tín thác;arbitration|sự phân xử bằng trọng tài;synergy|hiệu quả cộng hưởng',
  },
  life: {
    A1: 'home|nhà;food|thức ăn;family|gia đình;water|nước',
    A2: 'neighbour|hàng xóm;shopping|việc mua sắm;exercise|bài tập thể dục;routine|thói quen hằng ngày',
    B1: 'household|hộ gia đình;budget|ngân sách;wellbeing|trạng thái khỏe mạnh;community|cộng đồng',
    B2: 'sustainability|tính bền vững;nutrition|dinh dưỡng;resilience|khả năng phục hồi;mindfulness|sự chú tâm vào hiện tại',
    C1: 'frugality|tính tiết kiệm;reciprocity|sự có đi có lại;contentment|sự mãn nguyện;interdependence|sự phụ thuộc lẫn nhau',
    C2: 'equanimity|sự bình thản;conviviality|không khí vui vẻ thân tình;vicissitude|sự thăng trầm;selfactualisation|sự phát huy trọn vẹn tiềm năng',
  },
};

export function topicVocabulary(topic: Topic, level: CefrLevel): VocabularyEntry[] {
  return BANK[topic][level].split(';').map(pair => {
    const [word, meaning] = pair.split('|');
    return { word, meaning, level };
  });
}
