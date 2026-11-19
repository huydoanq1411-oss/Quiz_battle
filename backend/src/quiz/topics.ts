import type { CefrLevel, VocabularyEntry } from './english-learning-bank';

export const TOPICS = ['travel', 'work', 'life'] as const;
export type Topic = typeof TOPICS[number];

// Content is finite: do not recycle questions when a learner exhausts it.
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
    C2: 'equanimity|sự bình thản;conviviality|không khí vui vẻ thân tình;vicissitude|sự thăng trầm;actualisation|sự phát huy trọn vẹn tiềm năng',
  },
};

const EXTRA: Record<Topic, Record<CefrLevel, string>> = {
  travel: {
    A1: 'car|xe hơi;plane|máy bay;boat|thuyền;road|con đường;hotel|khách sạn;beach|bãi biển;park|công viên;city|thành phố;bag|túi xách;seat|chỗ ngồi;trip|chuyến đi;taxi|xe taxi;bike|xe đạp;station|nhà ga;street|đường phố;airport|sân bay',
    A2: 'suitcase|va li;guide|hướng dẫn viên;tourist|khách du lịch;flight|chuyến bay;island|hòn đảo;village|ngôi làng;museum|bảo tàng;bridge|cây cầu;camping|việc cắm trại;entrance|lối vào;exit|lối ra;platform|sân ga;return|sự trở về;abroad|ở nước ngoài;coast|bờ biển;ferry|phà',
    B1: 'reservation|sự đặt trước;customs|hải quan;currency|tiền tệ;insurance|bảo hiểm;brochure|tờ giới thiệu;backpack|ba lô;hostel|nhà trọ du lịch;route|tuyến đường;delay|sự chậm trễ;border|biên giới;souvenir|quà lưu niệm;arrival|sự đến nơi;passenger|hành khách;resort|khu nghỉ dưỡng;fare|giá vé;vehicle|phương tiện',
    B2: 'baggage|hành lý ký gửi;boarding|việc lên phương tiện;commute|đi lại thường ngày;detour|đường vòng;scenery|phong cảnh;cancellation|sự hủy bỏ;heritage|di sản;embark|lên tàu;disembark|xuống tàu;visa|thị thực;transit|sự trung chuyển;amenity|tiện nghi;overseas|ở hải ngoại;remote|xa xôi;terminal|nhà ga hành khách;expatriate|người sống ở nước ngoài',
    C1: 'pilgrimage|cuộc hành hương;immersion|sự hòa mình vào văn hóa;logistics|công tác hậu cần;repatriation|sự hồi hương;trekking|hoạt động đi bộ đường dài;infrastructure|cơ sở hạ tầng;embargo|lệnh cấm vận;sanctuary|khu bảo tồn;indigenous|bản địa;archipelago|quần đảo;topography|địa hình;inaccessible|khó tiếp cận;itinerant|di chuyển từ nơi này sang nơi khác;unspoilt|còn nguyên vẻ tự nhiên;seafaring|hoạt động đi biển;acclimatise|thích nghi khí hậu',
    C2: 'peregrination|cuộc du hành dài;wayfarer|người lữ hành;odyssey|hành trình nhiều biến cố;hinterland|vùng nội địa;cartography|ngành bản đồ học;portage|việc khiêng thuyền qua cạn;transcontinental|xuyên lục địa;disembarkation|sự rời tàu;extraterritorial|ngoài lãnh thổ;reconnaissance|sự khảo sát tiền trạm;sedentary|ít di chuyển;cosmopolitan|mang tính quốc tế;insularity|tính biệt lập;acculturation|sự chiếm dụng văn hóa;geotourism|du lịch địa chất;antipodes|vùng đối cực địa lý',
  },
  work: {
    A1: 'work|việc làm;shop|cửa hàng;teacher|giáo viên;doctor|bác sĩ;nurse|y tá;driver|tài xế;farmer|nông dân;worker|công nhân;manager|người quản lý;team|đội nhóm;email|thư điện tử;phone|điện thoại;paper|giấy;pen|bút;computer|máy tính;money|tiền',
    A2: 'customer|khách hàng;staff|nhân viên;factory|nhà máy;uniform|đồng phục;break|giờ nghỉ;task|nhiệm vụ;plan|kế hoạch;training|sự đào tạo;business|việc kinh doanh;project|dự án;report|báo cáo;assistant|trợ lý;employer|người sử dụng lao động;employee|người lao động;appointment|cuộc hẹn;experience|kinh nghiệm',
    B1: 'application|đơn ứng tuyển;qualification|bằng cấp;responsibility|trách nhiệm;department|phòng ban;income|thu nhập;career|sự nghiệp;overtime|giờ làm thêm;shift|ca làm;feedback|ý kiến phản hồi;achievement|thành tích;bonus|tiền thưởng;vacancy|vị trí còn trống;reference|thư giới thiệu;resign|từ chức;supervisor|người giám sát;workload|khối lượng công việc',
    B2: 'collaboration|sự hợp tác;efficiency|hiệu suất;appraisal|sự đánh giá công việc;turnover|tỷ lệ thay nhân sự;incentive|sự khuyến khích;competence|năng lực;autonomy|quyền tự chủ;benchmark|mốc chuẩn;outsourcing|việc thuê ngoài;probation|thời gian thử việc;portfolio|hồ sơ năng lực;entrepreneur|doanh nhân;revenue|doanh thu;profitability|khả năng sinh lời;compliance|sự tuân thủ;mentoring|việc hướng dẫn nghề nghiệp',
    C1: 'accountability|trách nhiệm giải trình;governance|hoạt động quản trị;liability|trách nhiệm pháp lý;restructuring|sự tái cơ cấu;succession|sự kế nhiệm;retention|việc giữ chân nhân sự;severance|trợ cấp thôi việc;diligence|sự thẩm định kỹ lưỡng;leveraging|việc tận dụng nguồn lực;scalability|khả năng mở rộng;disbursement|sự giải ngân;amortisation|sự phân bổ chi phí;insolvency|tình trạng mất khả năng thanh toán;divestment|sự thoái vốn;acquisition|sự mua lại;merger|sự sáp nhập',
    C2: 'intrapreneurship|tinh thần khởi nghiệp nội bộ;disintermediation|sự loại bỏ trung gian;commoditisation|sự phổ thông hóa sản phẩm;antitrust|chống độc quyền;indemnity|nghĩa vụ bồi thường;incumbency|vị thế đương nhiệm;obsolescence|sự lỗi thời;diseconomy|yếu tố làm tăng chi phí;fungibility|tính có thể thay thế ngang giá;externality|tác động ngoại ứng;solvency|khả năng thanh toán;recapitalisation|sự tái cấp vốn;whistleblowing|việc tố giác sai phạm;malfeasance|hành vi sai trái công vụ;collusion|sự thông đồng;underwriting|việc bảo lãnh phát hành',
  },
  life: {
    A1: 'mother|mẹ;father|bố;sister|chị hoặc em gái;brother|anh hoặc em trai;friend|bạn bè;room|căn phòng;bed|giường;sleep|giấc ngủ;milk|sữa;bread|bánh mì;rice|cơm;coffee|cà phê;tea|trà;day|ngày;night|đêm;child|đứa trẻ',
    A2: 'kitchen|nhà bếp;bathroom|phòng tắm;garden|khu vườn;laundry|quần áo cần giặt;hobby|sở thích;habit|thói quen;health|sức khỏe;medicine|thuốc;dentist|nha sĩ;recipe|công thức nấu ăn;meal|bữa ăn;rent|tiền thuê nhà;bill|hóa đơn;wallet|ví tiền;furniture|đồ nội thất;leisure|thời gian nhàn rỗi',
    B1: 'relationship|mối quan hệ;balance|sự cân bằng;expense|khoản chi tiêu;savings|tiền tiết kiệm;volunteer|tình nguyện viên;chores|việc nhà;diet|chế độ ăn;fitness|thể lực;recycling|việc tái chế;privacy|sự riêng tư;support|sự hỗ trợ;independence|sự độc lập;celebration|sự ăn mừng;tradition|truyền thống;permission|sự cho phép;patience|sự kiên nhẫn',
    B2: 'consumption|sự tiêu thụ;wellness|sức khỏe toàn diện;belonging|cảm giác thuộc về;empathy|sự đồng cảm;assertiveness|sự quyết đoán;burnout|sự kiệt sức;fulfilment|cảm giác viên mãn;commitment|sự cam kết;adaptability|khả năng thích nghi;affordability|tính vừa túi tiền;livelihood|sinh kế;upbringing|sự nuôi dạy;domesticity|đời sống gia đình;solidarity|tình đoàn kết;moderation|sự điều độ;companionship|tình bạn đồng hành',
    C1: 'altruism|lòng vị tha;introspection|sự tự suy ngẫm;gratification|sự thỏa mãn;alienation|sự xa cách xã hội;equity|sự công bằng;cohesion|sự gắn kết;longevity|tuổi thọ;temperance|sự tiết chế;conscientiousness|tính tận tâm;vulnerability|trạng thái dễ tổn thương;self-discipline|tính tự giác;bereavement|nỗi đau mất người thân;ambivalence|cảm xúc mâu thuẫn;ingenuity|sự khéo léo sáng tạo;serenity|sự thanh thản;discretion|sự thận trọng kín đáo',
    C2: 'eudaimonia|trạng thái sống tốt và có ý nghĩa;magnanimity|lòng cao thượng;stoicism|sự kiên cường điềm tĩnh;asceticism|lối sống khổ hạnh;solipsism|thuyết duy ngã;anomie|trạng thái thiếu chuẩn mực xã hội;ennui|nỗi buồn chán triền miên;intersubjectivity|sự chia sẻ trải nghiệm chủ quan;effervescence|sự sôi nổi;ineluctable|không thể tránh khỏi;ephemerality|tính ngắn ngủi;perspicacity|sự sáng suốt;propinquity|sự gần gũi;commensality|tập quán cùng ăn uống;liminality|trạng thái ở ngưỡng chuyển tiếp;convivial|vui vẻ thân tình',
  },
};

export function topicVocabulary(topic: Topic, level: CefrLevel): VocabularyEntry[] {
  return `${BANK[topic][level]};${EXTRA[topic][level]}`.split(';').map(pair => {
    const [word, meaning] = pair.split('|');
    return { word, meaning, level };
  });
}
