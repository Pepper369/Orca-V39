export interface MarketIndex {
  name: string;
  ticker: string;
  value: number;
  dailyChange: number;
  dailyChangePct: number;
  weeklyChange: number;
  monthlyChange: number;
  trend: "bullish" | "bearish" | "neutral";
}

export interface MacroIndicator {
  name: string;
  latestValue: string;
  previousValue: string;
  trend: "up" | "down" | "stable";
  impact: string;
  unit: string;
}

export interface Commodity {
  name: string;
  category: string;
  price: number;
  unit: string;
  dailyChange: number;
  weeklyTrend: "up" | "down" | "flat";
  monthlyTrend: "up" | "down" | "flat";
  vnImpact: string;
  weeklyChangePct?: number;
  monthlyChangePct?: number;
  ytdChangePct?: number;
  source: string;
  asOf: string;
  drivers: string;
  vnSectors: string[];
}

export interface NewsItem {
  headline: string;
  source: string;
  time: string;
  summary: string;
  impact: "high" | "medium" | "low";
  riskLevel: string;
  sectors: string[];
  verified: boolean;
}

export interface SectorData {
  name: string;
  relativeStrength: number;
  capitalFlow: "inflow" | "outflow" | "neutral";
  momentum: number;
  valuation: "attractive" | "fair" | "expensive";
  technicalScore: number;
}

export interface StockPick {
  ticker: string;
  company: string;
  sector: string;
  fundamentalScore: number;
  technicalScore: number;
  momentumScore: number;
  valuationScore: number;
  riskScore: "Thấp" | "Trung bình" | "Cao";
  entryZone: string;
  target1: string;
  target2: string;
  stopLoss: string;
  expectedReturn: string;
  thesis: string;
  risks: string;
  stars: number;
}

export interface DashboardData {
  date: string;
  dateShort: string;
  timestamp: string;
  sentimentScore: number;
  riskScore: number;
  fearGreedScore: number;
  orcaPulse: string;
  vietnamMarkets: MarketIndex[];
  globalMarkets: MarketIndex[];
  vietnamMacro: MacroIndicator[];
  globalMacro: MacroIndicator[];
  commodities: Commodity[];
  globalNews: NewsItem[];
  vietnamNews: NewsItem[];
  corporateNews: NewsItem[];
  sectors: SectorData[];
  technicalAnalysis: {
    vnindex: TechnicalBlock;
    vn30: TechnicalBlock;
  };
  strategy: StrategyBlock;
  stockPicks: StockPick[];
  executiveSummary: SummaryBlock;
  confidenceScores: ConfidenceBlock;
}

interface TechnicalBlock {
  ma20: number;
  ma50: number;
  ma200: number;
  rsi: number;
  macd: string;
  bollingerUpper: number;
  bollingerLower: number;
  adx: number;
  breadth: string;
  trend: string;
  supports: number[];
  resistances: number[];
  shortTermOutlook: string;
  mediumTermOutlook: string;
  probabilityScore: number;
}

interface StrategyBlock {
  regime: string;
  cashPct: number;
  stocksPct: number;
  bondsPct: number;
  goldPct: number;
  recommendedSectors: string[];
  riskGuidance: string;
  tradingThemes: string[];
  catalysts: string[];
}

interface SummaryBlock {
  keyMessage: string;
  biggestOpportunity: string;
  biggestRisk: string;
  sectorToWatch: string;
  stockToWatch: string;
  nextDayOutlook: string;
}

interface ConfidenceBlock {
  dataReliability: number;
  macroConfidence: number;
  technicalConfidence: number;
  strategyConfidence: number;
  overallConfidence: number;
  explanation: string;
}

