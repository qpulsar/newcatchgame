# Project Tasks

## 1. Repo and Project Kurulumu
- [x] Monorepo yapısı oluştur (apps/web-game, apps/api, packages/shared-types)
- [x] Frontend kurulumu (Vite + TS + Phaser)
- [x] Backend kurulumu (FastAPI + SQLAlchemy + Alembic)

## 2. Oyun Çekirdeği
- [x] Phaser sahne mimarisi (Boot, Preload, MainMenu, Game, Result, Editor)
- [x] Oyun nesneleri (PlayerPad, FallingObject, TargetBox)
- [x] Fizik sistemi (Arcade Physics)
- [x] İlk oyun modu (Fiziksel Büyüklükleri Sınıflandırma)

## 3. Level Veri Yapısı
- [x] JSON tabanlı level formatı
- [x] Level loader sistemi

## 4. Oyun Editörü
- [x] Editör MVP (Temel ayarlar, Hedef/Nesne ekleme, Backend entegrasyonu)
- [x] Editör ekranları
- [x] Doğrulama kuralları
- [x] Test Etme Özelliği

## 5. Backend Veri Modeli
- [x] Kullanıcı modelleri (Student, Teacher, Admin)
- [x] Oyun ve Level modelleri
    - [x] Level tablosu (JSON data alanı ile)
    - [x] GameAttempt tablosu
    - [x] Badge (Rozet) tablosu
- [x] Oyun denemesi ve Rozet modelleri

## 6. API Task List
- [x] Auth API
- [x] Game & Level API
    - [x] Level CRUD endpoints
    - [x] Level listeleme (Public/Private)
- [x] Attempt & Leaderboard API
    - [x] Skor kaydetme
    - [x] Liderlik tablosu

## 7. Oyunlaştırma
- [x] Puan sistemi
- [x] Rozet sistemi
- [x] Lider tablosu

## 8. Öğretmen Paneli
- [x] Oyun inceleme ve onay sistemi
- [x] Sınıf ve öğrenci takibi

## 9. Frontend Sayfaları
- [x] Login/Register
- [x] Dashboard
- [x] Game Play / Editor sayfaları
- [x] Teacher/Admin panelleri

## 10. Kod Analizi Sonrası Eksiklerin Giderilmesi
- [x] Mevcut `task.md` dosyasındaki karakter kodlama sorunlarını düzelt ve tüm Türkçe metinleri UTF-8 olarak standardize et.
- [x] Mevcut editörün yalnızca tek seviye verisi oluşturduğunu doğrula; oyun tasarımını birden fazla seviyeyi kapsayan `GameProject` veya benzeri üst veri yapısına taşı.
- [x] `LevelData` tipini genişlet; seviye kimliği, sıra numarası, konu başlığı, kazanım açıklaması, doğru kavramlar, yanlış kavramlar, görsel/işitsel ayarlar, zorluk ayarları ve değerlendirme kurallarını açık alanlar olarak tanımla.
- [x] Backend tarafında `data: dict` yerine Pydantic ile doğrulanabilir editör şemaları oluştur; hatalı level verisinin kaydedilmesini engelle.
- [x] Frontend, Phaser ve API arasında ortak kullanılacak seviye JSON sözleşmesini dokümante et.
- [x] Varsayılan örnek oyun olarak "Fiziksel Büyüklükler" şablonunu ekle.
- [x] Mevcut `Game.ts` içinde oyun kurallarının Phaser sahnesine gömülü olmasını azalt; seviye akışı, puanlama, doğru/yanlış kontrolü ve spawn mantığını test edilebilir ayrı modüllere taşı.
- [x] Asset yükleme sistemini sabit anahtarlarla çalışan bir manifest yapısına dönüştür; arka plan, düşen nesne görseli, müzik ve efekt dosyaları dosya adından bağımsız olarak seçilebilsin.
- [x] Oyun test modu ile yayınlanmış oyun oynama modunu ayır; editör testinde skor kaydı, rozet ve leaderboard tetiklenmesin.
- [x] Öğretmen, öğrenci ve admin rollerine göre editör erişimlerini netleştir; kimlerin oyun oluşturacağı, düzenleyeceği, kopyalayacağı ve yayınlayacağı ayrı izinlerle tanımlansın.

