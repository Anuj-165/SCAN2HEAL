import React, { useState } from 'react';
import { Pill, Search, AlertTriangle, CheckCircle, Info, Sparkles, Brain } from 'lucide-react';
import Button from '../components/UI/Button';
import Card from '../components/UI/Card';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import ApiService from '../services/api.ts';
import { Medicine } from '../types';

const ScanMedicinePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [medicineData, setMedicineData] = useState<Medicine | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [sideEffects, setSideEffects] = useState<string[]>([]); // ✅ NEW

  const searchMedicine = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setError('');
    setSuggestions([]);
    setSideEffects([]); // Clear previous effects

    try {
      const sideEffects = await ApiService.fetchSideEffects(searchQuery); // ✅ Use dynamic input
      setSideEffects(sideEffects);
    } catch (error: any) {
      setMedicineData(null);
      setError(error.message || 'Medicine not found');
      if (error.response?.data?.suggestions) {
        setSuggestions(error.response.data.suggestions);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setSuggestions([]);
    setError('');
    searchMedicine(); // Immediately search on click
  };

  const handleSearch = () => searchMedicine();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-green-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Pill className="h-12 w-12 text-green-600 mr-3" />
            <Sparkles className="h-8 w-8 text-yellow-500 animate-pulse" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent mb-4">
            AI Medicine Finder
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Enter a medicine name to get details like side effects, dosage, and interactions.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Search Section */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <Pill className="h-6 w-6 mr-2 text-green-600" />
                Search Medicine
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Medicine Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="e.g., Paracetamol, Ibuprofen"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <Search className="absolute right-3 top-3.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                <Button
                  onClick={handleSearch}
                  disabled={isSearching || !searchQuery.trim()}
                  loading={isSearching}
                  className="w-full"
                  size="lg"
                  icon={Search}
                >
                  {isSearching ? 'Searching...' : 'Search Medicine'}
                </Button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-700">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
                  <p className="text-blue-900 dark:text-blue-100 font-medium mb-2">Did you mean:</p>
                  <div className="space-y-1">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="block w-full text-left px-3 py-2 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800/30 rounded-lg transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2">
            {isSearching ? (
              <Card className="p-12 text-center">
                <LoadingSpinner
                  variant="medical"
                  size="lg"
                  text="Searching medicine database..."
                />
              </Card>
            ) : sideEffects.length > 0 ? (
              <>
                <Card className="p-6 mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                    <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
                    Side Effects
                  </h2>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-200">
                    {sideEffects[0].split('. ').map((effect, index) => (
                      <li key={index}>{effect.trim()}.</li>
                    ))}
                  </ul>
                </Card>
              </>
            ) : (
              <Card className="p-12 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-teal-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Pill className="h-12 w-12 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Search for Medicine Information
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Enter a medicine name to get comprehensive info including dosage, side effects, and warnings.
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanMedicinePage;
