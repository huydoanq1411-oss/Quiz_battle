export type EnglishLevel = 'A1-A2' | 'B1-B2' | 'C1-C2';
export type EnglishMode = 'VOCAB' | 'IELTS';

export interface VocabularyItem {
  word: string;
  meaning: string;
}

export interface IeltsItem {
  sentence: string;
  answer: string;
  distractors: [string, string, string];
}

export const VOCABULARY: Record<EnglishLevel, readonly VocabularyItem[]> = {
  'A1-A2': [
    { word: 'borrow', meaning: 'mượn' }, { word: 'arrive', meaning: 'đến nơi' },
    { word: 'quiet', meaning: 'yên tĩnh' }, { word: 'price', meaning: 'giá cả' },
    { word: 'healthy', meaning: 'khỏe mạnh' }, { word: 'choose', meaning: 'lựa chọn' },
    { word: 'improve', meaning: 'cải thiện' }, { word: 'journey', meaning: 'chuyến đi' },
    { word: 'invite', meaning: 'mời' }, { word: 'weather', meaning: 'thời tiết' },
    { word: 'neighbour', meaning: 'hàng xóm' }, { word: 'careful', meaning: 'cẩn thận' },
    { word: 'forget', meaning: 'quên' }, { word: 'repair', meaning: 'sửa chữa' },
    { word: 'empty', meaning: 'trống rỗng' }, { word: 'crowded', meaning: 'đông đúc' },
    { word: 'probably', meaning: 'có lẽ' }, { word: 'decide', meaning: 'quyết định' },
    { word: 'delicious', meaning: 'ngon' }, { word: 'receive', meaning: 'nhận' },
  ],
  'B1-B2': [
    { word: 'accomplish', meaning: 'hoàn thành' }, { word: 'accurate', meaning: 'chính xác' },
    { word: 'adapt', meaning: 'thích nghi' }, { word: 'benefit', meaning: 'lợi ích' },
    { word: 'challenge', meaning: 'thử thách' }, { word: 'consider', meaning: 'cân nhắc' },
    { word: 'decrease', meaning: 'giảm' }, { word: 'efficient', meaning: 'hiệu quả' },
    { word: 'encourage', meaning: 'khuyến khích' }, { word: 'evidence', meaning: 'bằng chứng' },
    { word: 'expand', meaning: 'mở rộng' }, { word: 'hesitate', meaning: 'do dự' },
    { word: 'maintain', meaning: 'duy trì' }, { word: 'opportunity', meaning: 'cơ hội' },
    { word: 'prevent', meaning: 'ngăn chặn' }, { word: 'require', meaning: 'đòi hỏi' },
    { word: 'respond', meaning: 'phản hồi' }, { word: 'source', meaning: 'nguồn' },
    { word: 'suitable', meaning: 'phù hợp' }, { word: 'valuable', meaning: 'có giá trị' },
  ],
  'C1-C2': [
    { word: 'ambiguous', meaning: 'mơ hồ, đa nghĩa' }, { word: 'anticipate', meaning: 'dự đoán trước' },
    { word: 'coherent', meaning: 'mạch lạc' }, { word: 'compelling', meaning: 'thuyết phục' },
    { word: 'constraint', meaning: 'sự hạn chế' }, { word: 'convey', meaning: 'truyền tải' },
    { word: 'crucial', meaning: 'then chốt' }, { word: 'diminish', meaning: 'làm suy giảm' },
    { word: 'diverse', meaning: 'đa dạng' }, { word: 'emerge', meaning: 'xuất hiện' },
    { word: 'enhance', meaning: 'nâng cao' }, { word: 'feasible', meaning: 'khả thi' },
    { word: 'inevitable', meaning: 'không thể tránh khỏi' }, { word: 'interpret', meaning: 'diễn giải' },
    { word: 'justify', meaning: 'biện minh' }, { word: 'perspective', meaning: 'góc nhìn' },
    { word: 'prevalent', meaning: 'phổ biến' }, { word: 'reinforce', meaning: 'củng cố' },
    { word: 'reluctant', meaning: 'miễn cưỡng' }, { word: 'substantial', meaning: 'đáng kể' },
  ],
};

