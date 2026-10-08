export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface VocabularyEntry {
  word: string;
  meaning: string;
  level: CefrLevel;
}

export interface GrammarEntry {
  sentence: string;
  answer: string;
  distractors: [string, string, string];
  level: CefrLevel;
}

export const VOCABULARY: readonly VocabularyEntry[] = [
  { word: 'apple', meaning: 'quả táo', level: 'A1' },
  { word: 'arrive', meaning: 'đến nơi', level: 'A1' },
  { word: 'borrow', meaning: 'mượn', level: 'A1' },
  { word: 'breakfast', meaning: 'bữa sáng', level: 'A1' },
  { word: 'brother', meaning: 'anh/em trai', level: 'A1' },
  { word: 'busy', meaning: 'bận rộn', level: 'A1' },
  { word: 'clean', meaning: 'sạch sẽ', level: 'A1' },
  { word: 'country', meaning: 'đất nước', level: 'A1' },
  { word: 'different', meaning: 'khác nhau', level: 'A1' },
  { word: 'early', meaning: 'sớm', level: 'A1' },
  { word: 'adventure', meaning: 'cuộc phiêu lưu', level: 'A2' },
  { word: 'careful', meaning: 'cẩn thận', level: 'A2' },
  { word: 'comfortable', meaning: 'thoải mái', level: 'A2' },
  { word: 'crowded', meaning: 'đông đúc', level: 'A2' },
  { word: 'decide', meaning: 'quyết định', level: 'A2' },
  { word: 'delicious', meaning: 'ngon', level: 'A2' },
  { word: 'environment', meaning: 'môi trường', level: 'A2' },
  { word: 'improve', meaning: 'cải thiện', level: 'A2' },
  { word: 'journey', meaning: 'chuyến đi', level: 'A2' },
  { word: 'neighbour', meaning: 'hàng xóm', level: 'A2' },
  { word: 'accomplish', meaning: 'hoàn thành', level: 'B1' },
  { word: 'afford', meaning: 'có đủ khả năng chi trả', level: 'B1' },
  { word: 'benefit', meaning: 'lợi ích', level: 'B1' },
  { word: 'challenge', meaning: 'thử thách', level: 'B1' },
  { word: 'consequence', meaning: 'hậu quả', level: 'B1' },
  { word: 'decrease', meaning: 'giảm xuống', level: 'B1' },
  { word: 'efficient', meaning: 'hiệu quả', level: 'B1' },
  { word: 'evidence', meaning: 'bằng chứng', level: 'B1' },
  { word: 'hesitate', meaning: 'do dự', level: 'B1' },
  { word: 'opportunity', meaning: 'cơ hội', level: 'B1' },
  { word: 'accurate', meaning: 'chính xác', level: 'B2' },
  { word: 'adapt', meaning: 'thích nghi', level: 'B2' },
  { word: 'controversial', meaning: 'gây tranh cãi', level: 'B2' },
  { word: 'criteria', meaning: 'các tiêu chí', level: 'B2' },
  { word: 'distinguish', meaning: 'phân biệt', level: 'B2' },
  { word: 'expand', meaning: 'mở rộng', level: 'B2' },
  { word: 'maintain', meaning: 'duy trì', level: 'B2' },
  { word: 'persuade', meaning: 'thuyết phục', level: 'B2' },
  { word: 'reliable', meaning: 'đáng tin cậy', level: 'B2' },
  { word: 'significant', meaning: 'đáng kể', level: 'B2' },
  { word: 'ambiguous', meaning: 'mơ hồ, có nhiều nghĩa', level: 'C1' },
  { word: 'coherent', meaning: 'mạch lạc', level: 'C1' },
  { word: 'compelling', meaning: 'có sức thuyết phục', level: 'C1' },
  { word: 'constraint', meaning: 'sự hạn chế', level: 'C1' },
  { word: 'diminish', meaning: 'làm suy giảm', level: 'C1' },
  { word: 'feasible', meaning: 'khả thi', level: 'C1' },
  { word: 'inevitable', meaning: 'không thể tránh khỏi', level: 'C1' },
  { word: 'prevalent', meaning: 'phổ biến', level: 'C1' },
  { word: 'reluctant', meaning: 'miễn cưỡng', level: 'C1' },
  { word: 'substantial', meaning: 'đáng kể, lớn về quy mô', level: 'C1' },
  { word: 'alleviate', meaning: 'làm dịu bớt', level: 'C2' },
  { word: 'conundrum', meaning: 'vấn đề hóc búa', level: 'C2' },
  { word: 'discrepancy', meaning: 'sự khác biệt không nhất quán', level: 'C2' },
  { word: 'elicit', meaning: 'gợi ra, khơi gợi', level: 'C2' },
  { word: 'exacerbate', meaning: 'làm trầm trọng thêm', level: 'C2' },
  { word: 'meticulous', meaning: 'tỉ mỉ, cẩn trọng', level: 'C2' },
  { word: 'ostensibly', meaning: 'bề ngoài có vẻ như', level: 'C2' },
  { word: 'pervasive', meaning: 'lan rộng khắp', level: 'C2' },
  { word: 'pragmatic', meaning: 'thực tế, thực dụng', level: 'C2' },
  { word: 'unequivocal', meaning: 'rõ ràng, không thể hiểu lầm', level: 'C2' },
];

