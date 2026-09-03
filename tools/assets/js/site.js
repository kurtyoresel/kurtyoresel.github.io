/* ============================================================
   Kürt Yöresel — Site Davranışları
   (Google Analytics, talep toplama, favoriler, arama, filtreler)
   ============================================================ */
(function () {
  "use strict";

  var ROOT = document.documentElement.hasAttribute("data-root")
    ? document.documentElement.getAttribute("data-root")
    : ".";

  /* ---------- Google Analytics (GA4) ----------
     Not: gtag betiği artık her sayfanın <head> bölümüne gömülü geliyor
     (Search Console doğrulaması ve daha erken ölçüm için).
     Burada sadece gtag'in var olduğunu garanti ediyoruz. */
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== "function") {
    window.gtag = function () { window.dataLayer.push(arguments); };
  }

  function track(eventName, params) {
    try { gtag("event", eventName, params || {}); } catch (e) { /* yoksay */ }
  }

  /* ---------- Yardımcılar ---------- */
  function $(sel, el) { return (el || document).querySelector(sel); }
  function $all(sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); }

  function todayKey() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  var toastTimer = null;
  function toast(msg) {
    var el = $("#ky-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "ky-toast";
      el.className = "toast";
      el.setAttribute("role", "status");
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("show"); }, 3200);
  }

  function store(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* özel mod */ }
  }
  function read(key, fallback) {
    try {
      var v = localStorage.getItem(key);
      return v === null ? fallback : JSON.parse(v);
    } catch (e) { return fallback; }
  }

  /* ---------- Mobil menü ---------- */
  var navToggle = $(".nav-toggle");
  var mainNav = $(".main-nav");
  if (navToggle && mainNav) {
    function menuKapat() {
      mainNav.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    }
    navToggle.addEventListener("click", function (ev) {
      ev.stopPropagation();
      var open = mainNav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    // Dışarı tıklayınca kapat
    document.addEventListener("click", function (ev) {
      if (!mainNav.classList.contains("open")) return;
      if (mainNav.contains(ev.target) || navToggle.contains(ev.target)) return;
      menuKapat();
    });
    // ESC ile kapat
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && mainNav.classList.contains("open")) {
        menuKapat();
        navToggle.focus();
      }
    });
    // Bir bağlantıya tıklanınca kapat
    $all("a", mainNav).forEach(function (a) {
      a.addEventListener("click", menuKapat);
    });
  }

  /* ---------- Favoriler (istek listesi) ---------- */
  var WISH_KEY = "ky_wishlist";

  function getWishlist() { return read(WISH_KEY, []); }
  function setWishlist(list) {
    store(WISH_KEY, list);
    updateWishCount();
  }
  function updateWishCount() {
    var el = $("#wish-count");
    if (!el) return;
    var n = getWishlist().length;
    el.textContent = n > 0 ? String(n) : "";
  }

  function bindWishButtons(scope) {
    $all(".wish-btn", scope).forEach(function (btn) {
      var slug = btn.getAttribute("data-slug");
      if (!slug) return;
      var list = getWishlist();
      var active = list.indexOf(slug) !== -1;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
      btn.addEventListener("click", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        var current = getWishlist();
        var i = current.indexOf(slug);
        var nowActive = i === -1;
        if (nowActive) {
          current.push(slug);
          toast("Favorilere eklendi ❤");
          track("add_to_wishlist", { item_id: slug });
        } else {
          current.splice(i, 1);
          toast("Favorilerden çıkarıldı");
        }
        btn.classList.toggle("active", nowActive);
        btn.setAttribute("aria-pressed", nowActive ? "true" : "false");
        setWishlist(current);
      });
    });
  }

  updateWishCount();
  bindWishButtons(document);

  /* ---------- Talep toplama (günde 1 talep) ---------- */
  var DEMAND_KEY = "ky_talep";

  function demandGivenToday() {
    return read(DEMAND_KEY, "") === todayKey();
  }

  function refreshDemandUI() {
    $all("[data-demand-btn]").forEach(function (btn) {
      var status = $("[data-demand-status]", btn.closest(".demand-section") || document);
      if (demandGivenToday()) {
        btn.disabled = true;
        btn.textContent = "✓ Talebiniz Alındı";
        if (status) status.textContent = "Teşekkürler! Bugünkü talebiniz kaydedildi. Yarın tekrar talep bırakabilirsiniz.";
      }
    });
  }

  $all("[data-demand-btn]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (demandGivenToday()) { refreshDemandUI(); return; }
      store(DEMAND_KEY, todayKey());
      track("talep_topla", { page: location.pathname });
      refreshDemandUI();
      toast("Talebiniz alındı, teşekkür ederiz! 🎉");
    });
  });
  refreshDemandUI();

  /* ---------- Ürün ön sipariş talebi ---------- */
  $all("[data-preorder-btn]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var slug = btn.getAttribute("data-slug") || "";
      var name = btn.getAttribute("data-name") || "";
      var price = parseFloat(btn.getAttribute("data-price") || "0");
      var sizeBtn = $(".size-chip.selected");
      var doneKey = "ky_pre_" + slug + "_" + todayKey();
      if (read(doneKey, false)) {
        toast("Bu ürün için bugün zaten talep bıraktınız.");
        return;
      }
      store(doneKey, true);
      track("urun_talep", {
        item_id: slug,
        item_name: name,
        value: price,
        currency: "TRY",
        size: sizeBtn ? sizeBtn.textContent.trim() : ""
      });
      toast("Ön sipariş talebiniz kaydedildi! Site açıldığında bu ürün öncelikli olarak stoklanacak. 🎉");
    });
  });

  /* ---------- Beden seçimi ---------- */
  $all(".size-chip").forEach(function (chip) {
    chip.addEventListener("click", function () {
      $all(".size-chip").forEach(function (c) {
        c.classList.remove("selected");
        c.setAttribute("aria-pressed", "false");
      });
      chip.classList.add("selected");
      chip.setAttribute("aria-pressed", "true");
    });
  });

  /* ---------- Ürün görüntüleme olayı ---------- */
  var pd = $("[data-product-view]");
  if (pd) {
    track("view_item", {
      item_id: pd.getAttribute("data-slug"),
      item_name: pd.getAttribute("data-name"),
      value: parseFloat(pd.getAttribute("data-price") || "0"),
      currency: "TRY"
    });
  }

  /* ---------- Arama ---------- */
  $all("form.search-form").forEach(function (form) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var input = $("input[name=q]", form);
      var q = input ? input.value.trim() : "";
      if (!q) return;
      track("search", { search_term: q });
      location.href = ROOT + "/arama/?q=" + encodeURIComponent(q);
    });
  });

  var searchResults = $("#search-results");
  if (searchResults) {
    var params = new URLSearchParams(location.search);
    var q = (params.get("q") || "").trim();
    var titleEl = $("#search-title");
    if (titleEl && q) titleEl.textContent = "“" + q + "” için arama sonuçları";
    if (q) {
      fetch(ROOT + "/assets/data/urunler.json")
        .then(function (r) { return r.json(); })
        .then(function (items) {
          var ql = q.toLocaleLowerCase("tr");
          var hits = items.filter(function (p) {
            return (p.name + " " + p.category + " " + p.region + " " + p.fabric + " " + (p.tags || []).join(" "))
              .toLocaleLowerCase("tr").indexOf(ql) !== -1;
          });
          renderCards(searchResults, hits);
          var count = $("#search-count");
          if (count) count.textContent = hits.length ? hits.length + " ürün bulundu" : "Sonuç bulunamadı. Farklı bir kelime deneyin (ör. kirasfistan, puşi, kadife).";
        })
        .catch(function () { searchResults.innerHTML = "<p>Arama şu anda kullanılamıyor.</p>"; });
    }
  }

  /* ---------- Favoriler sayfası ---------- */
  var wishGrid = $("#wishlist-grid");
  if (wishGrid) {
    var slugs = getWishlist();
    if (!slugs.length) {
      $("#wishlist-empty").hidden = false;
    } else {
      fetch(ROOT + "/assets/data/urunler.json")
        .then(function (r) { return r.json(); })
        .then(function (items) {
          var hits = items.filter(function (p) { return slugs.indexOf(p.slug) !== -1; });
          if (!hits.length) { $("#wishlist-empty").hidden = false; return; }
          renderCards(wishGrid, hits);
        })
        .catch(function () { $("#wishlist-empty").hidden = false; });
    }
  }

  /* ---------- Kart oluşturucu (arama + favoriler) ---------- */
  function renderCards(grid, items) {
    grid.innerHTML = items.map(function (p) {
      var url = ROOT + "/urun/" + p.slug + "/";
      var img = ROOT + "/" + (p.img || "images/products/" + p.slug + ".svg");
      var badge = p.oldPrice ? '<span class="p-badge badge-sale">İndirim</span>' : '<span class="p-badge">Ön Sipariş</span>';
      var old = p.oldPrice ? '<span class="price-old">' + formatPrice(p.oldPrice) + "</span>" : "";
      return '<article class="product-card">' +
        '<div class="product-media">' + badge +
        '<button class="wish-btn" type="button" data-slug="' + p.slug + '" aria-label="' + escapeHtml(p.name) + ' ürününü favorilere ekle" aria-pressed="false">' + heartSvg() + "</button>" +
        '<img src="' + img + '" alt="' + escapeHtml(p.alt || p.name) + '" loading="lazy" width="800" height="1000"></div>' +
        '<div class="product-body"><span class="p-region">' + escapeHtml(p.region || "") + "</span>" +
        '<h3><a href="' + url + '">' + escapeHtml(p.name) + "</a></h3>" +
        '<div class="p-price"><span class="price-now">' + formatPrice(p.price) + "</span>" + old + "</div></div></article>";
    }).join("");
    bindWishButtons(grid);
  }

  function heartSvg() {
    return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 21s-7.5-4.8-10-9.3C.5 8 2.4 4.5 6 4.5c2.2 0 3.7 1.2 4.6 2.6l1.4 2 1.4-2c.9-1.4 2.4-2.6 4.6-2.6 3.6 0 5.5 3.5 4 7.2C19.5 16.2 12 21 12 21z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';
  }

  function formatPrice(n) {
    try { return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(n) + " TL"; }
    catch (e) { return n + " TL"; }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------- Sözlük canlı arama ---------- */
  var sozlukAra = $("#sozluk-ara");
  if (sozlukAra) {
    var maddeler = $all(".sozluk-madde");
    var sozlukGruplar = $all(".sozluk-grup");
    var sonucEl = $("#sozluk-sonuc");
    sozlukAra.addEventListener("input", function () {
      var q = sozlukAra.value.trim().toLocaleLowerCase("tr");
      var bulunan = 0;
      maddeler.forEach(function (m) {
        var uyuyor = !q || (m.getAttribute("data-terim") || "").indexOf(q) !== -1;
        m.hidden = !uyuyor;
        if (uyuyor) bulunan++;
      });
      // İçinde görünen madde kalmayan grubu gizle
      sozlukGruplar.forEach(function (g) {
        g.hidden = !$all(".sozluk-madde:not([hidden])", g).length;
      });
      if (sonucEl) {
        sonucEl.textContent = !q ? "" :
          (bulunan ? bulunan + " terim bulundu" : "Sonuç bulunamadı — farklı bir kelime deneyin.");
      }
    });
  }

  /* ---------- Kategori filtreleri ---------- */
  var catGrid = $("[data-filterable]");
  if (catGrid) {
    var selRegion = $("#f-region");
    var selFabric = $("#f-fabric");
    var selSort = $("#f-sort");
    var countEl = $(".filter-count");
    var originalOrder = $all(".product-card", catGrid);

    function applyFilters() {
      var region = selRegion ? selRegion.value : "";
      var fabric = selFabric ? selFabric.value : "";
      var visible = [];
      originalOrder.forEach(function (card) {
        var ok = (!region || card.getAttribute("data-region") === region) &&
                 (!fabric || card.getAttribute("data-fabric") === fabric);
        card.style.display = ok ? "" : "none";
        if (ok) visible.push(card);
      });
      if (selSort && selSort.value) {
        var dir = selSort.value === "price-asc" ? 1 : -1;
        visible.sort(function (a, b) {
          return dir * (parseFloat(a.getAttribute("data-price")) - parseFloat(b.getAttribute("data-price")));
        });
        visible.forEach(function (card) { catGrid.appendChild(card); });
      } else {
        originalOrder.forEach(function (card) { catGrid.appendChild(card); });
      }
      if (countEl) countEl.textContent = visible.length + " ürün gösteriliyor";
    }

    [selRegion, selFabric, selSort].forEach(function (sel) {
      if (sel) sel.addEventListener("change", applyFilters);
    });
    applyFilters();
  }
})();
