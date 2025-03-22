import React, { useState, useMemo } from 'react';
import { Settings2, Sun, Moon, Monitor, Plus, Check, XCircle, Edit2, Trash2, Lock, FileText, Star, Award, ChevronDown, Users, Search, Filter, SortAsc, SortDesc, UserPlus, Download, Folder, X, Bell } from 'lucide-react';
import { useStore } from '../store';
import { ThemeToggle } from './ThemeToggle';
import { NameSettings } from './NameSettings';
import { UsersGuide } from './UsersGuide';
import { Student, Section, PARTICIPATION_QUALITIES, ParticipationQuality } from '../types';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { notificationManager } from '../utils/notifications';

export const Settings: React.FC = () => {
  const { 
    students,
    sections,
    removeSection,
    addSection,
    updateStudentSection,
    removeStudent,
    toggleStudentProtection,
    participationRecords,
    currentSectionId
  } = useStore();

  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'students' | 'guide'>('general');
  const [showNewSectionForm, setShowNewSectionForm] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkImportText, setBulkImportText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState<string | null>(currentSectionId);
  const [sortField, setSortField] = useState<'name' | 'score' | 'participations'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showProtectedOnly, setShowProtectedOnly] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState(notificationManager.getPreferences());

  const handleNotificationPrefChange = (key: keyof typeof notificationPrefs) => {
    const newPrefs = {
      ...notificationPrefs,
      [key]: !notificationPrefs[key]
    };
    setNotificationPrefs(newPrefs);
    notificationManager.setPreferences(newPrefs);
    toast.success('Notification preferences updated');
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Notifications are not supported in this browser');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      toast.success('Notification permission granted');
    } else {
      toast.error('Notification permission denied');
    }
  };

  const handleClose = () => {
    setShowSettings(false);
    setTimeout(() => setActiveTab('general'), 300);
  };

  const handleAddSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSectionName.trim()) {
      addSection(newSectionName.trim());
      setNewSectionName('');
      setShowNewSectionForm(false);
      toast.success(`Added section: ${newSectionName.trim()}`);
    }
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent({ ...student });
  };

  const handleSaveEdit = async () => {
    if (!editingStudent) return;
    await updateStudentSection(editingStudent.id, editingStudent.sectionId);
    setEditingStudent(null);
    toast.success('Student updated successfully');
  };

  const handleDeleteStudent = async (student: Student) => {
    if (student.protected) {
      const confirm = window.confirm(
        'This student is protected. Are you sure you want to remove them? This action cannot be undone.'
      );
      if (!confirm) return;
    }
    await removeStudent(student.id);
    toast.success('Student removed');
  };

  const handleExportData = () => {
    const data = students.map(student => ({
      firstName: student.firstName,
      lastName: student.lastName,
      section: sections.find(s => s.id === student.sectionId)?.name || 'Unsectioned',
      totalScore: student.totalScore,
      participationCount: student.participationCount,
      protected: student.protected
    }));

    const csv = [
      ['First Name', 'Last Name', 'Section', 'Total Score', 'Participations', 'Protected'].join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Data exported successfully');
  };

  const filteredStudents = useMemo(() => {
    let result = [...students];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(student => 
        student.firstName.toLowerCase().includes(term) ||
        student.lastName.toLowerCase().includes(term)
      );
    }

    if (selectedSection) {
      result = result.filter(student => student.sectionId === selectedSection);
    }

    if (showProtectedOnly) {
      result = result.filter(student => student.protected);
    }

    // Sort students
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'name':
          comparison = `${a.lastName}, ${a.firstName}`.localeCompare(`${b.lastName}, ${b.firstName}`);
          break;
        case 'score':
          comparison = (b.totalScore || 0) - (a.totalScore || 0);
          break;
        case 'participations':
          comparison = (b.participationCount || 0) - (a.participationCount || 0);
          break;
      }
      
      return sortDirection === 'asc' ? -comparison : comparison;
    });
    
    return result;
  }, [students, searchTerm, selectedSection, showProtectedOnly, sortField, sortDirection]);

  return (
    <div className="relative">
      <button
        onClick={() => setShowSettings(true)}
        className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
        title="Settings"
      >
        <Settings2 size={24} />
      </button>

      {showSettings && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
            onClick={handleClose}
          />

          <div 
            className={`
              fixed z-50 bg-white dark:bg-dark-800 shadow-xl transition-transform duration-300
              ${window.innerWidth < 640 
                ? 'inset-x-0 bottom-0 rounded-t-2xl max-h-[90vh] safe-bottom' 
                : 'right-0 top-0 h-full w-[90vw] max-w-2xl'
              }
            `}
          >
            <div className="sticky top-0 z-10 bg-white dark:bg-dark-800 border-b dark:border-dark-700 px-4 py-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold dark:text-white">Settings</h3>
              <button
                onClick={handleClose}
                className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-4 py-2 border-b dark:border-dark-700">
              <div className="flex space-x-2 overflow-x-auto hide-scrollbar">
                {[
                  { id: 'general', label: 'General', icon: Settings2 },
                  { id: 'students', label: 'Students', icon: Users },
                  { id: 'guide', label: 'Guide', icon: FileText }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap
                      transition-colors
                      ${activeTab === tab.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-700'
                      }
                    `}
                  >
                    <tab.icon size={16} />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div 
              className="overflow-y-auto hide-scrollbar" 
              style={{ 
                height: window.innerWidth < 640 
                  ? 'calc(90vh - 120px)' 
                  : 'calc(100vh - 120px)' 
              }}
            >
              <div className="p-4 space-y-6">
                {activeTab === 'general' && (
                  <>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Theme
                      </h4>
                      <ThemeToggle />
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Name Detection
                      </h4>
                      <NameSettings />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Notifications
                        </h4>
                        <button
                          onClick={requestNotificationPermission}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <Bell size={16} />
                          Request Permission
                        </button>
                      </div>

                      <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4 space-y-4">
                        <div className="space-y-3">
                          <label className="flex items-center justify-between">
                            <div>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Participation Alerts
                              </span>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Get notified when students participate
                              </p>
                            </div>
                            <input
                              type="checkbox"
                              checked={notificationPrefs.participationAlerts}
                              onChange={() => handleNotificationPrefChange('participationAlerts')}
                              className="h-5 w-5 text-blue-500 rounded focus:ring-blue-500 dark:bg-dark-600"
                            />
                          </label>

                          <label className="flex items-center justify-between">
                            <div>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Low Participation Alerts
                              </span>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Get notified about inactive students
                              </p>
                            </div>
                            <input
                              type="checkbox"
                              checked={notificationPrefs.lowParticipationAlerts}
                              onChange={() => handleNotificationPrefChange('lowParticipationAlerts')}
                              className="h-5 w-5 text-blue-500 rounded focus:ring-blue-500 dark:bg-dark-600"
                            />
                          </label>

                          <label className="flex items-center justify-between">
                            <div>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Ranking Changes
                              </span>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Get notified when student rankings change
                              </p>
                            </div>
                            <input
                              type="checkbox"
                              checked={notificationPrefs.rankingChanges}
                              onChange={() => handleNotificationPrefChange('rankingChanges')}
                              className="h-5 w-5 text-blue-500 rounded focus:ring-blue-500 dark:bg-dark-600"
                            />
                          </label>

                          <label className="flex items-center justify-between">
                            <div>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Audio Device Alerts
                              </span>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Get notified about microphone status
                              </p>
                            </div>
                            <input
                              type="checkbox"
                              checked={notificationPrefs.audioDeviceAlerts}
                              onChange={() => handleNotificationPrefChange('audioDeviceAlerts')}
                              className="h-5 w-5 text-blue-500 rounded focus:ring-blue-500 dark:bg-dark-600"
                            />
                          </label>

                          <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Minimum Time Between Alerts
                            </label>
                            <select
                              value={notificationPrefs.minTimeBetweenAlerts}
                              onChange={(e) => {
                                const newPrefs = {
                                  ...notificationPrefs,
                                  minTimeBetweenAlerts: Number(e.target.value)
                                };
                                setNotificationPrefs(newPrefs);
                                notificationManager.setPreferences(newPrefs);
                              }}
                              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-dark-600 border border-gray-300 dark:border-dark-500 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value={5000}>5 seconds</option>
                              <option value={15000}>15 seconds</option>
                              <option value={30000}>30 seconds</option>
                              <option value={60000}>1 minute</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'guide' && (
                  <UsersGuide />
                )}

                {activeTab === 'students' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Student Master List
                      </h4>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowBulkImport(true)}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <FileText size={16} />
                          Bulk Import
                        </button>
                        <button
                          onClick={handleExportData}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                        >
                          <Download size={16} />
                          Export CSV
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="relative flex-1">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Search students..."
                          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-700 dark:border-dark-600 dark:text-white"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg"
                          title={sortDirection === 'asc' ? 'Sort Ascending' : 'Sort Descending'}
                        >
                          {sortDirection === 'asc' ? <SortAsc size={20} /> : <SortDesc size={20} />}
                        </button>
                        <select
                          value={sortField}
                          onChange={(e) => setSortField(e.target.value as any)}
                          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-700 dark:border-dark-600 dark:text-white"
                        >
                          <option value="name">Sort by Name</option>
                          <option value="score">Sort by Score</option>
                          <option value="participations">Sort by Participations</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4">
                      <select
                        value={selectedSection || ''}
                        onChange={(e) => setSelectedSection(e.target.value || null)}
                        className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-700 dark:border-dark-600 dark:text-white"
                      >
                        <option value="">All Sections</option>
                        {sections.map(section => (
                          <option key={section.id} value={section.id}>{section.name}</option>
                        ))}
                      </select>

                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={showProtectedOnly}
                          onChange={(e) => setShowProtectedOnly(e.target.checked)}
                          className="text-blue-500 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Protected Only
                        </span>
                      </label>
                    </div>

                    <div className="space-y-2">
                      {filteredStudents.map(student => (
                        <div
                          key={student.id}
                          className="flex items-center justify-between p-3 bg-white dark:bg-dark-700 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-600 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium dark:text-white">
                                  {student.lastName}, {student.firstName}
                                </span>
                                {student.protected && (
                                  <Lock size={16} className="text-blue-500" />
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <span>Score: {student.totalScore || 0}</span>
                                <span>•</span>
                                <span>Participations: {student.participationCount || 0}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEditStudent(student)}
                              className="p-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                              title="Edit Student"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => toggleStudentProtection(student.id)}
                              className={`p-1 ${
                                student.protected ?
                                'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20' :
                                'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                              } rounded`}
                              title={student.protected ? 'Remove Protection' : 'Add Protection'}
                            >
                              <Lock size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(student)}
                              className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                              title="Delete Student"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}

                      {filteredStudents.length === 0 && (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                          No students found
                        </div>
                      )}
                    </div>

                    {showNewSectionForm ? (
                      <form onSubmit={handleAddSection} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newSectionName}
                          onChange={(e) => setNewSectionName(e.target.value)}
                          placeholder="Section name"
                          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-700 dark:border-dark-600 dark:text-white"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowNewSectionForm(false)}
                          className="px-4 py-2 text-gray-600 dark:text-gray-400"
                        >
                          Cancel
                        </button>
                      </form>
                    ) : (
                      <button
                        onClick={() => setShowNewSectionForm(true)}
                        className="flex items-center gap-2 text-blue-500 hover:text-blue-600"
                      >
                        <Plus size={16} />
                        Add Section
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};