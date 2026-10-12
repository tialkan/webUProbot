import {
  start,
  normalizeTarget,
  load,
  finding,
  report,
  section,
} from "./common.js";
export function observedVersion(response) {
  const $ = load(response.body);
  return (
    response.headers["x-app-version"] ||
    response.headers["x-build-id"] ||
    $("meta[name='application-version']").attr("content") ||
    $("meta[name='build-id']").attr("content") ||
    null
  );
}
export async function auditSite(input, options = {}) {
  let state;
  try {
    state = await start(input, options);
  } catch (error) {
    const target = normalizeTarget(input);
    return report(
      "WebUProbot",
      target,
      Date.now(),
      [
        finding(
          "UP-UNREACHABLE",
          "Siteye ulaşılamadı",
          target.href,
          error.message,
          "DNS, TLS, sunucu ve dağıtım durumunu kontrol edin.",
          "yüksek",
        ),
      ],
      [
        section("Anlık çalışma", [
          { etiket: "Durum", deger: "DNS/TLS/ağ nedeniyle doğrulanamadı" },
        ]),
      ],
      [
        "Tek gözlem süreklilik veya uptime yüzdesi değildir; yerelde --watch ile geçmiş tutabilirsiniz.",
      ],
      0,
    );
  }
  const { target, started, response, fetcher, signal } = state;
  const findings = [];
  const expected = options.expectedVersion?.trim();
  const observed = observedVersion(response);
  const reachable = response.status >= 200 && response.status < 400;
  if (!reachable)
    findings.push(
      finding(
        "UP-STATUS",
        "Beklenen başarılı HTTP yanıtı yok",
        response.url,
        `HTTP ${response.status}`,
        "Sunucu, dağıtım ve uygulama günlüklerini kontrol edin.",
        "yüksek",
      ),
    );
  if (expected && observed && expected !== observed)
    findings.push(
      finding(
        "UP-VERSION",
        "Yayındaki sürüm beklenenle uyuşmuyor",
        response.url,
        `Beklenen: ${expected}; gözlenen: ${observed}`,
        "Dağıtımın tamamlandığını ve CDN önbelleğini kontrol edin.",
        "yüksek",
      ),
    );
  let health = null;
  if (options.healthPath) {
    const h = new URL(options.healthPath, response.url);
    if (h.origin !== new URL(response.url).origin)
      throw new Error("Sağlık adresi aynı kökende olmalı.");
    const a = await fetcher(h.href, { signal, maxBytes: 100000 });
    health = {
      etiket: "Sağlık ucu",
      deger: a.ok ? `HTTP ${a.result.status}` : a.error,
      url: h.href,
    };
    if (!a.ok || a.result.status !== 200)
      findings.push(
        finding(
          "UP-HEALTH",
          "Sağlık ucu başarılı değil",
          h.href,
          health.deger,
          "Uygulama ve bağımlılıkların sağlık kontrollerini inceleyin.",
          "yüksek",
        ),
      );
  }
  return report(
    "WebUProbot",
    target,
    started,
    findings,
    [
      section("Anlık çalışma ve dağıtım", [
        { etiket: "HTTP", deger: String(response.status), url: response.url },
        { etiket: "Yönlendirme", deger: `${response.chain.length - 1}` },
        {
          etiket: "HTTPS",
          deger:
            new URL(response.url).protocol === "https:"
              ? "TLS doğrulanmış bağlantı"
              : "Şifresiz HTTP",
        },
        {
          etiket: "Gözlenen sürüm",
          deger: observed || "Ölçülemedi: site sürüm işareti yayımlamıyor.",
        },
        { etiket: "Beklenen sürüm", deger: expected || "Belirtilmedi." },
        {
          etiket: "Sürüm karşılaştırması",
          deger:
            !expected || !observed
              ? "Yapılamadı"
              : expected === observed
                ? "Eşleşiyor"
                : "Uyuşmuyor",
        },
        ...(health ? [health] : []),
      ]),
    ],
    [
      "Bu web denetimi anlık gözlemdir; uptime yüzdesi veya sürekli izleme değildir.",
      "Sürüm site sahibinin yayımladığı işaretten okunur; framework sürümü dağıtım sürümü değildir.",
      "Yerelde --watch ile JSONL geçmişi tutabilir veya GitHub Actions izleme örneğini kullanabilirsiniz.",
      "HTTP başarısı uygulamadaki bütün işlevlerin çalıştığını kanıtlamaz.",
    ],
  );
}
