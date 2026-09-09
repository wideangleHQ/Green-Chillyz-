"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Search,
  Heart,
  MapPin,
  ChevronDown,
  ChevronRight,
  X,
  Share2,
  Sparkles,
  Compass,
  Star,
  Clock,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Award,
  Utensils,
  Flame,
  Package,
  Soup,
  Pizza,
  Leaf,
  UtensilsCrossed,
  Cake,
  CupSoda,
  Bell
} from "lucide-react";

import { useActiveStores, useNearbyStores } from "@/hooks/useStores";
import { useStoreMenu, useFeaturedDishes, useMenuCategories } from "@/hooks/useMenu";
import { formatCoins } from "@/types/wallet";
import { useWalletSummary } from "@/hooks/useWallet";
import { useAuth } from "@/components/auth/AuthContext";
import type { Dish, MenuQueryParams, MenuCategory } from "@/types/menu";
import type { Store } from "@/types/store";
import type { AuthUser } from "@/types/auth";
import { Footer } from "@/components/footer/Footer";
import { RupeeCoin } from "@/components/ui/RupeeCoin";

// Helper function to extract area from store name
function getStoreArea(store: Store): string {
  if (store.name.startsWith(store.brandName)) {
    const area = store.name.slice(store.brandName.length).trim();
    if (area) return area;
  }
  return store.city;
}

// Normalize brand names for grouping
function getNormalizedBrand(brandName: string): string {
  const lower = (brandName || "").toLowerCase();
  if (lower.includes("yellow")) return "YellowChillyz";
  if (lower.includes("golden")) return "GoldenChillyz";
  return "GreenChillyz";
}

// Lightweight debounce utility to prevent typing lag
function debounce<T extends (...args: any[]) => void>(func: T, wait: number) {
  let timeout: NodeJS.Timeout | null = null;
  const debounced = (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
  debounced.cancel = () => {
    if (timeout) clearTimeout(timeout);
  };
  return debounced;
}

const CATEGORY_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  "Recommended": Award,
  "Meals": Utensils,
  "Starters": Flame,
  "Combos": Package,
  "Chinese": Soup,
  "Pizza": Pizza,
  "Rice": Leaf,
  "Noodles": UtensilsCrossed,
  "Desserts": Cake,
  "Beverages": CupSoda,
};

const FALLBACK_CATEGORIES = [
  "Recommended",
  "Meals",
  "Starters",
  "Combos",
  "Chinese",
  "Pizza",
  "Rice",
  "Noodles",
  "Desserts",
  "Beverages",
];

const SEARCH_PLACEHOLDERS = [
  "Search Paneer",
  "Search Pizza",
  "Search Biryani",
  "Search Chicken",
  "Search Noodles",
];

// Optimized Search Input Component to prevent parent re-renders on keystroke
interface SearchInputProps {
  onSearchChange: (val: string) => void;
}

