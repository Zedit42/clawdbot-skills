# 🚀 Solana Funding Rate Arbitrage Scanner

## Boşta Duran Coinlerini Değerlendir!

Bu araç, Solana üzerindeki perpetual DEX'lerdeki funding rate farklarını tarayarak **delta-neutral arbitraj fırsatları** bulur.

## 💡 Nasıl Çalışır?

Perpetual futures'larda "funding rate" mekanizması var:
- **Pozitif rate**: Long'lar Short'lara ödeme yapar
- **Negatif rate**: Short'lar Long'lara ödeme yapar

Farklı DEX'lerde aynı coin için farklı funding rate'ler olabiliyor. Bu farkı kullanarak:

```
DEX A: SOL Funding = -500% APY (Long'lar kazanır)
DEX B: SOL Funding = +800% APY (Short'lar kazanır)

Strateji:
→ DEX A'da Long aç (funding al)
→ DEX B'de Short aç (funding al)
→ Fiyat riski yok (hedge'li)
→ Her iki taraftan da funding kazan!
```

## 📊 Desteklenen DEX'ler

| DEX | Market Sayısı | Özellik |
|-----|---------------|---------|
| Drift Protocol | 64 | En büyük Solana perp DEX |
| Flash Trade | 19 | Düşük fee'ler |
| GMTrade | 37 | GMX-Solana |
| Zeta Markets | 24 | Options + Perps |

## 🛠️ Kurulum

### 1. Gereksinimler
- Node.js 18 veya üzeri
- npm veya pnpm

### 2. Kurulum
```bash
cd scripts
npm install
```

### 3. Yapılandırma (Opsiyonel)

`.env` dosyası oluştur:
```bash
cp .env.example .env
```

**Önerilen:** Helius RPC key al (ücretsiz):
1. https://helius.xyz adresine git
2. Ücretsiz hesap oluştur
3. API key'i al
4. `.env` dosyasına ekle:
```env
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=SENIN_KEY
```

## 🚀 Kullanım

### CLI Tarayıcı
```bash
npm run scan
```

Çıktı:
```
═══════════════════════════════════════════════════════════════
⚡ SOLANA DEX FUNDING RATE COMPARISON
═══════════════════════════════════════════════════════════════

Symbol  | Drift APY    | Flash APY    | Spread   | Arbitrage
────────────────────────────────────────────────────────────────
SOL     | 🟢 -3037%   | 🔴 +3626%   | 6663%   | Long Drift, Short Flash
BTC     | 🟢 -617%    | 🔴 +2330%   | 2947%   | Long Drift, Short Flash
```

### Web Dashboard
```bash
npm run start
```
Tarayıcıda: http://localhost:3456

## 📈 Strateji Uygulama

### Adım 1: Fırsat Bul
Dashboard'da veya CLI'da yüksek spread'li coinleri bul.

### Adım 2: Hedge Pozisyon Aç
Örnek: SOL için spread %1300

| DEX | Pozisyon | Miktar | Funding |
|-----|----------|--------|---------|
| Drift | Long | 10 SOL | Alıyorsun |
| Flash | Short | 10 SOL | Alıyorsun |

### Adım 3: Funding Topla
Her 8 saatte bir (veya DEX'e göre değişir) funding ödemesi alırsın.

### Adım 4: Kapat
Spread daralınca veya tersine dönünce pozisyonları kapat.

## ⚠️ Riskler

1. **Spread Değişimi**: Rate'ler hızla değişebilir
2. **Execution Risk**: Slippage olabilir
3. **Likidite**: Büyük pozisyonlarda sorun olabilir
4. **Likidasyon**: Leverage kullanıyorsan dikkat!
5. **Platform Riski**: Smart contract riski

## 💰 Tahmini Getiri

- Yüksek spread'lerde (>%500 APY fark) günlük %1-2
- Orta spread'lerde (>%100 APY fark) günlük %0.1-0.5
- Fee'ler ve slippage düşülmeli

## 🔐 Güvenlik

- **Private key'ini asla paylaşma!**
- `.env` dosyasını `.gitignore`'a ekle
- Küçük miktarlarla başla
- DYOR (Do Your Own Research)

## 🤝 Destek

- Discord: [Clawdbot Community](https://discord.com/invite/clawd)
- GitHub: Issues açabilirsin

---

*Bu araç sadece bilgilendirme amaçlıdır. Yatırım tavsiyesi değildir. Kendi araştırmanı yap ve sadece kaybetmeyi göze aldığın miktarla işlem yap.*
