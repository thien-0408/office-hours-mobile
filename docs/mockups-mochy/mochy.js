/* OfficeHours mobile — bản Mochy. Hành vi dùng chung cho các trang mock:
   chèn sprite icon (đơn sắc, cùng bộ Lucide với bản cũ), điền status bar và thanh điều hướng trang,
   nghiêng thẻ khi nhấn (press3D) và số đếm kiểu đồng hồ cơ. Không phụ thuộc thư viện nào. */
(function () {
  "use strict";

  var ICONS = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    users: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M16 4a4 4 0 0 1 0 8M22 21a7 7 0 0 0-4-6.3"/>',
    message: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
    map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>',
    pin: '<path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    right: '<path d="m9 6 6 6-6 6"/>',
    left: '<path d="m15 6-6 6 6 6"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    check: '<path d="M5 12.5 10 17l9-10"/>',
    checks: '<path d="M2 12.5 6 16.5l9-10"/><path d="m10 15.5 1 1 9-10"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    send: '<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7z"/>',
    sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    camera: '<path d="M3 8a2 2 0 0 1 2-2h2.5l1.5-2h6l1.5 2H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="3.5"/>',
    sparkles: '<path d="M12 3l1.8 4.7 4.7 1.8-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
    nav: '<path d="M3 11 22 2l-9 19-2-8-8-2z"/>',
    filter: '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17.5v.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.01"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m14 6 4 4"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    video: '<rect x="2" y="6" width="14" height="12" rx="2"/><path d="m16 10 6-3v10l-6-3"/>',
    hourglass: '<path d="M6 3h12M6 21h12"/><path d="M7 3v3a5 5 0 0 0 10 0V3M7 21v-3a5 5 0 0 1 10 0v3"/>',
    inbox: '<path d="M3 13h5l2 3h4l2-3h5"/><path d="M5 5h14l2 8v6H3v-6z"/>',
    file: '<path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4M9 13h6M9 17h6"/>',
    building: '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1M10 21v-3h4v3"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
    locate: '<circle cx="12" cy="12" r="7"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="2"/>',
    alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17v.01"/>',
    repeat: '<path d="M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5"/><path d="M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5"/>',
    upload: '<path d="M12 15V3M7 8l5-5 5 5M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/>',
    more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    book: '<path d="M2 5h7a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H2zM22 5h-7a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h8z"/>',
    door: '<path d="M5 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17M3 21h18"/><path d="M14 12v.01"/>',
    flash: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
    phoneoff: '<path d="M2 12h20"/>',
    key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m11 12 9-9M17 6l3 3M14 9l2 2"/>',
    star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>'
  };

  // vài icon riêng cho bản này
  ICONS["at"] = '<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/>';
  ICONS["key"] = '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.3-9.3M17 6l3 3M15 8l2 2"/>';
  ICONS["eyeoff"] = '<path d="M3 3l18 18"/><path d="M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>';
  ICONS["grad"] = '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/>';
  ICONS["teach"] = '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 20h8M12 16v4"/>';
  ICONS["mailopen"] = '<path d="M3 10l9-6 9 6v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="m3 10 9 6 9-6"/>';

  // Glyph trạng thái: hình tròn đặc, dấu bên trong được khoét rỗng (mask), nên hiện đúng trên mọi nền.
  // Một glyph cho mỗi nhóm trạng thái booking/waitlist của backend.
  var GLYPHS = {
    ok:    '<path d="M7.3 12.3l3.1 3.1 6.3-6.6"/>',                        // CONFIRMED, FULFILLED
    done:  '<path d="M5.6 12.6l2.7 2.7 5.3-5.6"/><path d="M11.8 14.8l.5.5 5.3-5.6"/>', // COMPLETED
    wait:  '<path d="M12 7.2v5l3.2 1.9"/>',                                 // PENDING
    queue: '<path d="M8 9h8M8 12h8M8 15h4.5"/>',                            // WAITING (hàng đợi)
    offer: '<path d="M9 15l6-6M10 9h5v5"/>',                                // OFFERED
    no:    '<path d="M8.8 8.8l6.4 6.4M15.2 8.8l-6.4 6.4"/>',                // DECLINED
    off:   '<path d="M7.6 12h8.8"/>',                                       // CANCELLED, EXPIRED
    warn:  '<path d="M12 7.2v5.6"/><path d="M12 16.4v.1"/>'                 // NO_SHOW, lỗi
  };

  // Logo dịch vụ ngoài (Simple Icons 13.21.0, CC0; nhãn hiệu thuộc chủ sở hữu). Giữ màu gốc.
  var BRANDS = {"gmail": ["M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z", "#EA4335"], "zoom": ["M5.033 14.649H.743a.74.74 0 0 1-.686-.458.74.74 0 0 1 .16-.808L3.19 10.41H1.06A1.06 1.06 0 0 1 0 9.35h3.957c.301 0 .57.18.686.458a.74.74 0 0 1-.161.808L1.51 13.59h2.464c.585 0 1.06.475 1.06 1.06zM24 11.338c0-1.14-.927-2.066-2.066-2.066-.61 0-1.158.265-1.537.686a2.061 2.061 0 0 0-1.536-.686c-1.14 0-2.066.926-2.066 2.066v3.311a1.06 1.06 0 0 0 1.06-1.06v-2.251a1.004 1.004 0 0 1 2.013 0v2.251c0 .586.474 1.06 1.06 1.06v-3.311a1.004 1.004 0 0 1 2.012 0v2.251c0 .586.475 1.06 1.06 1.06zM16.265 12a2.728 2.728 0 1 1-5.457 0 2.728 2.728 0 0 1 5.457 0zm-1.06 0a1.669 1.669 0 1 0-3.338 0 1.669 1.669 0 0 0 3.338 0zm-4.82 0a2.728 2.728 0 1 1-5.458 0 2.728 2.728 0 0 1 5.457 0zm-1.06 0a1.669 1.669 0 1 0-3.338 0 1.669 1.669 0 0 0 3.338 0z", "#0B5CFF"], "googlemeet": ["M5.53 2.13 0 7.75h5.53zm.398 0v5.62h7.608v3.65l5.47-4.45c-.014-1.22.031-2.25-.025-3.46-.148-1.09-1.287-1.47-2.236-1.36zM23.1 4.32c-.802.295-1.358.995-2.047 1.49-2.506 2.05-4.982 4.12-7.468 6.19 3.025 2.59 6.04 5.18 9.065 7.76 1.218.671 1.428-.814 1.328-1.64v-13a.828.828 0 0 0-.877-.825zM.038 8.15v7.7h5.53v-7.7zm13.577 8.1H6.008v5.62c3.864-.006 7.737.011 11.58-.009 1.02-.07 1.618-1.12 1.468-2.07v-2.51l-5.47-4.68v3.65zm-13.577 0c.02 1.44-.041 2.88.033 4.31.162.948 1.158 1.43 2.047 1.31h3.464v-5.62z", "#00897B"], "googlecalendar": ["M18.316 5.684H24v12.632h-5.684V5.684zM5.684 24h12.632v-5.684H5.684V24zM18.316 5.684V0H1.895A1.894 1.894 0 0 0 0 1.895v16.421h5.684V5.684h12.632zm-7.207 6.25v-.065c.272-.144.5-.349.687-.617s.279-.595.279-.982c0-.379-.099-.72-.3-1.025a2.05 2.05 0 0 0-.832-.714 2.703 2.703 0 0 0-1.197-.257c-.6 0-1.094.156-1.481.467-.386.311-.65.671-.793 1.078l1.085.452c.086-.249.224-.461.413-.633.189-.172.445-.257.767-.257.33 0 .602.088.816.264a.86.86 0 0 1 .322.703c0 .33-.12.589-.36.778-.24.19-.535.284-.886.284h-.567v1.085h.633c.407 0 .748.109 1.02.327.272.218.407.499.407.843 0 .336-.129.614-.387.832s-.565.327-.924.327c-.351 0-.651-.103-.897-.311-.248-.208-.422-.502-.521-.881l-1.096.452c.178.616.505 1.082.977 1.401.472.319.984.478 1.538.477a2.84 2.84 0 0 0 1.293-.291c.382-.193.684-.458.902-.794.218-.336.327-.72.327-1.149 0-.429-.115-.797-.344-1.105a2.067 2.067 0 0 0-.881-.689zm2.093-1.931l.602.913L15 10.045v5.744h1.187V8.446h-.827l-2.158 1.557zM22.105 0h-3.289v5.184H24V1.895A1.894 1.894 0 0 0 22.105 0zm-3.289 23.5l4.684-4.684h-4.684V23.5zM0 22.105C0 23.152.848 24 1.895 24h3.289v-5.184H0v3.289z", "#4285F4"]};

  function sprite() {
    var s = '<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true"><defs>';
    Object.keys(GLYPHS).forEach(function (k) {
      s += '<mask id="gm-' + k + '" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#fff"/>' +
        '<g fill="none" stroke="#000" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' + GLYPHS[k] + '</g></mask>';
    });
    s += '</defs>';
    Object.keys(ICONS).forEach(function (k) { s += '<symbol id="i-' + k + '" viewBox="0 0 24 24">' + ICONS[k] + '</symbol>'; });
    Object.keys(GLYPHS).forEach(function (k) {
      s += '<symbol id="g-' + k + '" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="currentColor" stroke="none" mask="url(#gm-' + k + ')"/></symbol>';
    });
    Object.keys(BRANDS).forEach(function (k) {
      s += '<symbol id="b-' + k + '" viewBox="0 0 24 24"><path fill="' + BRANDS[k][1] + '" stroke="none" d="' + BRANDS[k][0] + '"/></symbol>';
    });
    // logo "oh": vòng thời gian còn hở một khe + chữ h
    s += '<symbol id="oh-mark" viewBox="0 0 120 120"><g fill="none" stroke="currentColor" stroke-width="12" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M58.67 63.48A22 22 0 1 1 38 49"/><path d="M74 27V93"/><path d="M74 63A14 14 0 0 1 102 63V93"/></g></symbol>';
    document.body.insertAdjacentHTML("afterbegin", s + "</svg>");
  }
  function icon(name, cls) {
    return '<svg class="i ' + (cls || "") + '" aria-hidden="true"><use href="#i-' + name + '"/></svg>';
  }
  function expandIcons() {
    document.querySelectorAll("i[data-i]").forEach(function (el) {
      el.outerHTML = icon(el.getAttribute("data-i"), el.className);
    });
    document.querySelectorAll("i[data-g]").forEach(function (el) {
      el.outerHTML = '<svg class="gl ' + el.className + '" aria-hidden="true"><use href="#g-' + el.getAttribute("data-g") + '"/></svg>';
    });
    document.querySelectorAll("i[data-b]").forEach(function (el) {
      var st = el.getAttribute("style");
      el.outerHTML = '<svg class="bl ' + el.className + '"' + (st ? ' style="' + st + '"' : "") + ' aria-hidden="true"><use href="#b-' + el.getAttribute("data-b") + '"/></svg>';
    });
    document.querySelectorAll("i[data-logo]").forEach(function (el) {
      var st = el.getAttribute("style");
      el.outerHTML = '<svg class="logo ' + el.className + '"' + (st ? ' style="' + st + '"' : "") + ' aria-hidden="true"><use href="#oh-mark"/></svg>';
    });
  }

  var STATUS = '<span>9:41</span><span class="ic">' +
    '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="15" width="4" height="6" rx="1"/><rect x="8" y="11" width="4" height="10" rx="1"/><rect x="14" y="7" width="4" height="14" rx="1"/><rect x="20" y="3" width="3" height="18" rx="1" opacity=".35"/></svg>' +
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 11a12 12 0 0 1 16 0M7.5 14.5a7 7 0 0 1 9 0"/><circle cx="12" cy="18.5" r="1.4" fill="currentColor" stroke="none"/></svg>' +
    '<svg viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="4" y="9" width="12" height="6" rx="1.2" fill="currentColor"/><rect x="21" y="10" width="1.6" height="4" rx=".8" fill="currentColor"/></svg>' +
    "</span>";

  var PAGES = [
    ["index.html", "Tổng quan"],
    ["01-auth.html", "Auth"],
    ["02-chung.html", "Chung"],
    ["03-booking.html", "Booking"],
    ["04-lich-chat.html", "Lịch, chat"],
    ["05-giang-vien-admin.html", "Giảng viên, admin"],
    ["06-ban-do.html", "Bản đồ"]
  ];

  // Thanh nav viên thuốc nổi: <nav class="navpill" data-role="sv|gv|ad" data-on="home"></nav>
  var TABS = {
    sv: [["home", "Trang chủ", "home"], ["find", "Giảng viên", "search"], ["book", "Lịch hẹn", "calendar"], ["map", "Bản đồ", "map"], ["me", "Tôi", "user"]],
    gv: [["home", "Trang chủ", "home"], ["review", "Duyệt", "inbox", 4], ["book", "Lịch", "calendar"], ["map", "Bản đồ", "map"], ["me", "Tôi", "user"]],
    ad: [["users", "Người dùng", "users"], ["campus", "Campus", "map"], ["noti", "Thông báo", "bell", 2], ["me", "Tôi", "user"]]
  };
  function fillNavPill() {
    document.querySelectorAll("nav.navpill[data-role]").forEach(function (el) {
      var on = el.getAttribute("data-on");
      el.innerHTML = TABS[el.getAttribute("data-role")].map(function (t) {
        var isOn = t[0] === on;
        return '<span class="tb' + (isOn ? " on" : "") + '">' + icon(t[2]) +
          (isOn ? "<b>" + t[1] + "</b>" : "") + (t[3] && !isOn ? '<em>' + t[3] + "</em>" : "") + "</span>";
      }).join("");
    });
  }
  function fillChrome() {
    document.querySelectorAll(".sb:empty").forEach(function (el) { el.innerHTML = STATUS; });
    var here = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll("nav.mnav").forEach(function (el) {
      el.innerHTML = PAGES.map(function (p) {
        return '<a href="' + p[0] + '"' + (p[0] === here ? ' class="on"' : "") + ">" + p[1] + "</a>";
      }).join("") + '<a class="out" href="../mockups/index.html">Bản theo web ↗</a>';
    });
  }

  // press3D: nghiêng tối đa 4° theo vị trí ngón tay, thu còn 0.97 (Mochy: 7°, đã giảm cho app công cụ)
  function press3D() {
    document.querySelectorAll(".p3d").forEach(function (el) {
      var max = parseFloat(el.getAttribute("data-tilt") || "4");
      function set(e, down) {
        var r = el.getBoundingClientRect();
        var nx = ((e.clientX - r.left) / r.width) * 2 - 1;
        var ny = ((e.clientY - r.top) / r.height) * 2 - 1;
        el.style.transform = down
          ? "perspective(700px) rotateX(" + (-ny * max).toFixed(2) + "deg) rotateY(" + (nx * max).toFixed(2) + "deg) scale(.97)"
          : "";
      }
      el.addEventListener("pointerdown", function (e) { el.classList.add("pressing"); set(e, true); });
      el.addEventListener("pointermove", function (e) { if (el.classList.contains("pressing")) set(e, true); });
      ["pointerup", "pointerleave", "pointercancel"].forEach(function (t) {
        el.addEventListener(t, function () { el.classList.remove("pressing"); el.style.transform = ""; });
      });
    });
  }

  // số đếm kiểu đồng hồ cơ: <span class="odo" data-countdown="42"></span> → m:ss đếm lùi
  function odometer() {
    document.querySelectorAll(".odo[data-countdown]").forEach(function (el) {
      var left = parseInt(el.getAttribute("data-countdown"), 10) || 0;
      var reel = "";
      for (var k = 0; k <= 9; k++) reel += "<b>" + k + "</b>";
      el.innerHTML = '<span class="d"><span class="reel">' + reel + '</span></span><span class="sep">:</span>' +
        '<span class="d"><span class="reel">' + reel + '</span></span><span class="d"><span class="reel">' + reel + "</span></span>";
      var reels = el.querySelectorAll(".reel");
      function show(n) {
        var m = Math.floor(n / 60), s = n % 60;
        [m % 10, Math.floor(s / 10), s % 10].forEach(function (d, i) {
          reels[i].style.transform = "translateY(" + (-d * 1.2) + "em)";
        });
      }
      show(left);
      var t = setInterval(function () {
        left = left > 0 ? left - 1 : parseInt(el.getAttribute("data-countdown"), 10);
        show(left);
      }, 1000);
      el._timer = t;
    });
  }

  // đánh số thứ tự cho hiệu ứng hiện lần lượt trong từng màn
  function stagger() {
    document.querySelectorAll(".screen").forEach(function (sc) {
      sc.querySelectorAll(".rv").forEach(function (el, i) { el.style.setProperty("--i", i); });
    });
  }

  function init() { sprite(); fillNavPill(); expandIcons(); fillChrome(); stagger(); press3D(); odometer(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
