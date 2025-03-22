import React, { useState } from 'react';
import { useStore } from '../store';
import { PlusCircle, Folder, ChevronDown, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const ClassSelector: React.FC = () => {
  const { 
    sections, 
    addSection,
    removeSection,
    currentSectionId,
    setCurrentSection
  } = useStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSectionName.trim()) {
      addSection(newSectionName.trim());
      setNewSectionName('');
      setShowAddForm(false);
      toast.success(`Added section: ${newSectionName.trim()}`);
    }
  };

  const currentSection = sections.find(s => s.id === currentSectionId);

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-dark-800 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
          >
            <Folder size={20} className="text-purple-600 dark:text-purple-400" />
            <span className="font-medium dark:text-white">
              {currentSection ? currentSection.name : 'Select Section'}
            </span>
            <ChevronDown size={16} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </button>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
          title="Add New Section"
        >
          <PlusCircle size={24} />
        </button>
      </div>

      {showDropdown && (
        <div className="absolute top-full mt-1 w-64 bg-white dark:bg-dark-800 rounded-lg shadow-lg z-50">
          <div className="p-2 space-y-1">
            {sections.map(section => (
              <div
                key={section.id}
                className="flex items-center justify-between group"
              >
                <button
                  onClick={() => {
                    setCurrentSection(section.id);
                    setShowDropdown(false);
                  }}
                  className={`flex-1 px-3 py-2 text-left rounded-lg transition-colors ${
                    currentSectionId === section.id
                      ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                      : 'hover:bg-gray-50 dark:hover:bg-dark-700 dark:text-white'
                  }`}
                >
                  {section.name}
                </button>
                <button
                  onClick={() => removeSection(section.id)}
                  className="p-1 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
                  title="Remove Section"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            {sections.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 px-3 py-2">No sections added yet</p>
            )}
          </div>
        </div>
      )}

      {/* Add Section Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow-lg p-6 w-full max-w-md animate-scale-in">
            <h3 className="text-lg font-semibold dark:text-white mb-4">Add New Section</h3>
            <form onSubmit={handleAddSection}>
              <input
                type="text"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                placeholder="Enter section name"
                className="w-full px-4 py-2 border dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-dark-700 dark:text-white mb-4"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewSectionName('');
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                >
                  Add Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};