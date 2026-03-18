import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useVault } from './useVault';
import VaultInsights from '../insights/VaultInsights';
import VaultHero from './VaultHero';
import GlassCard from '../../renderer/components/ui/GlassCard';
import { executeRedaction } from '../../renderer/lib/redaction/redactionPipeline.ts';

function Vault() {
  const { items, loading, error, refresh, getItem, saveItem } = useVault();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [secretValue, setSecretValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const [selectedItemId, setSelectedItemId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedLoading, setSelectedLoading] = useState(false);
  const [selectedError, setSelectedError] = useState(null);

  const [isEditingSelected, setIsEditingSelected] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editSecretValue, setEditSecretValue] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState(null);

  const vaultOnline = Boolean(window.aura?.vault);
  const [entered, setEntered] = useState(false);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const aTime = a?.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bTime = b?.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [items]);
  const [searchQuery, setSearchQuery] = useState('');
  const vaultItems = sortedItems;

  const filteredItems = useMemo(() => {
    return sortedItems.filter(item => 
      (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.content || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sortedItems, searchQuery]);

  const listVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 }
  };

  const dashboardVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0 }
  };

  const formatModifiedAt = (updatedAt) => {
    if (!updatedAt) return '\u2014';
    const parsed = new Date(updatedAt);
    if (Number.isNaN(parsed.getTime())) return '\u2014';
    return parsed.toLocaleString();
  };

  const resetAddForm = () => {
    setItemName('');
    setSecretValue('');
    setSaveError(null);
  };

  const openAddModal = () => {
    resetAddForm();
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    resetAddForm();
  };

  const selectItem = async (item) => {
    setSelectedItemId(item.id);
    setSelectedLoading(true);
    setSelectedError(null);
    setIsEditingSelected(false);
    setEditError(null);

    const res = await getItem(item.id);
    if (res.ok && res.item) {
      setSelectedItem({
        id: res.item.id,
        title: res.item.title,
        content: res.item.content,
        updatedAt: res.item.updatedAt
      });
      setEditTitle(res.item.title || '');
      setEditSecretValue(res.item.content || '');
    } else {
      setSelectedItem(null);
      setSelectedError(res.error || 'Failed to load item details');
    }

    setSelectedLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);

    if (!itemName.trim()) {
      setSaveError('Item Name is required');
      setSaving(false);
      return;
    }

    const redactionResult = executeRedaction(secretValue);
    if (!redactionResult.safe) {
      setSaveError('Redaction pipeline failed. Item not saved.');
      setSaving(false);
      return;
    }

    const res = await saveItem(null, { title: itemName, content: redactionResult.redacted });
    if (!res.ok) {
      setSaveError(res.error || 'Failed to save secret');
      setSaving(false);
      return;
    }

    await refresh();
    closeAddModal();
    setSaving(false);

    const savedId = res.id;
    if (savedId) {
      setSelectedItemId(savedId);
      setSelectedLoading(true);
      setSelectedError(null);
      const detailRes = await getItem(savedId);
      if (detailRes.ok && detailRes.item) {
        setSelectedItem({
          id: detailRes.item.id,
          title: detailRes.item.title,
          content: detailRes.item.content,
          updatedAt: detailRes.item.updatedAt
        });
      } else {
        setSelectedItem(null);
        setSelectedError(detailRes.error || 'Failed to load saved item');
      }
      setSelectedLoading(false);
    }
  };

  const handleStartEditSelected = () => {
    if (!selectedItem) return;
    setEditTitle(selectedItem.title || '');
    setEditSecretValue(selectedItem.content || '');
    setEditError(null);
    setIsEditingSelected(true);
  };

  const handleCancelEditSelected = () => {
    if (selectedItem) {
      setEditTitle(selectedItem.title || '');
      setEditSecretValue(selectedItem.content || '');
    }
    setEditError(null);
    setIsEditingSelected(false);
  };

  const handleSaveSelected = async () => {
    if (!selectedItem?.id) return;

    setEditSaving(true);
    setEditError(null);

    if (!editTitle.trim()) {
      setEditError('Item Name is required');
      setEditSaving(false);
      return;
    }

    const redactionResult = executeRedaction(editSecretValue);
    if (!redactionResult.safe) {
      setEditError('Redaction pipeline failed. Item not updated.');
      setEditSaving(false);
      return;
    }

    const res = await saveItem(selectedItem.id, {
      title: editTitle,
      content: redactionResult.redacted
    });

    if (!res.ok) {
      setEditError(res.error || 'Failed to update item');
      setEditSaving(false);
      return;
    }

    await refresh();
    const detailRes = await getItem(selectedItem.id);
    if (detailRes.ok && detailRes.item) {
      setSelectedItem({
        id: detailRes.item.id,
        title: detailRes.item.title,
        content: detailRes.item.content,
        updatedAt: detailRes.item.updatedAt
      });
    }
    setIsEditingSelected(false);
    setEditSaving(false);
  };

  return (
    <AnimatePresence mode="wait">
      {!entered ? (
        <VaultHero key="vault-hero" onEnter={() => setEntered(true)} />
      ) : (
        <motion.div
          key="vault-dashboard"
          className="space-y-6 relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {/* Depth & Lighting */}
          <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-purple-900/20 to-black rounded-3xl" />
          <div className="pointer-events-none fixed top-[20%] left-[15%] h-[400px] w-[400px] -z-10 rounded-full bg-purple-600/10 blur-[100px]" />
          <div className="pointer-events-none fixed bottom-[10%] right-[10%] h-[300px] w-[300px] -z-10 rounded-full bg-pink-600/10 blur-[100px]" />
      <header className="rounded-2xl bg-white/[0.04] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-[12px]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-100">Vault Workspace</h2>
            <p className="mt-1 text-xs text-slate-300">
              A cleaner, modular archive to create, review, and update sensitive entries.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-white/[0.04] px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-[12px]">
              <p className="text-[10px] uppercase tracking-widest text-slate-400">Vault Engine</p>
              <motion.span
                className={`mt-1 inline-flex text-xs font-semibold ${vaultOnline ? 'text-emerald-300' : 'text-amber-300'}`}
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              >
                {vaultOnline ? 'Online' : 'Offline'}
              </motion.span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="relative flex items-center w-full rounded-full bg-white/10 backdrop-blur-xl border border-white/20 p-1 shadow-[0_10px_40px_rgba(0,0,0,0.3)] transition-all duration-300 focus-within:ring-2 focus-within:ring-purple-500/50">
            <svg className="w-5 h-5 ml-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search vault items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent px-4 py-2 text-sm text-white placeholder-white/50 focus:outline-none"
            />
            <button
              onClick={openAddModal}
              disabled={!vaultOnline}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(168,85,247,0.7)] disabled:opacity-50 disabled:cursor-not-allowed ml-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {!vaultOnline && (
        <div className="rounded-2xl bg-amber-500/10 px-4 py-3 text-xs text-amber-200 shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-[12px]">
          Vault Engine Offline
        </div>
      )}

      <motion.section
        className="grid gap-6 xl:grid-cols-[300px,1fr]"
        variants={dashboardVariants}
        initial="hidden"
        animate="show"
      >
        <aside className="space-y-6">
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -4 }}
            className="transition-all duration-300"
          >
            <GlassCard priority="primary" className="p-5">
              <p className="text-[10px] uppercase tracking-widest text-slate-400">Create</p>
              <h3 className="mt-2 text-lg font-bold text-slate-100">Add Vault Item</h3>
              <p className="mt-1 text-xs text-slate-300">Use a dedicated entry flow for cleaner, safer record creation.</p>
              <button
                type="button"
                onClick={openAddModal}
                disabled={!vaultOnline}
                className="mt-4 flex items-center justify-center gap-2 w-full px-5 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg hover:scale-105 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 text-white font-medium"
              >
                + Add Item
              </button>
            </GlassCard>
          </motion.div>

          <motion.article
            variants={cardVariants}
            whileHover={{ y: -4 }}
            className="rounded-2xl bg-white/[0.05] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-[12px] transition-all duration-300"
          >
            <p className="text-[10px] uppercase tracking-widest text-slate-400">Overview</p>
            <div className="mt-3 grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-white/[0.04] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-[12px]">
                <p className="text-[10px] uppercase tracking-widest text-slate-400">Stored</p>
                <p className="mt-1 text-lg font-bold text-slate-100">{sortedItems.length}</p>
              </div>
              <div className="rounded-2xl bg-white/[0.04] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-[12px]">
                <p className="text-[10px] uppercase tracking-widest text-slate-400">Selected</p>
                <p className="mt-1 text-lg font-bold text-slate-100">{selectedItemId ? '1' : '0'}</p>
              </div>
            </div>
          </motion.article>
        </aside>

        <div className="space-y-8">
          <motion.div variants={cardVariants} whileHover={{ y: -4 }} className="transition-all duration-300">
            <VaultInsights items={vaultItems} />
          </motion.div>

          <motion.div
            variants={cardVariants}
            whileHover={{ y: -4 }}
            className="transition-all duration-300"
          >
            <GlassCard priority="secondary" className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-100">Stored Items</h3>
              <span className="rounded-full bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-widest text-[#fbe4d8] shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-[12px]">
                Click card to view
              </span>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                {error}
              </div>
            )}

            {loading ? (
              <p className="text-xs text-slate-400">Loading items...</p>
            ) : filteredItems.length === 0 ? (
              <div className="text-center opacity-60 mt-10">
                <p>No items yet</p>
              </div>
            ) : (
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                variants={listVariants}
                initial="hidden"
                animate="show"
              >
                {filteredItems.map((item) => {
                  const isActive = selectedItemId === item.id;
                  
                  const getIconForType = (title = '') => {
                    const t = title.toLowerCase();
                    if (t.includes('password') || t.includes('key')) {
                      return (
                        <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      );
                    } else if (t.includes('email') || t.includes('mail')) {
                      return (
                        <svg className="w-5 h-5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      );
                    } else {
                      return (
                        <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                        </svg>
                      );
                    }
                  };

                  const isRecent = item.updatedAt && (Date.now() - new Date(item.updatedAt).getTime() < 604800000);

                  return (
                    <motion.button
                      key={item.id}
                      type="button"
                      onClick={() => selectItem(item)}
                      variants={itemVariants}
                      className={`group p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:scale-[1.02] hover:shadow-xl transition-all duration-300 flex items-center w-full text-left cursor-pointer ${
                          isActive ? 'ring-2 ring-purple-500' : ''
                      }`}
                    >
                      {/* Left: icon (use existing icon system) */}
                      <div className="p-3 shrink-0 rounded-full bg-white/5 shadow-inner mr-4 group-hover:scale-110 transition-transform duration-300">
                        {getIconForType(item.title)}
                      </div>
                      
                      {/* Center: item name */}
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-lg font-semibold text-white">{item.title || 'Untitled Item'}</p>
                        <p className="text-xs text-white/50 truncate mt-0.5">Updated {formatModifiedAt(item.updatedAt)?.split(',')[0]}</p>
                      </div>
                      
                      {/* Right: status pill */}
                      <div className="shrink-0 ml-4">
                        {isRecent ? (
                          <span className="text-xs px-3 py-1.5 rounded-full bg-green-500/20 text-green-300 font-medium">Secured</span>
                        ) : (
                          <span className="text-xs px-3 py-1.5 rounded-full bg-white/10 text-white/60 font-medium">Archived</span>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </motion.div>
            )}
            </GlassCard>
          </motion.div>

          {selectedItemId && (
            <motion.article
              variants={cardVariants}
              whileHover={{ y: -4 }}
              className="mt-2 rounded-2xl bg-white/[0.05] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-[12px] transition-all duration-300"
            >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-100">Item Detail</h3>
              {selectedItem && !isEditingSelected && (
                <button
                  type="button"
                  onClick={handleStartEditSelected}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-100 transition-all duration-200 hover:scale-105 hover:bg-white/10 hover:shadow-[0_5px_20px_rgba(0,0,0,0.3)]"
                >
                  Modify Item
                </button>
              )}
            </div>

            {selectedLoading ? (
              <p className="text-xs text-slate-400">Loading item details...</p>
            ) : selectedError ? (
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                {selectedError}
              </div>
            ) : !selectedItem ? (
              <p className="text-xs text-slate-400">Select a stored item to view and modify it.</p>
            ) : isEditingSelected ? (
              <div className="space-y-4 rounded-2xl bg-[#120b1f]/55 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.28)] backdrop-blur-[10px]">
                <div className="rounded-xl bg-white/[0.03] p-3 backdrop-blur-md">
                  <label className="mb-1 block text-[11px] uppercase tracking-widest text-slate-200">Item Name</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-aura-accent/70"
                  />
                </div>
                <div className="rounded-xl bg-white/[0.03] p-3 backdrop-blur-md">
                  <label className="mb-1 block text-[11px] uppercase tracking-widest text-slate-200">Secret Value</label>
                  <textarea
                    value={editSecretValue}
                    onChange={(e) => setEditSecretValue(e.target.value)}
                    rows="5"
                    className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-aura-accent/70"
                  />
                </div>
                {editError && (
                  <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                    {editError}
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSaveSelected}
                    disabled={editSaving || !vaultOnline}
                    className="rounded-full bg-aura-accent px-5 py-2 text-xs font-semibold text-slate-950 shadow-lg shadow-sky-500/40 transition-all duration-200 hover:scale-105 hover:bg-aura-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {editSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEditSelected}
                    disabled={editSaving}
                    className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs font-medium text-slate-100 transition-all duration-200 hover:scale-105 hover:bg-white/10"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400">Name</p>
                  <p className="mt-1 text-lg font-bold text-slate-100">{selectedItem.title || 'Untitled Item'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400">Modified</p>
                  <p className="mt-1 text-sm text-slate-200">{formatModifiedAt(selectedItem.updatedAt)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400">Secret Preview</p>
                  <p className="mt-1 rounded-xl bg-slate-950/50 px-3 py-2 text-sm text-slate-200 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
                    {selectedItem.content ? `${selectedItem.content.slice(0, 180)}${selectedItem.content.length > 180 ? '...' : ''}` : 'No secret value'}
                  </p>
                </div>
              </div>
            )}
            </motion.article>
          )}
        </div>
      </motion.section>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white/[0.04] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-[12px]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-100">Add Vault Item</h3>
              <button
                type="button"
                onClick={closeAddModal}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-slate-200 transition-all duration-200 hover:scale-105 hover:bg-white/10"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-widest text-slate-400">Item Name</label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g., API Key, Production Password"
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/20 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-xl focus:outline-none focus:ring-1 focus:ring-aura-accent"
                />
              </div>

              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-widest text-slate-400">Secret Value</label>
                <textarea
                  value={secretValue}
                  onChange={(e) => setSecretValue(e.target.value)}
                  placeholder="Enter sensitive value"
                  rows="5"
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/20 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-xl focus:outline-none focus:ring-1 focus:ring-aura-accent"
                />
              </div>

              {saveError && (
                <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                  {saveError}
                </div>
              )}

              <button
                type="submit"
                disabled={saving || !vaultOnline}
                className="w-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-2 text-sm font-semibold text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(168,85,247,0.7)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Item'}
              </button>
            </form>
          </div>
        </div>
      )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Vault;
