'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Eye,
  Settings,
  Plus,
  GripVertical,
  Trash2,
  ChevronUp,
  ChevronDown,
  Image,
  Type,
  Calendar,
  CreditCard,
  Users,
  MessageSquare,
  Video
} from 'lucide-react';

type SectionType = 'hero' | 'text' | 'schedule' | 'pricing' | 'team' | 'testimonials' | 'gallery' | 'cta';

interface Section {
  id: string;
  type: SectionType;
  content: Record<string, unknown>;
}

const sectionTypes = [
  { type: 'hero' as SectionType, label: 'Hero Banner', icon: Image, description: 'Large banner with headline' },
  { type: 'text' as SectionType, label: 'Text Block', icon: Type, description: 'Rich text content' },
  { type: 'schedule' as SectionType, label: 'Class Schedule', icon: Calendar, description: 'Weekly class timetable' },
  { type: 'pricing' as SectionType, label: 'Pricing Plans', icon: CreditCard, description: 'Membership options' },
  { type: 'team' as SectionType, label: 'Team / Coaches', icon: Users, description: 'Instructor profiles' },
  { type: 'testimonials' as SectionType, label: 'Testimonials', icon: MessageSquare, description: 'Member reviews' },
  { type: 'gallery' as SectionType, label: 'Photo Gallery', icon: Image, description: 'Image grid' },
  { type: 'cta' as SectionType, label: 'Call to Action', icon: Video, description: 'Signup prompt' },
];

const defaultSections: Section[] = [
  {
    id: '1',
    type: 'hero',
    content: {
      headline: 'Train Like a Champion',
      subheadline: 'Join the best MMA gym in the city',
      buttonText: 'Start Free Trial',
      backgroundImage: null
    }
  },
  {
    id: '2',
    type: 'schedule',
    content: {
      title: 'Class Schedule',
      showBooking: true
    }
  },
  {
    id: '3',
    type: 'pricing',
    content: {
      title: 'Membership Plans',
      showPlans: ['basic', 'pro', 'unlimited']
    }
  },
];