export const IELTS_SENTENCES: Record<EnglishLevel, readonly IeltsItem[]> = {
  'A1-A2': [
    { sentence: 'If it rains tomorrow, we ____ at home.', answer: 'will stay', distractors: ['stayed', 'are stay', 'would stayed'] },
    { sentence: 'She has lived in this town ____ 2020.', answer: 'since', distractors: ['for', 'during', 'from'] },
    { sentence: 'There are ____ apples in the basket than yesterday.', answer: 'fewer', distractors: ['less', 'little', 'fewest'] },
    { sentence: 'My brother is interested ____ learning Japanese.', answer: 'in', distractors: ['on', 'at', 'for'] },
    { sentence: 'The museum ____ by thousands of people every year.', answer: 'is visited', distractors: ['visits', 'visited', 'is visiting'] },
    { sentence: 'We ____ dinner when the lights suddenly went out.', answer: 'were having', distractors: ['have', 'are having', 'had have'] },
    { sentence: 'You ____ wear a seat belt while driving.', answer: 'must', distractors: ['might to', 'could to', 'would have'] },
    { sentence: 'This is the ____ film I have seen this year.', answer: 'best', distractors: ['better', 'good', 'well'] },
    { sentence: 'He speaks so ____ that everyone can understand him.', answer: 'clearly', distractors: ['clear', 'clearness', 'cleared'] },
    { sentence: 'I have not finished my homework ____.', answer: 'yet', distractors: ['already', 'still', 'ever'] },
    { sentence: 'The train was late, ____ we waited at the station.', answer: 'so', distractors: ['because', 'although', 'unless'] },
    { sentence: 'She asked me where ____.', answer: 'I lived', distractors: ['do I live', 'did I lived', 'I live?'] },
    { sentence: 'There is not ____ milk left for breakfast.', answer: 'much', distractors: ['many', 'few', 'several'] },
    { sentence: 'I enjoy ____ books before I go to sleep.', answer: 'reading', distractors: ['read', 'to reading', 'reads'] },
    { sentence: 'The park is ____ than it was ten years ago.', answer: 'more crowded', distractors: ['most crowded', 'crowdeder', 'the more crowded'] },
    { sentence: 'You will miss the bus ____ you leave now.', answer: 'unless', distractors: ['because', 'while', 'although'] },
    { sentence: 'My phone ____ while I was walking home.', answer: 'was stolen', distractors: ['stole', 'has stealing', 'is steal'] },
    { sentence: 'We ____ to the new sports centre yet.', answer: 'have not been', distractors: ['did not go', 'are not going', 'were not be'] },
    { sentence: 'The shop is closed, ____ we will come back tomorrow.', answer: 'so', distractors: ['but', 'or', 'if'] },
    { sentence: 'You should drink water ____ you feel thirsty.', answer: 'when', distractors: ['where', 'which', 'whose'] },
  ],
  'B1-B2': [
    { sentence: 'The new policy is expected to ____ traffic congestion.', answer: 'reduce', distractors: ['rise', 'extend', 'preserve'] },
    { sentence: 'Had the survey included more people, its findings ____ more reliable.', answer: 'would have been', distractors: ['will be', 'would be', 'had been'] },
    { sentence: 'The report provides strong evidence ____ the proposed changes.', answer: 'in favour of', distractors: ['in spite', 'instead', 'according'] },
    { sentence: 'Online courses enable students ____ at their own pace.', answer: 'to study', distractors: ['studying', 'study', 'studied'] },
    { sentence: 'The project was postponed ____ a shortage of funding.', answer: 'owing to', distractors: ['whereas', 'despite of', 'unless'] },
    { sentence: 'The more regularly people exercise, ____ they tend to feel.', answer: 'the better', distractors: ['better', 'the best', 'best'] },
    { sentence: 'Researchers must account ____ differences in age and income.', answer: 'for', distractors: ['to', 'at', 'with'] },
    { sentence: 'The company, ____ was founded in 1998, now operates worldwide.', answer: 'which', distractors: ['what', 'who', 'whose'] },
    { sentence: 'There has been a gradual ____ in the number of people using public transport.', answer: 'increase', distractors: ['increasing', 'increased', 'increasement'] },
    { sentence: 'The results were inconclusive; ____, further research is needed.', answer: 'therefore', distractors: ['nevertheless', 'otherwise', 'meanwhile'] },
    { sentence: 'Many residents objected ____ the construction of the motorway.', answer: 'to', distractors: ['against', 'for', 'with'] },
    { sentence: 'The figures are broadly ____ with those reported in earlier studies.', answer: 'consistent', distractors: ['constant', 'consequent', 'convenient'] },
    { sentence: 'No sooner ____ the announcement than the share price fell.', answer: 'had they made', distractors: ['they had made', 'they made', 'have they made'] },
    { sentence: 'Despite ____ a higher salary, she decided to remain in education.', answer: 'being offered', distractors: ['offered', 'to offer', 'having offer'] },
    { sentence: 'The scheme aims to make childcare more ____ for working families.', answer: 'accessible', distractors: ['access', 'accessibly', 'accession'] },
    { sentence: 'The evidence is limited and should be interpreted with ____.', answer: 'caution', distractors: ['cautious', 'cautiously', 'cautioned'] },
    { sentence: 'The council will allocate additional funds ____ the project succeeds.', answer: 'provided that', distractors: ['even though', 'in case of', 'as if'] },
    { sentence: 'A lack of sleep can have a negative ____ on concentration.', answer: 'effect', distractors: ['affect', 'resulted', 'consequence of'] },
    { sentence: 'The final decision rests ____ the committee.', answer: 'with', distractors: ['at', 'to', 'by'] },
    { sentence: 'The study was designed to ____ whether diet affects memory.', answer: 'investigate', distractors: ['invent', 'indicate to', 'insist'] },
  ],
  'C1-C2': [
    { sentence: 'The findings are compelling, ____ they rely on a relatively small sample.', answer: 'albeit', distractors: ['whereby', 'inasmuch', 'lest'] },
    { sentence: 'The proposal was rejected, not for being impractical, but for being ____.', answer: 'insufficiently substantiated', distractors: ['substantiating insufficient', 'insufficient substantiation', 'substantially insufficient'] },
    { sentence: 'Were it not for the revised timetable, the project ____ considerably.', answer: 'would have been delayed', distractors: ['will delay', 'would delay', 'had been delaying'] },
    { sentence: 'The author takes issue ____ the assumption that growth is limitless.', answer: 'with', distractors: ['to', 'against', 'about'] },
    { sentence: 'The policy may inadvertently ____ the very inequality it seeks to address.', answer: 'exacerbate', distractors: ['alleviate', 'consolidate', 'contemplate'] },
    { sentence: 'Little ____ that the seemingly minor change would have such far-reaching effects.', answer: 'did they anticipate', distractors: ['they anticipated', 'they did anticipate', 'had they anticipated'] },
    { sentence: 'The data, ____ from several independent sources, proved unusually robust.', answer: 'corroborated', distractors: ['corroborating by', 'to corroborate', 'having corroborate'] },
    { sentence: 'The distinction is not merely semantic; it has ____ consequences for policy.', answer: 'profound', distractors: ['profoundly', 'profundity', 'profounded'] },
    { sentence: 'The recommendations are contingent ____ the availability of long-term funding.', answer: 'upon', distractors: ['of', 'for', 'with'] },
    { sentence: 'The evidence is too ____ to support a definitive conclusion.', answer: 'equivocal', distractors: ['unequivocally', 'equivalent', 'equitable'] },
    { sentence: 'Not until the second trial ____ the researchers identify the source of error.', answer: 'did', distractors: ['had', 'were', 'have'] },
    { sentence: 'The report is notable for its ____ treatment of a highly contentious issue.', answer: 'dispassionate', distractors: ['impartiality', 'passionately', 'dispassion'] },
    { sentence: 'The reform was intended to streamline administration, ____ it created new layers of oversight.', answer: 'only for it to', distractors: ['so that it', 'thereby', 'lest it'] },
    { sentence: 'The extent to ____ these results can be generalised remains uncertain.', answer: 'which', distractors: ['what', 'that', 'how'] },
    { sentence: 'Far from ____ the debate, the new evidence has intensified it.', answer: 'resolving', distractors: ['resolve', 'being resolved', 'to resolve'] },
    { sentence: 'The committee stopped short of ____ the proposal outright.', answer: 'endorsing', distractors: ['to endorse', 'endorse', 'having endorsed it to'] },
    { sentence: 'The conclusions are predicated ____ the assumption that demand will remain stable.', answer: 'on', distractors: ['at', 'for', 'by'] },
    { sentence: 'Such measures are unlikely to yield the desired outcome ____ they are consistently enforced.', answer: 'unless', distractors: ['whereas', 'despite', 'insofar'] },
    { sentence: 'The author carefully distinguishes correlation ____ causation.', answer: 'from', distractors: ['with', 'of', 'against'] },
    { sentence: 'The latest figures lend ____ to concerns about regional inequality.', answer: 'credence', distractors: ['credibility to be', 'credible', 'credibly'] },
  ],
};