## 11. Çok Seviyeli Oyun Tasarım Modeli
- [x] Bir oyun projesi şu üst alanları içersin: oyun adı, açıklama, ders, sınıf düzeyi, konu, kapak görseli, dil, görünürlük, yayın durumu, oluşturucu, güncelleme tarihi.
- [x] Oyun projesi birden çok seviyeden oluşsun; tasarımcı seviyeleri ekleyebilsin, silebilsin, çoğaltabilsin, yeniden sıralayabilsin ve pasifleştirebilsin.
- [x] Her seviyede şu alanlar bulunsun: seviye adı, kısa yönerge, öğrenme hedefi, doğru kategori, yanlış kategori, doğru kavram listesi, yanlış kavram listesi, süre, hedef puan, minimum başarı yüzdesi.
- [x] Seviye geçiş kuralları tanımlansın; örneğin hedef puana ulaşınca sonraki seviyeye geç, süre bitince sonucu göster, belirli sayıda hata yapılınca yeniden dene.
- [x] Oyun genelinde toplam ilerleme gösterimi olsun; örneğin "Seviye 2/4", toplam skor, kalan süre ve başarı durumu.
- [x] Her seviyenin kendi arka planı, müziği, düşen nesne stili, hız ayarı ve efektleri olabilsin.
- [x] Seviyeler arası ortak ayarları toplu uygulama seçeneği eklensin; tasarımcı isterse tüm seviyelerde aynı arka planı veya aynı oyuncu hızını kullanabilsin.
- [x] Fiziksel Büyüklükler örnek şablonu 4 seviyeli olarak hazır gelsin:
  - [x] 1. seviye: Temel büyüklükler; doğru kavramlar: uzunluk, kütle, zaman, elektrik akımı, sıcaklık, madde miktarı, ışık şiddeti.
  - [x] 2. seviye: Türetilmiş büyüklükler; doğru kavramlar: hız, ivme, kuvvet, enerji, basınç, yoğunluk, güç.
  - [x] 3. seviye: Skaler büyüklükler; doğru kavramlar: sürat, sıcaklık, enerji, kütle, zaman, hacim, yoğunluk.
  - [x] 4. seviye: Vektörel büyüklükler; doğru kavramlar: hız, yer değiştirme, kuvvet, ivme, momentum, ağırlık.
- [x] Her örnek seviyede yanlış kavram havuzu ayrıca girilebilsin; örneğin temel büyüklükler seviyesinde türetilmiş, skaler veya vektörel kavramlar dikkat dağıtıcı olarak kullanılabilsin.

## 12. Editör Deneyimi ve Ekran Yapısı
- [x] Editörü üç ana bölgeye ayır: sol ayar paneli, orta canlı oyun önizlemesi, sağ seviye/kavram yönetimi veya varlık kütüphanesi.
- [x] Sol panelde sekmeler kullan: Genel, Seviyeler, Kavramlar, Görsel Tasarım, Ses, Oynanış, Puanlama, Yayınlama.
- [x] Orta önizleme alanı gerçek Phaser oyununa yakın çalışsın; yapılan değişiklikler kaydetmeden önizlemede görülebilsin.
- [x] Sağ panelde seviye listesi ve seçilen seviyenin kavram listeleri gösterilsin.
- [x] Tasarımcı bir seviyeyi seçtiğinde yalnızca o seviyeye ait kavramlar, görseller, efektler ve hız ayarları düzenlensin.
- [x] Tüm ayar kontrollerinde anlaşılır etiket, birim ve aralık bilgisi göster; örneğin "Düşme hızı: 250 px/sn", "Nesne üretme aralığı: 1200 ms".
- [x] Sayısal ayarlar için slider ve sayı inputu birlikte kullan; hassas değer girme ve hızlı ayarlama birlikte mümkün olsun.
- [x] Renk ayarları için renk seçici, hazır paletler ve kontrast uyarısı ekle.
- [x] Uzun kavram listelerinde arama, filtreleme, toplu seçim ve sürükle-bırak sıralama olsun.
- [x] Editör mobilde en azından görüntüleme ve küçük düzeltme yapabilecek şekilde uyumlu olsun; asıl üretim deneyimi tablet/masaüstü için optimize edilsin.
- [x] Kaydetme sırasında otomatik taslak oluştur; tarayıcı kapanırsa son düzenleme geri getirilebilsin.
- [x] Geri al/ileri al geçmişi ekle; kavram silme, seviye silme, ayar değiştirme gibi kritik işlemler geri alınabilsin.
- [x] Tasarımcıya boş durum ekranları göster; hiç seviye, hiç kavram veya hiç asset yokken ne yapılacağı net olsun.
- [x] Her sekmede küçük bir "hızlı kontrol" alanı göster; eksik alanlar, hatalı kavramlar ve yayın engelleri anında görünsün.

