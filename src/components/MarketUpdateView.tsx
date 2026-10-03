import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { MarketItem } from '../types';
import { INITIAL_MARKET_ITEMS } from '../data/spacesData';
import { useAuth } from '../context/AuthContext';
import { 
  ShoppingBag, 
  Plus, 
  Search, 
  Tag, 
  Phone, 
  MessageSquare, 
  CheckCircle, 
  X, 
  BookOpen, 
  Sparkles,
  Layers,
  GraduationCap
} from 'lucide-react';

interface MarketUpdateViewProps {
  onOpenDirectChatWithSeller?: (sellerId: string, sellerName: string) => void;
}

export const MarketUpdateView: React.FC<MarketUpdateViewProps> = ({
  onOpenDirectChatWithSeller,
}) => {
  const { userProfile, currentUser, isDemoUser } = useAuth();
  const [items, setItems] = useState<MarketItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<MarketItem['category']>('textbooks');
  const [contact, setContact] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const marketRef = collection(db, 'marketItems');
    const q = query(marketRef, orderBy('createdAt', 'desc'), limit(50));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: MarketItem[] = [];
          snapshot.forEach(docSnap => {
            list.push({ id: docSnap.id, ...docSnap.data() } as MarketItem);
          });
          setItems(list);
        } else {
          setItems(INITIAL_MARKET_ITEMS);
        }
      },
      (error) => {
        console.warn('Market items realtime listener warning:', error);
        setItems(INITIAL_MARKET_ITEMS);
      }
    );

    return () => unsubscribe();
  }, []);

  const handlePostItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !price || !currentUser || !userProfile || submitting) return;

    setSubmitting(true);
    const newItem: Omit<MarketItem, 'id'> = {
      title: title.trim(),
      description: description.trim(),
      price: parseFloat(price) || 0,
      category,
      sellerId: currentUser.uid,
      sellerName: userProfile.displayName,
      sellerDepartment: userProfile.department,
      sellerLevel: userProfile.level,
      sellerContact: contact.trim() || userProfile.email,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    try {
      if (!isDemoUser) {
        await addDoc(collection(db, 'marketItems'), newItem);
      } else {
        const optimistic: MarketItem = {
          id: `demo-mkt-${Date.now()}`,
          ...newItem
        };
        setItems(prev => [optimistic, ...prev]);
      }
      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      setPrice('');
      setContact('');
    } catch (err) {
      console.error('Failed to post market item:', err);
      handleFirestoreError(err, OperationType.CREATE, 'marketItems');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleSold = async (item: MarketItem) => {
    if (item.sellerId !== currentUser?.uid) return;
    const newStatus = item.status === 'active' ? 'sold' : 'active';

    setItems(prev => prev.map(i => (i.id === item.id ? { ...i, status: newStatus } : i)));

    if (!isDemoUser && !item.id.startsWith('mkt-') && !item.id.startsWith('demo-')) {
      try {
        await updateDoc(doc(db, 'marketItems', item.id), { status: newStatus });
      } catch (err) {
        console.warn('Could not update market item status on Firestore:', err);
      }
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sellerName.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (selectedCategory === 'all') return true;
    return item.category === selectedCategory;
  });

  const formatNaira = (amount: number) => {
    return '₦' + amount.toLocaleString('en-NG');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24 md:pb-12">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 rounded-2xl p-5 sm:p-6 text-white shadow-xl border border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800/80 border border-emerald-700 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
            <ShoppingBag className="w-3.5 h-3.5" /> Campus Student Marketplace
          </div>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
            NABIOSOS MARKET UPDATE
          </h2>
          <p className="text-xs sm:text-sm text-emerald-200 mt-1">
            Buy and sell textbooks, laboratory coats, dissection kits, past questions, scientific calculators, and student accommodation.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="self-start sm:self-center px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Post an Item</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search textbooks, lab coats, calculators, seller..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Items' },
            { id: 'textbooks', label: 'Textbooks' },
            { id: 'lab-gear', label: 'Lab Gear' },
            { id: 'past-questions', label: 'Past Qs' },
            { id: 'electronics', label: 'Calculators & Tech' },
            { id: 'accommodation', label: 'Hostel/Room' },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-emerald-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => {
          const isSeller = item.sellerId === currentUser?.uid;

          return (
            <div
              key={item.id}
              className={`bg-white rounded-2xl p-5 border flex flex-col justify-between transition-all shadow-xs hover:shadow-md ${
                item.status === 'sold'
                  ? 'border-slate-200 opacity-60 bg-slate-50'
                  : 'border-slate-200 hover:border-emerald-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {item.category.replace('-', ' ')}
                  </span>
                  <div className="text-sm font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    {formatNaira(item.price)}
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-slate-700 truncate">
                    Seller: {item.sellerName}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {item.sellerLevel}
                  </span>
                </div>

                {item.sellerContact && (
                  <div className="text-[11px] text-slate-600 flex items-center gap-1.5 font-medium bg-slate-50 p-1.5 rounded-lg border border-slate-100 truncate">
                    <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{item.sellerContact}</span>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-2 pt-1">
                  {isSeller ? (
                    <button
                      onClick={() => handleToggleSold(item)}
                      className="w-full py-1.5 text-xs font-bold rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                    >
                      {item.status === 'sold' ? 'Mark as Active' : 'Mark as Sold'}
                    </button>
                  ) : (
                    <>
                      {onOpenDirectChatWithSeller && (
                        <button
                          onClick={() => onOpenDirectChatWithSeller(item.sellerId, item.sellerName)}
                          className="flex-1 py-2 px-3 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>DM Seller</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Post Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-black text-slate-900 uppercase">
                List Campus Item on NABIOSOS Market
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePostItem} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Item Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Prescott's Microbiology or White Lab Coat"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Price (₦ Naira) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="100"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-2.5 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="textbooks">Textbooks</option>
                    <option value="lab-gear">Lab Coats & Kits</option>
                    <option value="past-questions">Past Questions & Notes</option>
                    <option value="electronics">Calculators & Tech</option>
                    <option value="accommodation">Hostel & Roommates</option>
                    <option value="other">Other Campus Gear</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Phone / WhatsApp Contact *
                </label>
                <input
                  type="text"
                  required
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="e.g. 0812-345-6789 (Calls / WhatsApp)"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Item Description & Condition *
                </label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe condition, edition, pickup location on Federal University Wukari campus..."
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Listing...' : 'List Item on Market'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
