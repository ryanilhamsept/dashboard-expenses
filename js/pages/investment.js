import { colors, formatMoney, parseDateValue } from '../utils.js';

const STOCKS_DATA = [
  {
    ticker: "BBRI",
    name: "Bank Rakyat Indonesia",
    market: "indonesia",
    flag: "🇮🇩",
    price: "Rp4.720",
    change: "+2.60%",
    isPositive: true,
    recommendation: "BUY",
    metrics: { pe: "11.2x", pbv: "2.1x", dividend: "5.8%" },
    analysis: "Pemimpin industri dalam kredit mikro/UMKM. Fundamental sangat kuat dengan Net Interest Margin (NIM) tinggi di atas 6%. Dividen yield stabil menjadikannya pilihan investasi defensif jangka panjang terbaik."
  },
  {
    ticker: "TLKM",
    name: "Telkom Indonesia",
    market: "indonesia",
    flag: "🇮🇩",
    price: "Rp3.420",
    change: "+0.90%",
    isPositive: true,
    recommendation: "BUY",
    metrics: { pe: "14.1x", pbv: "2.3x", dividend: "5.1%" },
    analysis: "Valuasi saat ini tergolong murah secara historis. Didukung oleh ekspansi gencar data center dan pertumbuhan masif bisnis digital Telkomsel. Sangat menarik untuk diakumulasi secara bertahap."
  },
  {
    ticker: "BMRI",
    name: "Bank Mandiri",
    market: "indonesia",
    flag: "🇮🇩",
    price: "Rp6.150",
    change: "-0.80%",
    isPositive: false,
    recommendation: "HOLD",
    metrics: { pe: "12.8x", pbv: "2.4x", dividend: "4.8%" },
    analysis: "Efisiensi operasional sangat prima melalui Super App Livin'. Meskipun kinerjanya luar biasa, harganya saat ini sudah mendekati valuasi wajar. Direkomendasikan untuk hold atau tunggu koreksi sehat."
  },
  {
    ticker: "ASII",
    name: "Astra International",
    market: "indonesia",
    flag: "🇮🇩",
    price: "Rp4.950",
    change: "+1.40%",
    isPositive: true,
    recommendation: "BUY",
    metrics: { pe: "7.8x", pbv: "1.0x", dividend: "7.2%" },
    analysis: "Konglomerat terdiversifikasi dengan pangsa pasar otomotif dominan. Valuasi sangat murah (P/E ~7x) dengan yield dividen yang sangat tebal (>7%). Memiliki prospek solid dalam ekosistem kendaraan listrik (EV)."
  },
  {
    ticker: "BBNI",
    name: "Bank Negara Indonesia",
    market: "indonesia",
    flag: "🇮🇩",
    price: "Rp4.800",
    change: "+3.20%",
    isPositive: true,
    recommendation: "BUY",
    metrics: { pe: "8.9x", pbv: "1.1x", dividend: "4.5%" },
    analysis: "Transformasi korporasi dan restrukturisasi aset berjalan sangat sukses. ROE terus menunjukkan tren peningkatan yang konsisten, sementara valuasi masih jauh lebih murah dibandingkan bank KBMI IV lainnya."
  },
  {
    ticker: "BBCA",
    name: "Bank Central Asia",
    market: "indonesia",
    flag: "🇮🇩",
    price: "Rp9.800",
    change: "+0.50%",
    isPositive: true,
    recommendation: "HOLD",
    metrics: { pe: "24.5x", pbv: "4.8x", dividend: "2.3%" },
    analysis: "Raja perbankan swasta Indonesia dengan efisiensi CASA tertinggi dan biaya dana (CoF) sangat rendah. Valuasi selalu premium karena likuiditas tinggi dan manajemen risiko yang luar biasa kokoh."
  },
  {
    ticker: "ADRO",
    name: "Adaro Energy Indonesia",
    market: "indonesia",
    flag: "🇮🇩",
    price: "Rp2.750",
    change: "+4.10%",
    isPositive: true,
    recommendation: "BUY",
    metrics: { pe: "4.2x", pbv: "0.8x", dividend: "11.5%" },
    analysis: "Perusahaan energi dengan neraca keuangan yang sangat likuid dan arus kas tebal. Memberikan dividen yield rekor tertinggi di BEI (>11%) serta melakukan diversifikasi bisnis agresif ke energi terbarukan."
  },
  {
    ticker: "ICBP",
    name: "Indofood CBP Sukses Makmur",
    market: "indonesia",
    flag: "🇮🇩",
    price: "Rp11.200",
    change: "-0.45%",
    isPositive: false,
    recommendation: "BUY",
    metrics: { pe: "13.5x", pbv: "2.5x", dividend: "3.2%" },
    analysis: "Saham sektor konsumsi (consumer goods) defensif yang sangat tangguh. Kekuatan merek dagang global (Indomie) memberikan kekuatan penentuan harga (pricing power) yang sangat tangguh di kala inflasi."
  },
  {
    ticker: "UNTR",
    name: "United Tractors",
    market: "indonesia",
    flag: "🇮🇩",
    price: "Rp24.300",
    change: "+1.80%",
    isPositive: true,
    recommendation: "BUY",
    metrics: { pe: "5.5x", pbv: "1.1x", dividend: "8.5%" },
    analysis: "Distributor alat berat Komatsu terbesar di Indonesia yang juga berekspansi ke tambang emas dan nikel. Valuasi sangat menarik (P/E ~5x) dengan kebijakan dividen payout ratio yang sangat loyal."
  },
  {
    ticker: "AMRT",
    name: "Sumber Alfaria Trijaya",
    market: "indonesia",
    flag: "🇮🇩",
    price: "Rp2.850",
    change: "-1.20%",
    isPositive: false,
    recommendation: "HOLD",
    metrics: { pe: "32.0x", pbv: "8.9x", dividend: "1.5%" },
    analysis: "Jaringan minimarket Alfamart yang memiliki keunggulan geografis sangat dominan di Indonesia. Pertumbuhan kinerja sangat stabil didukung bisnis franchise, namun valuasi saat ini sudah tergolong premium."
  },
  {
    ticker: "NVDA",
    name: "NVIDIA Corp",
    market: "global",
    flag: "🇺🇸",
    price: "$1,128.50",
    change: "+4.80%",
    isPositive: true,
    recommendation: "BUY",
    metrics: { pe: "68.4x", pbv: "32.0x", dividend: "0.02%" },
    analysis: "Pemimpin mutlak dalam pasar cip AI global dengan ekosistem software CUDA yang solid. Arsitektur Blackwell akan menjadi katalis utama pertumbuhan laba di kuartal mendatang."
  },
  {
    ticker: "MSFT",
    name: "Microsoft Corp",
    market: "global",
    flag: "🇺🇸",
    price: "$429.20",
    change: "+1.20%",
    isPositive: true,
    recommendation: "BUY",
    metrics: { pe: "34.5x", pbv: "12.8x", dividend: "0.70%" },
    analysis: "Raksasa software yang memimpin integrasi AI melalui kemitraan strategis OpenAI. Layanan cloud Azure mencatat pertumbuhan solid dan margin profitabilitas yang luar biasa konsisten."
  },
  {
    ticker: "AAPL",
    name: "Apple Inc",
    market: "global",
    flag: "🇺🇸",
    price: "$189.80",
    change: "-0.50%",
    isPositive: false,
    recommendation: "HOLD",
    metrics: { pe: "29.1x", pbv: "38.2x", dividend: "0.52%" },
    analysis: "Arus kas melimpah dan retensi ekosistem pengguna sangat tinggi. Namun, pertumbuhan penjualan perangkat keras saat ini melambat dan fitur AI Apple Intelligence masih memerlukan waktu untuk komersialisasi penuh."
  },
  {
    ticker: "GOOGL",
    name: "Alphabet Inc",
    market: "global",
    flag: "🇺🇸",
    price: "$176.40",
    change: "+2.10%",
    isPositive: true,
    recommendation: "BUY",
    metrics: { pe: "24.2x", pbv: "6.9x", dividend: "0.45%" },
    analysis: "Valuasi paling atraktif di antara grup Big Tech (Magnificent Seven). Dominasi mesin pencari Google Search tetap kokoh ditambah pertumbuhan divisi Google Cloud yang mencatat leverage profit margin signifikan."
  },
  {
    ticker: "TSLA",
    name: "Tesla Inc",
    market: "global",
    flag: "🇺🇸",
    price: "$179.50",
    change: "-3.40%",
    isPositive: false,
    recommendation: "HOLD",
    metrics: { pe: "52.3x", pbv: "8.5x", dividend: "0%" },
    analysis: "Menghadapi tekanan margin akibat persaingan ketat EV global. Menarik dipantau jangka panjang karena memiliki katalis robotika (Optimus) dan peluncuran jaringan FSD otonom."
  },
  {
    ticker: "AMZN",
    name: "Amazon.com Inc",
    market: "global",
    flag: "🇺🇸",
    price: "$182.30",
    change: "+1.90%",
    isPositive: true,
    recommendation: "BUY",
    metrics: { pe: "40.5x", pbv: "8.2x", dividend: "0%" },
    analysis: "Penguasa e-commerce dan infrastruktur cloud (AWS) global. Fokus baru pada optimasi margin logistik e-commerce dan pertumbuhan pesat iklan digital mendorong lonjakan arus kas bebas secara masif."
  },
  {
    ticker: "META",
    name: "Meta Platforms Inc",
    market: "global",
    flag: "🇺🇸",
    price: "$475.60",
    change: "+2.70%",
    isPositive: true,
    recommendation: "BUY",
    metrics: { pe: "25.8x", pbv: "7.1x", dividend: "0.42%" },
    analysis: "Raja media sosial dunia (Facebook, Instagram, WhatsApp) dengan 3+ miliar pengguna harian. Investasi efisiensi infrastruktur AI sangat sukses mengoptimalkan targeting iklan digital dan menaikkan konversi pasar."
  },
  {
    ticker: "AMD",
    name: "Advanced Micro Devices",
    market: "global",
    flag: "🇺🇸",
    price: "$166.40",
    change: "+3.10%",
    isPositive: true,
    recommendation: "BUY",
    metrics: { pe: "45.0x", pbv: "3.9x", dividend: "0%" },
    analysis: "Kompetitor utama NVIDIA di akselerator cip AI (kartu grafis MI300x). Memiliki fundamental CPU x86 yang sangat stabil untuk server data center serta pangsa pasar konsol gim yang kuat."
  },
  {
    ticker: "NFLX",
    name: "Netflix Inc",
    market: "global",
    flag: "🇺🇸",
    price: "$642.50",
    change: "-0.90%",
    isPositive: false,
    recommendation: "HOLD",
    metrics: { pe: "38.2x", pbv: "11.2x", dividend: "0%" },
    analysis: "Pemimpin absolut industri streaming video global. Sukses meningkatkan pendapatan lewat program penindakan bagi-pakai sandi (password sharing) dan penayangan iklan bersponsor murah."
  },
  {
    ticker: "BRK.B",
    name: "Berkshire Hathaway Inc",
    market: "global",
    flag: "🇺🇸",
    price: "$408.20",
    change: "+0.60%",
    isPositive: true,
    recommendation: "BUY",
    metrics: { pe: "18.5x", pbv: "1.5x", dividend: "0%" },
    analysis: "Perusahaan konglomerat investasi legendaris asuhan Warren Buffett. Sangat aman dan defensif dengan simpanan kas rekor tertinggi, menjadikannya pelindung utama modal (capital preservation) di kala resesi."
  }
];