## 13. Genel Oyun Ayarları
- [ ] Oyun adı, açıklama, ders, konu, sınıf düzeyi ve etiketler düzenlenebilsin.
- [ ] Kapak görseli veya küçük resim yükleme/seçme özelliği ekle.
- [ ] Oyun dili ve metin yönü için temel hazırlık yap; ileride çok dilli içerik desteklenebilsin.
- [ ] Oyun modu seçimi ekle; ilk mod "yakala ve sınıflandır" olsun.
- [ ] Oyun alanı boyutu ve oranı seçilebilsin; örneğin 4:3, 16:9 veya sabit 1024x768.
- [ ] Oyuncu karakteri veya sepet/pad görseli seçilebilsin.
- [ ] Oyun başlangıç ekranı metni, seviye başlangıç yönergesi ve oyun sonu mesajı düzenlenebilsin.
- [ ] Tasarımcı oyunu özel, sınıf içi, okul içi veya herkese açık olarak ayarlayabilsin.

## 14. Seviye Editörü Özellikleri
- [ ] Seviye ekleme, silme, çoğaltma, yeniden adlandırma ve sıralama özelliklerini ekle.
- [ ] Her seviye için doğru hedef/kategori adı tanımlansın; örneğin "Temel Büyüklükler".
- [ ] Her seviye için yanlış veya dikkat dağıtıcı kavram havuzu tanımlansın.
- [ ] Seviyeye özel yönerge yazılabilsin; örneğin "Yalnızca temel büyüklükleri yakala".
- [ ] Seviye süresi, hedef puan, geçme puanı, maksimum hata sayısı ve tekrar hakkı ayarlanabilsin.
- [ ] Seviye zorluğu kolay/orta/zor hazır ayarıyla seçilebilsin; seçime göre hız, spawn aralığı ve eş zamanlı nesne sayısı otomatik önerilsin.
- [ ] Hazır ayar değiştirildiğinde tasarımcı isterse değerleri elle düzenleyebilsin.
- [ ] Seviyeye özel arka plan, müzik, doğru efekt, yanlış efekt ve düşen nesne tasarımı seçilebilsin.
- [ ] Seviye içi hedef alanı veya sepet davranışı ayarlanabilsin; tek sepet, doğru/yanlış kutuları veya birden fazla kategori kutusu seçenekleri değerlendirilsin.
- [ ] Seviye önizleme butonu yalnızca seçili seviyeyi başlatabilsin.
- [ ] Tüm oyunu test et butonu seviyeleri sırayla oynatsın.

## 15. Kavram ve Nesne Yönetimi
- [ ] Kavramlar doğru ve yanlış olarak iki ana listeye ayrılabilsin.
- [ ] Her kavram için metin, kategori, açıklama, zorluk, çıkma olasılığı, özel görsel ve özel ses alanları tanımlansın.
- [ ] Kavramlar CSV veya çok satırlı metin alanından toplu içe aktarılabilsin.
- [ ] Toplu içe aktarmada satır başına kavram, kategori ve doğru/yanlış bilgisi ayrıştırılsın.
- [ ] Aynı kavramın aynı seviyede iki kez girilmesi engellensin veya uyarı verilsin.
- [ ] Boş, çok uzun veya okunamayacak kadar küçük metinler için doğrulama ekle.
- [ ] Düşen nesne üzerindeki yazı boyutu, yazı rengi, arka plan rengi, kenarlık ve şekil seçilebilsin.
- [ ] Nesne metni uzun olduğunda otomatik satır kırma veya dinamik font küçültme uygulansın.
- [ ] Kavram bazında ağırlık/çıkma sıklığı ayarı çalışır hale getirilsin; `weight` alanı gerçek spawn seçiminde kullanılsın.
- [ ] Kavram bazında "kritik kavram" işareti olsun; kritik kavramlar seviyede en az bir kez düşürülsün.
- [ ] Yanlış kavramlar için ceza puanı veya can azaltma davranışı ayrı ayarlanabilsin.

