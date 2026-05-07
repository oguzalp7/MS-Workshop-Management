"use client";

import { useEffect, useState, FormEvent } from "react";
import { Modal, useModalContext } from "@/components/Modal";
import { BatchInput } from "@/components/BatchInput";

interface ProductMedia {
  url: string;
  type: "image" | "video";
}

interface Product {
  id: string;
  name: string;
  price: number;
  media?: ProductMedia[];
}

interface Category {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  products?: Product[];
  _count?: {
    products: number;
  };
}

function ProductThumbnail({ product, size = "md" }: { product: Product, size?: "md" | "lg" }) {
  const firstMedia = product.media && product.media.length > 0 ? product.media[0] : null;
  const dimensionClass = size === "lg" ? "w-24 h-24" : "w-10 h-10";
  
  if (!firstMedia) {
    return (
      <div className={`${dimensionClass} rounded-lg bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground border border-border/50`}>
        ?
      </div>
    );
  }

  return (
    <div className={`${dimensionClass} rounded-lg bg-muted overflow-hidden border border-border/50 flex-shrink-0 shadow-sm`}>
      {firstMedia.type === "video" ? (
        <video src={firstMedia.url} className="w-full h-full object-cover" muted loop playsInline />
      ) : (
        <img src={firstMedia.url} alt={product.name} className="w-full h-full object-cover" />
      )}
    </div>
  );
}

