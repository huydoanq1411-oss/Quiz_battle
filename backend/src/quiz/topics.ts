import type { CefrLevel, VocabularyEntry } from './english-learning-bank';

export const TOPICS = ['travel', 'work', 'life', 'technology', 'food', 'nature'] as const;
export type Topic = typeof TOPICS[number];

// Content is finite: do not recycle questions when a learner exhausts it.
const BANK: Record<Topic, Record<CefrLevel, string>> = {
  travel: {
    A1: 'bus|xe buýt;train|tàu hỏa;map|bản đồ;ticket|vé;route|tuyến đường;guidebook|sách hướng dẫn',
    A2: 'luggage|hành lý;journey|chuyến đi;passport|hộ chiếu;booking|đặt chỗ;departure|sự khởi hành;scenic|có phong cảnh đẹp',
    B1: 'destination|điểm đến;departure|sự khởi hành;accommodation|chỗ ở;itinerary|lịch trình;voyage|chuyến hải hành;passage|hành trình qua biển',
    B2: 'excursion|chuyến tham quan;layover|thời gian quá cảnh;hospitality|sự hiếu khách;landmark|địa danh nổi bật;voyage|chuyến hải hành;pilgrim|người hành hương',
    C1: 'ecotourism|du lịch sinh thái;seclusion|sự biệt lập;expedition|chuyến thám hiểm;quarantine|sự cách ly;biodiversity|đa dạng sinh học;waypoint|điểm dừng định vị',
    C2: 'wanderlust|niềm khao khát du lịch;circumnavigation|hành trình vòng quanh thế giới;sojourn|lần lưu trú ngắn;peripatetic|hay di chuyển;maritime|thuộc hàng hải;wayfaring|việc đi đây đó',
  },
  work: {
    A1: 'job|công việc;desk|bàn làm việc;boss|sếp;office|văn phòng;cubicle|ô làm việc;lunch|bữa trưa',
    A2: 'meeting|cuộc họp;salary|tiền lương;colleague|đồng nghiệp;company|công ty;schedule|lịch làm việc;shift|ca làm',
    B1: 'deadline|hạn chót;promotion|sự thăng chức;interview|buổi phỏng vấn;contract|hợp đồng;agenda|chương trình họp;minutes|biên bản cuộc họp',
    B2: 'negotiation|sự đàm phán;recruitment|sự tuyển dụng;productivity|năng suất;stakeholder|bên liên quan;merit|thành tích;workflow|quy trình làm việc',
    C1: 'delegation|sự ủy quyền;remuneration|thù lao;procurement|hoạt động thu mua;redundancy|việc cắt giảm nhân sự;hierarchy|hệ thống cấp bậc;oversight|sự giám sát',
    C2: 'entrepreneurship|tinh thần khởi nghiệp;fiduciary|thuộc trách nhiệm tín thác;arbitration|sự phân xử bằng trọng tài;synergy|hiệu quả cộng hưởng;oligopoly|thị trường độc quyền nhóm;prospectus|bản cáo bạch',
  },
  life: {
    A1: 'home|nhà;food|thức ăn;family|gia đình;water|nước;clothes|quần áo;breakfast|bữa sáng',
    A2: 'neighbour|hàng xóm;shopping|việc mua sắm;exercise|bài tập thể dục;routine|thói quen hằng ngày;weekend|cuối tuần;weekday|ngày trong tuần',
    B1: 'household|hộ gia đình;budget|ngân sách;wellbeing|trạng thái khỏe mạnh;community|cộng đồng;neighbourhood|khu dân cư;income|thu nhập',
    B2: 'sustainability|tính bền vững;nutrition|dinh dưỡng;resilience|khả năng phục hồi;mindfulness|sự chú tâm vào hiện tại;self-care|chăm sóc bản thân;thrift|tính tiết kiệm',
    C1: 'frugality|tính tiết kiệm;reciprocity|sự có đi có lại;contentment|sự mãn nguyện;interdependence|sự phụ thuộc lẫn nhau;mindset|tư duy;volunteering|hoạt động tình nguyện',
    C2: 'equanimity|sự bình thản;conviviality|không khí vui vẻ thân tình;vicissitude|sự thăng trầm;actualisation|sự phát huy trọn vẹn tiềm năng;serendipity|sự tình cờ may mắn;selfhood|bản ngã',
  },
  technology: {
    A1: 'computer|máy tính;phone|điện thoại;screen|màn hình;button|nút bấm;camera|máy ảnh;keyboard|bàn phím',
    A2: 'website|trang web;password|mật khẩu;download|tải xuống;online|trực tuyến;message|tin nhắn;search|tìm kiếm',
    B1: 'software|phần mềm;device|thiết bị;network|mạng lưới;database|cơ sở dữ liệu;update|bản cập nhật;digital|kỹ thuật số',
    B2: 'algorithm|thuật toán;interface|giao diện;encryption|mã hóa;bandwidth|băng thông;automation|tự động hóa;cybersecurity|an ninh mạng',
    C1: 'infrastructure|cơ sở hạ tầng;interoperability|khả năng tương tác;proprietary|độc quyền;decentralised|phi tập trung;scalability|khả năng mở rộng;telemetry|dữ liệu đo từ xa',
    C2: 'cryptography|mật mã học;disintermediation|loại bỏ trung gian;quantum|thuộc lượng tử;ubiquitous|hiện diện khắp nơi;ontological|thuộc bản thể học;technocracy|chế độ kỹ trị',
  },
  food: {
    A1: 'bread|bánh mì;rice|cơm;apple|quả táo;egg|trứng;soup|súp;water|nước',
    A2: 'breakfast|bữa sáng;vegetable|rau củ;recipe|công thức;spicy|cay;hungry|đói;delicious|ngon',
    B1: 'ingredient|nguyên liệu;flavour|hương vị;portion|khẩu phần;organic|hữu cơ;consume|tiêu thụ;dietary|thuộc chế độ ăn',
    B2: 'nutrition|dinh dưỡng;preserve|bảo quản;fermentation|sự lên men;culinary|thuộc nấu nướng;appetite|sự thèm ăn;processed|đã qua chế biến',
    C1: 'gastronomy|ẩm thực học;provenance|nguồn gốc;palatable|ngon miệng;delectable|ngon tuyệt;seasonality|tính theo mùa;artisan|thợ thủ công',
    C2: 'epicurean|sành ăn;umami|vị umami;connoisseur|người sành;gustatory|thuộc vị giác;deconstruction|sự tách cấu trúc;terroir|đặc tính vùng đất',
  },
  nature: {
    A1: 'tree|cây;flower|hoa;river|sông;mountain|núi;rain|mưa;animal|động vật',
    A2: 'forest|rừng;island|hòn đảo;weather|thời tiết;garden|khu vườn;pollution|ô nhiễm;recycle|tái chế',
    B1: 'climate|khí hậu;habitat|môi trường sống;species|loài;resource|tài nguyên;wildlife|động vật hoang dã;drought|hạn hán',
    B2: 'ecosystem|hệ sinh thái;biodiversity|đa dạng sinh học;conservation|sự bảo tồn;emission|khí thải;renewable|có thể tái tạo;deforestation|sự phá rừng',
    C1: 'sustainability|tính bền vững;reforestation|sự trồng lại rừng;degradation|sự suy thoái;mitigation|sự giảm nhẹ;resilience|khả năng phục hồi;carbon-neutral|trung hòa carbon',
    C2: 'anthropogenic|do con người gây ra;biogeochemical|thuộc địa hóa sinh học;desertification|sự sa mạc hóa;stewardship|sự quản lý có trách nhiệm;ecological|thuộc sinh thái;intertidal|thuộc vùng triều',
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
  technology: {
    A1: 'mouse|chuột máy tính;file|tệp;printer|máy in;website|trang web;email|thư điện tử;video|video;tablet|máy tính bảng;robot|rô bốt;app|ứng dụng;icon|biểu tượng;charger|bộ sạc;code|mã',
    A2: 'account|tài khoản;browser|trình duyệt;cloud|đám mây;link|liên kết;login|đăng nhập;mobile|di động;signal|tín hiệu;upload|tải lên;viral|lan truyền;virtual|ảo;screen-time|thời gian dùng màn hình;privacy|quyền riêng tư',
    B1: 'application|ứng dụng;programmer|lập trình viên;platform|nền tảng;server|máy chủ;storage|bộ nhớ lưu trữ;streaming|phát trực tuyến;hardware|phần cứng;bug|lỗi phần mềm;query|truy vấn;feature|tính năng;source-code|mã nguồn;framework|khung phát triển',
    B2: 'protocol|giao thức;repository|kho mã;deployment|triển khai;virtualisation|ảo hóa;authentication|xác thực;permission|quyền truy cập;latency|độ trễ;encryption-key|khóa mã hóa;open-source|mã nguồn mở;debugging|gỡ lỗi;dependency|phụ thuộc;runtime|môi trường chạy',
    C1: 'distributed|phân tán;containerisation|đóng gói container;observability|khả năng quan sát;redundancy|dự phòng;throughput|thông lượng;latency-sensitive|nhạy với độ trễ;backward-compatible|tương thích ngược;data-mining|khai phá dữ liệu;schema|lược đồ;pipeline|đường ống xử lý;regression|hồi quy;benchmarking|đo chuẩn',
    C2: 'algorithmic|thuộc thuật toán;cryptographic|thuộc mật mã;epistemology|nhận thức luận;hyperautomation|siêu tự động hóa;neural-network|mạng nơ-ron;polymorphism|tính đa hình;deprecate|khai tử tính năng;idempotent|lũy đẳng;provenance|nguồn gốc dữ liệu;synthetic|tổng hợp;heuristic|thuật nghiệm;inference|suy luận',
  },
  food: {
    A1: 'milk|sữa;cheese|phô mai;chicken|thịt gà;banana|quả chuối;cake|bánh ngọt;coffee|cà phê;tea|trà;salt|muối;sugar|đường;plate|đĩa;spoon|thìa;market|chợ',
    A2: 'lunch|bữa trưa;dinner|bữa tối;restaurant|nhà hàng;menu|thực đơn;order|gọi món;fruit|trái cây;meat|thịt;fresh|tươi;boil|luộc;fry|chiên;serve|phục vụ;snack|đồ ăn nhẹ',
    B1: 'cuisine|ẩm thực;flavour|hương vị;dish|món ăn;meal|bữa ăn;recipe|công thức;harvest|vụ thu hoạch;farmer|nông dân;local|địa phương;seasoning|gia vị;portion|khẩu phần;consume|tiêu thụ;allergy|dị ứng',
    B2: 'beverage|đồ uống;preservation|sự bảo quản;packaging|bao bì;agriculture|nông nghiệp;appetising|ngon miệng;substitute|thay thế;surplus|thặng dư;shortage|thiếu hụt;retail|bán lẻ;wholesale|bán buôn;import|nhập khẩu;export|xuất khẩu',
    C1: 'ferment|lên men;probiotic|men vi sinh;seasonality|tính theo mùa;traceability|khả năng truy xuất;consumption|sự tiêu thụ;commodity|hàng hóa;artisan|thợ thủ công;palate|khẩu vị;delectable|ngon tuyệt;nutrient|chất dinh dưỡng;culinary|thuộc nấu nướng;foodborne|do thực phẩm gây ra',
    C2: 'gastronomic|thuộc ẩm thực;epicureanism|chủ nghĩa hưởng lạc ẩm thực;connoisseurship|sự sành ăn;gustation|sự nếm;palatability|tính ngon miệng;provenance|nguồn gốc;terroir|đặc tính vùng đất;umami|vị umami;delectation|sự thưởng thức;preservative|chất bảo quản;commodification|sự thương mại hóa;gastronomy|ẩm thực học',
  },
  nature: {
    A1: 'sky|bầu trời;cloud|đám mây;grass|cỏ;lake|hồ;sea|biển;sun|mặt trời;moon|mặt trăng;wind|gió;stone|hòn đá;leaf|lá cây;farm|nông trại;park|công viên',
    A2: 'riverbank|bờ sông;island|hòn đảo;season|mùa;storm|bão;flood|lũ lụt;energy|năng lượng;plastic|nhựa;clean|sạch;dirty|bẩn;protect|bảo vệ;grow|phát triển;natural|tự nhiên',
    B1: 'environment|môi trường;temperature|nhiệt độ;rainfall|lượng mưa;farming|canh tác;endangered|có nguy cơ tuyệt chủng;organic|hữu cơ;carbon|carbon;coastline|đường bờ biển;volcano|núi lửa;earthquake|động đất;adapt|thích nghi;forecast|dự báo',
    B2: 'renewable|có thể tái tạo;consumption|sự tiêu thụ;conservation|sự bảo tồn;habitat-loss|mất môi trường sống;climate-change|biến đổi khí hậu;landfill|bãi chôn lấp;waterway|đường thủy;solar|thuộc năng lượng mặt trời;wind-power|năng lượng gió;ecosystem|hệ sinh thái;species-rich|giàu loài;greenhouse|nhà kính',
    C1: 'biodiversity|đa dạng sinh học;carbon-footprint|dấu chân carbon;reforestation|sự trồng lại rừng;ecotoxicity|độc tính sinh thái;watershed|lưu vực;permafrost|băng vĩnh cửu;biomass|sinh khối;geothermal|địa nhiệt;invasive|xâm lấn;wetland|đất ngập nước;restoration|sự phục hồi;drought-resistant|chịu hạn',
    C2: 'anthropocene|kỷ nguyên con người;biocentrism|thuyết trọng sinh;desertification|sự sa mạc hóa;anthropogenic|do con người gây ra;palynology|bào tử phấn học;hydrological|thuộc thủy văn;photosynthetic|thuộc quang hợp;ecoregion|vùng sinh thái;rewilding|tái hoang dã;cryosphere|quyển băng;transboundary|xuyên biên giới;stewardship|quản lý có trách nhiệm',
  },
};

export function topicVocabulary(topic: Topic, level: CefrLevel): VocabularyEntry[] {
  return `${BANK[topic][level]};${EXTRA[topic][level]}`.split(';').map(pair => {
    const [word, meaning] = pair.split('|');
    return { word, meaning, level };
  });
}
