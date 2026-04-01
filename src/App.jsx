import { useState, useEffect, useCallback, useRef } from "react";

// ─── CONSTANTS ───────────────────────────────────────────────
const API_URL = "https://dummyjson.com/products?limit=100";

const CATEGORIES = [
  "smartphones",
  "laptops",
  "fragrances",
  "skincare",
  "groceries",
  "home-decoration",
  "furniture",
  "tops",
  "womens-dresses",
  "womens-shoes",
  "mens-shirts",
  "mens-shoes",
  "mens-watches",
  "womens-watches",
  "womens-bags",
  "womens-jewellery",
  "sunglasses",
  "automotive",
  "motorcycle",
  "lighting",
];

export default function App() {
  const [page, setPage] = useState("home");
  const [allProducts, setAllProducts] = useState([]);
  const [apiCategories, setApiCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState({});
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: "" });

  // Shop filters
  const [checkedCats, setCheckedCats] = useState([]);
  const [maxPrice, setMaxPrice] = useState(2000);
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState("default");
  const [searchQ, setSearchQ] = useState("");

  // Login
  const [userId, setUserId] = useState("");
  const [userPass, setUserPass] = useState("");
  const [loginStatus, setLoginStatus] = useState(null);

  const toastTimer = useRef(null);
  const carouselRef = useRef(null);

  // ── FETCH ──────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    fetch(API_URL)
      .then((r) => r.json())
      .then((data) => {
        // dummyjson wraps products in { products: [...], total, skip, limit }
        const products = data.products || data;
        setAllProducts(products);

        // Extract unique categories from actual data
        const cats = [...new Set(products.map((p) => p.category))];
        setApiCategories(cats);
        setCheckedCats(cats); // all checked by default

        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch products");
        setLoading(false);
      });
  }, []);

  // ── FILTERED PRODUCTS ──────────────────────────────────────
  // dummyjson: p.rating is a plain number, p.thumbnail is the image
  const filtered = useCallback(() => {
    let res = [...allProducts];
    if (checkedCats.length < apiCategories.length) {
      res = res.filter((p) => checkedCats.includes(p.category));
    }
    res = res.filter((p) => p.price <= maxPrice);
    if (minRating > 0) res = res.filter((p) => p.rating >= minRating);
    if (searchQ) {
      const q = searchQ.toLowerCase();
      res = res.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }
    if (sort === "price-asc") res.sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") res.sort((a, b) => b.price - a.price);
    else if (sort === "rating") res.sort((a, b) => b.rating - a.rating);
    return res;
  }, [allProducts, checkedCats, apiCategories, maxPrice, minRating, sort, searchQ]);

  const displayProducts = filtered();
  const cartItems = Object.values(cart);
  const cartCount = cartItems.reduce((s, c) => s + c.qty, 0);
  const cartTotal = cartItems.reduce(
    (s, { product: p, qty }) => s + p.price * qty,
    0
  );

  // ── CART ACTIONS ───────────────────────────────────────────
  function addToCart(product) {
    setCart((prev) => ({
      ...prev,
      [product.id]: prev[product.id]
        ? { ...prev[product.id], qty: prev[product.id].qty + 1 }
        : { product, qty: 1 },
    }));
    showToast(`"${product.title.slice(0, 24)}..." added!`);
  }

  function changeQty(id, delta) {
    setCart((prev) => {
      const updated = { ...prev };
      if (!updated[id]) return prev;
      updated[id] = { ...updated[id], qty: updated[id].qty + delta };
      if (updated[id].qty <= 0) delete updated[id];
      return updated;
    });
  }

  function removeItem(id) {
    setCart((prev) => {
      const n = { ...prev };
      delete n[id];
      return n;
    });
  }

  // ── TOAST ──────────────────────────────────────────────────
  function showToast(msg) {
    clearTimeout(toastTimer.current);
    setToast({ show: true, msg });
    toastTimer.current = setTimeout(
      () => setToast({ show: false, msg: "" }),
      2600
    );
  }

  // ── LOGIN ──────────────────────────────────────────────────
  function handleLogin() {
    setLoginStatus(null);
    if (userId.trim().length !== 8 || !userPass.trim()) {
      setLoginStatus("err");
      return;
    }
    setLoginStatus("ok");
    setTimeout(() => {
      setPage("shop");
      setLoginStatus(null);
    }, 1500);
  }

  // ── CATEGORY CHECKBOX ──────────────────────────────────────
  function toggleCat(cat) {
    setCheckedCats((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  function toggleAllCats() {
    setCheckedCats((prev) =>
      prev.length === apiCategories.length ? [] : [...apiCategories]
    );
  }

  function resetFilters() {
    setCheckedCats([...apiCategories]);
    setMaxPrice(2000);
    setMinRating(0);
    setSort("default");
    setSearchQ("");
  }

  // ── HELPERS ────────────────────────────────────────────────
  // dummyjson rating is 0-5 plain number
  function stars(rate) {
    const rounded = Math.round(rate);
    return "★".repeat(rounded) + "☆".repeat(5 - rounded);
  }

  // dummyjson image: p.thumbnail or p.images[0]
  function getImage(p) {
    return p.thumbnail || (p.images && p.images[0]) || "";
  }

  // Format category label nicely
  function fmtCat(cat) {
    return cat
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  // ─────────────────────────────── STYLES ────────────────────
  const css = {
    app: {
      fontFamily: "'Outfit', sans-serif",
      background: "#f8f7f4",
      minHeight: "100vh",
      color: "#1a1a1a",
    },
    nav: {
      background: "#fff",
      borderBottom: "1px solid #e8e4de",
      padding: "0 2rem",
      height: 65,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      position: "sticky",
      top: 0,
      zIndex: 200,
      boxShadow: "0 1px 8px rgba(0,0,0,.06)",
    },
    logo: {
      fontFamily: "'Fraunces', serif",
      fontSize: "1.6rem",
      fontWeight: 700,
      color: "#0f1e2d",
      cursor: "pointer",
      letterSpacing: ".5px",
    },
    logoSpan: { color: "#f97316" },
    navLinks: { display: "flex", gap: ".2rem", marginLeft: "2rem" },
    navLink: (active) => ({
      background: "none",
      border: "none",
      fontFamily: "'Outfit', sans-serif",
      fontSize: ".95rem",
      fontWeight: active ? 600 : 500,
      color: active ? "#2563eb" : "#6b7280",
      padding: ".4rem .85rem",
      borderRadius: 6,
      cursor: "pointer",
      borderBottom: active ? "2px solid #2563eb" : "2px solid transparent",
    }),
    searchBar: {
      display: "flex",
      alignItems: "center",
      background: "#f8f7f4",
      border: "1.5px solid #e8e4de",
      borderRadius: 30,
      overflow: "hidden",
      width: 260,
    },
    searchInput: {
      border: "none",
      background: "transparent",
      padding: ".5rem 1rem",
      fontFamily: "'Outfit', sans-serif",
      fontSize: ".88rem",
      outline: "none",
      color: "#1a1a1a",
      width: "100%",
    },
    searchBtn: {
      background: "#2563eb",
      border: "none",
      color: "#fff",
      padding: ".52rem 1rem",
      cursor: "pointer",
      fontSize: "1rem",
    },
    cartBtn: {
      position: "relative",
      background: "none",
      border: "none",
      cursor: "pointer",
      fontSize: "1.45rem",
      padding: ".3rem",
      color: "#0f1e2d",
      lineHeight: 1,
    },
    cartBadge: {
      position: "absolute",
      top: -3,
      right: -5,
      background: "#f97316",
      color: "#fff",
      fontSize: ".62rem",
      fontWeight: 700,
      borderRadius: "50%",
      width: 18,
      height: 18,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: "2px solid #fff",
    },
    hero: {
      background:
        "linear-gradient(135deg,#e8f0fe 0%,#f0f4ff 50%,#faf5ff 100%)",
      padding: "5rem 2rem",
      textAlign: "center",
      minHeight: 380,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "1.5rem",
    },
    heroBadge: {
      background: "rgba(37,99,235,.1)",
      color: "#2563eb",
      fontSize: ".76rem",
      fontWeight: 600,
      letterSpacing: ".08em",
      textTransform: "uppercase",
      padding: ".35rem 1rem",
      borderRadius: 30,
      border: "1px solid rgba(37,99,235,.2)",
    },
    heroH1: {
      fontFamily: "'Fraunces', serif",
      fontSize: "clamp(2.4rem,5vw,3.8rem)",
      fontWeight: 700,
      color: "#0f1e2d",
      lineHeight: 1.1,
    },
    heroSpan: { color: "#f97316", fontStyle: "italic" },
    heroP: {
      fontSize: "1.05rem",
      color: "#6b7280",
      maxWidth: 480,
      fontWeight: 300,
    },
    heroCta: {
      background: "#0f1e2d",
      color: "#fff",
      border: "none",
      fontFamily: "'Outfit', sans-serif",
      fontSize: "1rem",
      fontWeight: 600,
      padding: ".85rem 2.2rem",
      borderRadius: 50,
      cursor: "pointer",
    },
    features: {
      background: "#fff",
      borderTop: "1px solid #e8e4de",
      borderBottom: "1px solid #e8e4de",
      padding: "2.5rem 2rem",
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
      gap: "1.5rem",
      textAlign: "center",
    },
    section: { padding: "3rem 2rem" },
    sectionTitle: {
      textAlign: "center",
      fontFamily: "'Fraunces', serif",
      fontSize: "2rem",
      fontWeight: 600,
      color: "#0f1e2d",
    },
    underline: {
      width: 48,
      height: 3,
      background: "#2563eb",
      margin: ".6rem auto 0",
      borderRadius: 3,
    },
    carouselWrap: { position: "relative", marginTop: "2rem" },
    carousel: {
      display: "flex",
      gap: "1.5rem",
      overflowX: "auto",
      scrollSnapType: "x mandatory",
      scrollbarWidth: "none",
      padding: ".5rem .5rem 1rem",
    },
    cBtn: (side) => ({
      position: "absolute",
      top: "45%",
      transform: "translateY(-50%)",
      [side]: 0,
      background: "#2563eb",
      color: "#fff",
      border: "none",
      borderRadius: "50%",
      width: 38,
      height: 38,
      fontSize: "1.2rem",
      cursor: "pointer",
      zIndex: 10,
      boxShadow: "0 2px 12px rgba(0,0,0,.15)",
    }),
    tCard: {
      minWidth: 250,
      scrollSnapAlign: "start",
      background: "#fff",
      borderRadius: 16,
      border: "1px solid #e8e4de",
      overflow: "hidden",
      flexShrink: 0,
      position: "relative",
    },
    tImg: {
      height: 160,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#f1f5f9",
      padding: "1rem",
      overflow: "hidden",
    },
    tImgEl: { maxHeight: 130, maxWidth: "100%", objectFit: "contain" },
    tBody: { padding: "1rem" },
    shopLayout: { display: "flex", minHeight: "calc(100vh - 65px)" },
    sidebar: {
      width: 270,
      flexShrink: 0,
      background: "#fff",
      borderRight: "1px solid #e8e4de",
      padding: "1.5rem",
      position: "sticky",
      top: 65,
      height: "calc(100vh - 65px)",
      overflowY: "auto",
    },
    fLabel: {
      fontSize: ".7rem",
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: ".1em",
      color: "#6b7280",
      display: "block",
      marginBottom: ".8rem",
    },
    checkRow: {
      display: "flex",
      alignItems: "center",
      gap: ".6rem",
      marginBottom: ".5rem",
      cursor: "pointer",
      fontSize: ".88rem",
    },
    applyBtn: {
      width: "100%",
      background: "#2563eb",
      color: "#fff",
      border: "none",
      borderRadius: 10,
      padding: ".7rem",
      fontFamily: "'Outfit', sans-serif",
      fontSize: ".9rem",
      fontWeight: 600,
      cursor: "pointer",
      marginTop: ".5rem",
    },
    resetBtn: {
      width: "100%",
      background: "none",
      color: "#6b7280",
      border: "1px solid #e8e4de",
      borderRadius: 10,
      padding: ".55rem",
      fontFamily: "'Outfit', sans-serif",
      fontSize: ".83rem",
      cursor: "pointer",
      marginTop: ".5rem",
    },
    shopMain: { flex: 1, padding: "1.5rem 2rem" },
    shopTitle: {
      fontFamily: "'Fraunces', serif",
      fontSize: "1.8rem",
      fontWeight: 700,
      color: "#0f1e2d",
    },
    sortSel: {
      padding: ".55rem 1.1rem",
      border: "1.5px solid #e8e4de",
      borderRadius: 8,
      fontFamily: "'Outfit', sans-serif",
      fontSize: ".88rem",
      background: "#fff",
      outline: "none",
      cursor: "pointer",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
      gap: "1.4rem",
    },
    card: {
      background: "#fff",
      borderRadius: 16,
      border: "1px solid #e8e4de",
      overflow: "hidden",
      position: "relative",
    },
    cardImg: {
      height: 185,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#f8fafc",
      padding: "1.2rem",
      overflow: "hidden",
    },
    cardImgEl: { maxHeight: 145, maxWidth: "100%", objectFit: "contain" },
    cardBody: { padding: "1rem 1.1rem" },
    cardCat: {
      fontSize: ".67rem",
      textTransform: "uppercase",
      letterSpacing: ".1em",
      color: "#2563eb",
      fontWeight: 700,
      marginBottom: ".3rem",
    },
    cardName: {
      fontWeight: 600,
      fontSize: ".88rem",
      color: "#0f1e2d",
      marginBottom: ".4rem",
      lineHeight: 1.35,
      display: "-webkit-box",
      WebkitLineClamp: 2,
      WebkitBoxOrient: "vertical",
      overflow: "hidden",
    },
    cardStars: { fontSize: ".75rem", color: "#f59e0b", marginBottom: ".45rem" },
    cardPrice: {
      fontFamily: "'Fraunces', serif",
      fontSize: "1.1rem",
      fontWeight: 700,
      color: "#0f1e2d",
      marginBottom: ".85rem",
    },
    addBtn: {
      width: "100%",
      background: "transparent",
      color: "#0f1e2d",
      border: "2px solid #0f1e2d",
      borderRadius: 10,
      padding: ".58rem",
      fontFamily: "'Outfit', sans-serif",
      fontSize: ".87rem",
      fontWeight: 600,
      cursor: "pointer",
    },
    stepper: {
      display: "flex",
      alignItems: "center",
      background: "#0f1e2d",
      borderRadius: 10,
      overflow: "hidden",
      width: "100%",
    },
    sBtn: {
      background: "none",
      border: "none",
      color: "#fff",
      fontSize: "1.15rem",
      fontWeight: 700,
      padding: ".52rem .9rem",
      cursor: "pointer",
      lineHeight: 1,
    },
    sNum: {
      color: "#fff",
      fontWeight: 700,
      fontSize: ".95rem",
      flex: 1,
      textAlign: "center",
      padding: ".56rem 0",
      fontFamily: "'Outfit', sans-serif",
    },
    loginPage: {
      minHeight: "calc(100vh - 65px)",
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "center",
      padding: "3rem 1rem",
    },
    loginCard: {
      background: "#fff",
      borderRadius: 20,
      padding: "2.8rem 2.5rem",
      width: "100%",
      maxWidth: 460,
      border: "1px solid #e8e4de",
      boxShadow: "0 4px 28px rgba(0,0,0,.07)",
    },
    formGroup: { marginBottom: "1.4rem" },
    formLabel: {
      display: "block",
      fontWeight: 600,
      fontSize: ".87rem",
      color: "#1a1a1a",
      marginBottom: ".5rem",
    },
    formInput: {
      width: "100%",
      padding: ".75rem 1rem",
      border: "1.5px solid #e8e4de",
      borderRadius: 10,
      fontFamily: "'Outfit', sans-serif",
      fontSize: ".95rem",
      outline: "none",
    },
    loginBtn: {
      width: "100%",
      background: "#2563eb",
      color: "#fff",
      border: "none",
      borderRadius: 10,
      padding: ".85rem",
      fontFamily: "'Outfit', sans-serif",
      fontSize: "1rem",
      fontWeight: 700,
      cursor: "pointer",
      marginTop: ".5rem",
    },
    overlay: (open) => ({
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,.45)",
      zIndex: 300,
      opacity: open ? 1 : 0,
      pointerEvents: open ? "all" : "none",
      transition: "opacity .3s",
      display: "flex",
      justifyContent: "flex-end",
    }),
    drawer: (open) => ({
      background: "#fff",
      width: 380,
      maxWidth: "95vw",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      transform: open ? "translateX(0)" : "translateX(100%)",
      transition: "transform .35s cubic-bezier(.4,0,.2,1)",
      boxShadow: "-4px 0 30px rgba(0,0,0,.12)",
    }),
    cartHead: {
      background: "#0f1e2d",
      color: "#fff",
      padding: "1.2rem 1.5rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    },
    cartClose: {
      background: "none",
      border: "none",
      color: "#fff",
      fontSize: "1.5rem",
      cursor: "pointer",
      opacity: 0.7,
      lineHeight: 1,
    },
    cRow: {
      display: "flex",
      gap: ".8rem",
      alignItems: "center",
      padding: ".75rem",
      background: "#f8f7f4",
      borderRadius: 12,
      border: "1px solid #e8e4de",
      marginBottom: ".7rem",
    },
    toast: (show) => ({
      position: "fixed",
      bottom: "2rem",
      right: "2rem",
      background: "#0f1e2d",
      color: "#fff",
      padding: ".72rem 1.3rem",
      borderRadius: 10,
      fontSize: ".85rem",
      fontWeight: 500,
      boxShadow: "0 4px 20px rgba(0,0,0,.2)",
      zIndex: 999,
      transform: show ? "translateY(0)" : "translateY(60px)",
      opacity: show ? 1 : 0,
      transition: "all .35s cubic-bezier(.4,0,.2,1)",
      pointerEvents: "none",
      display: "flex",
      alignItems: "center",
      gap: ".5rem",
    }),
    tDot: {
      width: 7,
      height: 7,
      background: "#f97316",
      borderRadius: "50%",
      flexShrink: 0,
    },
  };

  // ─────────────────────────────── RENDER ────────────────────
  return (
    <div style={css.app}>

      {/* ── NAV ─────────────────────────────────────────── */}
      <nav style={css.nav}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={css.logo} onClick={() => setPage("home")}>
            A<span style={css.logoSpan}>j</span>eo
          </span>
          <div style={css.navLinks}>
            {["home", "shop", "login"].map((p) => (
              <button
                key={p}
                style={css.navLink(page === p)}
                onClick={() => setPage(p)}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={css.searchBar}>
            <input
              style={css.searchInput}
              placeholder="Search Ajeo..."
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value.toLowerCase())}
              onKeyDown={(e) => e.key === "Enter" && setPage("shop")}
            />
            <button style={css.searchBtn} onClick={() => setPage("shop")}>
              🔍
            </button>
          </div>
          <button style={css.cartBtn} onClick={() => setCartOpen(true)}>
            🛒
            {cartCount > 0 && (
              <span style={css.cartBadge}>{cartCount}</span>
            )}
          </button>
        </div>
      </nav>

      {/* ── HOME PAGE ───────────────────────────────────── */}
      {page === "home" && (
        <div>
          <div style={css.hero}>
            <div style={css.heroBadge}>✨ New Season Collection</div>
            <h1 style={css.heroH1}>
              Welcome to <span style={css.heroSpan}>Ajeo</span>
            </h1>
            <p style={css.heroP}>
              Modern essentials delivered to your doorstep. Simple. Fast.
              Reliable.
            </p>
            <button style={css.heroCta} onClick={() => setPage("shop")}>
              Explore Collections →
            </button>
          </div>

          <div style={css.features}>
            {[
              ["🚚", "Free Shipping", "On orders over $50"],
              ["🔄", "Easy Returns", "30-day return policy"],
              ["🔒", "Secure Payments", "100% protected"],
              ["💬", "24/7 Support", "Always here to help"],
            ].map(([icon, title, sub]) => (
              <div key={title}>
                <div style={{ fontSize: "2rem", marginBottom: ".5rem" }}>
                  {icon}
                </div>
                <div style={{ fontWeight: 600, fontSize: ".9rem", color: "#0f1e2d" }}>
                  {title}
                </div>
                <div style={{ fontSize: ".78rem", color: "#6b7280", marginTop: ".2rem" }}>
                  {sub}
                </div>
              </div>
            ))}
          </div>

          <div style={css.section}>
            <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
              <h2 style={css.sectionTitle}>Trending Now</h2>
              <div style={css.underline} />
              <p style={{ marginTop: ".5rem", color: "#6b7280", fontSize: ".9rem" }}>
                Hand-picked products everyone's loving
              </p>
            </div>
            <div style={css.carouselWrap}>
              <button
                style={css.cBtn("left")}
                onClick={() =>
                  carouselRef.current?.scrollBy({ left: -270, behavior: "smooth" })
                }
              >
                ‹
              </button>
              <div ref={carouselRef} style={css.carousel}>
                {loading
                  ? Array(4)
                      .fill(0)
                      .map((_, i) => (
                        <div key={i} style={{ ...css.tCard, opacity: 0.6 }}>
                          <div style={{ ...css.tImg, background: "#ede9e3" }} />
                          <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: 8 }}>
                            {[50, 80, 60].map((w, j) => (
                              <div key={j} style={{ height: 11, borderRadius: 6, background: "#ede9e3", width: `${w}%` }} />
                            ))}
                          </div>
                        </div>
                      ))
                  : allProducts.slice(0, 10).map((p) => (
                      <div key={p.id} style={css.tCard}>
                        {p.id % 3 === 0 && (
                          <div style={{ position: "absolute", top: 10, left: 10, background: "#2563eb", color: "#fff", fontSize: ".68rem", fontWeight: 700, padding: ".22rem .55rem", borderRadius: 20, textTransform: "uppercase", zIndex: 1 }}>
                            New
                          </div>
                        )}
                        <div style={css.tImg}>
                          <img
                            src={getImage(p)}
                            alt={p.title}
                            style={css.tImgEl}
                            loading="lazy"
                          />
                        </div>
                        <div style={css.tBody}>
                          <div style={{ fontSize: ".68rem", textTransform: "uppercase", letterSpacing: ".1em", color: "#2563eb", fontWeight: 700, marginBottom: ".3rem" }}>
                            {fmtCat(p.category)}
                          </div>
                          <div style={{ fontWeight: 600, fontSize: ".88rem", color: "#0f1e2d", marginBottom: ".4rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {p.title}
                          </div>
                          <div style={{ fontSize: ".75rem", color: "#f59e0b", marginBottom: ".5rem" }}>
                            {stars(p.rating)}{" "}
                            <span style={{ color: "#6b7280" }}>{p.rating}</span>
                          </div>
                          <div style={{ fontFamily: "'Fraunces', serif", fontSize: "1.1rem", fontWeight: 700, color: "#0f1e2d", marginBottom: ".8rem" }}>
                            ${p.price.toFixed(2)}
                          </div>
                          <button
                            style={{ width: "100%", background: "#0f1e2d", color: "#fff", border: "none", borderRadius: 8, padding: ".55rem", fontFamily: "'Outfit', sans-serif", fontSize: ".86rem", fontWeight: 600, cursor: "pointer" }}
                            onClick={() => addToCart(p)}
                          >
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    ))}
              </div>
              <button
                style={css.cBtn("right")}
                onClick={() =>
                  carouselRef.current?.scrollBy({ left: 270, behavior: "smooth" })
                }
              >
                ›
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SHOP PAGE ───────────────────────────────────── */}
      {page === "shop" && (
        <div style={css.shopLayout}>
          {/* Sidebar */}
          <aside style={css.sidebar}>
            <h3 style={{ fontWeight: 700, fontSize: "1rem", color: "#0f1e2d", marginBottom: "1.3rem" }}>
              Filters
            </h3>

            {/* Category */}
            <div style={{ marginBottom: "1.8rem" }}>
              <span style={css.fLabel}>Category</span>
              {/* Select All toggle */}
              <label style={{ ...css.checkRow, marginBottom: ".8rem", fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={checkedCats.length === apiCategories.length}
                  onChange={toggleAllCats}
                  style={{ accentColor: "#2563eb", width: 15, height: 15, cursor: "pointer" }}
                />
                All Categories
              </label>
              <div style={{ maxHeight: 200, overflowY: "auto", paddingRight: ".3rem" }}>
                {apiCategories.map((cat) => (
                  <label key={cat} style={css.checkRow}>
                    <input
                      type="checkbox"
                      checked={checkedCats.includes(cat)}
                      onChange={() => toggleCat(cat)}
                      style={{ accentColor: "#2563eb", width: 15, height: 15, cursor: "pointer" }}
                    />
                    {fmtCat(cat)}
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div style={{ marginBottom: "1.8rem" }}>
              <span style={css.fLabel}>Price Range</span>
              <input
                type="range"
                min="0"
                max="2000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#2563eb", cursor: "pointer" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".8rem", color: "#6b7280" }}>
                <span>$0</span>
                <span>${maxPrice}</span>
              </div>
            </div>

            {/* Rating */}
            <div style={{ marginBottom: "1.8rem" }}>
              <span style={css.fLabel}>Rating</span>
              {[
                [0, "All"],
                [4, "★ 4+ Stars"],
                [4.5, "★ 4.5+ Stars"],
              ].map(([val, label]) => (
                <label key={val} style={css.checkRow}>
                  <input
                    type="radio"
                    name="rating"
                    checked={minRating === val}
                    onChange={() => setMinRating(val)}
                    style={{ accentColor: "#2563eb", cursor: "pointer" }}
                  />
                  {label}
                </label>
              ))}
            </div>

            <button style={css.resetBtn} onClick={resetFilters}>
              Reset All
            </button>
          </aside>

          {/* Main grid */}
          <div style={css.shopMain}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: ".8rem" }}>
              <div style={css.shopTitle}>
                All Items{" "}
                <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: "1.05rem", fontWeight: 400, color: "#6b7280", marginLeft: ".5rem" }}>
                  ({displayProducts.length})
                </span>
              </div>
              <select
                style={css.sortSel}
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="default">Sort: Default</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>

            {/* Skeletons */}
            {loading && (
              <div style={css.grid}>
                {Array(8)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} style={{ background: "#fff", borderRadius: 16, border: "1px solid #e8e4de", overflow: "hidden" }}>
                      <div style={{ height: 185, background: "linear-gradient(90deg,#ede9e3 25%,#f5f3ef 50%,#ede9e3 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
                      <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: 8 }}>
                        {[45, 75, 75, 40].map((w, j) => (
                          <div key={j} style={{ height: 11, borderRadius: 6, background: "#ede9e3", width: `${w}%` }} />
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {error && (
              <p style={{ color: "#ef4444", fontWeight: 600, textAlign: "center", padding: "2rem" }}>
                {error}
              </p>
            )}

            {!loading && !error && displayProducts.length === 0 && (
              <div style={{ textAlign: "center", padding: "4rem", color: "#6b7280" }}>
                <div style={{ fontSize: "3rem" }}>🔍</div>
                <h3 style={{ marginTop: "1rem", color: "#1a1a1a" }}>
                  No products found
                </h3>
                <p>Try adjusting your filters or search.</p>
              </div>
            )}

            {!loading && !error && (
              <div style={css.grid}>
                {displayProducts.map((p) => {
                  const inCart = cart[p.id];
                  const isNew = p.id % 3 === 0;
                  const isSale = p.id % 4 === 0 && !isNew;
                  return (
                    <div key={p.id} style={css.card}>
                      {isNew && (
                        <div style={{ position: "absolute", top: 10, left: 10, background: "#2563eb", color: "#fff", fontSize: ".66rem", fontWeight: 700, padding: ".22rem .55rem", borderRadius: 20, textTransform: "uppercase", zIndex: 1 }}>
                          New
                        </div>
                      )}
                      {isSale && (
                        <div style={{ position: "absolute", top: 10, left: 10, background: "#ef4444", color: "#fff", fontSize: ".66rem", fontWeight: 700, padding: ".22rem .55rem", borderRadius: 20, textTransform: "uppercase", zIndex: 1 }}>
                          Sale
                        </div>
                      )}
                      <div style={css.cardImg}>
                        <img
                          src={getImage(p)}
                          alt={p.title}
                          style={css.cardImgEl}
                          loading="lazy"
                        />
                      </div>
                      <div style={css.cardBody}>
                        <div style={css.cardCat}>{fmtCat(p.category)}</div>
                        <div style={css.cardName}>{p.title}</div>
                        {/* dummyjson: p.rating is a plain number */}
                        <div style={css.cardStars}>
                          {stars(p.rating)}{" "}
                          <span style={{ color: "#6b7280", fontSize: ".75rem" }}>
                            {p.rating} ({p.stock} in stock)
                          </span>
                        </div>
                        <div style={css.cardPrice}>${p.price.toFixed(2)}</div>

                        {/* ADD BTN ↔ QTY STEPPER */}
                        {!inCart ? (
                          <button
                            style={css.addBtn}
                            onClick={() => addToCart(p)}
                          >
                            Add to Cart
                          </button>
                        ) : (
                          <div style={css.stepper}>
                            <button
                              style={css.sBtn}
                              onClick={() => changeQty(p.id, -1)}
                            >
                              −
                            </button>
                            <span style={css.sNum}>{inCart.qty}</span>
                            <button
                              style={css.sBtn}
                              onClick={() => changeQty(p.id, 1)}
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── LOGIN PAGE ──────────────────────────────────── */}
      {page === "login" && (
        <div style={css.loginPage}>
          <div style={css.loginCard}>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "2rem", fontWeight: 700, color: "#0f1e2d", marginBottom: ".3rem" }}>
              Welcome back
            </h2>
            <p style={{ color: "#6b7280", fontSize: ".9rem", marginBottom: "2rem" }}>
              Sign in to your Ajeo account
            </p>
            {loginStatus === "err" && (
              <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#dc2626", fontSize: ".84rem", padding: ".65rem 1rem", borderRadius: 8, marginBottom: "1rem" }}>
                Invalid User ID or password.
              </div>
            )}
            {loginStatus === "ok" && (
              <div style={{ background: "#f0fdf4", border: "1px solid #86efac", color: "#16a34a", fontSize: ".84rem", padding: ".65rem 1rem", borderRadius: 8, marginBottom: "1rem" }}>
                ✓ Login successful! Redirecting...
              </div>
            )}
            <div style={css.formGroup}>
              <label style={css.formLabel}>User Id:</label>
              <input
                style={css.formInput}
                type="text"
                placeholder="8 digit User Id"
                maxLength={8}
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
            </div>
            <div style={css.formGroup}>
              <label style={css.formLabel}>Password:</label>
              <input
                style={css.formInput}
                type="password"
                placeholder="Enter password"
                value={userPass}
                onChange={(e) => setUserPass(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
            <button style={css.loginBtn} onClick={handleLogin}>
              Login
            </button>
            <div style={{ textAlign: "center", marginTop: "1.5rem", fontSize: ".88rem", color: "#6b7280" }}>
              Don't have an account?{" "}
              <span
                style={{ color: "#2563eb", fontWeight: 600, cursor: "pointer" }}
                onClick={() => showToast("Sign up coming soon!")}
              >
                Signup
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── CART DRAWER ─────────────────────────────────── */}
      <div
        style={css.overlay(cartOpen)}
        onClick={(e) => e.target === e.currentTarget && setCartOpen(false)}
      >
        <div style={css.drawer(cartOpen)}>
          <div style={css.cartHead}>
            <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: "1.2rem" }}>
              My Cart
            </h3>
            <button style={css.cartClose} onClick={() => setCartOpen(false)}>
              ✕
            </button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "1rem" }}>
            {cartItems.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 200, color: "#6b7280", gap: ".5rem" }}>
                <span style={{ fontSize: "3rem", opacity: 0.35 }}>🛒</span>
                <p>Your cart is empty</p>
              </div>
            ) : (
              cartItems.map(({ product: p, qty }) => (
                <div key={p.id} style={css.cRow}>
                  <img
                    src={getImage(p)}
                    alt={p.title}
                    style={{ width: 54, height: 54, objectFit: "contain", background: "#fff", borderRadius: 8, padding: 4, flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: ".8rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#0f1e2d" }}>
                      {p.title}
                    </div>
                    <div style={{ fontSize: ".84rem", fontWeight: 700, color: "#2563eb", marginTop: ".15rem" }}>
                      ${(p.price * qty).toFixed(2)}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: ".35rem", marginTop: ".4rem" }}>
                      <button
                        onClick={() => changeQty(p.id, -1)}
                        style={{ width: 22, height: 22, borderRadius: "50%", border: "1px solid #e8e4de", background: "#fff", cursor: "pointer", fontWeight: 700, fontSize: ".85rem", display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        −
                      </button>
                      <span style={{ fontSize: ".85rem", fontWeight: 700, minWidth: 18, textAlign: "center" }}>
                        {qty}
                      </span>
                      <button
                        onClick={() => changeQty(p.id, 1)}
                        style={{ width: 22, height: 22, borderRadius: "50%", border: "1px solid #e8e4de", background: "#fff", cursor: "pointer", fontWeight: 700, fontSize: ".85rem", display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(p.id)}
                    style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: "1rem", flexShrink: 0 }}
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
          {cartItems.length > 0 && (
            <div style={{ padding: "1.2rem 1.5rem", borderTop: "1px solid #e8e4de" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "1rem", marginBottom: "1rem", color: "#0f1e2d" }}>
                <span>Total</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <button
                style={{ width: "100%", background: "#f97316", color: "#fff", border: "none", borderRadius: 10, padding: ".85rem", fontFamily: "'Outfit', sans-serif", fontSize: ".95rem", fontWeight: 700, cursor: "pointer" }}
              >
                Checkout →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── TOAST ───────────────────────────────────────── */}
      <div style={css.toast(toast.show)}>
        <span style={css.tDot} />
        {toast.msg}
      </div>

      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </div>
  );
}