# Süper Lig Bahis Analiz Skill

Türkiye Süper Lig maçları için kapsamlı analiz ve kupon önerisi sistemi.

## Kullanım

Kullanıcı bir maç söyler (örn: "Galatasaray - Fenerbahçe", "GS FB", "derbi"):
1. Tüm veri kaynaklarını tara
2. Analiz raporunu hazırla
3. Yüzdelik olasılıklarla kupon öner

## Analiz Adımları

### 1. Maç Bilgisi
```
web_search: "[Takım1] vs [Takım2] Süper Lig 2025-26 tarih saat"
```
- Maç tarihi ve saati
- Hangi hafta
- Stadyum (ev sahibi avantajı için)

### 2. Takım Formu (Son 5 Maç)
```
web_search: "[Takım] son 5 maç Süper Lig form"
web_fetch: flashscore.com.tr veya mackolik.com
```
Her takım için:
- Son 5 lig maçı sonuçları (G-B-M)
- Attığı/Yediği gol ortalaması
- Ev/Deplasman performansı
- Gol atılan dakikalar (erken gol eğilimi, geç gol eğilimi)

### 3. Head-to-Head (Son 10 Maç)
```
web_search: "[Takım1] [Takım2] head to head son maçlar"
```
- Son 10 karşılaşma sonuçları
- Ev sahibi/deplasman dağılımı
- Gol ortalaması bu eşleşmede
- Öne çıkan pattern'ler

### 4. Kadro Durumu
```
web_search: "[Takım] kadro sakatlık cezalı Süper Lig"
web_search: "[Takım] muhtemel 11"
```
- Sakat oyuncular
- Cezalı oyuncular (sarı/kırmızı kart birikimi)
- Milli takım yorgunluğu
- Muhtemel 11'ler

### 5. Hakem Analizi
```
web_search: "[Hakem adı] Süper Lig istatistik kart penaltı"
```
- Maçın hakemi kim?
- Ortalama sarı kart / maç
- Ortalama kırmızı kart / maç
- Penaltı verme eğilimi
- Ev sahibi lehine karar oranı
- Bu takımları daha önce yönetti mi?

### 6. Son Haberler
```
web_search: "[Takım1] [Takım2] maç öncesi haber"
web_search: "[Takım] transfer sakatlık son dakika"
```
- Teknik direktör açıklamaları
- Soyunma odası haberleri
- Motivasyon faktörleri (kupa, şampiyonluk, küme düşme)
- Taraftar/tribün durumu

### 7. İstatistiksel Metrikler
```
web_fetch: sofascore.com veya fbref.com
```
- xG (Expected Goals)
- xGA (Expected Goals Against)
- Topa sahip olma oranları
- Şut/İsabetli şut ortalaması
- Korner ortalaması
- Faul ortalaması

## Veri Kaynakları

| Kaynak | URL | Veri Tipi |
|--------|-----|-----------|
| Mackolik | mackolik.com | TR odaklı, canlı skor, iddaa |
| Flashscore | flashscore.com.tr | Detaylı istatistik |
| SofaScore | sofascore.com | xG, heatmap, ratings |
| Transfermarkt | transfermarkt.com.tr | Kadro, piyasa değeri |
| TFF | tff.org | Resmi kadro, cezalar |
| Google News | news.google.com | Son haberler |

## Çıktı Formatı

```markdown
# 🏟️ [Takım1] vs [Takım2] Analizi
📅 Tarih | ⏰ Saat | 🏟️ Stadyum | 🧑‍⚖️ Hakem

## 📊 Form Durumu
| Takım | Son 5 | Gol Ort. | Ev/Dep |
|-------|-------|----------|--------|
| [T1]  | GGBMG | 1.8      | 2.1/1.2|
| [T2]  | MBGGB | 1.4      | 1.6/1.0|

## 🤝 Head-to-Head (Son 5)
- T1: X galibiyet
- T2: Y galibiyet  
- Beraberlik: Z
- Ort. gol: A.B

## 🏥 Kadro Durumu
**[T1] Eksikler:** Oyuncu1 (sakatl), Oyuncu2 (ceza)
**[T2] Eksikler:** Oyuncu3 (sakatl)

## 🧑‍⚖️ Hakem: [İsim]
- Ort. sarı: X.X / maç
- Ort. kırmızı: X.X / maç
- Penaltı: X son Y maçta

## 📰 Son Gelişmeler
- [Önemli haber 1]
- [Önemli haber 2]

## 🎯 Kupon Önerisi

| Bahis Tipi | Seçim | Olasılık | Güven |
|------------|-------|----------|-------|
| Maç Sonucu | T1 | %55 | ⭐⭐⭐ |
| KG Var | Evet | %62 | ⭐⭐⭐⭐ |
| Üst 2.5 | Evet | %58 | ⭐⭐⭐ |
| İlk Y. Gol | Var | %70 | ⭐⭐⭐⭐ |

### 💰 Önerilen Kupon
1. **Tekli (Güvenli):** [En yüksek güvenli seçim]
2. **İkili:** [Seçim1] + [Seçim2]
3. **Riskli:** [Yüksek oranlı kombinasyon]

### ⚠️ Risk Faktörleri
- [Dikkat edilmesi gereken faktör 1]
- [Dikkat edilmesi gereken faktör 2]
```

## Olasılık Hesaplama

Basit ağırlıklı model:
- Form (%30): Son 5 maç performansı
- H2H (%20): Geçmiş karşılaşmalar
- Kadro (%20): Eksikler ve güç dengesi
- Ev avantajı (%15): Ev sahibi bonusu (+%8-12)
- Motivasyon (%15): Puan durumu, kupa, derbi

Güven seviyeleri:
- ⭐⭐⭐⭐⭐ = %75+ (Çok güvenli)
- ⭐⭐⭐⭐ = %65-74 (Güvenli)
- ⭐⭐⭐ = %55-64 (Makul)
- ⭐⭐ = %45-54 (Riskli)
- ⭐ = <%45 (Çok riskli)

## Takım Kısaltmaları

| Kısaltma | Takım |
|----------|-------|
| GS | Galatasaray |
| FB | Fenerbahçe |
| BJK | Beşiktaş |
| TS | Trabzonspor |
| SİV | Sivasspor |
| ANT | Antalyaspor |
| KON | Konyaspor |
| KAY | Kayserispor |
| GZT | Gaziantep FK |
| ALN | Alanyaspor |
| RİZ | Çaykur Rizespor |
| KAS | Kasımpaşa |
| HTS | Hatayspor |
| ADN | Adana Demirspor |
| İBB | İstanbul Başakşehir |
| ANK | MKE Ankaragücü |
| SAM | Samsunspor |
| BOD | Bodrumspor |
| EYP | Eyüpspor |
| GÖZ | Göztepe |

## Notlar

- Her zaman güncel veri kullan (maç günü haberleri önemli)
- Hakem ataması genelde maçtan 2-3 gün önce açıklanır
- Derbi ve kritik maçlarda motivasyon faktörü daha ağır
- Canlı bahis için son dakika kadro değişikliklerini kontrol et