export const GRAMMAR: readonly GrammarEntry[] = [
  { sentence: 'She ____ to school every day.', answer: 'walks', distractors: ['walk', 'walking', 'walked'], level: 'A1' },
  { sentence: 'They ____ watching a film now.', answer: 'are', distractors: ['is', 'be', 'was'], level: 'A1' },
  { sentence: 'I ____ a new student last year.', answer: 'was', distractors: ['am', 'were', 'be'], level: 'A1' },
  { sentence: 'There ____ two books on the table.', answer: 'are', distractors: ['is', 'was', 'be'], level: 'A1' },
  { sentence: 'We ____ visit our grandparents tomorrow.', answer: 'will', distractors: ['did', 'were', 'have'], level: 'A2' },
  { sentence: 'He has lived here ____ 2020.', answer: 'since', distractors: ['for', 'during', 'from'], level: 'A2' },
  { sentence: 'This is the ____ cake I have ever tasted.', answer: 'best', distractors: ['better', 'good', 'well'], level: 'A2' },
  { sentence: 'You ____ wear a seat belt while driving.', answer: 'must', distractors: ['might to', 'could to', 'would have'], level: 'A2' },
  { sentence: 'If it rains, we ____ at home.', answer: 'will stay', distractors: ['stayed', 'are stay', 'would stayed'], level: 'B1' },
  { sentence: 'The report ____ by the team yesterday.', answer: 'was written', distractors: ['wrote', 'is writing', 'has write'], level: 'B1' },
  { sentence: 'She asked me where ____.', answer: 'I lived', distractors: ['do I live', 'did I lived', 'I live?'], level: 'B1' },
  { sentence: 'Despite ____ tired, he finished the work.', answer: 'being', distractors: ['be', 'was', 'to being'], level: 'B1' },
  { sentence: 'Had they left earlier, they ____ the train.', answer: 'would have caught', distractors: ['will catch', 'would catch', 'had caught'], level: 'B2' },
  { sentence: 'The more you practise, ____ you become.', answer: 'the more confident', distractors: ['more confident', 'most confident', 'the most confident'], level: 'B2' },
  { sentence: 'The proposal, ____ was revised twice, was approved.', answer: 'which', distractors: ['what', 'who', 'whose'], level: 'B2' },
  { sentence: 'No sooner ____ the speech than the lights went out.', answer: 'had she begun', distractors: ['she had begun', 'did she began', 'has she begun'], level: 'B2' },
  { sentence: 'The findings, ____ independently, were considered robust.', answer: 'having been verified', distractors: ['verified them', 'to verify', 'having verified'], level: 'C1' },
  { sentence: 'Were it not for her guidance, we ____ the deadline.', answer: 'would miss', distractors: ['will miss', 'missed', 'would have miss'], level: 'C1' },
  { sentence: 'The policy is likely to fail unless it ____ consistently.', answer: 'is enforced', distractors: ['enforces', 'will enforce', 'enforced'], level: 'C1' },
  { sentence: 'So compelling ____ the evidence that the case was reopened.', answer: 'was', distractors: ['were', 'is', 'has'], level: 'C1' },
  { sentence: 'Only after the audit ____ the discrepancy become apparent.', answer: 'did', distractors: ['had', 'was', 'has'], level: 'C2' },
  { sentence: 'The measures are intended to reduce, if not entirely ____, the risk.', answer: 'eliminate', distractors: ['elimination', 'eliminated', 'eliminating'], level: 'C2' },
  { sentence: 'Much as I ____ with the conclusion, the evidence is persuasive.', answer: 'disagree', distractors: ['am disagree', 'disagreed', 'would disagreeing'], level: 'C2' },
  { sentence: 'Not until the data were reanalysed ____ the flaw.', answer: 'was identified', distractors: ['identified', 'did identify', 'has identified'], level: 'C2' },
];