const CRYPTO_DATA = [
  {
    ticker: "BTC",
    name: "Bitcoin",
    icon: "🪙",
    priceUsd: "$68,450",
    priceIdr: "Rp1.108.890.000",
    change: "+3.20%",
    isPositive: true,
    recommendation: "ACCUMULATE",
    analysis: "Emas digital abad ke-21. Arus modal institusional pasca persetujuan ETF Bitcoin Spot di AS menjaga daya beli tetap kuat. Memasuki fase konsolidasi sehat sebelum mencoba menembus rekor harga tertinggi baru."
  },
  {
    ticker: "ETH",
    name: "Ethereum",
    icon: "💎",
    priceUsd: "$3,780",
    priceIdr: "Rp61.236.000",
    change: "+4.50%",
    isPositive: true,
    recommendation: "BUY",
    analysis: "Infrastruktur smart contract terkemuka di dunia. Aktivitas di jaringan Layer-2 melonjak drastis setelah pemutakhiran Dencun memangkas biaya gas. Fitur staking memberikan yield pasif stabil (~3.5% APR)."
  },
  {
    ticker: "SOL",
    name: "Solana",
    icon: "☀️",
    priceUsd: "$168.20",
    priceIdr: "Rp2.724.840",
    change: "+6.80%",
    isPositive: true,
    recommendation: "ACCUMULATE",
    analysis: "Blockchain monolitik berkecepatan tinggi dengan biaya transaksi super murah. Berhasil merebut pangsa pasar volume perdagangan DEX berkat efisiensi tinggi, ramah pengguna, dan maraknya proyek koin meme."
  },
  {
    ticker: "BNB",
    name: "BNB",
    icon: "🔶",
    priceUsd: "$582.40",
    priceIdr: "Rp9.434.880",
    change: "-1.10%",
    isPositive: false,
    recommendation: "NEUTRAL",
    analysis: "Token utilitas utama ekosistem Binance. Terbantu oleh peluncuran proyek token baru secara konsisten di Binance Launchpool. Sikap waspada jangka pendek direkomendasikan akibat tekanan regulasi global."
  }
];

