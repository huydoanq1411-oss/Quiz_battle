import { EXTRA_GRAMMAR } from './grammar-expansion';
import { TOPICS, topicVocabulary } from './topics';
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
  explanation: string;
}

const BASE_VOCABULARY: readonly VocabularyEntry[] = [
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

export const VOCABULARY: readonly VocabularyEntry[] = [...new Map([
  ...TOPICS.flatMap(topic => (['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const).flatMap(level => topicVocabulary(topic, level))),
  ...BASE_VOCABULARY,
].map(item => [`${item.level}:${item.word}`, item])).values()];

export const GRAMMAR: readonly GrammarEntry[] = [
  ...EXTRA_GRAMMAR,
  { sentence: 'She ____ to school every day.', answer: 'walks', distractors: ['walk', 'walking', 'walked'], level: 'A1', explanation: '“Every day” diễn tả thói quen ở hiện tại đơn. Chủ ngữ “she” là ngôi thứ ba số ít nên động từ thêm -s: walks.' },
  { sentence: 'They ____ watching a film now.', answer: 'are', distractors: ['is', 'be', 'was'], level: 'A1', explanation: '“Now” chỉ hành động đang diễn ra. Hiện tại tiếp diễn dùng am/is/are + V-ing; “they” đi với “are”.' },
  { sentence: 'I ____ a new student last year.', answer: 'was', distractors: ['am', 'were', 'be'], level: 'A1', explanation: '“Last year” chỉ quá khứ. Động từ “be” ở quá khứ với chủ ngữ “I” là “was”.' },
  { sentence: 'There ____ two books on the table.', answer: 'are', distractors: ['is', 'was', 'be'], level: 'A1', explanation: 'Cấu trúc “there are” dùng để nói có nhiều vật ở hiện tại. “Two books” là danh từ số nhiều nên chọn “are”.' },
  { sentence: 'We ____ visit our grandparents tomorrow.', answer: 'will', distractors: ['did', 'were', 'have'], level: 'A2', explanation: '“Tomorrow” chỉ tương lai. Dùng “will” + động từ nguyên mẫu để diễn đạt hành động trong tương lai.' },
  { sentence: 'He has lived here ____ 2020.', answer: 'since', distractors: ['for', 'during', 'from'], level: 'A2', explanation: 'Hiện tại hoàn thành dùng “since” với mốc bắt đầu như năm 2020. “For” đi với khoảng thời gian, chẳng hạn “for six years”.' },
  { sentence: 'This is the ____ cake I have ever tasted.', answer: 'best', distractors: ['better', 'good', 'well'], level: 'A2', explanation: 'Câu so sánh một chiếc bánh với tất cả những chiếc đã từng nếm nên dùng so sánh nhất. Dạng so sánh nhất bất quy tắc của “good” là “best”.' },
  { sentence: 'You ____ wear a seat belt while driving.', answer: 'must', distractors: ['might to', 'could to', 'would have'], level: 'A2', explanation: '“Must” diễn tả sự bắt buộc, ở đây là thắt dây an toàn khi lái xe. Sau “must” dùng động từ nguyên mẫu không “to”.' },
  { sentence: 'If it rains, we ____ at home.', answer: 'will stay', distractors: ['stayed', 'are stay', 'would stayed'], level: 'B1', explanation: 'Điều kiện loại 1 nói về khả năng có thật trong tương lai: If + hiện tại đơn, will + động từ nguyên mẫu.' },
  { sentence: 'The report ____ by the team yesterday.', answer: 'was written', distractors: ['wrote', 'is writing', 'has write'], level: 'B1', explanation: 'Bản báo cáo là vật được viết nên dùng bị động. “Yesterday” yêu cầu quá khứ đơn: was/were + quá khứ phân từ; “write” có phân từ là “written”.' },
  { sentence: 'She asked me where ____.', answer: 'I lived', distractors: ['do I live', 'did I lived', 'I live?'], level: 'B1', explanation: 'Câu hỏi gián tiếp dùng trật tự chủ ngữ + động từ, không đảo trợ động từ. Sau “asked”, câu này dùng dạng lùi thì “I lived”.' },
  { sentence: 'Despite ____ tired, he finished the work.', answer: 'being', distractors: ['be', 'was', 'to being'], level: 'B1', explanation: '“Despite” là giới từ, theo sau bởi danh từ hoặc V-ing. Vì vậy dùng “being tired”, không dùng động từ chia “was”.' },
  { sentence: 'Had they left earlier, they ____ the train.', answer: 'would have caught', distractors: ['will catch', 'would catch', 'had caught'], level: 'B2', explanation: '“Had they left” là đảo ngữ của “If they had left”, điều kiện loại 3. Kết quả giả định trong quá khứ dùng would have + quá khứ phân từ.' },
  { sentence: 'The more you practise, ____ you become.', answer: 'the more confident', distractors: ['more confident', 'most confident', 'the most confident'], level: 'B2', explanation: 'So sánh kép dùng “the + so sánh hơn, the + so sánh hơn”, nghĩa là càng luyện tập thì càng tự tin.' },
  { sentence: 'The proposal, ____ was revised twice, was approved.', answer: 'which', distractors: ['what', 'who', 'whose'], level: 'B2', explanation: 'Mệnh đề quan hệ không xác định bổ sung thông tin cho vật “the proposal”. Dùng “which” làm chủ ngữ; “who” chỉ người, “whose” chỉ sở hữu.' },
  { sentence: 'No sooner ____ the speech than the lights went out.', answer: 'had she begun', distractors: ['she had begun', 'did she began', 'has she begun'], level: 'B2', explanation: 'Khi “No sooner” đứng đầu câu, dùng đảo ngữ: No sooner had + chủ ngữ + quá khứ phân từ + than + quá khứ đơn.' },
  { sentence: 'The findings, ____ independently, were considered robust.', answer: 'having been verified', distractors: ['verified them', 'to verify', 'having verified'], level: 'C1', explanation: 'Các phát hiện đã được kiểm chứng trước khi được đánh giá. Phân từ hoàn thành bị động “having been + V3” thể hiện hành động bị động xảy ra trước.' },
  { sentence: 'Were it not for her guidance, we ____ the deadline.', answer: 'would miss', distractors: ['will miss', 'missed', 'would have miss'], level: 'C1', explanation: '“Were it not for” là đảo ngữ điều kiện giả định ở hiện tại, nghĩa là nếu không nhờ. Mệnh đề kết quả dùng would + động từ nguyên mẫu.' },
  { sentence: 'The policy is likely to fail unless it ____ consistently.', answer: 'is enforced', distractors: ['enforces', 'will enforce', 'enforced'], level: 'C1', explanation: 'Chính sách được thực thi nên dùng bị động. Sau “unless” trong điều kiện tương lai dùng hiện tại đơn: is enforced.' },
  { sentence: 'So compelling ____ the evidence that the case was reopened.', answer: 'was', distractors: ['were', 'is', 'has'], level: 'C1', explanation: 'Đảo ngữ nhấn mạnh: So + tính từ + be + chủ ngữ + that. “Evidence” là danh từ không đếm được và ngữ cảnh ở quá khứ nên dùng “was”.' },
  { sentence: 'Only after the audit ____ the discrepancy become apparent.', answer: 'did', distractors: ['had', 'was', 'has'], level: 'C2', explanation: 'Cụm “Only after” đứng đầu câu yêu cầu đảo ngữ ở mệnh đề chính. Quá khứ đơn dùng did + chủ ngữ + động từ nguyên mẫu “become”.' },
  { sentence: 'The measures are intended to reduce, if not entirely ____, the risk.', answer: 'eliminate', distractors: ['elimination', 'eliminated', 'eliminating'], level: 'C2', explanation: '“Reduce” và “eliminate” là hai động từ song song cùng phụ thuộc vào “to”. Vì vậy chỗ trống cần động từ nguyên mẫu “eliminate”.' },
  { sentence: 'Much as I ____ with the conclusion, the evidence is persuasive.', answer: 'disagree', distractors: ['am disagree', 'disagreed', 'would disagreeing'], level: 'C2', explanation: '“Much as” mở đầu mệnh đề nhượng bộ, nghĩa là mặc dù. “Disagree” là động từ thường ở hiện tại, không đi cùng “am”.' },
  { sentence: 'Not until the data were reanalysed ____ identified.', answer: 'was the flaw', distractors: ['the flaw was', 'did the flaw', 'has the flaw'], level: 'C2', explanation: '“Not until” đầu câu yêu cầu đảo ngữ ở mệnh đề chính. Bị động quá khứ “the flaw was identified” đổi thành “was the flaw identified”.' },
];