export function getDashboardData(): DashboardData {
  return {
    date: "Thứ Ba, ngày 09 tháng 06 năm 2026",
    dateShort: "09/06/2026",
    timestamp: "Cập nhật: 08:10 SA (GMT+7) | Dữ liệu thị trường đến close 08/06/2026",

    sentimentScore: 36,
    riskScore: 78,
    fearGreedScore: 30,
    orcaPulse: "Risk-Off nội địa — VN-Index mất 1,800, chờ CPI Mỹ",

    vietnamMarkets: [
      { name: "VNINDEX", ticker: "VNI", value: 1790.53, dailyChange: -48.37, dailyChangePct: -2.63, weeklyChange: -2.63, monthlyChange: -5.04, trend: "bearish" },
      { name: "VN30", ticker: "VN30", value: 1935.80, dailyChange: -50.48, dailyChangePct: -2.54, weeklyChange: -3.22, monthlyChange: -5.25, trend: "bearish" },
      { name: "HNX-INDEX", ticker: "HNX", value: 298.36, dailyChange: 4.57, dailyChangePct: 1.56, weeklyChange: 1.56, monthlyChange: 14.48, trend: "neutral" },
      { name: "UPCOM", ticker: "UPC", value: 123.10, dailyChange: -1.06, dailyChangePct: -0.85, weeklyChange: -1.95, monthlyChange: 0.20, trend: "neutral" },
    ],

    globalMarkets: [
      { name: "S&P 500", ticker: "SPX", value: 7405.73, dailyChange: 21.99, dailyChangePct: 0.30, weeklyChange: -2.22, monthlyChange: 0.58, trend: "neutral" },
      { name: "NASDAQ", ticker: "IXIC", value: 25929.66, dailyChange: 220.23, dailyChangePct: 0.86, weeklyChange: -3.88, monthlyChange: 0.26, trend: "neutral" },
      { name: "DOW JONES", ticker: "DJI", value: 50786.01, dailyChange: -80.77, dailyChangePct: -0.16, weeklyChange: -0.76, monthlyChange: 1.86, trend: "neutral" },
      { name: "Russell 2000", ticker: "RUT", value: 2854.06, dailyChange: 24.06, dailyChangePct: 0.85, weeklyChange: -2.95, monthlyChange: -0.30, trend: "neutral" },
      { name: "DAX", ticker: "DAX", value: 24346.0, dailyChange: -413.05, dailyChangePct: -1.67, weeklyChange: -2.88, monthlyChange: -0.65, trend: "bearish" },
      { name: "FTSE 100", ticker: "FTSE", value: 10368.0, dailyChange: 8.0, dailyChangePct: 0.07, weeklyChange: 0.25, monthlyChange: 1.15, trend: "neutral" },
      { name: "Nikkei 225", ticker: "N225", value: 64085.0, dailyChange: -2503.12, dailyChangePct: -3.76, weeklyChange: -4.10, monthlyChange: -0.85, trend: "bearish" },
      { name: "Hang Seng", ticker: "HSI", value: 24961.95, dailyChange: -290.0, dailyChangePct: -1.15, weeklyChange: -1.50, monthlyChange: -1.85, trend: "bearish" },
      { name: "Shanghai", ticker: "SHCOMP", value: 3968.0, dailyChange: -59.74, dailyChangePct: -1.49, weeklyChange: -2.10, monthlyChange: -0.65, trend: "bearish" },
    ],

    vietnamMacro: [
      { name: "GDP Q1/2026", latestValue: "6.93", previousValue: "7.09 (Q4/2025)", trend: "down", impact: "Tăng trưởng vẫn tốt nhưng động lượng chậm lại nhẹ.", unit: "% YoY" },
      { name: "CPI tháng 3/2026", latestValue: "4.65", previousValue: "3.48", trend: "up", impact: "Lạm phát ở mức cao nhất 5 năm, nhạy với dầu và tỷ giá.", unit: "% YoY" },
      { name: "Lạm phát lõi Q1/2026", latestValue: "3.63", previousValue: "2.94", trend: "up", impact: "Áp lực giá nền vẫn cao, khiến room nới lỏng chính sách hạn chế hơn.", unit: "%" },
      { name: "USD/VND", latestValue: "25,850", previousValue: "25,480", trend: "up", impact: "Tỷ giá tăng là một trong các rủi ro lớn của thị trường tháng 6.", unit: "VND" },
      { name: "PMI sản xuất", latestValue: "51.2", previousValue: "50.8", trend: "up", impact: "Sản xuất duy trì mở rộng, hỗ trợ nhóm công nghiệp và xuất khẩu.", unit: "điểm" },
      { name: "FDI đăng ký 5T/2026", latestValue: "18.5", previousValue: "15.2", trend: "up", impact: "FDI vẫn là câu chuyện nền quan trọng cho KCN và logistics.", unit: "tỷ USD" },
      { name: "Tăng trưởng tín dụng", latestValue: "13.8", previousValue: "15.08", trend: "down", impact: "Dòng tín dụng chậm lại, ảnh hưởng kỳ vọng ngân hàng và bất động sản.", unit: "%" },
    ],

    globalMacro: [
      { name: "Fed Funds Rate", latestValue: "4.25–4.50", previousValue: "4.50–4.75", trend: "down", impact: "Fed đã giảm trước đó nhưng NFP mạnh đang làm thị trường quay lại pricing rate hike.", unit: "%" },
      { name: "NFP Mỹ tháng 5", latestValue: "172,000", previousValue: "~80,000 kỳ vọng", trend: "up", impact: "Số liệu việc làm rất mạnh, kéo lợi suất tăng và gây áp lực lên nhóm tăng trưởng.", unit: "jobs" },
      { name: "US 10Y Treasury", latestValue: "4.56", previousValue: "4.54", trend: "up", impact: "Lợi suất neo cao là biến số tiêu cực nhất cho tech/AI/EM hiện tại.", unit: "%" },
      { name: "US Dollar Index", latestValue: "~100.0", previousValue: "100.02", trend: "stable", impact: "USD mạnh làm tăng áp lực lên tỷ giá EM và giá vàng.", unit: "điểm" },
      { name: "US CPI / Lạm phát", latestValue: "Cập nhật theo lịch mới", previousValue: "Dữ liệu kỳ trước", trend: "stable", impact: "Lạm phát Mỹ tiếp tục là biến số quan trọng với Fed, USD, vàng và cổ phiếu tăng trưởng.", unit: "% YoY" },
      { name: "VIX", latestValue: "18.52", previousValue: "~21.5", trend: "down", impact: "Biến động đã hạ nhiệt sau phiên hồi kỹ thuật, nhưng vẫn cao hơn nền đầu tháng.", unit: "điểm" },
      { name: "China PMI", latestValue: "50.5", previousValue: "50.1", trend: "up", impact: "PMI Trung Quốc trên 50 giúp giảm bớt lo ngại cầu nguyên liệu sụt sâu.", unit: "điểm" },
    ],

    commodities: [
      {
        name: "Dầu Brent",
        category: "Năng lượng",
        price: 96.18,
        unit: "USD/thùng",
        dailyChange: 3.32,
        weeklyTrend: "up",
        monthlyTrend: "down",
        weeklyChangePct: 1.05,
        monthlyChangePct: -14.7,
        ytdChangePct: 43.45,
        source: "Investing.com / Trading Economics",
        asOf: "08/06/2026",
        drivers: "Giá dầu hồi theo rủi ro Iran-Israel nhưng vẫn dao động mạnh theo headline địa chính trị.",
        vnImpact: "Hỗ trợ nhóm dầu khí trading ngắn hạn nhưng gây áp lực CPI, logistics và hàng không nếu neo cao.",
        vnSectors: ["Dầu khí", "Vận tải", "Hàng không", "Nhựa"]
      },
      {
        name: "Dầu WTI",
        category: "Năng lượng",
        price: 94.06,
        unit: "USD/thùng",
        dailyChange: 3.89,
        weeklyTrend: "up",
        monthlyTrend: "down",
        weeklyChangePct: 0.92,
        monthlyChangePct: -13.1,
        ytdChangePct: 56.3,
        source: "Trading Economics / Yahoo Finance",
        asOf: "08/06/2026",
        drivers: "Bật lại theo risk premium Trung Đông và lực mua kỹ thuật sau nhịp giảm cuối tuần.",
        vnImpact: "Tâm lý tích cực với PVD/PVS/GAS nhưng chưa đủ tạo xu hướng nếu VN-Index tiếp tục risk-off.",
        vnSectors: ["Dầu khí", "Hóa chất"]
      },
      {
        name: "Khí tự nhiên Henry Hub",
        category: "Năng lượng",
        price: 3.17,
        unit: "USD/MMBtu",
        dailyChange: -1.72,
        weeklyTrend: "down",
        monthlyTrend: "up",
        weeklyChangePct: -0.8,
        monthlyChangePct: 6.5,
        ytdChangePct: 2.6,
        source: "Trading Economics",
        asOf: "08/06/2026",
        drivers: "Giá khí dao động trái chiều do thời tiết và tiến độ tồn kho ở Mỹ.",
        vnImpact: "Tác động gián tiếp lên nhóm điện khí như POW, NT2.",
        vnSectors: ["Điện", "Dầu khí"]
      },
      {
        name: "Vàng spot",
        category: "Kim loại quý",
        price: 4308.21,
        unit: "USD/oz",
        dailyChange: -0.53,
        weeklyTrend: "down",
        monthlyTrend: "down",
        weeklyChangePct: -4.1,
        monthlyChangePct: -8.86,
        ytdChangePct: -0.4,
        source: "Trading Economics",
        asOf: "08/06/2026",
        drivers: "USD cao và US10Y quanh 4.56% tiếp tục đè vàng bất chấp căng thẳng địa chính trị.",
        vnImpact: "Giảm áp lực hưng phấn ở nhóm vàng trong nước nhưng vẫn giữ vai trò phòng thủ tài sản.",
        vnSectors: ["Vàng", "Tài sản phòng thủ"]
      },
      {
        name: "Bạc",
        category: "Kim loại quý",
        price: 67.29,
        unit: "USD/oz",
        dailyChange: -0.02,
        weeklyTrend: "down",
        monthlyTrend: "down",
        weeklyChangePct: -3.1,
        monthlyChangePct: -6.5,
        ytdChangePct: -1.4,
        source: "Trading Economics",
        asOf: "08/06/2026",
        drivers: "Bạc đi theo vàng nhưng vẫn được đỡ bởi câu chuyện công nghiệp và năng lượng sạch.",
        vnImpact: "Ảnh hưởng trực tiếp thấp, chủ yếu dùng như thước đo khẩu vị rủi ro kim loại quý.",
        vnSectors: ["Kim loại quý"]
      },
      {
        name: "Đồng",
        category: "Kim loại cơ bản",
        price: 11168.8,
        unit: "USD/tấn",
        dailyChange: -0.42,
        weeklyTrend: "up",
        monthlyTrend: "up",
        weeklyChangePct: 0.8,
        monthlyChangePct: 3.5,
        ytdChangePct: 12.4,
        source: "Trading Economics / Reuters context",
        asOf: "08/06/2026",
        drivers: "Tồn kho LME giảm và nhu cầu Trung Quốc hỗ trợ giá đồng, dù tăng trưởng toàn cầu còn bất định.",
        vnImpact: "Tích cực cho nhóm khoáng sản/công nghiệp; cũng phản ánh kỳ vọng hồi phục sản xuất.",
        vnSectors: ["Khoáng sản", "Công nghiệp"]
      },
      {
        name: "Quặng sắt",
        category: "Kim loại cơ bản",
        price: 111.68,
        unit: "USD/tấn",
        dailyChange: -0.42,
        weeklyTrend: "flat",
        monthlyTrend: "down",
        weeklyChangePct: -0.2,
        monthlyChangePct: -3.8,
        ytdChangePct: 5.1,
        source: "Trading Economics",
        asOf: "08/06/2026",
        drivers: "Nhu cầu Trung Quốc chưa đủ mạnh để tạo xu hướng tăng bền cho quặng sắt.",
        vnImpact: "Ảnh hưởng trực tiếp đến HPG, HSG, NKG qua chi phí đầu vào và kỳ vọng biên lợi nhuận.",
        vnSectors: ["Thép", "Vật liệu"]
      },
      {
        name: "Thép cuộn nóng HRC",
        category: "Nguyên liệu công nghiệp",
        price: 576.81,
        unit: "USD/tấn",
        dailyChange: -0.55,
        weeklyTrend: "down",
        monthlyTrend: "down",
        weeklyChangePct: -1.1,
        monthlyChangePct: -4.6,
        ytdChangePct: -2.2,
        source: "Trading Economics",
        asOf: "08/06/2026",
        drivers: "Nguồn cung châu Á còn nhiều khiến HRC khó bật mạnh dù chi phí năng lượng tăng.",
        vnImpact: "Chi phối kỳ vọng lợi nhuận nhóm thép nội địa, đặc biệt là HPG/HSG/NKG.",
        vnSectors: ["Thép", "Xây dựng"]
      },
      {
        name: "Nhôm",
        category: "Kim loại cơ bản",
        price: 3141.0,
        unit: "USD/tấn",
        dailyChange: -0.63,
        weeklyTrend: "flat",
        monthlyTrend: "up",
        weeklyChangePct: 0.2,
        monthlyChangePct: 1.9,
        ytdChangePct: 8.7,
        source: "Trading Economics",
        asOf: "08/06/2026",
        drivers: "Nhôm neo cao do chi phí năng lượng và kỳ vọng nhu cầu công nghiệp châu Á.",
        vnImpact: "Tác động tới nhóm nhôm, xây dựng, bao bì và điện gia dụng.",
        vnSectors: ["Vật liệu", "Công nghiệp"]
      },
      {
        name: "Niken",
        category: "Kim loại cơ bản",
        price: 17300.0,
        unit: "USD/tấn",
        dailyChange: -0.03,
        weeklyTrend: "flat",
        monthlyTrend: "down",
        weeklyChangePct: -0.5,
        monthlyChangePct: -3.2,
        ytdChangePct: 2.4,
        source: "Trading Economics",
        asOf: "08/06/2026",
        drivers: "Thị trường pin EV và thép không gỉ giữ niken ở vùng biến động rộng.",
        vnImpact: "Ảnh hưởng gián tiếp tới chuỗi thép không gỉ và công nghiệp nặng.",
        vnSectors: ["Thép", "Pin", "Công nghiệp"]
      },
      {
        name: "Ngô",
        category: "Nông sản & softs",
        price: 435.0,
        unit: "USc/giạ",
        dailyChange: 0.45,
        weeklyTrend: "flat",
        monthlyTrend: "down",
        weeklyChangePct: 0.2,
        monthlyChangePct: -2.5,
        ytdChangePct: -4.1,
        source: "Markets Insider / Trading context",
        asOf: "08/06/2026",
        drivers: "Dự báo mùa vụ Mỹ và xuất khẩu Nam Mỹ tiếp tục chi phối giá ngô.",
        vnImpact: "Quan trọng với chi phí thức ăn chăn nuôi và biên lợi nhuận ngành heo/gia cầm.",
        vnSectors: ["Chăn nuôi", "Thực phẩm"]
      },
      {
        name: "Lúa mì",
        category: "Nông sản & softs",
        price: 555.0,
        unit: "USc/giạ",
        dailyChange: 0.18,
        weeklyTrend: "flat",
        monthlyTrend: "down",
        weeklyChangePct: 0.1,
        monthlyChangePct: -1.8,
        ytdChangePct: -3.6,
        source: "Trading context",
        asOf: "08/06/2026",
        drivers: "Thời tiết và logistics Biển Đen tiếp tục là biến số lớn cho lúa mì.",
        vnImpact: "Tác động gián tiếp lên ngành thực phẩm, bột mì và bánh kẹo.",
        vnSectors: ["Thực phẩm", "Tiêu dùng"]
      },
      {
        name: "Đậu nành",
        category: "Nông sản & softs",
        price: 1168.63,
        unit: "USc/giạ",
        dailyChange: 0.35,
        weeklyTrend: "up",
        monthlyTrend: "flat",
        weeklyChangePct: 0.6,
        monthlyChangePct: 0.9,
        ytdChangePct: 2.1,
        source: "Investing.com context",
        asOf: "08/06/2026",
        drivers: "Biến động thời tiết Mỹ và nhu cầu ép dầu hỗ trợ giá đậu nành.",
        vnImpact: "Tác động đến chi phí thức ăn chăn nuôi và dầu thực vật.",
        vnSectors: ["Chăn nuôi", "Dầu thực vật"]
      },
      {
        name: "Đường",
        category: "Nông sản & softs",
        price: 19.9,
        unit: "USc/lb",
        dailyChange: 0.72,
        weeklyTrend: "up",
        monthlyTrend: "up",
        weeklyChangePct: 1.4,
        monthlyChangePct: 3.5,
        ytdChangePct: 7.8,
        source: "Trading context",
        asOf: "08/06/2026",
        drivers: "Nguồn cung Ấn Độ/Brazil và chính sách ethanol tiếp tục hỗ trợ đường.",
        vnImpact: "Có lợi cho SBT, QNS và toàn chuỗi mía đường nội địa.",
        vnSectors: ["Mía đường", "Nông nghiệp"]
      },
      {
        name: "Cà phê Robusta",
        category: "Nông sản & softs",
        price: 5480.0,
        unit: "USD/tấn",
        dailyChange: 1.85,
        weeklyTrend: "up",
        monthlyTrend: "up",
        weeklyChangePct: 2.1,
        monthlyChangePct: 5.4,
        ytdChangePct: 18.2,
        source: "Liffe / market context",
        asOf: "08/06/2026",
        drivers: "Nguồn cung thắt chặt và nhu cầu rang xay toàn cầu vẫn hỗ trợ robusta.",
        vnImpact: "Tích cực cho doanh nghiệp cà phê Việt Nam và tâm lý với nhóm xuất khẩu nông sản.",
        vnSectors: ["Xuất khẩu", "Nông sản", "Cà phê"]
      },
      {
        name: "Bông",
        category: "Nông sản & softs",
        price: 77.0,
        unit: "USc/lb",
        dailyChange: 0.21,
        weeklyTrend: "flat",
        monthlyTrend: "down",
        weeklyChangePct: 0.1,
        monthlyChangePct: -1.0,
        ytdChangePct: -2.2,
        source: "Markets Insider",
        asOf: "08/06/2026",
        drivers: "Cầu dệt may toàn cầu chưa phục hồi mạnh nhưng giá bông vẫn ổn định.",
        vnImpact: "Quan trọng với biên lợi nhuận dệt may Việt Nam.",
        vnSectors: ["Dệt may", "Xuất khẩu"]
      },
      {
        name: "Gạo rough rice",
        category: "Nông sản & softs",
        price: 14.88,
        unit: "USD/cwt",
        dailyChange: 0.81,
        weeklyTrend: "up",
        monthlyTrend: "flat",
        weeklyChangePct: 0.4,
        monthlyChangePct: 0.7,
        ytdChangePct: 3.3,
        source: "Trading Economics",
        asOf: "08/06/2026",
        drivers: "Nguồn cung châu Á và thời tiết giữ giá gạo ở vùng nhạy cảm.",
        vnImpact: "Quan trọng với doanh nghiệp xuất khẩu gạo và nhóm nông nghiệp.",
        vnSectors: ["Nông nghiệp", "Xuất khẩu gạo"]
      }
    ],

    globalNews: [
      {
        headline: "Phố Wall hồi kỹ thuật: Nasdaq +0.86%, S&P 500 +0.30% nhờ chip rebound",
        source: "CNBC / Yahoo Finance / TheStreet",
        time: "08/06/2026 16:00 ET",
        summary: "Nasdaq và S&P 500 hồi nhẹ sau cú bán tháo cuối tuần nhờ nhóm chip phục hồi. Micron bật mạnh, Nvidia và Broadcom hồi, nhưng đây mới là nhịp kỹ thuật, chưa xóa rủi ro từ CPI Mỹ và lợi suất cao.",
        impact: "high",
        riskLevel: "Trung bình",
        sectors: ["Công nghệ", "Bán dẫn", "Chứng khoán"],
        verified: true,
      },
      {
        headline: "Lạm phát Mỹ tiếp tục là biến số chính cho Fed và tài sản rủi ro",
        source: "Market calendar / macro context",
        time: "Cập nhật theo lịch vĩ mô mới nhất",
        summary: "Các số liệu CPI/PPI/PCE mới vẫn là nhóm dữ liệu quan trọng quyết định kỳ vọng lãi suất, USD, vàng và cổ phiếu tăng trưởng. Dashboard sẽ tự thay thế tin này bằng tin RSS mới trong vòng 24 giờ khi có dữ liệu mới.",
        impact: "high",
        riskLevel: "Cao",
        sectors: ["Toàn thị trường", "USD", "Tech", "Vàng"],
        verified: true,
      },
      {
        headline: "Oracle earnings là phép thử tiếp theo của AI software/cloud",
        source: "Schwab / CMC Markets / Zacks",
        time: "10/06/2026 sau giờ Mỹ",
        summary: "Sau Broadcom, thị trường cần một báo cáo đủ tốt từ Oracle để duy trì câu chuyện AI capex. Kết quả và guidance của Oracle sẽ ảnh hưởng mạnh tới Nasdaq, cloud software và sentiment AI toàn cầu.",
        impact: "high",
        riskLevel: "Cao",
        sectors: ["AI", "Cloud", "Công nghệ"],
        verified: true,
      },
      {
        headline: "SpaceX IPO 12/06 vẫn là lực hút thanh khoản cực lớn của tuần",
        source: "Yahoo Finance / market commentary",
        time: "12/06/2026",
        summary: "SpaceX dự kiến IPO ở mức $135/cp, quy mô huy động khoảng $75 tỷ. Mega IPO có thể hút tiền khỏi nhóm công nghệ đã tăng nóng, đồng thời là phép thử định giá AI/công nghệ của thị trường Mỹ.",
        impact: "medium",
        riskLevel: "Trung bình",
        sectors: ["IPO", "Công nghệ", "AI"],
        verified: true,
      },
      {
        headline: "Dầu bật lại theo headline Trung Đông, nhưng rủi ro CPI cũng tăng theo",
        source: "Investing.com / Trading Economics",
        time: "08/06/2026",
        summary: "Brent và WTI đều hồi mạnh do căng thẳng mới ở Trung Đông. Điều này hỗ trợ nhóm dầu khí trading ngắn hạn nhưng đồng thời làm câu chuyện lạm phát trở nên khó đoán hơn trước CPI và PPI Mỹ.",
        impact: "high",
        riskLevel: "Trung bình",
        sectors: ["Dầu khí", "Vận tải", "Hàng không"],
        verified: true,
      },
      {
        headline: "Apple WWDC đang diễn ra, thị trường chờ tín hiệu AI đủ mạnh từ Apple",
        source: "Market commentary",
        time: "08-12/06/2026",
        summary: "WWDC là sự kiện công nghệ lớn của tuần. Nếu Apple thiếu điểm nhấn về AI, nhóm megacap có thể tiếp tục bị bán; ngược lại, nếu thông điệp AI mạnh, Nasdaq có thể được hỗ trợ tâm lý.",
        impact: "medium",
        riskLevel: "Trung bình",
        sectors: ["Apple", "AI", "Megacap"],
        verified: true,
      }
    ],

    vietnamNews: [
      {
        headline: "VN-Index được cập nhật theo dữ liệu realtime và vùng mốc 1,800",
        source: "ORCA fallback / realtime scanner",
        time: "Cập nhật theo dữ liệu realtime",
        summary: "Trạng thái VN-Index không còn cố định theo bản tin cũ. Hệ thống sẽ tự đánh giá đang trên hay dưới mốc 1,800 dựa trên dữ liệu realtime sau mỗi lần cập nhật.",
        impact: "high",
        riskLevel: "Cao",
        sectors: ["VNINDEX", "Toàn thị trường"],
        verified: true,
      },
      {
        headline: "VN30 có 27/30 mã giảm, blue-chips không còn đỡ chỉ số",
        source: "Vietnam.vn / HOSE context",
        time: "08/06/2026",
        summary: "Áp lực bán ở nhóm blue-chips lan rất mạnh, cho thấy lực cung không còn chỉ tập trung ở mid/small caps. Việc VN30 đồng loạt suy yếu là tín hiệu kỹ thuật rất xấu cho ngắn hạn.",
        impact: "high",
        riskLevel: "Cao",
        sectors: ["VN30", "Blue-chips"],
        verified: true,
      },
      {
        headline: "Khối ngoại bán ròng hơn 671 tỷ trên HOSE, tập trung FPT, VHM, MSN, VIC",
        source: "Vietnam.vn / HOSE",
        time: "08/06/2026",
        summary: "Khối ngoại quay lại bán ròng mạnh trong phiên thị trường gãy hỗ trợ, làm tăng áp lực tâm lý. Trên HNX chỉ mua ròng nhẹ, chưa đủ bù cho áp lực bên HOSE.",
        impact: "high",
        riskLevel: "Cao",
        sectors: ["Khối ngoại", "Công nghệ", "Bất động sản"],
        verified: true,
      },
      {
        headline: "Bất động sản là nhóm giảm mạnh nhất, mất 4.36% toàn ngành",
        source: "Vietnam.vn / market summary",
        time: "08/06/2026",
        summary: "VIC, VHM, VRE, BCM, KBC cùng suy yếu cho thấy bất động sản đang là nguồn áp lực chính của thị trường. Việc nhóm này giảm đồng loạt làm ảnh hưởng trực tiếp tới VN-Index và tâm lý nhà đầu tư.",
        impact: "high",
        riskLevel: "Cao",
        sectors: ["Bất động sản"],
        verified: true,
      },
      {
        headline: "Định giá HOSE vẫn hấp dẫn quanh PE 11.1x dù thị trường gãy ngắn hạn",
        source: "SimplyWallSt / HOSE",
        time: "05/06/2026",
        summary: "Về trung hạn, định giá thị trường vẫn ở vùng hấp dẫn tương đối. Tuy nhiên valuation rẻ không đồng nghĩa thị trường sẽ ngừng giảm ngay nếu dòng tiền chưa quay lại và rủi ro vĩ mô quốc tế còn cao.",
        impact: "medium",
        riskLevel: "Trung bình",
        sectors: ["Định giá", "Trung hạn"],
        verified: true,
      }
    ],

    corporateNews: [
      {
        headline: "VIC, VHM, BID, VPB lấy đi hơn 26.68 điểm của VN-Index",
        source: "Vietnam.vn / HOSE",
        time: "08/06/2026",
        summary: "Nhóm trụ vốn hóa lớn tiếp tục là nguyên nhân trực tiếp khiến chỉ số mất sâu. Đây là tín hiệu cho thấy bán tháo không còn chỉ xảy ra ở cổ phiếu đầu cơ.",
        impact: "high",
        riskLevel: "Cao",
        sectors: ["Bất động sản", "Ngân hàng", "VN30"],
        verified: true,
      },
      {
        headline: "FPT giảm 2.8% và bị khối ngoại bán ròng mạnh nhất HOSE",
        source: "Vietnam.vn / HOSE",
        time: "08/06/2026",
        summary: "FPT trở thành đại diện rõ nhất cho áp lực công nghệ nội địa sau cú bán tech toàn cầu. Điều này buộc chiến lược ngắn hạn phải giảm mức ưu tiên với nhóm công nghệ dù nền tảng doanh nghiệp vẫn tốt.",
        impact: "high",
        riskLevel: "Cao",
        sectors: ["Công nghệ", "Khối ngoại"],
        verified: true,
      },
      {
        headline: "PVS được nhắc đến như điểm sáng tương đối trên HNX",
        source: "HNX / foreign flow context",
        time: "08/06/2026",
        summary: "Trong khi HOSE bị bán mạnh, HNX vẫn có một số điểm sáng như PVS được khối ngoại quan tâm nhẹ. Đây là lý do nhóm dầu khí chỉ phù hợp trading chọn lọc, không phải giải ngân mạnh diện rộng.",
        impact: "medium",
        riskLevel: "Trung bình",
        sectors: ["Dầu khí", "HNX"],
        verified: true,
      },
      {
        headline: "POW, REE, NT2 được chú ý như nhóm trú ẩn tương đối",
        source: "ORCA internal strategy",
        time: "09/06/2026",
        summary: "Trong bối cảnh VN-Index gãy hỗ trợ, nhóm điện/tiện ích có xác suất phòng thủ tốt hơn so với bất động sản, công nghệ và chứng khoán. Đây là nhóm nên theo dõi nếu thị trường tiếp tục biến động mạnh.",
        impact: "medium",
        riskLevel: "Thấp",
        sectors: ["Điện", "Tiện ích"],
        verified: true,
      }
    ],

    sectors: [
      { name: "Ngân hàng", relativeStrength: 48, capitalFlow: "outflow", momentum: 38, valuation: "attractive", technicalScore: 42 },
      { name: "Chứng khoán", relativeStrength: 42, capitalFlow: "outflow", momentum: 35, valuation: "fair", technicalScore: 38 },
      { name: "Bất động sản", relativeStrength: 30, capitalFlow: "outflow", momentum: 25, valuation: "fair", technicalScore: 28 },
      { name: "Thép", relativeStrength: 52, capitalFlow: "neutral", momentum: 45, valuation: "fair", technicalScore: 48 },
      { name: "Dầu khí", relativeStrength: 58, capitalFlow: "neutral", momentum: 52, valuation: "fair", technicalScore: 55 },
      { name: "Công nghệ", relativeStrength: 35, capitalFlow: "outflow", momentum: 30, valuation: "expensive", technicalScore: 32 },
      { name: "Bán lẻ", relativeStrength: 46, capitalFlow: "outflow", momentum: 40, valuation: "fair", technicalScore: 42 },
      { name: "KCN", relativeStrength: 44, capitalFlow: "outflow", momentum: 36, valuation: "attractive", technicalScore: 40 },
      { name: "Xây dựng", relativeStrength: 50, capitalFlow: "neutral", momentum: 44, valuation: "attractive", technicalScore: 46 },
      { name: "Điện", relativeStrength: 62, capitalFlow: "neutral", momentum: 56, valuation: "fair", technicalScore: 58 },
      { name: "Logistics", relativeStrength: 48, capitalFlow: "neutral", momentum: 42, valuation: "fair", technicalScore: 44 },
    ],

    technicalAnalysis: {
      vnindex: {
        ma20: 1858.4,
        ma50: 1876.2,
        ma200: 1691.6,
        rsi: 35.2,
        macd: "Tín hiệu bán mở rộng (-12.80), histogram âm tăng mạnh",
        bollingerUpper: 1924.3,
        bollingerLower: 1782.4,
        adx: 31.5,
        breadth: "Rất tiêu cực: 509 mã giảm / 208 mã tăng, VN30 có 27/30 mã đỏ",
        trend: "Giảm ngắn hạn — thủng mốc 1,800",
        supports: [1780, 1750, 1720],
        resistances: [1800, 1822, 1841],
        shortTermOutlook: "VN-Index đã thủng 1,800 với biên giảm lớn, cho thấy vùng hỗ trợ ngắn hạn bị phá vỡ. Cần theo dõi liệu chỉ số có lấy lại 1,800-1,822 trong 1-2 phiên hay không trước khi nghĩ đến bắt đáy.",
        mediumTermOutlook: "Dài hơn, MA200 vẫn chưa bị thủng nên xu hướng lớn chưa gãy hoàn toàn. Tuy nhiên cần thêm thời gian tích lũy và xác nhận dòng tiền, đặc biệt là hành vi của khối ngoại.",
        probabilityScore: 30,
      },
      vn30: {
        ma20: 1998.5,
        ma50: 2015.2,
        ma200: 1871.0,
        rsi: 36.8,
        macd: "Tín hiệu bán mạnh, nhóm blue-chip bị bán đồng loạt",
        bollingerUpper: 2058.0,
        bollingerLower: 1925.0,
        adx: 29.4,
        breadth: "Rất xấu: 27 giảm / 2 tăng / 1 đứng giá",
        trend: "Giảm mạnh — áp lực blue-chip lan rộng",
        supports: [1925, 1900, 1871],
        resistances: [1960, 1980, 2000],
        shortTermOutlook: "VN30 mất cấu trúc sideway hồi phục và quay lại xu hướng giảm ngắn hạn. Blue-chips chưa có tín hiệu tạo đáy đồng thuận.",
        mediumTermOutlook: "VN30 vẫn trên MA200 nhưng đang tiến gần vùng rủi ro hơn. Chỉ phù hợp theo dõi chọn lọc các cổ phiếu ngân hàng quốc doanh và tiện ích phòng thủ.",
        probabilityScore: 32,
      },
    },

    strategy: {
      regime: "Risk-Off nội địa — bảo toàn vốn, chờ tái chiếm 1,800",
      cashPct: 45,
      stocksPct: 25,
      bondsPct: 15,
      goldPct: 15,
      recommendedSectors: [
        "Điện / Tiện ích",
        "Tiêu dùng thiết yếu",
        "Dầu khí trading ngắn hạn",
        "Ngân hàng quốc doanh chờ nền",
        "Hạ tầng công phòng thủ",
      ],
      riskGuidance: "Giảm rủi ro là ưu tiên số một. Không dùng margin, không bắt đáy vội, và chỉ mở vị thế nhỏ khi chỉ số lấy lại 1,800-1,822 với áp lực bán giảm. Nếu VN-Index thủng 1,780, ưu tiên hạ tiếp tỷ trọng cổ phiếu.",
      tradingThemes: [
        "Phòng thủ với điện/tiện ích: POW, REE, NT2",
        "Trading ngắn ở dầu khí khi Brent giữ trên 95: PVS, PVD, GAS",
        "Theo dõi ngân hàng quốc doanh chờ nền: VCB, BID, CTG",
        "Hạ tầng/đầu tư công có thể ít nhạy hơn nhóm tăng trưởng: HHV, VCG, C4G",
        "Tránh mua đuổi công nghệ, bất động sản và chứng khoán trong phiên hồi kỹ thuật",
      ],
      catalysts: [
        "Dữ liệu CPI/PPI/PCE mới nhất của Mỹ — ảnh hưởng Fed, USD, vàng và cổ phiếu tăng trưởng",
        "Kết quả kinh doanh nhóm AI/cloud/software mới nhất — kiểm định sức bền câu chuyện công nghệ",
        "Hành vi của khối ngoại với FPT, VHM, VIC, MSN",
        "VN-Index đang duy trì trên hay dưới mốc 1,800 theo dữ liệu realtime",
        "Biến động dầu Brent quanh vùng 95-97 USD/thùng",
      ],
    },

    stockPicks: [
      {
        ticker: "VCB",
        company: "Vietcombank",
        sector: "Ngân hàng",
        fundamentalScore: 88,
        technicalScore: 60,
        momentumScore: 50,
        valuationScore: 76,
        riskScore: "Thấp",
        entryZone: "Chờ tích lũy lại trên hỗ trợ",
        target1: "+8%",
        target2: "+15%",
        stopLoss: "-5%",
        expectedReturn: "Phù hợp tích lũy từng phần",
        thesis: "VCB là blue-chip ngân hàng chất lượng cao, phù hợp với chiến lược giữ tỷ trọng thấp và chờ thị trường ổn định lại.",
        risks: "Nếu VN-Index tiếp tục mất hỗ trợ, nhóm ngân hàng vẫn có thể bị kéo giảm thêm bởi tâm lý chung.",
        stars: 4,
      },
      {
        ticker: "POW",
        company: "PV Power",
        sector: "Điện / Tiện ích",
        fundamentalScore: 76,
        technicalScore: 64,
        momentumScore: 58,
        valuationScore: 74,
        riskScore: "Thấp",
        entryZone: "Mua thăm dò từng phần",
        target1: "+6%",
        target2: "+12%",
        stopLoss: "-4%",
        expectedReturn: "Phòng thủ tốt hơn thị trường",
        thesis: "POW phù hợp cho pha risk-off nhờ đặc tính phòng thủ và mức biến động thấp hơn nhóm tăng trưởng.",
        risks: "Không phải mã bứt tốc mạnh; lợi nhuận kỳ vọng thấp hơn nếu thị trường hồi nhanh.",
        stars: 4,
      },
      {
        ticker: "PVS",
        company: "PV Technical Services",
        sector: "Dầu khí",
        fundamentalScore: 76,
        technicalScore: 64,
        momentumScore: 62,
        valuationScore: 70,
        riskScore: "Trung bình",
        entryZone: "Chỉ trading tỷ trọng nhỏ khi giữ hỗ trợ",
        target1: "+8%",
        target2: "+15%",
        stopLoss: "-5%",
        expectedReturn: "Trading ngắn hạn",
        thesis: "PVS phù hợp cho chiến lược trading theo dầu Brent khi giá dầu còn neo trên 95 USD và HNX giữ nhịp tốt hơn HOSE.",
        risks: "Nếu dầu đảo chiều hoặc VN-Index bán tháo sâu hơn, PVS cũng sẽ chịu áp lực theo tâm lý chung.",
        stars: 4,
      },
      {
        ticker: "REE",
        company: "REE Corp",
        sector: "Điện / Hạ tầng",
        fundamentalScore: 82,
        technicalScore: 58,
        momentumScore: 55,
        valuationScore: 72,
        riskScore: "Thấp",
        entryZone: "Tích lũy chậm",
        target1: "+7%",
        target2: "+12%",
        stopLoss: "-4%",
        expectedReturn: "Phòng thủ + cổ tức",
        thesis: "REE phù hợp cho nhà đầu tư ưu tiên phòng thủ, dòng tiền ổn định và ít chịu ảnh hưởng trực tiếp từ selloff công nghệ.",
        risks: "Biên tăng ngắn hạn không lớn, cần kiên nhẫn hơn so với mã đầu cơ.",
        stars: 4,
      },
      {
        ticker: "FPT",
        company: "FPT Corporation",
        sector: "Công nghệ",
        fundamentalScore: 92,
        technicalScore: 46,
        momentumScore: 40,
        valuationScore: 58,
        riskScore: "Cao",
        entryZone: "Chỉ theo dõi, chưa ưu tiên mua mới",
        target1: "Chờ sau CPI/Oracle",
        target2: "—",
        stopLoss: "Quản trị vị thế hiện có",
        expectedReturn: "Watchlist",
        thesis: "FPT vẫn là doanh nghiệp công nghệ chất lượng cao dài hạn, nhưng ngắn hạn đang chịu áp lực kép từ khối ngoại bán mạnh và selloff AI/chip toàn cầu.",
        risks: "Biến động cao, dễ bị bán tiếp nếu CPI Mỹ nóng hoặc Nasdaq quay đầu giảm.",
        stars: 3,
      },
    ],

    executiveSummary: {
      keyMessage: "Phiên 08/06 đã xác nhận trạng thái risk-off nội địa khi VN-Index mất 1,800 và blue-chips suy yếu trên diện rộng. Mỹ hồi kỹ thuật nhẹ nhưng rủi ro CPI và Oracle vẫn còn nguyên. Ưu tiên số một cho ngày 09/06 là bảo toàn vốn và chờ phản ứng quanh 1,800.",
      biggestOpportunity: "Cơ hội nằm ở các nhịp trading rất chọn lọc: điện/tiện ích phòng thủ, dầu khí khi Brent giữ trên 95, và ngân hàng quốc doanh nếu chỉ số lấy lại 1,800-1,822.",
      biggestRisk: "Rủi ro lớn nhất là CPI Mỹ nóng hơn kỳ vọng khiến lợi suất/USD tăng tiếp, trong khi VN-Index chưa có tín hiệu tạo đáy và khối ngoại vẫn bán ròng mạnh.",
      sectorToWatch: "Điện/Tiện ích phòng thủ và dầu khí trading ngắn hạn",
      stockToWatch: "POW / PVS — ưu tiên tỷ trọng nhỏ, FPT chuyển xuống watchlist",
      nextDayOutlook: "Kịch bản cơ sở là kiểm định lại 1,800. Nếu lấy lại 1,800-1,822 với lực bán giảm, thị trường có thể hồi kỹ thuật. Nếu thủng 1,780, xác suất test 1,750 tăng đáng kể.",
    },

    confidenceScores: {
      dataReliability: 93,
      macroConfidence: 84,
      technicalConfidence: 82,
      strategyConfidence: 85,
      overallConfidence: 86,
      explanation: "Bản dữ liệu nền được xây sẵn với đầy đủ các lớp thông tin: thị trường, vĩ mô, hàng hóa, tin tức, kỹ thuật và chiến lược. Hệ thống backend có thể tự quét dữ liệu công khai mỗi giờ để cập nhật snapshot mới vào PostgreSQL, đồng thời giữ bản fallback này nếu nguồn bên ngoài lỗi.",
    },
  };
}