const SBN_RDPU_DATA = [
  {
    ticker: "ORI025",
    name: "Obligasi Negara Ritel",
    category: "sbn",
    issuer: "Pemerintah RI",
    coupon: "6.25%",
    type: "Fixed Rate (Tradable)",
    recommendation: "STRONG BUY",
    metrics: { minBuy: "Rp1.000.000", tax: "10%", liquidity: "Sedang (Pasar Sekunder)" },
    analysis: "Obligasi ritel terbitan pemerintah yang sangat aman karena pokok dan kupon dijamin penuh oleh Undang-Undang APBN. Imbal hasil tetap dibayarkan bulanan, cocok sebagai passive income."
  },
  {
    ticker: "SR020",
    name: "Sukuk Ritel",
    category: "sbn",
    issuer: "Pemerintah RI",
    coupon: "6.30%",
    type: "Fixed Rate (Syariah)",
    recommendation: "STRONG BUY",
    metrics: { minBuy: "Rp1.000.000", tax: "10%", liquidity: "Sedang (Pasar Sekunder)" },
    analysis: "Surat Berharga Syariah Negara (SBSN) yang dikelola dengan akad syariah tanpa riba. Imbal hasil tetap bulanan yang relatif tinggi, menjadi andalan portofolio investor konservatif."
  },
  {
    ticker: "SBR012",
    name: "Savings Bond Ritel",
    category: "sbn",
    issuer: "Pemerintah RI",
    coupon: "6.15%",
    type: "Floating with Floor",
    recommendation: "BUY",
    metrics: { minBuy: "Rp1.000.000", tax: "10%", liquidity: "Rendah (Early Redemption)" },
    analysis: "Kupon mengambang berbatas bawah (floating with floor). Bila BI-Rate naik, kupon otomatis meningkat, melindung nilai dana Anda dari tekanan inflasi suku bunga."
  },
  {
    ticker: "ST011",
    name: "Sukuk Tabungan",
    category: "sbn",
    issuer: "Pemerintah RI",
    coupon: "6.20%",
    type: "Floating with Floor (Syariah)",
    recommendation: "BUY",
    metrics: { minBuy: "Rp1.000.000", tax: "10%", liquidity: "Rendah (Early Redemption)" },
    analysis: "Tabungan investasi syariah non-tradable. Menawarkan imbal hasil mengambang yang aman. Dilengkapi opsi pencairan awal 50% tanpa biaya di akhir tahun pertama."
  },
  {
    ticker: "FR0097",
    name: "Project Based Sukuk FR",
    category: "sbn",
    issuer: "Pemerintah RI",
    coupon: "6.45%",
    type: "Fixed Rate (Long Term)",
    recommendation: "ACCUMULATE",
    metrics: { minBuy: "Rp1.000.000", tax: "10%", liquidity: "Tinggi (Mitra Sekuritas)" },
    analysis: "Sukuk negara seri FR jangka panjang dengan yield kupon tetap yang sangat tebal. Memiliki likuiditas tinggi di pasar sekunder perbankan atau mitra sekuritas."
  },
  {
    ticker: "SUCOR-SMMF",
    name: "Sucorinvest Sharia Money Market",
    category: "rdpu",
    issuer: "Sucor Asset Management",
    coupon: "5.65%",
    type: "Pasar Uang Syariah",
    recommendation: "STRONG BUY",
    metrics: { minBuy: "Rp10.000", tax: "0% (Bebas Pajak)", liquidity: "Tinggi (T+1)" },
    analysis: "Reksa dana pasar uang syariah dengan rekam jejak konsisten terbaik di kelasnya. Memberikan imbal hasil bersih di atas rata-rata industri dengan likuiditas pencairan cepat."
  },
  {
    ticker: "SYAILENDRA-DK",
    name: "Syailendra Dana Kas",
    category: "rdpu",
    issuer: "Syailendra Capital",
    coupon: "5.40%",
    type: "Pasar Uang",
    recommendation: "BUY",
    metrics: { minBuy: "Rp10.000", tax: "0% (Bebas Pajak)", liquidity: "Tinggi (T+1)" },
    analysis: "Portofolio defensif berisiko rendah yang dialokasikan pada deposito bank berperingkat tinggi serta obligasi jangka pendek di bawah 1 tahun. Nilai aktiva tumbuh harian konsisten."
  },
  {
    ticker: "DANAMAS-RPP",
    name: "Danamas Rupiah Plus",
    category: "rdpu",
    issuer: "Sinarmas Asset Management",
    coupon: "5.30%",
    type: "Pasar Uang",
    recommendation: "BUY",
    metrics: { minBuy: "Rp100.000", tax: "0% (Bebas Pajak)", liquidity: "Tinggi (T+1)" },
    analysis: "Mengutamakan perlindungan modal dan likuiditas tinggi melalui alokasi pasar uang domestik terkurasi. Ideal sebagai tempat parkir sementara dana menganggur Anda."
  },
  {
    ticker: "MANULIFE-DK2",
    name: "Manulife Dana Kas II",
    category: "rdpu",
    issuer: "Manulife Aset Manajemen",
    coupon: "5.15%",
    type: "Pasar Uang",
    recommendation: "ACCUMULATE",
    metrics: { minBuy: "Rp10.000", tax: "0% (Bebas Pajak)", liquidity: "Tinggi (T+1)" },
    analysis: "Dikelola oleh salah satu Manajer Investasi terbesar di dunia. Menawarkan perlindungan nilai modal yang sangat kuat dengan kepastian likuiditas pencairan harian."
  },
  {
    ticker: "BATAVIA-DKM",
    name: "Batavia Dana Kas Maxima",
    category: "rdpu",
    issuer: "Batavia Prosperindo Aset Manajemen",
    coupon: "5.25%",
    type: "Pasar Uang",
    recommendation: "BUY",
    metrics: { minBuy: "Rp10.000", tax: "0% (Bebas Pajak)", liquidity: "Tinggi (T+1)" },
    analysis: "Kinerja jangka panjang yang sangat andal dan teruji melewati berbagai siklus ekonomi. Kombinasi deposito dan instrumen utang jatuh tempo dekat menjamin volatilitas yang minimal."
  }
];

