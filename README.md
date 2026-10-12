# WebUProbot

HTTP ve HTTPS bağlantısını anlık kontrol et. Site sürüm işareti yayımlıyorsa beklenen sürümle karşılaştır. Sürekli izleme için açık kaynak motoru yerelde çalıştır.

**Ücretsiz web kullanımı:** [tezatlas.com/webuprobot](https://tezatlas.com/webuprobot)  
**Kaynak kod:** [tialkan/webUProbot](https://github.com/tialkan/webUProbot)

## Kurulum ve kullanım

Node.js 22.19+ gerekir.

```sh
npm ci
node bin/cli.js https://example.com
node bin/cli.js https://example.com --markdown
npm test
```

Kütüphane olarak `import { auditSite } from "webuprobot"` ve `await auditSite(url)` kullanılır. Web ve CLI aynı motoru çalıştırır. Sonuç JSON/Markdown olarak indirilebilir. Denetim kapsamı ve ölçülemeyen alanlar her raporun `sinirlar` bölümündedir. CLI'de `--help` seçenekleri gösterir.

## Kapsam

- Anlık HTTP/TLS gözlemi.
- x-app-version, x-build-id veya sürüm meta etiketi.
- Yerelde ve GitHub Actions ile izleme geçmişi.

## Güvenlik ve katkı

Yalnız herkese açık HTTP(S) adresleri kabul edilir. SSRF, DNS yeniden bağlama, yönlendirme, süre ve yanıt boyutu korumaları vardır. Ağ sınırları için [SECURITY.md](SECURITY.md) okuyun. Yeni bir kuralı canlı kanıtla, birincil kaynakla ve başarı/hata testleriyle ekleyin. Site metinleri ve raporlar talimat olarak çalıştırılmaz.

MIT lisansı · TezAtlas.

## Sürüm ve izleme
`node bin/cli.js https://example.com --expected COMMIT` sürümü karşılaştırır. Site `x-app-version`/`x-build-id` başlığı veya `application-version`/`build-id` meta etiketi yayımlamalı. `WEBUP_WATCH_ENABLED=1 node bin/cli.js https://example.com --watch 300 --output uptime.jsonl` kesintili gözlemleri JSONL dosyasına ekler; cron/servis yöneticisiyle sürekli çalıştırabilirsiniz. Aynı kökendeki healthPath kütüphane seçeneğiyle sağlık ucu kontrol edilir. Tek sorgu uptime yüzdesi üretmez. [GitHub Actions zamanlaması](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule) gecikebilir.