function CategoryEditorContent({ 
  category, 
  onUpdateName, 
  onToggleProduct, 
  onSearch, 
  searchResults, 
  searchLoading, 
  productSearch, 
  setProductSearch,
  error 
}: any) {
  const { isMaximized } = useModalContext();

  return (
    <div className={`p-6 transition-all duration-300 ${isMaximized ? "space-y-12" : "space-y-8"}`}>
      {error && <div className="px-4 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">{error}</div>}

      {/* Quick Edit Name */}
      <section>
        <label className={`block font-bold mb-1.5 text-muted uppercase tracking-widest ${isMaximized ? "text-xs" : "text-[10px]"}`}>
          Category Name
        </label>
        <input 
          type="text" 
          defaultValue={category?.name}
          onBlur={(e) => onUpdateName(category.id, e.target.value)}
          className={`font-bold bg-transparent border-b border-transparent hover:border-border focus:border-foreground focus:outline-none transition-all w-full pb-1 ${isMaximized ? "text-4xl" : "text-xl"}`}
        />
      </section>

      <div className={`grid gap-12 ${isMaximized ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
        {/* Included Products */}
        <section>
          <h3 className={`font-bold mb-4 uppercase tracking-widest text-muted ${isMaximized ? "text-sm" : "text-[10px]"}`}>
            Included Products ({category?.products?.length || 0})
          </h3>
          <div className={`grid gap-4 ${isMaximized ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1 sm:grid-cols-2"}`}>
            {category?.products?.map((product: Product) => (
              <div key={product.id} className={`flex items-center justify-between p-3 rounded-2xl bg-secondary/30 border border-border/50 group transition-all hover:bg-secondary/50`}>
                <a href={`/admin/products/${product.id}`} className="flex items-center gap-4 flex-1 cursor-pointer">
                  <ProductThumbnail product={product} size={isMaximized ? "lg" : "md"} />
                  <div>
                    <span className={`font-bold truncate block group-hover:underline ${isMaximized ? "text-lg max-w-[300px]" : "text-sm max-w-[150px]"}`}>{product.name}</span>
                    {isMaximized && <span className="text-xs text-muted-foreground font-medium">${product.price.toFixed(2)}</span>}
                  </div>
                </a>
                <button 
                  onClick={() => onToggleProduct(product.id, "disconnect")}
                  className="p-2 rounded-xl text-muted hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width={isMaximized ? 24 : 16} height={isMaximized ? 24 : 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>
            ))}
            {category?.products?.length === 0 && <p className="col-span-full text-xs text-muted-foreground italic py-2">No products in this category.</p>}
          </div>
        </section>

        {/* Available to Add */}
        <section className={`${isMaximized ? "" : "pt-8 border-t border-border"}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <h3 className={`font-bold uppercase tracking-widest text-muted ${isMaximized ? "text-sm" : "text-[10px]"}`}>
              Add Products
            </h3>
            <div className={`relative ${isMaximized ? "w-full sm:w-80" : "w-full sm:w-64"}`}>
              <input 
                type="text" 
                placeholder="Search global catalog..." 
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-xl bg-secondary border border-border focus:outline-none focus:ring-1 focus:ring-foreground transition-all ${isMaximized ? "text-sm" : "text-xs"}`}
              />
              <svg className="absolute left-3.5 top-2.5 text-muted" xmlns="http://www.w3.org/2000/svg" width={isMaximized ? 18 : 14} height={isMaximized ? 18 : 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
          </div>

          <div className={`grid gap-4 ${isMaximized ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1 sm:grid-cols-2"}`}>
            {searchResults.map((product: Product) => (
              <div key={product.id} className="flex items-center justify-between p-3 rounded-2xl border border-dashed border-border hover:border-foreground/30 transition-all bg-card/50 group">
                <a href={`/admin/products/${product.id}`} className="flex items-center gap-4 flex-1 cursor-pointer">
                  <ProductThumbnail product={product} size={isMaximized ? "lg" : "md"} />
                  <div>
                    <span className={`font-bold truncate block group-hover:underline ${isMaximized ? "text-lg max-w-[200px]" : "text-sm max-w-[120px]"}`}>{product.name}</span>
                    {isMaximized && <span className="text-xs text-muted-foreground font-medium">${product.price.toFixed(2)}</span>}
                  </div>
                </a>
                <button 
                  onClick={() => onToggleProduct(product.id, "connect")}
                  className={`rounded-xl bg-foreground text-background font-bold hover:opacity-90 transition-all active:scale-95 ${isMaximized ? "px-6 py-2.5 text-xs" : "px-4 py-1.5 text-[10px]"}`}
                >
                  ADD
                </button>
              </div>
            ))}
            {searchLoading && <div className="col-span-full text-center py-8 text-xs text-muted">Searching...</div>}
            {productSearch && searchResults.length === 0 && !searchLoading && <div className="col-span-full text-center py-8 text-xs text-muted italic">No results found for "{productSearch}"</div>}
            {!productSearch && <div className="col-span-full text-center py-12 border border-dashed border-border/30 rounded-2xl text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">Enter product name to search</div>}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "" });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Modal State
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  async function fetchCategories() {
    try {
      const res = await fetch("/api/admin/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  // Search products for the modal
  useEffect(() => {
    if (!editingCategory) return;
    
    const delayDebounceFn = setTimeout(async () => {
      if (!productSearch.trim()) {
        setSearchResults([]);
        return;
      }
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/admin/products?q=${productSearch}&excludeCategory=${editingCategory.id}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.products);
        }
      } catch { /* ignore */ } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [productSearch, editingCategory]);

  async function handleCreate(name: string) {
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) fetchCategories();
      return res.ok;
    } catch { return false; }
  }

  async function handleBatchCreate(names: string[]) {
    for (const name of names) {
      await handleCreate(name);
    }
    fetchCategories();
  }

  async function handleSingleCreate(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);
    const success = await handleCreate(formData.name);
    if (success) {
      setFormData({ name: "" });
      setShowForm(false);
    } else {
      setFormError("Failed to create category. Check if it already exists.");
    }
    setFormLoading(false);
  }

  async function openEditor(category: Category) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/categories/${category.id}`);
      if (res.ok) {
        const data = await res.json();
        setEditingCategory(data.category);
        setProductSearch("");
        setModalError("");
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }

  async function updateCategoryName(id: string, name: string) {
    if (editingCategory?.name === name) return;
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const data = await res.json();
        setEditingCategory(data.category);
        fetchCategories();
      }
    } catch { /* ignore */ }
  }

  async function toggleProduct(productId: string, action: "connect" | "disconnect") {
    if (!editingCategory) return;
    setModalError("");
    try {
      const res = await fetch(`/api/admin/categories/${editingCategory.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          [action === "connect" ? "connectProduct" : "disconnectProduct"]: productId 
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setEditingCategory(data.category);
        fetchCategories();
        if (action === "connect") {
          setSearchResults(prev => prev.filter(p => p.id !== productId));
        }
      } else {
        setModalError(data.error);
      }
    } catch { setModalError("Failed to update associations"); }
  }

  async function toggleActive(category: Category) {
    try {
      await fetch(`/api/admin/categories/${category.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !category.active }),
      });
      fetchCategories();
    } catch { /* ignore */ }
  }

  async function handleDelete(category: Category) {
    if ((category._count?.products || 0) > 0) {
      alert("Cannot delete category with products. Please remove products first or deactivate it.");
      return;
    }
    if (!confirm(`Hard delete "${category.name}"? This action cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/admin/categories/${category.id}`, { method: "DELETE" });
      if (res.ok) fetchCategories();
    } catch { /* ignore */ }
  }

  if (loading && !editingCategory) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-5 w-5 border-2 border-foreground border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-12 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted text-xs uppercase tracking-[0.3em] mt-2 font-bold opacity-60">Global Catalog Management</p>
        </div>
        <div className="flex items-center gap-6">
          <BatchInput onAdd={handleBatchCreate} label="categories" placeholder="Lipsticks&#10;Eyeliners&#10;Foundations" />
          <button
            onClick={() => setShowForm(!showForm)}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${showForm ? "bg-secondary text-foreground" : "bg-foreground text-background hover:opacity-90 active:scale-95"}`}
          >
            {showForm ? "CANCEL" : "ADD CATEGORY"}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSingleCreate} className="mb-12 p-8 rounded-2xl border border-border bg-card animate-in fade-in slide-in-from-top-6 duration-300 shadow-lg">
          <h2 className="text-xs font-bold mb-6 uppercase tracking-widest text-muted">New Category</h2>
          {formError && <div className="px-4 py-3 mb-6 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">{formError}</div>}
          <div className="flex flex-col md:flex-row gap-6 items-end">
            <div className="flex-1">
              <label htmlFor="cat-name" className="block text-[10px] font-bold mb-2 text-muted uppercase tracking-widest">Category Name</label>
              <input id="cat-name" type="text" required autoFocus value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-foreground transition-all"
                placeholder="e.g. Skin Prep"
              />
            </div>
            <button type="submit" disabled={formLoading} className="px-8 py-2.5 rounded-xl bg-foreground text-background text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-all active:scale-95">
              {formLoading ? "CREATING..." : "CREATE CATEGORY"}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <div key={category.id} className={`p-6 rounded-2xl border transition-all flex items-center justify-between group ${category.active ? "bg-card border-border hover:border-foreground/30 shadow-sm hover:shadow-md" : "bg-secondary/30 border-border/50 opacity-60"}`}>
            <div className="cursor-pointer flex-1" onClick={() => openEditor(category)}>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-bold text-base">{category.name}</h3>
                {!category.active && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase tracking-widest">Inactive</span>}
              </div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">{category._count?.products || 0} ITEMS</p>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => toggleActive(category)} title={category.active ? "Deactivate" : "Activate"} className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-secondary transition-colors">
                {category.active ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" x2="23" y1="1" y2="23"/></svg>
                )}
              </button>
              <button onClick={() => handleDelete(category)} title="Delete" className="p-2 rounded-xl text-muted hover:text-destructive hover:bg-destructive/10 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal 
        isOpen={!!editingCategory} 
        onClose={() => setEditingCategory(null)} 
        title={editingCategory?.name || "Edit Category"}
        maxWidth="3xl"
      >
        <CategoryEditorContent 
          category={editingCategory}
          onUpdateName={updateCategoryName}
          onToggleProduct={toggleProduct}
          searchResults={searchResults}
          searchLoading={searchLoading}
          productSearch={productSearch}
          setProductSearch={setProductSearch}
          error={modalError}
        />
      </Modal>
    </div>
  );
}