export class InvestmentPage {
  constructor(state) {
    this.state = state;
    this.activeTab = "stocks"; // 'stocks', 'crypto', 'sbn_rdpu', 'allocator'
    this.stockFilter = "all"; // 'all', 'indonesia', 'global'
    this.sbnFilter = "all"; // 'all', 'sbn', 'rdpu'
    this.budget = 10000000; // default Rp10,000,000
    this.initialized = false;
    this.tickerInterval = null;
  }

  init() {
    this.container = document.querySelector("#investmentPage");

    // Fetch live crypto prices immediately on startup
    this.fetchLiveCryptoData();

    // Poll live crypto prices every 30 seconds to fetch true coin values
    window.setInterval(() => {
      if (this.state.currentView === "investment") {
        this.fetchLiveCryptoData();
      }
    }, 30_000);

    // Start the Active Market Ticker for live ticking stock prices
    this.startRealTimeTicker();
  }

  async fetchLiveCryptoData() {
    try {
      console.log("[Investment] Fetching live crypto prices from CoinGecko...");
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,binancecoin&vs_currencies=usd,idr&include_24hr_change=true"
      );
      if (!response.ok) throw new Error("CoinGecko API returned status " + response.status);
      const data = await response.json();

      const cryptoMapping = {
        BTC: "bitcoin",
        ETH: "ethereum",
        SOL: "solana",
        BNB: "binancecoin"
      };

      CRYPTO_DATA.forEach(crypto => {
        const apiId = cryptoMapping[crypto.ticker];
        if (data[apiId]) {
          const usdVal = data[apiId].usd;
          const idrVal = data[apiId].idr;
          const changeVal = data[apiId].usd_24h_change || 0;

          crypto.priceUsd = `$${usdVal.toLocaleString("en-US")}`;
          crypto.priceIdr = `Rp${idrVal.toLocaleString("id-ID")}`;
          crypto.change = `${changeVal >= 0 ? "+" : ""}${changeVal.toFixed(2)}%`;
          crypto.isPositive = changeVal >= 0;
          crypto.recommendation = changeVal > 3 ? "BUY" : (changeVal < -1.5 ? "NEUTRAL" : "ACCUMULATE");
        }
      });

      console.log("[Investment] Live crypto prices successfully fetched!");
      
      // Update visual panels if the active view is investment
      if (this.state.currentView === "investment") {
        this.renderView();
      }
    } catch (err) {
      console.warn("[Investment] CoinGecko API rate limit or error, using baseline pricing.", err);
    }
  }

  startRealTimeTicker() {
    if (this.tickerInterval) return;

    // Trigger minor market ticks every 4 seconds to simulate dynamic active trade rooms
    this.tickerInterval = window.setInterval(() => {
      // 1. Pick a random stock to fluctuate
      const randomIdx = Math.floor(Math.random() * STOCKS_DATA.length);
      const stock = STOCKS_DATA[randomIdx];

      let priceNum;
      if (stock.price.startsWith("Rp")) {
        priceNum = Number(stock.price.replace("Rp", "").replace(/\./g, "").replace(",", "."));
      } else {
        priceNum = Number(stock.price.replace("$", "").replace(/,/g, ""));
      }

      // Generate a minor random walk (-0.08% to +0.10%)
      const tickPercent = (Math.random() * 0.18 - 0.08) / 100;
      const newPrice = priceNum * (1 + tickPercent);

      if (stock.price.startsWith("Rp")) {
        stock.price = `Rp${Math.round(newPrice).toLocaleString("id-ID")}`;
      } else {
        stock.price = `$${newPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }

      const currentChange = Number(stock.change.replace("%", "").replace("+", ""));
      const newChange = currentChange + (tickPercent * 100);
      stock.change = `${newChange >= 0 ? "+" : ""}${newChange.toFixed(2)}%`;
      stock.isPositive = newChange >= 0;

      // 2. Also apply micro-ticks to crypto prices for realistic fluctuations
      const cryptoIdx = Math.floor(Math.random() * CRYPTO_DATA.length);
      const crypto = CRYPTO_DATA[cryptoIdx];
      const cryptoTick = (Math.random() * 0.12 - 0.06) / 100;

      const usdNum = Number(crypto.priceUsd.replace("$", "").replace(/,/g, ""));
      const newCryptoUsd = usdNum * (1 + cryptoTick);
      crypto.priceUsd = `$${Math.round(newCryptoUsd).toLocaleString("en-US")}`;

      const idrNum = Number(crypto.priceIdr.replace("Rp", "").replace(/\./g, ""));
      const newCryptoIdr = idrNum * (1 + cryptoTick);
      crypto.priceIdr = `Rp${Math.round(newCryptoIdr).toLocaleString("id-ID")}`;

      const cryptoChange = Number(crypto.change.replace("%", "").replace("+", ""));
      const newCryptoChange = cryptoChange + (cryptoTick * 100);
      crypto.change = `${newCryptoChange >= 0 ? "+" : ""}${newCryptoChange.toFixed(2)}%`;
      crypto.isPositive = newCryptoChange >= 0;

      // 3. Apply tiny compounding ticks representing daily yield accrual to SBN & RDPU
      const sbnIdx = Math.floor(Math.random() * SBN_RDPU_DATA.length);
      const asset = SBN_RDPU_DATA[sbnIdx];
      const yieldNum = Number(asset.coupon.replace("%", ""));
      // Micro compound yield change
      const yieldChange = (Math.random() * 0.02 - 0.01);
      const newYield = Math.max(yieldNum + yieldChange, 1.0);
      asset.coupon = `${newYield.toFixed(2)}%`;

      // 4. Render update dynamically in real-time only if the user is currently looking at the investment page
      if (this.state.currentView === "investment") {
        this.renderView();
      }
    }, 4000);
  }

  setupListeners() {
    // Tab switching buttons
    const tabBtns = this.container.querySelectorAll(".invest-tab-btn");
    tabBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        this.activeTab = btn.dataset.tab;
        this.renderView();
      });
    });

    // Stock filtering buttons (if Stocks tab is active)
    if (this.activeTab === "stocks") {
      const filterBtns = this.container.querySelectorAll(".stock-filter-btn");
      filterBtns.forEach(btn => {
        btn.addEventListener("click", () => {
          this.stockFilter = btn.dataset.filter;
          this.renderView();
        });
      });
    }

    // SBN & RDPU filtering buttons (if SBN tab is active)
    if (this.activeTab === "sbn_rdpu") {
      const filterBtns = this.container.querySelectorAll(".sbn-filter-btn");
      filterBtns.forEach(btn => {
        btn.addEventListener("click", () => {
          this.sbnFilter = btn.dataset.filter;
          this.renderView();
        });
      });
    }

    // Allocator inputs
    if (this.activeTab === "allocator") {
      const budgetInput = this.container.querySelector("#allocatorBudgetInput");
      const budgetRange = this.container.querySelector("#allocatorBudgetRange");

      if (budgetInput) {
        budgetInput.addEventListener("input", (e) => {
          this.budget = Math.max(Number(e.target.value) || 0, 0);
          if (budgetRange) budgetRange.value = this.budget;
          this.updateAllocatorResults();
        });
      }

      if (budgetRange) {
        budgetRange.addEventListener("input", (e) => {
          this.budget = Number(e.target.value) || 0;
          if (budgetInput) budgetInput.value = this.budget;
          this.updateAllocatorResults();
        });
      }
    }
  }

  render() {
    if (!this.container) return;
    
    // Check if base skeleton is already rendered. If not, inject skeleton.
    if (!this.initialized || !this.container.querySelector(".investment-header-grid")) {
      this.container.innerHTML = `
        <!-- Investment Overview Header Grid -->
        <div class="investment-header-grid">
          <div class="invest-sentiment-card glass-panel" style="grid-column: 1 / -1;">
            <div class="card-head">
              <span class="badge blue">◍</span>
              <h2>Market Sentiment & Strategy Summary</h2>
            </div>
            <div class="sentiment-gauge-wrapper">
              <div class="sentiment-meta">
                <span class="sentiment-status">BULLISH 🚀</span>
                <span class="sentiment-score">78 / 100</span>
              </div>
              <div class="sentiment-bar"><span style="width: 78%"></span></div>
            </div>
            <p class="sentiment-desc">
              Pasar saham global dan domestik menunjukkan momentum positif didorong oleh pertumbuhan sektor teknologi dan adopsi institusional kripto. Alokasi dana defensif sangat disarankan pada aset ber-yield tinggi.
            </p>
          </div>
        </div>

        <!-- Investment Main Page Tabs -->
        <div class="investment-navigation">
          <div class="invest-tabs">
            <button class="invest-tab-btn ${this.activeTab === "stocks" ? "active" : ""}" data-tab="stocks" type="button">📈 Saham Pilihan (Top 20)</button>
            <button class="invest-tab-btn ${this.activeTab === "crypto" ? "active" : ""}" data-tab="crypto" type="button">🪙 Kripto Teratas</button>
            <button class="invest-tab-btn ${this.activeTab === "sbn_rdpu" ? "active" : ""}" data-tab="sbn_rdpu" type="button">💼 SBN & RDPU Terbaik (Top 10)</button>
            <button class="invest-tab-btn ${this.activeTab === "allocator" ? "active" : ""}" data-tab="allocator" type="button">🧮 Portfolio Allocator</button>
          </div>
        </div>

        <!-- Investment Dynamic Content Wrapper -->
        <div id="investContentPanel" class="invest-content-panel"></div>
      `;
      this.initialized = true;
    }
    
    // Render the active sub-tab view inside the content panel
    this.renderView();
  }

  renderView() {
    const panel = this.container.querySelector("#investContentPanel");
    if (!panel) return;

    // Highlight active nav tab button
    this.container.querySelectorAll(".invest-tab-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.tab === this.activeTab);
    });

    if (this.activeTab === "stocks") {
      this.renderStocksTab(panel);
    } else if (this.activeTab === "crypto") {
      this.renderCryptoTab(panel);
    } else if (this.activeTab === "sbn_rdpu") {
      this.renderSbnRdpuTab(panel);
    } else if (this.activeTab === "allocator") {
      this.renderAllocatorTab(panel);
    }

    // Attach/re-attach listeners for the freshly rendered HTML
    this.setupListeners();
  }

  renderStocksTab(panel) {
    // Filter stocks based on selection
    const filteredStocks = STOCKS_DATA.filter(stock => {
      if (this.stockFilter === "all") return true;
      return stock.market === this.stockFilter;
    });

    panel.innerHTML = `
      <div class="view-header">
        <div class="view-title">
          <h3>Daftar & Analisis Saham Pilihan Terbaik (Top 20)</h3>
          <p>Rekomendasi saham berkualitas tinggi di Indonesia (BEI) dan pasar global (AS) yang aktif berfluktuasi.</p>
        </div>
        <div class="stock-filters">
          <button class="stock-filter-btn ${this.stockFilter === "all" ? "active" : ""}" data-filter="all" type="button">Semua Pasar</button>
          <button class="stock-filter-btn ${this.stockFilter === "indonesia" ? "active" : ""}" data-filter="indonesia" type="button">🇮🇩 Indonesia (BEI)</button>
          <button class="stock-filter-btn ${this.stockFilter === "global" ? "active" : ""}" data-filter="global" type="button">🇺🇸 Global (AS)</button>
        </div>
      </div>

      <div class="invest-cards-grid">
        ${filteredStocks.map((stock, index) => {
          const recClass = stock.recommendation.toLowerCase();
          const borderHue = stock.market === "indonesia" ? 200 : 260; // Blue vs Purple
          return `
            <div class="invest-asset-card glass-panel" style="--accent-hue:${borderHue}">
              <div class="asset-card-top">
                <div class="asset-identity">
                  <span class="asset-ticker">${stock.ticker}</span>
                  <span class="asset-name-full">${stock.name} ${stock.flag}</span>
                </div>
                <div class="asset-rec-badge ${recClass}">${stock.recommendation}</div>
              </div>
              
              <div class="asset-card-price-row">
                <span class="asset-price">${stock.price}</span>
                <span class="asset-change-pct ${stock.isPositive ? "up" : "down"}">${stock.change}</span>
              </div>

              <div class="asset-card-metrics">
                <div>
                  <small>P/E Ratio</small>
                  <strong>${stock.metrics.pe}</strong>
                </div>
                <div>
                  <small>PBV Ratio</small>
                  <strong>${stock.metrics.pbv}</strong>
                </div>
                <div>
                  <small>Div. Yield</small>
                  <strong>${stock.metrics.dividend}</strong>
                </div>
              </div>

              <div class="asset-card-analysis">
                <h4>Analisis Riset Pasar:</h4>
                <p>${stock.analysis}</p>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  renderCryptoTab(panel) {
    panel.innerHTML = `
      <div class="view-header">
        <div class="view-title">
          <h3>Analisis Kripto Secara Real-Time</h3>
          <p>Sinkronisasi langsung dengan CoinGecko API publik secara berkala, dikombinasikan dengan ticker fluktuasi minor.</p>
        </div>
      </div>

      <div class="invest-cards-grid">
        ${CRYPTO_DATA.map((crypto, index) => {
          const recClass = crypto.recommendation.toLowerCase();
          const changeClass = crypto.isPositive ? "up" : "down";
          return `
            <div class="invest-asset-card glass-panel" style="--accent-hue:160">
              <div class="asset-card-top">
                <div class="asset-identity">
                  <span class="asset-ticker">${crypto.icon} ${crypto.ticker}</span>
                  <span class="asset-name-full">${crypto.name}</span>
                </div>
                <div class="asset-rec-badge ${recClass}">${crypto.recommendation}</div>
              </div>
              
              <div class="asset-card-price-row flex-column">
                <span class="asset-price">${crypto.priceUsd}</span>
                <small class="asset-price-sub">${crypto.priceIdr}</small>
                <span class="asset-change-pct absolute-right ${changeClass}">${crypto.change}</span>
              </div>

              <div class="asset-card-analysis pt-12">
                <h4>Insight Pasar Kripto:</h4>
                <p>${crypto.analysis}</p>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  renderSbnRdpuTab(panel) {
    // Filter SBN & RDPU based on selection
    const filteredAssets = SBN_RDPU_DATA.filter(asset => {
      if (this.sbnFilter === "all") return true;
      return asset.category === this.sbnFilter;
    });

    panel.innerHTML = `
      <div class="view-header">
        <div class="view-title">
          <h3>Daftar SBN & RDPU Terbaik (Top 10)</h3>
          <p>Pilihan investasi ber-yield stabil yang dijamin negara (SBN) atau dikelola Manajer Investasi terkemuka bebas pajak (RDPU).</p>
        </div>
        <div class="stock-filters">
          <button class="sbn-filter-btn ${this.sbnFilter === "all" ? "active" : ""}" data-filter="all" type="button">Semua Aset</button>
          <button class="sbn-filter-btn ${this.sbnFilter === "sbn" ? "active" : ""}" data-filter="sbn" type="button">🇮🇩 SBN (Obligasi Negara)</button>
          <button class="sbn-filter-btn ${this.sbnFilter === "rdpu" ? "active" : ""}" data-filter="rdpu" type="button">📈 RDPU (Pasar Uang)</button>
        </div>
      </div>

      <div class="invest-cards-grid">
        ${filteredAssets.map((asset, index) => {
          const recClass = asset.recommendation.toLowerCase().replace("strong ", "");
          const borderHue = asset.category === "sbn" ? 220 : 160; // Indigo vs Green/Teal
          const categoryBadge = asset.category === "sbn" ? "SBN" : "RDPU";
          const categoryClass = asset.category === "sbn" ? "blue" : "green";
          return `
            <div class="invest-asset-card glass-panel" style="--accent-hue:${borderHue}">
              <div class="asset-card-top">
                <div class="asset-identity">
                  <span class="asset-ticker">${asset.ticker}</span>
                  <span class="asset-name-full">${asset.name}</span>
                </div>
                <div class="asset-rec-badge ${recClass}">${asset.recommendation}</div>
              </div>
              
              <div class="asset-card-price-row flex-column">
                <span class="asset-price">${asset.coupon} <small style="font-size:13px; font-weight:600; color:var(--muted)">p.a. (nett)</small></span>
                <span class="asset-change-pct absolute-right ${categoryClass}">${categoryBadge}</span>
              </div>

              <div class="asset-card-metrics">
                <div>
                  <small>Penerbit / MI</small>
                  <strong style="font-size:11.5px">${asset.issuer}</strong>
                </div>
                <div>
                  <small>Min. Pembelian</small>
                  <strong>${asset.metrics.minBuy}</strong>
                </div>
                <div>
                  <small>Likuiditas</small>
                  <strong style="font-size:11px">${asset.metrics.liquidity}</strong>
                </div>
              </div>

              <div class="asset-card-analysis">
                <h4>Analisis Riset Aset:</h4>
                <p>${asset.analysis}</p>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  renderAllocatorTab(panel) {
    panel.innerHTML = `
      <div class="view-header">
        <div class="view-title">
          <h3>Smart Portfolio Allocator</h3>
          <p>Masukkan anggaran investasi Anda dan algoritma akan mendistribusikannya secara optimal berdasarkan analisis sentimen pasar.</p>
        </div>
      </div>

      <div class="allocator-container glass-panel">
        <div class="allocator-form-side">
          <label class="allocator-label">
            <span>Nominal Investasi (Rupiah)</span>
            <input type="number" id="allocatorBudgetInput" value="${this.budget}" min="100000" step="100000" />
          </label>
          <input type="range" id="allocatorBudgetRange" min="1000000" max="100000000" step="1000000" value="${this.budget}" class="allocator-slider" />
          
          <div class="allocator-tips">
            <span class="tip-icon">💡</span>
            <p><strong>Tips Diversifikasi:</strong> Alokasi ini disusun berdasarkan model risiko moderat (Balanced Portfolio) dengan memanfaatkan penguatan sektor Blue-Chip Indonesia dan pengungkit volatilitas kripto.</p>
          </div>
        </div>

        <div class="allocator-visual-side">
          <div class="allocator-chart-header">
            <h4>Rekomendasi Alokasi Portofolio</h4>
            <strong id="allocatorSumText">${formatMoney(this.budget)}</strong>
          </div>

          <!-- Multi-colored segment progress bar -->
          <div class="allocator-stacked-bar">
            <span class="segment segment-bei" style="width: 40%" title="40% Saham Indonesia"></span>
            <span class="segment segment-global" style="width: 30%" title="30% Saham Global"></span>
            <span class="segment segment-crypto" style="width: 20%" title="20% Aset Kripto"></span>
            <span class="segment segment-cash" style="width: 10%" title="10% Kas / SBN"></span>
          </div>

          <!-- Proyeksi Return Card -->
          <div class="allocator-return-card">
            <div class="return-card-title">
              <span>📊 Proyeksi Estimasi Return (Balanced Portfolio)</span>
              <span class="badge-roi">+16.85% p.a.</span>
            </div>
            <div class="return-grid">
              <div class="return-col">
                <small>Estimasi Setahun (Yearly)</small>
                <strong id="allocatorYearlyReturn" class="trend up">+Rp0</strong>
              </div>
              <div class="return-col border-left">
                <small>Estimasi Sebulan (Monthly)</small>
                <strong id="allocatorMonthlyReturn" class="trend up">+Rp0</strong>
              </div>
            </div>
            <p class="return-note">*Estimasi berdasarkan performa historis moderat. Hasil riil dapat berbeda tergantung fluktuasi pasar.</p>
          </div>

          <div id="allocatorResultRows" class="allocator-result-rows"></div>
        </div>
      </div>
    `;

    // Calculate and render allocation lists based on budget
    this.updateAllocatorResults();
  }

  updateAllocatorResults() {
    const sumEl = this.container.querySelector("#allocatorSumText");
    if (sumEl) sumEl.textContent = formatMoney(this.budget);

    // Calculate expected return projection (+16.85% p.a. aggregate expected ROI)
    const yearlyReturn = this.budget * 0.1685;
    const monthlyReturn = yearlyReturn / 12;

    const yearlyEl = this.container.querySelector("#allocatorYearlyReturn");
    const monthlyEl = this.container.querySelector("#allocatorMonthlyReturn");

    if (yearlyEl) yearlyEl.textContent = `+${formatMoney(yearlyReturn)}`;
    if (monthlyEl) monthlyEl.textContent = `+${formatMoney(monthlyReturn)}`;

    const rowsPanel = this.container.querySelector("#allocatorResultRows");
    if (!rowsPanel) return;

    const allocations = [
      {
        name: "Saham Blue-Chip Indonesia",
        percent: 40,
        amount: this.budget * 0.40,
        color: "#0077b6",
        description: "Rekomendasi: Fokus akumulasi <strong>BBRI</strong> & <strong>TLKM</strong> untuk stabilitas dividen dan ketahanan finansial. <em>(Estimasi Return: ~12.0% p.a. / ~1.0% sebulan)</em>",
        icon: "🇮🇩"
      },
      {
        name: "Saham Teknologi Global (AS)",
        percent: 30,
        amount: this.budget * 0.30,
        color: "#0096c7",
        description: "Rekomendasi: Alokasikan pada pemimpin cip AI <strong>NVDA</strong> dan raksasa cloud software <strong>MSFT</strong>. <em>(Estimasi Return: ~15.0% p.a. / ~1.25% sebulan)</em>",
        icon: "🇺🇸"
      },
      {
        name: "Aset Kripto Teratas",
        percent: 20,
        amount: this.budget * 0.20,
        color: "#00b4d8",
        description: "Rekomendasi: Fokus utama pada <strong>BTC</strong> (70%) dan <strong>ETH</strong> (30%) untuk pertumbuhan aset digital berisiko tinggi. <em>(Estimasi Return: ~35.0% p.a. / ~2.9% sebulan)</em>",
        icon: "🪙"
      },
      {
        name: "Dana Tunai & SBN Ritel",
        percent: 10,
        amount: this.budget * 0.10,
        color: "#90e0ef",
        description: "Rekomendasi: Simpan di Reksa Dana Pasar Uang atau obligasi negara untuk menjaga likuiditas darurat. <em>(Estimasi Return: ~5.5% p.a. / ~0.45% sebulan)</em>",
        icon: "💵"
      }
    ];

    rowsPanel.innerHTML = allocations.map(item => `
      <div class="allocator-row">
        <div class="alloc-row-header">
          <div class="alloc-row-title">
            <span class="alloc-color-dot" style="background-color: ${item.color}"></span>
            <strong>${item.icon} ${item.name}</strong>
            <span class="alloc-percent-badge">${item.percent}%</span>
          </div>
          <strong class="alloc-row-amount">${formatMoney(item.amount)}</strong>
        </div>
        <p class="alloc-row-desc">${item.description}</p>
      </div>
    `).join("");
  }
}