const SearchInput = memo(({ onSearchChange }: SearchInputProps) => {
  const [localValue, setLocalValue] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // Search Placeholder Rotator
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % SEARCH_PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const debouncedOnChange = useRef(
    debounce((val: string) => {
      onSearchChange(val);
    }, 300)
  ).current;

  useEffect(() => {
    return () => {
      debouncedOnChange.cancel();
    };
  }, [debouncedOnChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalValue(val);
    debouncedOnChange(val);
  };

  const handleClear = () => {
    setLocalValue("");
    onSearchChange("");
  };

  return (
    <div className="relative flex items-center bg-white rounded-full border border-stone-200/80 px-5 py-2 shadow-soft hover:shadow-hover transition-all duration-300">
      <Search className="size-5 text-stone-400 shrink-0" />
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        className="w-full py-2 pl-3 pr-4 bg-transparent text-sm text-stone-800 placeholder-stone-400 outline-none"
        placeholder={SEARCH_PLACEHOLDERS[placeholderIndex]}
      />
      {localValue && (
        <button
          onClick={handleClear}
          className="p-1 rounded-full hover:bg-stone-100 text-stone-400 transition cursor-pointer"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
});
SearchInput.displayName = "SearchInput";

export default function MenuPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { data: walletSummary } = useWalletSummary(isAuthenticated);

  // States
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [isOutletOpen, setIsOutletOpen] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Recommended");
  const [selectedDishId, setSelectedDishId] = useState<string | null>(null);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  // Filters State
  const [filters, setFilters] = useState({
    veg: false,
    nonVeg: false,
    bestseller: false,
    new: false,
    spicy: false,
    available: false,
  });

  // Load wishlist from localstorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("gch-wishlist");
      if (stored) {
        try {
          setWishlist(JSON.parse(stored));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  // Sync wishlist to localstorage
  const toggleWishlist = useCallback((dishId: string) => {
    setWishlist((prev) => {
      const updated = prev.includes(dishId)
        ? prev.filter((id) => id !== dishId)
        : [...prev, dishId];
      localStorage.setItem("gch-wishlist", JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Fetch menu categories from API
  const { data: apiCategories } = useMenuCategories();

  // Derive unique category objects for the selected store/brand
  const categoryObjects = useMemo(() => {
    if (!apiCategories || apiCategories.length === 0) {
      // Return fallback as objects with synthetic IDs
      return FALLBACK_CATEGORIES.map((name, idx) => ({
        id: `fallback-${idx}`,
        name,
        slug: name.toLowerCase(),
        sortOrder: idx,
        status: 'ACTIVE' as const,
        description: null,
        image: null,
        icon: null,
      }));
    }

    // Filter by selected store's brand if available
    let filteredCategories = apiCategories.filter((c) => c.status === "ACTIVE");
    
    // If we have a selected store with a brandName, filter categories to that brand
    if (selectedStore?.brandName) {
      const storeBrandNormalized = getNormalizedBrand(selectedStore.brandName);
      
      // Group categories by name to identify which ones exist for the selected brand
      const categoriesByName = new Map<string, MenuCategory[]>();
      filteredCategories.forEach((cat) => {
        const list = categoriesByName.get(cat.name) || [];
        list.push(cat);
        categoriesByName.set(cat.name, list);
      });

      // For each category name, prefer the one matching the current brand
      const uniqueCategories: MenuCategory[] = [];
      categoriesByName.forEach((cats, name) => {
        // Try to find a category that belongs to the current brand
        // Note: We would need brandId on the category object to do exact matching
        // For now, we'll take the first one found (all have same name, different IDs)
        // This prevents duplicates while allowing brand-specific categories
        uniqueCategories.push(cats[0]);
      });

      filteredCategories = uniqueCategories;
    } else {
      // No selected store yet - remove duplicates by name, keeping first occurrence
      const seen = new Set<string>();
      filteredCategories = filteredCategories.filter((c) => {
        if (seen.has(c.name)) return false;
        seen.add(c.name);
        return true;
      });
    }

    const sorted = filteredCategories.sort((a, b) => a.sortOrder - b.sortOrder);
    
    // Add synthetic "Recommended" category at the start
    const recommended = {
      id: 'recommended',
      name: 'Recommended',
      slug: 'recommended',
      sortOrder: -1,
      status: 'ACTIVE' as const,
      description: null,
      image: null,
      icon: null,
    };

    return [recommended, ...sorted.filter((c) => c.name !== "Recommended")];
  }, [apiCategories, selectedStore]);

  // Extract just the names for backward compatibility with existing code
  const categories = useMemo(() => {
    return categoryObjects.map((c) => c.name);
  }, [categoryObjects]);

  // Fetch active outlets
  const { data: activeStores, isLoading: isStoresLoading } = useActiveStores();

  // Nearby outlets query based on user location coords
  const { data: nearbyData } = useNearbyStores(
    userCoords ? { latitude: userCoords.latitude, longitude: userCoords.longitude } : null
  );

  // Auto-select nearest store if geolocation available and activeStore not set yet
  useEffect(() => {
    if (nearbyData?.nearestStore && !selectedStore) {
      const matched = activeStores?.find((s) => s.id === nearbyData.nearestStore?.id);
      if (matched) {
        setSelectedStore(matched);
      }
    }
  }, [nearbyData, activeStores, selectedStore]);

  // Fallback default store selection
  useEffect(() => {
    if (activeStores && activeStores.length > 0 && !selectedStore) {
      setSelectedStore(activeStores[0]);
    }
  }, [activeStores, selectedStore]);

  // Request user location
  const handleDetectLocation = useCallback(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        (err) => {
          console.warn("Geolocation permission denied: ", err);
        }
      );
    }
  }, []);

  // Fetch the entire menu for the selected store once to do instant client-side filtering
  const { data: rawMenu, isLoading: isMenuLoading } = useStoreMenu(
    selectedStore?.id || "",
    {}, // Fetch entire menu to support cache hit on filter toggle
    !!selectedStore?.id
  );

  const { data: featuredDishes, isLoading: isFeaturedLoading } = useFeaturedDishes(
    selectedStore?.id || "",
    !!selectedStore?.id
  );

  // Client-side Instant Filter Optimization
  const filteredMenu = useMemo(() => {
    if (!rawMenu) return [];
    return rawMenu.filter((dish) => {
      if (debouncedSearch) {
        const query = debouncedSearch.toLowerCase().trim();
        const matchesSearch =
          dish.name.toLowerCase().includes(query) ||
          dish.description.toLowerCase().includes(query) ||
          dish.category.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      
      if (filters.veg && !filters.nonVeg && !dish.isVeg) return false;
      if (filters.nonVeg && !filters.veg && dish.isVeg) return false;
      if (filters.bestseller && !dish.isBestseller) return false;
      if (filters.new && !dish.isNew) return false;
      if (filters.spicy && !dish.isSpicy) return false;
      if (filters.available && !dish.available) return false;
      return true;
    });
  }, [rawMenu, debouncedSearch, filters]);

  // Filter & Group Menu by Category
  const categorizedMenu = useMemo(() => {
    const grouped: Record<string, Dish[]> = {};

    categories.forEach((cat) => {
      grouped[cat] = [];
    });

    filteredMenu.forEach((dish) => {
      const cat = dish.category;
      if (grouped[cat]) {
        grouped[cat].push(dish);
      } else {
        // Handle unexpected custom categories under Meals / Recommended
        if (dish.isBestseller || dish.isChefRecommended) {
          grouped["Recommended"].push(dish);
        } else {
          grouped["Meals"]?.push(dish);
        }
      }
    });

    // Populate Recommended using bestseller / chef recommended
    const recommendedItems = filteredMenu.filter((d) => d.isBestseller || d.isChefRecommended);
    grouped["Recommended"] = recommendedItems;

    return grouped;
  }, [filteredMenu, categories]);

  // Active Category Observer/Scroll Tracker (requestAnimationFrame + passive listener)
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const isScrollingRef = useRef(false);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (isScrollingRef.current) return;
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollPos = window.scrollY + 220; // offset categories bar height
          let active = "Recommended";
          for (const cat of categories) {
            const el = categoryRefs.current[cat];
            if (el && el.offsetTop <= scrollPos) {
              active = cat;
            }
          }
          setSelectedCategory(active);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [categories]);

  const handleCategoryClick = useCallback((category: string) => {
    setSelectedCategory(category);
    const el = categoryRefs.current[category];
    if (el) {
      isScrollingRef.current = true;
      const offset = el.offsetTop - 190; // Categories sticky offset
      window.scrollTo({
        top: offset,
        behavior: "smooth",
      });

      // Unlock scroll listener after animation finishes
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 500);
    }
  }, []);

  // Toggle Filters
  const handleFilterToggle = useCallback((key: keyof typeof filters) => {
    setFilters((prev) => {
      // Exclude opposite filters
      if (key === "veg" && !prev.veg) return { ...prev, veg: true, nonVeg: false };
      if (key === "nonVeg" && !prev.nonVeg) return { ...prev, nonVeg: true, veg: false };
      return { ...prev, [key]: !prev[key] };
    });
  }, []);

  // Selected Dish Details helper
  const selectedDish = useMemo(() => {
    if (!selectedDishId || !rawMenu) return null;
    return rawMenu.find((d) => d.id === selectedDishId) || null;
  }, [selectedDishId, rawMenu]);

  const relatedDishes = useMemo(() => {
    if (!selectedDish || !rawMenu) return [];
    return rawMenu
      .filter((d) => d.category === selectedDish.category && d.id !== selectedDish.id)
      .slice(0, 3);
  }, [selectedDish, rawMenu]);

  // Copy sharing link
  const handleShare = useCallback(() => {
    if (typeof window !== "undefined" && selectedDishId) {
      navigator.clipboard.writeText(`${window.location.origin}/menu?dish=${selectedDishId}`);
      alert("Dish link copied to clipboard!");
    }
  }, [selectedDishId]);

  const handleSelectStore = useCallback((store: Store) => {
    setSelectedStore(store);
    
    // Update recent outlets
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("gch-recent-outlets");
        let recents: string[] = stored ? JSON.parse(stored) : [];
        recents = [store.id, ...recents.filter((id) => id !== store.id)].slice(0, 3);
        localStorage.setItem("gch-recent-outlets", JSON.stringify(recents));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleSelectDish = useCallback((id: string) => {
    setSelectedDishId(id);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setSelectedDishId(null);
  }, []);

  const isLoading = isStoresLoading || isMenuLoading || isFeaturedLoading;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans pb-0 selection:bg-brand-green/20">
      {/* 1. Header */}
      <Header walletBalance={walletSummary?.balance} user={user} />

      {/* Center Container for Desktop Alignment */}
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 mt-[72px] pt-5 pb-16">
        <header className="mb-6 max-w-3xl">
          <h1 className="text-3xl md:text-5xl font-heading font-extrabold uppercase tracking-tight text-stone-950">
            GreenChillyz Indian Food Menu
          </h1>
          <p className="mt-3 text-sm md:text-base leading-relaxed text-stone-600">
            Browse meals, starters, combos, rice, noodles, desserts and beverages by outlet. Select a GreenChillyz, YellowChillyz or GoldenChillyz location to see available dishes.
          </p>
        </header>

        {/* 2. Outlet Selector & Details */}
        <div className="mb-4">
          <OutletSelector
            activeStore={selectedStore}
            allStores={activeStores || []}
            nearbyStores={nearbyData?.nearbyStores || []}
            onSelectStore={handleSelectStore}
            onDetectLocation={handleDetectLocation}
            isOpen={isOutletOpen}
            setIsOpen={setIsOutletOpen}
          />
        </div>

        {/* 3. Search Bar */}
        <div className="relative">
          <SearchInput onSearchChange={setDebouncedSearch} />
        </div>

        {/* 4. Quick Filters Chips */}
        <div className="mt-4 flex gap-2.5 overflow-x-auto py-1 no-scrollbar select-none">
          <FilterChip
            label="Veg"
            active={filters.veg}
            onClick={() => handleFilterToggle("veg")}
            icon={<span className="size-2 rounded-full bg-emerald-500 shrink-0" />}
          />
          <FilterChip
            label="Non-Veg"
            active={filters.nonVeg}
            onClick={() => handleFilterToggle("nonVeg")}
            icon={<span className="size-2 rounded-full bg-red-500 shrink-0" />}
          />
          <FilterChip
            label="Bestseller"
            active={filters.bestseller}
            onClick={() => handleFilterToggle("bestseller")}
            icon={<Star className="size-3.5 fill-amber-500 text-amber-500 shrink-0" />}
          />
          <FilterChip
            label="New"
            active={filters.new}
            onClick={() => handleFilterToggle("new")}
            icon={<span className="text-[8px] font-extrabold text-amber-600 bg-amber-500/10 px-1 rounded shrink-0">NEW</span>}
          />
          <FilterChip
            label="Spicy"
            active={filters.spicy}
            onClick={() => handleFilterToggle("spicy")}
            icon={<Flame className="size-3.5 text-red-500 fill-red-500 shrink-0" />}
          />
          <FilterChip
            label="Available"
            active={filters.available}
            onClick={() => handleFilterToggle("available")}
            icon={<span className="size-2 rounded-full bg-emerald-500 shrink-0" />}
          />
        </div>

        {/* 5. Sticky Category Navigation */}
        <CategoryBar
          categoryObjects={categoryObjects}
          activeCategory={selectedCategory}
          onCategoryClick={handleCategoryClick}
        />

        {isLoading ? (
          /* Progressive Skeletons */
          <SkeletonGroup />
        ) : (
          <>
            {/* 6. Featured Specials Carousel */}
            {featuredDishes && featuredDishes.length > 0 && !debouncedSearch && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-5 text-amber-500 fill-amber-500" />
                    <h3 className="font-sans text-lg font-bold text-on-surface uppercase tracking-wide">
                      Featured Specials
                    </h3>
                  </div>
                  <button
                    onClick={() => handleCategoryClick("Recommended")}
                    className="text-xs font-sans font-bold text-brand-green flex items-center gap-1 hover:underline cursor-pointer uppercase tracking-wider"
                  >
                    View All <ChevronRight className="size-3.5" />
                  </button>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                  {featuredDishes.map((dish, index) => (
                    <FeaturedCard
                      key={dish.id}
                      dish={dish}
                      wishlisted={wishlist.includes(dish.id)}
                      onWishlistToggle={toggleWishlist}
                      onSelect={handleSelectDish}
                      priority={index < 3}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 7. Category Items Sections */}
            <div className="mt-8 flex flex-col gap-16">
              {categoryObjects.map((categoryObj) => {
                const items = categorizedMenu[categoryObj.name] || [];
                return (
                  <div
                    key={categoryObj.id}
                    ref={(el) => {
                      categoryRefs.current[categoryObj.name] = el;
                    }}
                    className="scroll-mt-48"
                  >
                    <div className="border-b border-stone-200 pb-2 mb-6 flex items-baseline justify-between">
                      <div className="flex items-baseline gap-2">
                        <h3 className="font-sans text-xl font-bold uppercase text-on-surface tracking-wide">
                          {categoryObj.name}
                        </h3>
                        <span className="text-xs font-sans text-brand-green font-bold uppercase tracking-wider">
                          {items.length} {items.length === 1 ? "Item" : "Items"}
                        </span>
                      </div>
                      <button
                        onClick={() => handleCategoryClick(categoryObj.name)}
                        className="text-xs font-sans font-bold text-brand-green flex items-center gap-1 hover:underline cursor-pointer uppercase tracking-wider"
                      >
                        View All <ChevronRight className="size-3.5" />
                      </button>
                    </div>

                    {items.length === 0 ? (
                      <div className="text-center py-10 bg-white border border-dashed border-stone-200 rounded-2xl">
                        <p className="text-sm font-sans text-stone-400">
                          {debouncedSearch
                            ? "No matching items in this category."
                            : "This outlet currently has no items in this category."}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {items.map((dish, index) => (
                          <MenuCard
                            key={dish.id}
                            dish={dish}
                            wishlisted={wishlist.includes(dish.id)}
                            onWishlistToggle={toggleWishlist}
                            onSelect={handleSelectDish}
                            priority={index < 4}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Empty Overall Search Results */}
            {filteredMenu.length === 0 && (
              <div className="text-center py-20 bg-white border border-dashed border-stone-200 rounded-3xl mt-6 flex flex-col items-center gap-3">
                <AlertTriangle className="size-10 text-amber-500" />
                <h4 className="font-sans text-lg font-bold uppercase tracking-wide">
                  No Dishes Found
                </h4>
                <p className="text-sm font-sans text-stone-500 max-w-sm">
                  We couldn&apos;t find any matching dishes at this outlet. Try adjusting your filters or changing outlets.
                </p>
              </div>
            )}
          </>
        )}

        {/* 14. Visit Outlet Call to Action */}
        {selectedStore && (
          <div className="mt-16 bg-white border border-stone-200 rounded-3xl p-6 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex-1">
              <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-brand-green bg-brand-green/10 px-2.5 py-1 rounded-full border border-brand-green/20">
                Outlet Details
              </span>
              <h4 className="font-sans text-xl font-bold uppercase tracking-tight mt-3 text-stone-900">
                {selectedStore.name}
              </h4>
              <p className="text-xs font-sans text-stone-500 mt-1.5 leading-relaxed">
                {selectedStore.addressLine1}, {selectedStore.city}
              </p>
              <div className="flex items-center gap-4 mt-3">
                <span className="text-xs font-sans font-bold text-brand-green flex items-center gap-1">
                  <CheckCircle className="size-4" /> Open Now
                </span>
                <span className="text-xs font-sans text-stone-400">•</span>
                <span className="text-xs font-sans font-semibold text-stone-500 flex items-center gap-1">
                  <Compass className="size-4 text-stone-400" /> Local Discovery
                </span>
              </div>
            </div>
            {selectedStore.googleMapsLink && (
              <a
                href={selectedStore.googleMapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-brand-green hover:bg-brand-green-hover text-white py-3 px-6 rounded-full font-sans font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-soft uppercase tracking-wider md:w-auto text-center"
              >
                Get Directions <ExternalLink className="size-4" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* 11. Dish Details Side Drawer / Bottom Sheet */}
      <DishDetailDrawer
        dish={selectedDish}
        related={relatedDishes}
        wishlisted={selectedDish ? wishlist.includes(selectedDish.id) : false}
        onWishlistToggle={toggleWishlist}
        onShare={handleShare}
        onClose={handleCloseDrawer}
        storeMapsLink={selectedStore?.googleMapsLink}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}

// 1. HEADER PRIMITIVE
const Header = memo(({ walletBalance, user }: { walletBalance?: number; user?: AuthUser | null }) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 40);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const userLetter = user?.fullName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "G";

  return (
    <motion.header
      className={`fixed top-0 inset-x-0 z-50 bg-white border-b border-stone-200/80 transition-all duration-300 flex justify-center ${
        isScrolled ? "py-2 shadow-soft" : "py-4"
      }`}
    >
      <div className="w-full max-w-5xl px-4 flex items-center justify-between">
        <Link
          href="/"
          className="p-2 -ml-2 rounded-full hover:bg-stone-100 text-stone-700 transition cursor-pointer"
          aria-label="Back to home"
        >
          <ArrowLeft className="size-5" />
        </Link>
        
        {/* Anton font for Menu title in Header */}
        <span className="font-heading text-2xl uppercase tracking-wider text-stone-900 leading-none">
          Menu
        </span>

        {/* Filled up right actions */}
        <div className="flex items-center gap-3">
          {/* Coins Balance */}
          <Link
            href="/wallet"
            className="flex items-center gap-1.5 bg-brand-green/10 text-brand-green border border-brand-green/20 px-3 py-1.5 rounded-full text-xs font-sans font-extrabold uppercase tracking-wide cursor-pointer transition hover:bg-brand-green/15 shrink-0"
          >
            <RupeeCoin className="size-4" strokeWidth={2} />
            <span suppressHydrationWarning>{walletBalance !== undefined ? `${formatCoins(walletBalance)} CC` : "Coins"}</span>
          </Link>

          {/* Wishlist Link */}
          <Link
            href="/wishlist"
            className="p-1.5 rounded-full hover:bg-stone-100 text-stone-600 transition shrink-0 cursor-pointer hidden sm:flex"
            aria-label="Wishlist"
          >
            <Heart className="size-5" />
          </Link>

          {/* Notifications Bell */}
          <Link
            href="/notifications"
            className="p-1.5 rounded-full hover:bg-stone-100 text-stone-600 transition shrink-0 cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="size-5" />
          </Link>

          {/* Profile Avatar Icon */}
          {user?.avatarUrl ? (
            <Link
              href="/profile"
              className="relative size-8 rounded-full overflow-hidden border border-stone-200 shrink-0 cursor-pointer shadow-xs hover:border-brand-green transition"
            >
              <Image src={user.avatarUrl} alt={user.fullName} fill className="object-cover" />
            </Link>
          ) : (
            <Link
              href="/profile"
              className="size-8 rounded-full bg-brand-green text-white flex items-center justify-center font-bold text-xs shrink-0 cursor-pointer hover:bg-brand-green-hover transition shadow-xs"
            >
              {userLetter}
            </Link>
          )}
        </div>
      </div>
    </motion.header>
  );
});
Header.displayName = "Header";

// 2. OUTLET SELECTOR COMPONENT
interface OutletSelectorProps {
  activeStore: Store | null;
  allStores: Store[];
  nearbyStores: any[];
  onSelectStore: (store: Store) => void;
  onDetectLocation: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const OutletSelector = memo(({
  activeStore,
  allStores,
  nearbyStores,
  onSelectStore,
  onDetectLocation,
  isOpen,
  setIsOpen,
}: OutletSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredStores = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return allStores;
    return allStores.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        s.addressLine1.toLowerCase().includes(q)
    );
  }, [allStores, searchQuery]);

  const handleSelectStore = useCallback((store: Store) => {
    onSelectStore(store);
    setIsOpen(false);
  }, [onSelectStore, setIsOpen]);

  const handleClose = useCallback(() => setIsOpen(false), [setIsOpen]);
  const handleOpen = useCallback(() => setIsOpen(true), [setIsOpen]);

  const recentStores = useMemo(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("gch-recent-outlets");
      if (!stored) return [];
      const ids: string[] = JSON.parse(stored);
      return allStores.filter((s) => ids.includes(s.id));
    } catch (e) {
      return [];
    }
  }, [allStores, isOpen]);

  const groupedStores = useMemo(() => {
    const groups: Record<string, Store[]> = {
      "GreenChillyz": [],
      "YellowChillyz": [],
      "GoldenChillyz": [],
    };
    filteredStores.forEach((store) => {
      const norm = getNormalizedBrand(store.brandName || "");
      if (!groups[norm]) {
        groups[norm] = [];
      }
      groups[norm].push(store);
    });
    return groups;
  }, [filteredStores]);

  const activeDistance = useMemo(() => {
    if (!activeStore || !nearbyStores) return null;
    const match = nearbyStores.find((s) => s.id === activeStore.id);
    return match ? `${match.distance.toFixed(1)} km` : null;
  }, [activeStore, nearbyStores]);

  const brandName = activeStore ? getNormalizedBrand(activeStore.brandName) : "GreenChillyz";
  const outletName = activeStore ? getStoreArea(activeStore) : "Select Outlet";

  return (
    <div className="w-full">
      <button
        onClick={handleOpen}
        className="w-full flex items-center justify-between p-4.5 rounded-[24px] border border-stone-200 bg-white shadow-soft hover:shadow-hover transition-all duration-300 text-left cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-10 rounded-full bg-brand-green/10 flex items-center justify-center shrink-0 text-brand-green">
            <MapPin className="size-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-sans text-sm font-extrabold uppercase text-stone-900 truncate leading-none">
              {brandName} • {outletName}
            </h3>
            <p className="text-[11px] font-sans text-stone-500 mt-1.5 flex items-center gap-1 leading-none">
              <span className="text-brand-green font-bold">Open Now</span>
              {activeDistance && (
                <>
                  <span className="text-stone-300">•</span>
                  <span>{activeDistance}</span>
                </>
              )}
            </p>
          </div>
        </div>
        <ChevronDown className="size-4 text-stone-500 shrink-0 mr-1" />
      </button>

      {/* Geolocation Drawer/Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-stone-950/70 p-0 sm:p-4">
            <div className="absolute inset-0 cursor-default" onClick={handleClose} />
            <motion.div
              initial={{ y: "100%", opacity: 0.5 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              style={{ willChange: "transform, opacity" }}
              className="relative z-10 w-full sm:max-w-md bg-white rounded-t-[28px] sm:rounded-3xl p-6 border border-stone-200 shadow-xl overflow-hidden max-h-[85vh] flex flex-col gap-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-stone-100 pb-3 shrink-0">
                <h3 className="font-sans text-lg font-bold text-on-surface uppercase tracking-wide">
                  Select Outlet
                </h3>
                <button
                  onClick={handleClose}
                  className="p-1 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition cursor-pointer"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Detect My Location */}
              <button
                onClick={() => {
                  onDetectLocation();
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 bg-brand-green text-white py-3.5 px-6 rounded-full font-sans font-bold text-xs uppercase tracking-wider shadow-soft hover:bg-brand-green-hover transition cursor-pointer shrink-0"
              >
                <Compass className="size-4" /> Detect My Location
              </button>

              {/* Search Outlets */}
              <div className="relative flex items-center bg-stone-50 border border-stone-200 rounded-2xl px-3.5 py-1.5 shrink-0">
                <Search className="size-4 text-stone-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Outlets or Cities..."
                  className="w-full py-2.5 pl-2.5 bg-transparent text-xs text-stone-800 placeholder-stone-400 outline-none"
                />
              </div>

              {/* Outlet Lists */}
              <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-5">
                {/* Recent Outlets */}
                {recentStores.length > 0 && !searchQuery && (
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-stone-400">
                      Recent Outlets
                    </span>
                    {recentStores.map((store) => (
                      <OutletListItem
                        key={store.id}
                        store={store}
                        onClick={handleSelectStore}
                      />
                    ))}
                  </div>
                )}

                {/* Nearest Outlets if detected */}
                {nearbyStores.length > 0 && !searchQuery && (
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-stone-400">
                      Nearest Outlets
                    </span>
                    {nearbyStores.map((store) => {
                      const fullStore = allStores.find((s) => s.id === store.id);
                      if (!fullStore) return null;
                      return (
                        <OutletListItem
                          key={store.id}
                          store={fullStore}
                          distance={`${store.distance.toFixed(1)} km`}
                          onClick={handleSelectStore}
                        />
                      );
                    })}
                  </div>
                )}

                {/* All Outlets grouped by Brand */}
                {Object.entries(groupedStores).map(([brand, stores]) => {
                  if (stores.length === 0) return null;
                  return (
                    <div key={brand} className="flex flex-col gap-2">
                      <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-stone-400">
                        {brand} Outlets ({stores.length})
                      </span>
                      {stores.map((store) => (
                        <OutletListItem
                          key={store.id}
                          store={store}
                          onClick={handleSelectStore}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
});
OutletSelector.displayName = "OutletSelector";

const OutletListItem = memo(({
  store,
  distance,
  onClick,
}: {
  store: Store;
  distance?: string;
  onClick: (store: Store) => void;
}) => {
  const handleClick = () => {
    onClick(store);
  };

  const brandName = getNormalizedBrand(store.brandName);
  const outletName = getStoreArea(store);

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-stone-150 bg-stone-50/50 hover:bg-stone-50 transition-all text-left gap-3 cursor-pointer"
    >
      <div className="min-w-0">
        <h4 className="font-sans text-sm font-bold uppercase text-stone-900 truncate">
          {brandName} • {outletName}
        </h4>
        <p className="text-[10px] font-sans text-stone-500 truncate mt-0.5">
          {store.addressLine1 || (store as any).address || ""}, {store.city}
        </p>
      </div>
      {distance && (
        <span className="text-[10px] font-sans font-extrabold text-brand-green bg-brand-green/10 px-2 py-0.5 rounded-full border border-brand-green/20 shrink-0">
          {distance}
        </span>
      )}
    </button>
  );
});
OutletListItem.displayName = "OutletListItem";

// 4. FILTER CHIP PRIMITIVE
interface FilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}

const FilterChip = memo(({ label, active, onClick, icon }: FilterChipProps) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full font-sans font-bold text-xs tracking-wider uppercase transition-all duration-300 border cursor-pointer select-none shrink-0 flex items-center gap-1.5 ${
        active
          ? "bg-brand-green/10 border-brand-green text-brand-green shadow-xs"
          : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50 hover:border-stone-300"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
});
FilterChip.displayName = "FilterChip";

// 5. STICKY CATEGORIES BAR
interface CategoryBarProps {
  categoryObjects: Array<{
    id: string;
    name: string;
    slug: string;
    sortOrder: number;
    status: string;
    description: string | null;
    image: string | null;
    icon: string | null;
  }>;
  activeCategory: string;
  onCategoryClick: (category: string) => void;
}

const CategoryBar = memo(({ categoryObjects, activeCategory, onCategoryClick }: CategoryBarProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto scroll categories bar to center the active category item on mobile
  useEffect(() => {
    const activeEl = containerRef.current?.querySelector(`[data-cat="${activeCategory}"]`);
    if (activeEl && containerRef.current) {
      const container = containerRef.current;
      const scrollOffset =
        (activeEl as HTMLElement).offsetLeft - container.offsetWidth / 2 + (activeEl as HTMLElement).offsetWidth / 2;
      container.scrollTo({
        left: scrollOffset,
        behavior: "smooth",
      });
    }
  }, [activeCategory]);

  return (
    <div className="sticky top-[58px] sm:top-[70px] z-40 -mx-4 md:-mx-6 px-4 md:px-6 py-2.5">
      <div
        ref={containerRef}
        className="bg-white border border-stone-155 rounded-3xl p-3 shadow-soft overflow-x-auto no-scrollbar flex gap-2 select-none w-full scroll-smooth"
      >
        {categoryObjects.map((catObj) => {
          const isActive = catObj.name === activeCategory;
          const Icon = CATEGORY_ICON_MAP[catObj.name] || Utensils;
          
          return (
            <button
              key={catObj.id}
              data-cat={catObj.name}
              onClick={() => onCategoryClick(catObj.name)}
              className={`relative flex flex-col items-center justify-center py-2.5 px-4 min-w-[90px] rounded-2xl transition-all duration-300 cursor-pointer shrink-0 gap-1.5 focus:outline-none`}
            >
              {/* Active State Background Pill */}
              {isActive && (
                <motion.div
                  layoutId="activeCategoryBg"
                  className="absolute inset-0 bg-brand-green/10 border border-brand-green rounded-2xl shadow-sm z-0"
                  style={{ willChange: "transform, opacity" }}
                  transition={{ type: "spring", damping: 26, stiffness: 220 }}
                />
              )}
              
              <div className={`relative z-10 shrink-0 transition-colors duration-300 ${isActive ? "text-brand-green" : "text-stone-400 group-hover:text-stone-700"}`}>
                <Icon className="size-5" />
              </div>
              <span className={`relative z-10 font-sans text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${isActive ? "text-brand-green" : "text-stone-400 group-hover:text-stone-700"}`}>
                {catObj.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
});
CategoryBar.displayName = "CategoryBar";

// 6. FEATURED DISH CARD
interface FeaturedCardProps {
  dish: Dish;
  wishlisted: boolean;
  onWishlistToggle: (id: string) => void;
  onSelect: (id: string) => void;
  priority?: boolean;
}

const FeaturedCard = memo(({ dish, wishlisted, onWishlistToggle, onSelect, priority }: FeaturedCardProps) => {
  const [hasError, setHasError] = useState(false);

  const handleSelect = () => {
    onSelect(dish.id);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    onWishlistToggle(dish.id);
  };

  const hasImage = Boolean(dish.image && !hasError && dish.image.trim() !== "");

  return (
    <div
      onClick={handleSelect}
      className="relative shrink-0 w-[280px] bg-white border border-stone-200 rounded-[24px] p-3 shadow-soft hover:shadow-hover hover:scale-[1.01] transition-all duration-300 cursor-pointer overflow-hidden group"
    >
      {/* Food Photography or Empty State */}
      <div className="relative w-full h-[150px] rounded-[18px] overflow-hidden bg-stone-100 shrink-0 flex items-center justify-center">
        {hasImage ? (
          <Image
            key={dish.image}
            src={dish.image}
            alt={dish.name}
            fill
            priority={priority}
            sizes="(max-width: 768px) 280px, 280px"
            loading={priority ? undefined : "lazy"}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setHasError(true)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-stone-300 gap-1">
            {dish.isVeg ? (
              <Leaf className="size-8 stroke-[1.5]" />
            ) : (
              <UtensilsCrossed className="size-8 stroke-[1.5]" />
            )}
          </div>
        )}
        {/* Wishlist Floating Button */}
        <button
          onClick={handleWishlist}
          className="absolute right-2.5 top-2.5 p-2 bg-white rounded-full shadow-soft text-stone-500 hover:text-red-500 transition-all duration-200 cursor-pointer hover:scale-110 z-10"
        >
          <Heart className={`size-4 ${wishlisted ? "fill-red-500 text-red-500" : "text-stone-600"}`} />
        </button>

        {/* Veg/Non-veg indicator overlay */}
        <div className="absolute left-2.5 top-2.5 bg-white rounded-full px-2.5 py-1 flex items-center gap-1.5 border border-stone-200 shadow-xs z-10">
          <span className={`size-1.5 rounded-full ${dish.isVeg ? "bg-emerald-500" : "bg-red-500"}`} />
          <span className="text-[8px] font-sans font-extrabold tracking-wider text-stone-600 uppercase">
            {dish.isVeg ? "Veg" : "Non-Veg"}
          </span>
        </div>
      </div>

      <div className="mt-3 px-1.5 pb-1">
        <h4 className="font-sans text-sm font-extrabold uppercase tracking-tight text-stone-950 truncate">
          {dish.name}
        </h4>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-sans font-extrabold text-brand-green">
            ₹{dish.price}
          </span>
          <div className="flex items-center gap-1 text-amber-500">
            <Star className="size-3.5 fill-amber-500 text-amber-500" />
            <span className="text-xs font-sans font-extrabold text-stone-700">
              {dish.rating}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});
FeaturedCard.displayName = "FeaturedCard";

// 8. VERTICAL MENU ITEM CARD
interface MenuCardProps {
  dish: Dish;
  wishlisted: boolean;
  onWishlistToggle: (id: string) => void;
  onSelect: (id: string) => void;
  priority?: boolean;
}

const MenuCard = memo(({ dish, wishlisted, onWishlistToggle, onSelect, priority }: MenuCardProps) => {
  const [hasError, setHasError] = useState(false);

  const handleSelect = () => {
    onSelect(dish.id);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    onWishlistToggle(dish.id);
  };

  const hasImage = Boolean(dish.image && !hasError && dish.image.trim() !== "");

  return (
    <div
      onClick={handleSelect}
      className="bg-white border border-stone-200 rounded-[28px] p-5 shadow-soft hover:shadow-hover hover:scale-[1.005] transition-all duration-300 cursor-pointer flex items-center justify-between gap-5 group relative"
    >
      {/* Details Box */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-col gap-2">
          {/* Title & Veg Indicator Row */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className={`size-4 border flex items-center justify-center p-0.5 shrink-0 ${dish.isVeg ? "border-emerald-500" : "border-red-500"}`}>
              <div className={`size-1.5 rounded-full ${dish.isVeg ? "bg-emerald-500" : "bg-red-500"}`} />
            </div>
            <h4 className="font-sans text-base font-extrabold uppercase tracking-tight text-stone-950 group-hover:text-brand-green transition-colors">
              {dish.name}
            </h4>
            
            {/* Inline Badges */}
            {dish.isBestseller && (
              <span className="text-[8px] font-sans font-extrabold uppercase tracking-wider text-red-600 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20 shrink-0">
                Bestseller
              </span>
            )}
            {dish.isSpicy && (
              <span className="text-[8px] font-sans font-extrabold uppercase tracking-wider text-orange-600 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20 flex items-center gap-0.5 shrink-0">
                <Flame className="size-2.5 fill-orange-500 text-orange-500" /> Spicy
              </span>
            )}
            {dish.isNew && (
              <span className="text-[8px] font-sans font-extrabold uppercase tracking-wider text-brand-green bg-brand-green/10 px-1.5 py-0.5 rounded border border-brand-green/20 shrink-0">
                New
              </span>
            )}
          </div>

          <p className="text-xs font-sans text-stone-400 line-clamp-2 leading-relaxed">
            {dish.description}
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-1">
            <span className="text-sm font-sans font-extrabold text-brand-green">
              ₹{dish.price}
            </span>
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="size-3.5 fill-amber-500 text-amber-500" />
              <span className="text-[11px] font-sans font-extrabold text-stone-700">
                {dish.rating}
              </span>
              <span className="text-[10px] font-sans text-stone-400 font-semibold">
                (128)
              </span>
            </div>
            
            {dish.available ? (
              <span className="text-[8px] font-sans font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                In Stock
              </span>
            ) : (
              <span className="text-[8px] font-sans font-extrabold uppercase tracking-wider text-stone-500 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                Sold Out
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right Image Box */}
      <div className="relative size-28 md:size-32 rounded-[20px] overflow-hidden bg-stone-100 shrink-0 shadow-inner flex items-center justify-center">
        {hasImage ? (
          <Image
            key={dish.image}
            src={dish.image}
            alt={dish.name}
            fill
            priority={priority}
            sizes="(max-width: 768px) 112px, 128px"
            loading={priority ? undefined : "lazy"}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setHasError(true)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-stone-300">
            {dish.isVeg ? (
              <Leaf className="size-8 stroke-[1.5]" />
            ) : (
              <UtensilsCrossed className="size-8 stroke-[1.5]" />
            )}
          </div>
        )}
        {/* Wishlist Button */}
        <button
          onClick={handleWishlist}
          className="absolute right-2 top-2 p-1.5 bg-white rounded-full shadow-soft text-stone-500 hover:text-red-500 transition-all duration-200 cursor-pointer hover:scale-110 z-10"
        >
          <Heart className={`size-3.5 ${wishlisted ? "fill-red-500 text-red-500" : "text-stone-600"}`} />
        </button>

        {/* Sold out indicator overlay */}
        {!dish.available && (
          <div className="absolute inset-0 bg-stone-950/60 flex items-center justify-center z-10">
            <span className="text-[9px] font-sans font-extrabold uppercase tracking-widest text-white">
              Sold Out
            </span>
          </div>
        )}
      </div>
    </div>
  );
});
MenuCard.displayName = "MenuCard";

// 11. DISH DETAIL DRAWER / BOTTOM SHEET
interface DishDetailDrawerProps {
  dish: Dish | null;
  related: Dish[];
  wishlisted: boolean;
  onWishlistToggle: (id: string) => void;
  onShare: () => void;
  onClose: () => void;
  storeMapsLink?: string | null;
}

const DishDetailDrawer = memo(({
  dish,
  related,
  wishlisted,
  onWishlistToggle,
  onShare,
  onClose,
  storeMapsLink,
}: DishDetailDrawerProps) => {
  const [hasError, setHasError] = useState(false);

  const handleWishlist = () => {
    if (dish) onWishlistToggle(dish.id);
  };

  const hasImage = Boolean(dish?.image && !hasError && dish.image.trim() !== "");

  return (
    <AnimatePresence>
      {dish && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-stone-950/70">
          {/* Click backdrop to close */}
          <div className="absolute inset-0 cursor-default" onClick={onClose} />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 240 }}
            style={{ willChange: "transform" }}
            className="relative z-10 w-full sm:max-w-md bg-white h-full shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header close button */}
            <div className="absolute top-4 right-4 z-20 flex gap-2">
              <button
                onClick={onShare}
                className="p-2.5 bg-white rounded-full shadow-soft text-stone-600 hover:bg-stone-50 transition cursor-pointer border border-stone-200"
                aria-label="Share dish"
              >
                <Share2 className="size-5" />
              </button>
              <button
                onClick={handleWishlist}
                className="p-2.5 bg-white rounded-full shadow-soft text-stone-600 hover:text-red-500 transition cursor-pointer border border-stone-200"
                aria-label="Toggle wishlist"
              >
                <Heart className={`size-5 ${wishlisted ? "fill-red-500 text-red-500" : ""}`} />
              </button>
              <button
                onClick={onClose}
                className="p-2.5 bg-white rounded-full shadow-soft text-stone-600 hover:bg-stone-50 transition cursor-pointer border border-stone-200"
                aria-label="Close details"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Food photography or clean header hero */}
            <div className="relative w-full h-[220px] sm:h-[260px] bg-stone-100 shrink-0 shadow-inner flex items-center justify-center">
              {hasImage ? (
                <Image
                  key={dish.image}
                  src={dish.image}
                  alt={dish.name}
                  fill
                  className="object-cover"
                  onError={() => setHasError(true)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-stone-300 gap-2">
                  {dish.isVeg ? (
                    <Leaf className="size-14 stroke-[1.2]" />
                  ) : (
                    <UtensilsCrossed className="size-14 stroke-[1.2]" />
                  )}
                </div>
              )}
              <div className="absolute bottom-4 left-4 bg-white rounded-lg px-2.5 py-1 flex items-center gap-1.5 border border-stone-200 shadow-soft">
                <span className={`size-2.5 rounded-full ${dish.isVeg ? "bg-emerald-500" : "bg-red-500"}`} />
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-stone-700">
                  {dish.isVeg ? "Pure Veg" : "Non-Veg"}
                </span>
              </div>
            </div>

            {/* Scrollable details container */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
              <div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {dish.isBestseller && (
                    <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-amber-600 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                      Bestseller
                    </span>
                  )}
                  {dish.isChefRecommended && (
                    <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-purple-600 bg-purple-500/10 px-2.5 py-0.5 rounded border border-purple-500/20">
                      Chef Choice
                    </span>
                  )}
                  {dish.isNew && (
                    <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-brand-green bg-brand-green/10 px-2.5 py-0.5 rounded border border-brand-green/20">
                      New Arrival
                    </span>
                  )}
                </div>
                <h3 className="font-sans text-2xl font-extrabold uppercase tracking-tight text-stone-950 leading-none mt-1">
                  {dish.name}
                </h3>
                <div className="flex items-center gap-4 mt-3">
                  <span className="text-xl font-sans font-extrabold text-stone-900">
                    ₹{dish.price}
                  </span>
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="size-4.5 fill-amber-500" />
                    <span className="text-xs font-sans font-extrabold text-stone-700">
                      {dish.rating}
                    </span>
                  </div>
                  {dish.prepTime && (
                    <span className="text-xs font-sans text-stone-400 flex items-center gap-0.5 font-semibold">
                      <Clock className="size-3.5 text-stone-300" /> {dish.prepTime} mins
                    </span>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-sans font-bold uppercase tracking-wider text-stone-400 mb-2">
                  Description
                </h4>
                <p className="text-sm font-sans text-stone-600 leading-relaxed">
                  {dish.description}
                </p>
              </div>

              {/* Nutrition (Future ready) */}
              <div className="grid grid-cols-3 gap-3 border-t border-b border-stone-100 py-4">
                <div className="text-center">
                  <span className="block text-[10px] font-sans font-bold uppercase tracking-wider text-stone-400">
                    Calories
                  </span>
                  <span className="block font-sans font-extrabold text-sm text-stone-700 mt-1">
                    {dish.calories || "—"} Kcal
                  </span>
                </div>
                <div className="text-center border-l border-r border-stone-100">
                  <span className="block text-[10px] font-sans font-bold uppercase tracking-wider text-stone-400">
                    Prep Time
                  </span>
                  <span className="block font-sans font-extrabold text-sm text-stone-700 mt-1">
                    {dish.prepTime || "—"} Min
                  </span>
                </div>
                <div className="text-center">
                  <span className="block text-[10px] font-sans font-bold uppercase tracking-wider text-stone-400">
                    Spice Level
                  </span>
                  <span className="block font-sans font-extrabold text-xs text-stone-700 mt-1.5 uppercase">
                    {dish.isSpicy ? "🔥 Spicy" : "Mild"}
                  </span>
                </div>
              </div>

              {/* Allergens (Future ready) */}
              {dish.allergens && dish.allergens.length > 0 && (
                <div>
                  <h4 className="text-xs font-sans font-bold uppercase tracking-wider text-stone-400 mb-2">
                    Allergens
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {dish.allergens.map((alg: string) => (
                      <span
                        key={alg}
                        className="text-[10px] font-sans font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded border border-amber-200"
                      >
                        {alg}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Dishes */}
              {related.length > 0 && (
                <div className="mt-2">
                  <h4 className="text-xs font-sans font-bold uppercase tracking-wider text-stone-400 mb-3">
                    You Might Also Like
                  </h4>
                  <div className="flex flex-col gap-3">
                    {related.map((item: Dish) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-stone-50 transition border border-transparent hover:border-stone-150 cursor-pointer"
                      >
                        <div className="relative size-12 rounded-lg overflow-hidden bg-stone-100 shrink-0 flex items-center justify-center text-stone-300">
                          {item.image && item.image.trim() !== "" ? (
                            <Image src={item.image} alt={item.name} fill className="object-cover" />
                          ) : item.isVeg ? (
                            <Leaf className="size-5 stroke-[1.5]" />
                          ) : (
                            <UtensilsCrossed className="size-5 stroke-[1.5]" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h5 className="font-sans text-xs font-extrabold uppercase text-stone-950 truncate">
                            {item.name}
                          </h5>
                          <span className="text-xs font-sans font-extrabold text-stone-600 block mt-0.5">
                            ₹{item.price}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Visit Outlet CTA */}
            {storeMapsLink && (
              <div className="p-4 border-t border-stone-100 shrink-0">
                <a
                  href={storeMapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-brand-green hover:bg-brand-green-hover text-white py-3.5 px-6 rounded-full font-sans font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-soft text-center"
                >
                  Visit Outlet to Dine In <ExternalLink className="size-4" />
                </a>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});
DishDetailDrawer.displayName = "DishDetailDrawer";

// 13. SKELETON LOADERS
function SkeletonGroup() {
  return (
    <div className="mt-8 flex flex-col gap-10 animate-pulse">
      {/* Featured Items Skeletons */}
      <div>
        <div className="h-5 bg-stone-200 rounded w-1/3 mb-4" />
        <div className="flex gap-4">
          <div className="w-[260px] h-[220px] bg-stone-200 rounded-3xl shrink-0" />
          <div className="w-[260px] h-[220px] bg-stone-200 rounded-3xl shrink-0" />
        </div>
      </div>

      {/* Menu Cards Skeletons */}
      <div>
        <div className="h-6 bg-stone-200 rounded w-1/4 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-32 bg-stone-200 rounded-3xl" />
          <div className="h-32 bg-stone-200 rounded-3xl" />
          <div className="h-32 bg-stone-200 rounded-3xl" />
          <div className="h-32 bg-stone-200 rounded-3xl" />
        </div>
      </div>
    </div>
  );
}
