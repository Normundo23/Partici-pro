import React, { useState, useRef, useEffect } from 'react';
import { Trophy, Medal, ChevronDown, Folder, UserPlus, AlertCircle } from 'lucide-react';
import { useStore } from '../store';
import { Student } from '../types';
import { toast } from 'react-hot-toast';

export const StudentList: React.FC = () => {
  const { 
    students, 
    sections,
    participationRecords,
    addStudent
  } = useStore();
  
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [newStudentFirstName, setNewStudentFirstName] = useState('');
  const [newStudentLastName, setNewStudentLastName] = useState('');
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  // Add a state variable to force re-renders when scores change
  const [refreshKey, setRefreshKey] = useState(0);

  // Force a re-render whenever students or participationRecords change
  useEffect(() => {
    setRefreshKey(prevKey => prevKey + 1);
    console.log('StudentList refreshed due to data changes');
  }, [students, participationRecords]);

  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const sectionRef = useRef<HTMLSelectElement>(null);

  const handleToggleSection = (sectionId: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newStudentFirstName.trim() && newStudentLastName.trim()) {
      await addStudent(newStudentFirstName.trim(), newStudentLastName.trim(), selectedSection);
      setNewStudentFirstName('');
      setNewStudentLastName('');
      setSelectedSection(null);
      firstNameRef.current?.focus();
    } else {
      toast.error('Please enter both first and last name');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, field: 'firstName' | 'lastName' | 'section') => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      switch (field) {
        case 'firstName':
          lastNameRef.current?.focus();
          break;
        case 'lastName':
          sectionRef.current?.focus();
          break;
        case 'section':
          if (newStudentFirstName && newStudentLastName) {
            handleAddStudent(e as any);
          }
          break;
      }
    }
  };

  // Get the latest participation quality for a student
  const getLatestParticipation = (studentId: string) => {
    return participationRecords
      .filter(record => record.studentId === studentId)
      .sort((a, b) => {
        const dateA = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
        const dateB = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
        return dateB.getTime() - dateA.getTime();
      })[0]?.quality;
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="text-yellow-500" size={20} />;
      case 2:
        return <Medal className="text-gray-400" size={20} />;
      case 3:
        return <Medal className="text-amber-600" size={20} />;
      default:
        return null;
    }
  };

  // Group students by section
  const groupedStudents: Record<string | 'unsectioned', typeof students> = {
    unsectioned: students.filter(s => !s.sectionId)
  };

  sections.forEach(section => {
    groupedStudents[section.id] = students.filter(s => s.sectionId === section.id);
  });

  // Sort students by score within each section
  Object.values(groupedStudents).forEach(sectionStudents => {
    sectionStudents.sort((a, b) => b.totalScore - a.totalScore);
  });

  const renderStudent = (student: Student) => {
    const latestQuality = getLatestParticipation(student.id);
    
    console.log(`Rendering student: ${student.firstName} ${student.lastName}, Score: ${student.totalScore}`);
    
    return (
      <div
        key={student.id}
        className="flex items-center justify-between p-3 bg-white dark:bg-dark-800 rounded-lg shadow-sm"
      >
        <div className="flex items-center gap-3">
          {getRankIcon(student.rank)}
          <div>
            <h3 className="text-lg font-semibold dark:text-white">
              {student.firstName} {student.lastName}
            </h3>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600 dark:text-gray-400 font-bold">
                Score: {student.totalScore}
              </span>
              {latestQuality && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className={latestQuality.color}>
                    {latestQuality.keyword}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // The refreshKey is used in a key prop to force re-rendering when data changes
  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6" key={refreshKey}>
      {/* Add Student Form */}
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-4">
        <form onSubmit={handleAddStudent} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                First Name
              </label>
              <input
                ref={firstNameRef}
                id="firstName"
                type="text"
                value={newStudentFirstName}
                onChange={(e) => setNewStudentFirstName(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 'firstName')}
                placeholder="Enter first name"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-700 dark:border-dark-600 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Last Name
              </label>
              <input
                ref={lastNameRef}
                id="lastName"
                type="text"
                value={newStudentLastName}
                onChange={(e) => setNewStudentLastName(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 'lastName')}
                placeholder="Enter last name"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-700 dark:border-dark-600 dark:text-white"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="section" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Section (Optional)
              </label>
              <select
                ref={sectionRef}
                id="section"
                value={selectedSection || ''}
                onChange={(e) => setSelectedSection(e.target.value || null)}
                onKeyDown={(e) => handleKeyDown(e, 'section')}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-700 dark:border-dark-600 dark:text-white"
              >
                <option value="">No Section</option>
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                <UserPlus size={20} />
                Add Student
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Student List */}
      <div className="space-y-6">
        {sections.map(section => {
          const sectionStudents = groupedStudents[section.id];
          if (!sectionStudents?.length) return null;
          
          const isCollapsed = collapsedSections.has(section.id);
          
          return (
            <div key={section.id} className="space-y-2">
              <button
                onClick={() => handleToggleSection(section.id)}
                className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-600 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Folder className="text-purple-500" size={20} />
                  <h2 className="text-lg font-semibold dark:text-white">
                    {section.name}
                  </h2>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    ({sectionStudents.length} students)
                  </span>
                </div>
                <ChevronDown
                  size={20}
                  className={`text-gray-400 transition-transform ${
                    isCollapsed ? '' : 'rotate-180'
                  }`}
                />
              </button>
              {!isCollapsed && (
                <div className="space-y-2">
                  {sectionStudents.map(renderStudent)}
                </div>
              )}
            </div>
          );
        })}

        {groupedStudents.unsectioned.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 p-3">
              Unsectioned Students ({groupedStudents.unsectioned.length})
            </h2>
            <div className="space-y-2">
              {groupedStudents.unsectioned.map(renderStudent)}
            </div>
          </div>
        )}

        {Object.values(groupedStudents).every(group => group.length === 0) && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No students added yet
          </div>
        )}
      </div>
    </div>
  );
};