export default function PageEditorPage() {
  const params = useParams();
  const isNew = params.id === 'new';

  const [pageTitle, setPageTitle] = useState(isNew ? '' : 'Main Homepage');
  const [pageSlug, setPageSlug] = useState(isNew ? '' : '');
  const [sections, setSections] = useState<Section[]>(isNew ? [] : defaultSections);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [showAddSection, setShowAddSection] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...sections];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;
    [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
    setSections(newSections);
  };

  const deleteSection = (id: string) => {
    setSections(sections.filter(s => s.id !== id));
    if (selectedSection === id) setSelectedSection(null);
  };

  const addSection = (type: SectionType) => {
    const newSection: Section = {
      id: Date.now().toString(),
      type,
      content: {}
    };
    setSections([...sections, newSection]);
    setShowAddSection(false);
    setSelectedSection(newSection.id);
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  return (
    <div className="min-h-screen -m-4 lg:-m-8 flex flex-col">
      {/* Editor Header */}
      <div className="bg-[#12121a] border-b border-white/10 px-4 lg:px-6 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Link
            href="/owner/pages"
            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <input
              type="text"
              value={pageTitle}
              onChange={(e) => setPageTitle(e.target.value)}
              placeholder="Page title..."
              className="bg-transparent text-white font-semibold text-lg focus:outline-none placeholder-gray-500"
            />
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">yoursite.com/</span>
              <input
                type="text"
                value={pageSlug}
                onChange={(e) => setPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="page-url"
                className="bg-transparent text-gray-400 focus:outline-none placeholder-gray-600 w-32"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <Settings className="w-4 h-4" />
            Settings
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-linear-to-r from-orange-500 to-amber-500 text-white px-4 py-2 rounded-lg font-medium hover:from-orange-600 hover:to-amber-600 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 flex">
        {/* Section List */}
        <div className="w-80 bg-[#0d0d12] border-r border-white/10 overflow-y-auto">
          <div className="p-4 border-b border-white/10">
            <h2 className="font-semibold text-white">Page Sections</h2>
            <p className="text-gray-500 text-sm mt-1">Drag to reorder, click to edit</p>
          </div>

          <div className="p-4 space-y-2">
            {sections.map((section, index) => (
              <div
                key={section.id}
                onClick={() => setSelectedSection(section.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedSection === section.id
                    ? 'bg-orange-500/10 border-orange-500/30'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <GripVertical className="w-4 h-4 text-gray-600 cursor-grab" />
                  <div className="flex-1">
                    <p className="text-white font-medium capitalize">{section.type.replace('-', ' ')}</p>
                    <p className="text-gray-500 text-xs">Section {index + 1}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); moveSection(index, 'up'); }}
                      disabled={index === 0}
                      className="p-1 hover:bg-white/10 rounded disabled:opacity-30"
                    >
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); moveSection(index, 'down'); }}
                      disabled={index === sections.length - 1}
                      className="p-1 hover:bg-white/10 rounded disabled:opacity-30"
                    >
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteSection(section.id); }}
                      className="p-1 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={() => setShowAddSection(true)}
              className="w-full p-3 border border-dashed border-white/20 rounded-xl text-gray-400 hover:text-white hover:border-orange-500/50 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Section
            </button>
          </div>
        </div>

        {/* Preview / Editor Pane */}
        <div className="flex-1 bg-[#0a0a0f] overflow-y-auto p-8">
          {selectedSection ? (
            <SectionEditor
              section={sections.find(s => s.id === selectedSection)!}
              onUpdate={(content) => {
                setSections(sections.map(s =>
                  s.id === selectedSection ? { ...s, content } : s
                ));
              }}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
                <Plus className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-white font-semibold mb-2">Select a section to edit</h3>
              <p className="text-gray-500 max-w-sm">
                Click on a section from the left panel to edit its content, or add a new section.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Section Modal */}
      {showAddSection && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12121a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Add Section</h2>
              <button
                onClick={() => setShowAddSection(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4 overflow-y-auto">
              {sectionTypes.map((st) => (
                <button
                  key={st.type}
                  onClick={() => addSection(st.type)}
                  className="p-4 bg-white/5 border border-white/10 rounded-xl text-left hover:bg-white/10 hover:border-orange-500/30 transition-all group"
                >
                  <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center mb-3 group-hover:bg-orange-500/30 transition-colors">
                    <st.icon className="w-5 h-5 text-orange-400" />
                  </div>
                  <h3 className="font-medium text-white">{st.label}</h3>
                  <p className="text-gray-500 text-sm mt-1">{st.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionEditor({ section, onUpdate }: { section: Section; onUpdate: (content: Record<string, unknown>) => void }) {
  const renderEditor = () => {
    switch (section.type) {
      case 'hero':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Headline</label>
              <input
                type="text"
                value={(section.content.headline as string) || ''}
                onChange={(e) => onUpdate({ ...section.content, headline: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                placeholder="Your main headline..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Subheadline</label>
              <input
                type="text"
                value={(section.content.subheadline as string) || ''}
                onChange={(e) => onUpdate({ ...section.content, subheadline: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                placeholder="Supporting text..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Button Text</label>
              <input
                type="text"
                value={(section.content.buttonText as string) || ''}
                onChange={(e) => onUpdate({ ...section.content, buttonText: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                placeholder="Call to action..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Background Image</label>
              <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-orange-500/50 transition-colors cursor-pointer">
                <Image className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                <p className="text-gray-400">Click to upload or drag and drop</p>
                <p className="text-gray-600 text-sm mt-1">PNG, JPG up to 5MB</p>
              </div>
            </div>
          </div>
        );

      case 'text':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Content</label>
              <textarea
                value={(section.content.text as string) || ''}
                onChange={(e) => onUpdate({ ...section.content, text: e.target.value })}
                rows={8}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none"
                placeholder="Write your content here..."
              />
            </div>
          </div>
        );

      case 'schedule':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Section Title</label>
              <input
                type="text"
                value={(section.content.title as string) || 'Class Schedule'}
                onChange={(e) => onUpdate({ ...section.content, title: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="showBooking"
                checked={(section.content.showBooking as boolean) ?? true}
                onChange={(e) => onUpdate({ ...section.content, showBooking: e.target.checked })}
                className="w-5 h-5 rounded border-white/20 bg-white/5 text-orange-500 focus:ring-orange-500"
              />
              <label htmlFor="showBooking" className="text-gray-300">Allow members to book classes</label>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-gray-400 text-sm">
                This section will automatically display your class schedule from the Classes section.
              </p>
            </div>
          </div>
        );

      case 'pricing':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Section Title</label>
              <input
                type="text"
                value={(section.content.title as string) || 'Membership Plans'}
                onChange={(e) => onUpdate({ ...section.content, title: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              />
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-gray-400 text-sm">
                This section will display your membership plans from the Payments section.
              </p>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
            <p className="text-gray-400">Editor for {section.type} section coming soon.</p>
          </div>
        );
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white capitalize">{section.type.replace('-', ' ')} Section</h2>
        <p className="text-gray-500 mt-1">Customize this section&apos;s content</p>
      </div>
      {renderEditor()}
    </div>
  );
}
