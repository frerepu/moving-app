import React, { useState, useEffect } from 'react';
import { Trash2, Gift, Package, Plus, X, LogOut, Camera, Upload, Image as ImageIcon, CheckCircle, DollarSign, MessageSquare } from 'lucide-react';

const API_URL = '/api';

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [voteComments, setVoteComments] = useState({});
  const [voteModal, setVoteModal] = useState(null); // { itemId, vote }

  // Login state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    if (token) {
      fetchUserInfo();
      fetchItems();
    }
  }, [token]);

  const fetchUserInfo = async () => {
    try {
      const res = await fetch(`${API_URL}/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error);
    }
  };

  const fetchItems = async () => {
    try {
      const res = await fetch(`${API_URL}/items`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (error) {
      console.error('Failed to fetch items:', error);
    }
  };

  const login = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
      } else {
        setLoginError(data.error || 'Login failed');
      }
    } catch (error) {
      setLoginError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setItems([]);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (10MB limit to match backend)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        setError('Image is too large. Please choose an image smaller than 10MB.');
        return;
      }

      setError('');
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const addItem = async () => {
    if (!newItem.trim()) return;

    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('name', newItem);
    if (selectedImage) {
      formData.append('image', selectedImage);
    }

    try {
      const res = await fetch(`${API_URL}/items`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        setNewItem('');
        clearImage();
        fetchItems();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to add item. Please try again.');
      }
    } catch (error) {
      console.error('Failed to add item:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const openVoteModal = (itemId, vote) => {
    setVoteModal({ itemId, vote });
  };

  const closeVoteModal = () => {
    setVoteModal(null);
  };

  const submitVote = async () => {
    if (!voteModal) return;

    try {
      const comment = voteComments[voteModal.itemId] || null;
      const res = await fetch(`${API_URL}/items/${voteModal.itemId}/vote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ vote: voteModal.vote, comment })
      });

      if (res.ok) {
        // Clear comment after successful vote
        setVoteComments(prev => ({ ...prev, [voteModal.itemId]: '' }));
        closeVoteModal();
        fetchItems();
      }
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  const removeItem = async (itemId) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const res = await fetch(`${API_URL}/items/${itemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        fetchItems();
      }
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const finalizeDecision = async (itemId, decision) => {
    try {
      const res = await fetch(`${API_URL}/items/${itemId}/decision`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ decision })
      });

      if (res.ok) {
        fetchItems();
      }
    } catch (error) {
      console.error('Failed to finalize decision:', error);
    }
  };

  const decisions = {
    move: { label: 'Move it', icon: Package, color: 'bg-blue-500', textColor: 'text-blue-600' },
    toss: { label: 'Toss it', icon: Trash2, color: 'bg-red-500', textColor: 'text-red-600' },
    give: { label: 'Give away', icon: Gift, color: 'bg-green-500', textColor: 'text-green-600' },
    sell: { label: 'Sell it', icon: DollarSign, color: 'bg-yellow-500', textColor: 'text-yellow-600' },
    other: { label: 'Other', icon: MessageSquare, color: 'bg-purple-500', textColor: 'text-purple-600' }
  };

  const getVoteSummary = (item) => {
    const summary = { move: 0, toss: 0, give: 0, sell: 0, other: 0 };
    item.votes.forEach(vote => {
      if (vote.vote) summary[vote.vote]++;
    });
    return summary;
  };

  const getUserVote = (item) => {
    const vote = item.votes.find(v => v.user_id === user?.id);
    return vote?.vote;
  };

  const getSortedItems = (items) => {
    if (!user) return items;

    // Separate items into voted and unvoted
    const unvoted = [];
    const voted = [];

    items.forEach(item => {
      const userVote = item.votes.find(v => v.user_id === user.id);
      if (userVote) {
        voted.push(item);
      } else {
        unvoted.push(item);
      }
    });

    // Sort unvoted by created_at DESC (newest first)
    unvoted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Sort voted by created_at DESC too (most recently created first)
    // This way when you vote, the item stays in its relative position among voted items
    voted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Return unvoted first, then voted
    return [...unvoted, ...voted];
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Moving Decisions</h1>
          <p className="text-gray-600 mb-6">Sign in to continue</p>

          <form onSubmit={login} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            {loginError && (
              <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const stats = {
    total: items.length,
    move: items.filter(i => i.decision === 'move').length,
    toss: items.filter(i => i.decision === 'toss').length,
    give: items.filter(i => i.decision === 'give').length,
    sell: items.filter(i => i.decision === 'sell').length,
    other: items.filter(i => i.decision === 'other').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Moving Decisions</h1>
              <p className="text-gray-600">Welcome, {user?.displayName}!</p>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>

          {/* Stats */}
          {items.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-gray-600">{stats.total}</div>
                <div className="text-xs text-gray-600">Total</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.move}</div>
                <div className="text-xs text-gray-600">Moving</div>
              </div>
              <div className="bg-red-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-600">{stats.toss}</div>
                <div className="text-xs text-gray-600">Tossing</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.give}</div>
                <div className="text-xs text-gray-600">Giving</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.sell}</div>
                <div className="text-xs text-gray-600">Selling</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.other}</div>
                <div className="text-xs text-gray-600">Other</div>
              </div>
            </div>
          )}
        </div>

        {/* Add Item */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="space-y-4">
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !selectedImage && addItem()}
              placeholder="What item do we need to decide about?"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 text-lg"
            />

            {imagePreview && (
              <div className="relative">
                <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                <button
                  onClick={clearImage}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                >
                  <X size={20} />
                </button>
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <label className="flex-1 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <div className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg flex items-center justify-center gap-2 font-semibold transition-colors">
                  <Camera size={20} />
                  {selectedImage ? 'Change Photo' : 'Take Photo'}
                </div>
              </label>

              <button
                onClick={addItem}
                disabled={loading || !newItem.trim()}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-semibold transition-colors disabled:opacity-50"
              >
                <Plus size={20} />
                Add Item
              </button>
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-3">
          {items.length === 0 ? (
            <div className="bg-white rounded-lg shadow-lg p-12 text-center text-gray-400">
              <Package size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">No items yet. Add your first item above!</p>
            </div>
          ) : (
            getSortedItems(items).map(item => {
              const voteSummary = getVoteSummary(item);
              const userVote = getUserVote(item);

              return (
                <div key={item.id} className="bg-white rounded-lg shadow-lg p-5 transition-all hover:shadow-xl">
                  {item.image_path && (
                    <img 
                      src={item.image_path} 
                      alt={item.name}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-semibold text-gray-800">{item.name}</h3>
                        {userVote && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                            ✓ Voted
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">Added by {item.created_by_name}</p>
                    </div>
                    {user?.isAdmin && (
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Remove item (Admin only)"
                      >
                        <X size={20} />
                      </button>
                    )}
                  </div>

                  {/* Vote Summary */}
                  {item.votes.length > 0 && (
                    <div className="flex gap-2 mb-3 text-sm">
                      {Object.entries(voteSummary).map(([key, count]) => {
                        if (count === 0) return null;
                        const { icon: Icon, textColor } = decisions[key];
                        return (
                          <div key={key} className={`flex items-center gap-1 ${textColor}`}>
                            <Icon size={16} />
                            <span className="font-semibold">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Voting Buttons */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {Object.entries(decisions).map(([key, { label, icon: Icon, color }]) => (
                      <button
                        key={key}
                        onClick={() => openVoteModal(item.id, key)}
                        disabled={!!item.decision}
                        className={`
                          py-3 px-3 rounded-lg font-semibold text-white transition-all
                          flex items-center justify-center gap-2
                          ${userVote === key
                            ? color + ' ring-4 ring-offset-2 ring-offset-white ring-opacity-50 ' + color.replace('bg-', 'ring-')
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          }
                          ${item.decision ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                      >
                        <Icon size={18} />
                        <span className="hidden sm:inline text-sm">{label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Who Voted What */}
                  {item.votes.length > 0 && (
                    <div className="mt-4 border-t-2 border-gray-100 pt-4">
                      <p className="text-sm font-semibold text-gray-600 mb-2">Everyone's Votes:</p>
                      <div className="space-y-2">
                        {item.votes.map(vote => (
                          <div key={vote.user_id} className="flex items-start gap-2 text-sm">
                            <span className={`font-semibold ${decisions[vote.vote]?.textColor || 'text-gray-600'}`}>
                              {vote.username}:
                            </span>
                            <span className={`${decisions[vote.vote]?.textColor || 'text-gray-600'}`}>
                              {decisions[vote.vote]?.label || vote.vote}
                            </span>
                            {vote.comment && (
                              <span className="text-gray-600 italic">
                                - "{vote.comment}"
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Final Decision */}
                  {item.decision && (
                    <div className={`mt-4 p-4 rounded-lg border-2 ${decisions[item.decision].color.replace('bg-', 'border-')} ${decisions[item.decision].color} bg-opacity-10`}>
                      <div className="flex items-center gap-2">
                        <CheckCircle size={20} className={decisions[item.decision].textColor} />
                        <span className={`font-semibold ${decisions[item.decision].textColor}`}>
                          Final Decision: {decisions[item.decision].label}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Admin Controls */}
                  {user?.isAdmin && !item.decision && (
                    <div className="mt-4 border-t-2 border-gray-100 pt-4">
                      <p className="text-sm text-gray-600 font-semibold mb-2">Finalize Decision (Admin Only)</p>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        {Object.entries(decisions).map(([key, { label, icon: Icon, color }]) => (
                          <button
                            key={key}
                            onClick={() => finalizeDecision(item.id, key)}
                            className={`${color} hover:opacity-90 text-white py-2 px-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-1 text-sm`}
                          >
                            <CheckCircle size={16} />
                            <span className="hidden sm:inline">{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Vote Modal */}
      {voteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={closeVoteModal}>
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                {decisions[voteModal.vote] && (
                  <>
                    {React.createElement(decisions[voteModal.vote].icon, { size: 24, className: decisions[voteModal.vote].textColor })}
                    <span>Vote: {decisions[voteModal.vote].label}</span>
                  </>
                )}
              </h3>
              <button onClick={closeVoteModal} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Add a comment (optional):
              </label>
              <textarea
                value={voteComments[voteModal.itemId] || ''}
                onChange={(e) => setVoteComments(prev => ({ ...prev, [voteModal.itemId]: e.target.value }))}
                placeholder="Add your thoughts here..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm resize-none"
                rows="4"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={closeVoteModal}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitVote}
                className={`flex-1 px-4 py-3 rounded-lg font-semibold text-white transition-colors flex items-center justify-center gap-2 ${decisions[voteModal.vote]?.color || 'bg-blue-500'} hover:opacity-90`}
              >
                <CheckCircle size={20} />
                Submit Vote
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