## 16. Görsel Tasarım ve Asset Editörü
- [ ] Arka plan seçimi için hazır görsel kütüphanesi, URL girişi ve dosya yükleme seçenekleri ekle.
- [ ] Her seviyede farklı arka plan kullanma seçeneği ekle.
- [ ] Düşen nesnelerin arka planı seçilebilsin; örneğin elma, kart, balon, damla, yıldız veya özel görsel.
- [ ] Nesne şekli, rengi, kenarlığı, gölgesi ve etiket yerleşimi düzenlenebilsin.
- [ ] Doğru yakalama efekti seçilebilsin; örneğin parlama, puan yazısı, parçacık, kısa animasyon.
- [ ] Yanlış yakalama efekti seçilebilsin; örneğin kırmızı titreşim, eksi puan yazısı, sönme animasyonu.
- [ ] Efekt yoğunluğu, süre ve renkleri ayarlanabilsin.
- [ ] Oyuncu/sepet görseli seçilebilsin ve boyutu ayarlanabilsin.
- [ ] Hedef alanları görsel olarak düzenlenebilsin; konum, genişlik, yükseklik, renk ve etiket ayarları yapılabilsin.
- [ ] Önizleme alanında hedef alanları sürükle-bırak ile konumlandırılabilsin.
- [ ] Asset dosyaları için boyut, format and maksimum dosya ağırlığı kuralları belirlenip doğrulansın.
- [ ] Yüklenen görseller otomatik optimize edilsin veya en azından kullanıcıya büyük dosya uyarısı verilsin.

## 17. Ses ve Müzik Ayarları
- [ ] Oyun genel müziği seçilebilsin, yüklenebilsin veya kapatılabilsin.
- [ ] Her seviye için farklı müzik kullanma seçeneği ekle.
- [ ] Doğru yakalama sesi, yanlış yakalama sesi, seviye geçiş sesi, oyun bitiş sesi ve buton sesi ayrı seçilebilsin.
- [ ] Ses seviyesi oyun geneli, müzik ve efektler için ayrı ayarlanabilsin.
- [ ] Ses dosyaları için ön dinleme butonu ekle.
- [ ] Telif ve sınıf ortamı açısından sessiz varsayılan mod veya düşük ses varsayılanı değerlendirilsin.
- [ ] Ses dosyası yoksa oyun hataya düşmeden sessiz çalışsın.

## 18. Oynanış ve Fizik Ayarları
- [ ] Düşme hızı ayarı gerçek oyunda kullanılacak şekilde `gravityY` ve/veya nesne velocity değerlerine bağlansın.
- [ ] Spawn aralığı ayarı milisaniye olarak düzenlenebilsin.
- [ ] Aynı anda ekranda bulunabilecek maksimum düşen nesne sayısı ayarlanabilsin.
- [ ] Düşen nesneler arasındaki minimum yatay ve dikey mesafe ayarlanabilsin.
- [ ] Nesnelerin düşeceği x konumları çakışma azaltacak şekilde hesaplanabilsin.
- [ ] Nesne düşme rotasyonu aç/kapat ve rotasyon hızı ayarı ekle.
- [ ] Oyuncu hareket hızı ayarı gerçek oyunda kullanılacak şekilde bağlansın.
- [ ] Oyuncu kontrol tipi seçilebilsin; klavye, fare/sürükleme, dokunmatik.
- [ ] Hatalı yakalamada puan düşürme, can azaltma veya süre azaltma seçenekleri ekle.
- [ ] Doğru yakalamada puan, süre bonusu veya combo artışı ayarlanabilsin.
- [ ] Kaçırılan doğru kavram için ceza ayarı ekle.
- [ ] Kaçırılan yanlış kavram için ödül veya cezasız geçiş seçeneği ekle.
- [ ] Seviye ilerledikçe hızlanma seçeneği ekle; örneğin her 20 saniyede düşme hızı yüzde 10 artsın.
- [ ] Rastgelelik ayarları dengeli olsun; seviye testlerinde bütün doğru kavramların görünmesi garanti edilebilsin.

## 19. Puanlama, Geri Bildirim ve Öğrenme Analitiği
- [ ] Doğru yakalama puanı, yanlış yakalama cezası, kaçırma cezası ve combo puanı editörden ayarlanabilsin.
- [ ] Seviye sonunda doğru sayısı, yanlış sayısı, kaçırılan doğru kavramlar, başarı yüzdesi ve süre gösterilsin.
- [ ] Öğrenciye yanlış yaptığı kavramlar için kısa açıklama gösterme alanı ekle.
- [ ] Kavram bazında performans kaydı tutulabilsin; hangi kavramların sık karıştırıldığı öğretmen panelinde görülsün.
- [ ] Attempt API yalnızca skor değil doğruluk, süre, seviye bazlı sonuç ve kavram bazlı hata bilgisi de kaydetsin.
- [ ] Rozet sistemi editör oyunlarıyla uyumlu hale getirilsin; örneğin "4 seviyeyi hatasız bitirdi" rozeti.
- [ ] Liderlik tablosu isteğe bağlı olsun; öğretmen isterse kapatabilsin.

