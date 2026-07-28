(function () {
  "use strict";

  // ── Sidebar toggle ────────────────────────────────────────────────────────
  var navToggle = document.getElementById("navToggle");
  var docLayout = document.getElementById("docLayout");
  var sidebarOverlay = document.getElementById("sidebarOverlay");

  function isMobile() {
    return window.innerWidth <= 768;
  }

  if (navToggle && docLayout) {
    navToggle.addEventListener("click", function () {
      if (isMobile()) {
        docLayout.classList.toggle("is-nav-visible");
      } else {
        docLayout.classList.toggle("is-nav-hidden");
      }
    });
  }

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener("click", function () {
      if (docLayout) docLayout.classList.remove("is-nav-visible");
    });
  }

  document.addEventListener("click", function (e) {
    if (!isMobile()) return;
    var sidebar = document.getElementById("docSidebar");
    if (
      sidebar &&
      navToggle &&
      !sidebar.contains(e.target) &&
      !navToggle.contains(e.target)
    ) {
      if (docLayout) docLayout.classList.remove("is-nav-visible");
    }
  });

  // ── TOC ───────────────────────────────────────────────────────────────────
  var tocList = document.getElementById("tocList");
  var tocData = window._TOC || [];
  var tocRail = document.getElementById("docToc");

  // No sections → no in-page nav. Hide the whole rail so it doesn't sit there
  // empty.
  if (tocRail && !tocData.length) {
    tocRail.style.display = "none";
  }

  if (tocList && tocData.length) {
    tocList.innerHTML = tocData
      .map(function (item) {
        return (
          "<li><a href=\"#" +
          item.id +
          "\">" +
          item.title +
          "</a></li>"
        );
      })
      .join("");

    if ("IntersectionObserver" in window) {
      var tocLinks = tocList.querySelectorAll("a");
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              tocLinks.forEach(function (link) {
                link.classList.toggle(
                  "active",
                  link.getAttribute("href") === "#" + entry.target.id,
                );
              });
            }
          });
        },
        { rootMargin: "-10% 0px -80% 0px", threshold: 0 },
      );
      document.querySelectorAll(".doc-section[id]").forEach(function (sec) {
        observer.observe(sec);
      });
    }
  }

  // ── Search ────────────────────────────────────────────────────────────────
  var searchInput = document.getElementById("docSearch");
  if (searchInput) {
    searchInput.addEventListener("input", function (e) {
      var query = e.target.value.trim();
      var sections = document.querySelectorAll("[data-searchable]");
      sections.forEach(function (node) {
        var orig = node.getAttribute("data-orig");
        if (orig) node.innerHTML = orig;
      });
      if (!query) return;
      var re = new RegExp(
        query.replace(/[.*+?^{}()|[\]\\]/g, "\\$&"),
        "gi",
      );
      sections.forEach(function (node) {
        if (!node.getAttribute("data-orig")) {
          node.setAttribute("data-orig", node.innerHTML);
        }
        node.innerHTML = node.innerHTML.replace(re, function (m) {
          return "<mark>" + m + "</mark>";
        });
      });
    });
  }

  // ── Copy buttons ──────────────────────────────────────────────────────────
  document.querySelectorAll(".copy-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var code =
        btn.nextElementSibling &&
        btn.nextElementSibling.querySelector("code");
      if (!code) return;
      navigator.clipboard
        .writeText(code.textContent)
        .then(function () {
          btn.textContent = "Copied!";
          setTimeout(function () {
            btn.textContent = "Copy";
          }, 2000);
        })
        .catch(function () {
          btn.textContent = "Failed";
          setTimeout(function () {
            btn.textContent = "Copy";
          }, 2000);
        });
    });
  });
})();