## 20. Doğrulama ve Yayına Hazırlık
- [ ] Kaydetmeden önce oyun bütünlüğü kontrol edilsin: en az bir seviye, her seviyede en az bir doğru kavram, en az bir yanlış kavram ve geçerli oyun ayarları.
- [ ] Yayınlamadan önce daha sıkı kontrol çalışsın: tüm seviyeler test edilmiş mi, assetler yükleniyor mu, ses dosyaları erişilebilir mi, kavram metinleri okunabilir mi.
- [ ] Hata mesajları teknik değil, tasarımcının düzeltebileceği şekilde yazılsın.
- [ ] Eksik alanlar ilgili editör sekmesine bağlantı vererek gösterilsin.
- [ ] Yayın öncesi "öğrenci gibi oyna" modu zorunlu veya önerilen adım olsun.
- [ ] Taslak, incelemede, yayınlandı ve arşivlendi durumları eklensin.
- [ ] Yayındaki oyunda düzenleme yapılırsa doğrudan canlı oyunu bozmak yerine yeni taslak sürüm oluşturulsun.
- [ ] Öğretmen/admin onay akışı gerçek yayın durumu ile bağlansın.

## 21. Kaydetme, Sürümleme ve Paylaşım
- [ ] Oyun ve seviyeler için oluşturulma/güncellenme tarihi, oluşturan kullanıcı ve son düzenleyen kullanıcı bilgileri tutulabilsin.
- [ ] Otomatik kaydetme ile manuel kaydetme ayrıştırılsın.
- [ ] Oyun sürümleri saklansın; öğretmen eski sürüme dönebilsin.
- [ ] "Şablondan oluştur" ve "Oyunu kopyala" özellikleri eklensin.
- [ ] Fiziksel Büyüklükler oyunu örnek şablon olarak kopyalanabilir şekilde sunulsun.
- [ ] Paylaşım bağlantısı, sınıfa atama ve gizlilik ayarları ekle.
- [ ] Silme işlemleri geri alınabilir veya arşiv mantığıyla çalışsın.

## 22. Test ve Kalite Kontrol
- [ ] Level JSON şeması için birim testleri yaz.
- [ ] Kavram doğrulama, spawn ağırlığı, maksimum eş zamanlı nesne ve minimum mesafe kuralları için birim testleri yaz.
- [ ] Çok seviyeli oyun akışı için entegrasyon testi ekle.
- [ ] Editörde seviye ekleme, kavram ekleme, asset seçme, test etme ve kaydetme akışları için frontend testleri yaz.
- [ ] Phaser test modunda sahnenin boş kalmadığını, assetlerin yüklendiğini ve çarpışmaların çalıştığını doğrula.
- [ ] Masaüstü ve mobil ekranlarda editörün taşma, okunabilirlik ve buton erişilebilirliği kontrollerini yap.
- [ ] Büyük kavram listeleriyle performans testi yap; örneğin 4 seviye, her seviyede 50 doğru ve 50 yanlış kavram.
- [ ] API tarafında yetkisiz düzenleme, hatalı JSON ve eksik token senaryoları test edilsin.

## 23. Uygulama Sırası Önerisi
- [ ] Önce ortak çok seviyeli veri modelini ve JSON şemasını tasarla.
- [ ] Ardından backend doğrulama ve CRUD uçlarını çok seviyeli oyun projesine göre güncelle.
- [ ] Sonra frontend editör kabuğunu sekmeli, çok seviyeli ve canlı önizlemeli hale getir.
- [ ] Kavram yönetimini ve fiziksel büyüklükler 4 seviye şablonunu ekle.
- [ ] Oynanış ayarlarını Phaser runtime'a bağla; hız, spawn aralığı, maksimum nesne sayısı ve mesafe ayarları gerçekten oyunu değiştirsin.
- [ ] Görsel, ses ve efekt seçicileri asset manifest sistemiyle uygula.
- [ ] Yayınlama, test etme, doğrulama ve öğretmen onayı akışını tamamla.
- [ ] Son aşamada analitik, rozet, leaderboard ve sınıfa atama özelliklerini çok seviyeli oyun sonuçlarıyla uyumlu hale getir.
