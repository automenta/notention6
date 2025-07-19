// Component Registration - Register all available component variants
import { ComponentRegistry } from './ComponentRegistry';
import { createNoteEditor } from '../ui/NoteEditor';
import { createNoteEditor2 } from '../ui/NoteEditor2';
import { createNoteEditorMinimal } from '../ui/NoteEditorMinimal';
import { createNoteEditorMarkdown } from '../ui/NoteEditorMarkdown';

/**
 * Register all available components with the component registry
 * This should be called during app initialization
 */
export function registerComponents(): void {
    // Note Editor Components
    ComponentRegistry.registerType({
        id: 'noteEditor',
        name: 'Note Editor',
        description: 'Choose your preferred note editing interface',
        defaultVariant: 'tiptap',
        variants: new Map()
    });

    // TipTap Editor (Original)
    ComponentRegistry.registerVariant('noteEditor', {
        id: 'tiptap',
        name: 'TipTap Editor',
        description: 'Modern rich text editor with semantic tagging and extensions',
        icon: '📝',
        tags: ['Modern', 'Extensible', 'Semantic'],
        createComponent: (noteId?: string) => createNoteEditor(noteId)
    });

    // Quill Editor (Alternative)
    ComponentRegistry.registerVariant('noteEditor', {
        id: 'quill',
        name: 'Quill Editor', 
        description: 'Classic WYSIWYG editor with traditional formatting controls',
        icon: '🖋️',
        tags: ['Classic', 'Simple', 'Traditional'],
        createComponent: (noteId?: string) => createNoteEditor2(noteId)
    });

    // Minimal Text Editor
    ComponentRegistry.registerVariant('noteEditor', {
        id: 'minimal',
        name: 'Minimal Editor',
        description: 'Clean, distraction-free text editor focused on writing',
        icon: '✏️',
        tags: ['Minimal', 'Clean', 'Focus'],
        createComponent: (noteId?: string) => createNoteEditorMinimal(noteId)
    });

    // Markdown Editor
    ComponentRegistry.registerVariant('noteEditor', {
        id: 'markdown',
        name: 'Markdown Editor',
        description: 'Split-view markdown editor with live preview',
        icon: '📄',
        tags: ['Markdown', 'Preview', 'Technical'],
        createComponent: (noteId?: string) => createNoteEditorMarkdown(noteId)
    });

    // TODO: Add more editor variants
    // - Block-based Editor (Notion-style blocks)
    // - Code Editor (Monaco-based for technical notes)
    // - Zen Mode Editor (full-screen distraction-free)
    // - Rich Media Editor (enhanced image/video support)

    // TODO: Register other component types:
    // - Sidebar variants (collapsible, tabs, tree view)
    // - Note list variants (grid, table, kanban)
    // - Search interfaces (simple, advanced, visual)
    // - Dashboard layouts (minimal, detailed, widget-based)
}

/**
 * Get a list of all possible component types that could be registered
 * This is for future development planning
 */
export function getPlannedComponentTypes(): Array<{
    id: string;
    name: string;
    description: string;
    plannedVariants: string[];
}> {
    return [
        {
            id: 'noteEditor',
            name: 'Note Editor',
            description: 'Different approaches to note editing',
            plannedVariants: [
                'TipTap Editor (Current)',
                'Quill Editor (Current)', 
                'Minimal Text Editor',
                'Block-based Editor',
                'Markdown Editor',
                'Code Editor'
            ]
        },
        {
            id: 'sidebar',
            name: 'Sidebar Layout',
            description: 'Different sidebar organization approaches',
            plannedVariants: [
                'Standard Tabs',
                'Collapsible Sections',
                'Tree Navigation',
                'Floating Panels'
            ]
        },
        {
            id: 'notesList',
            name: 'Notes List View',
            description: 'Different ways to display and organize notes',
            plannedVariants: [
                'List View (Current)',
                'Grid View',
                'Table View', 
                'Kanban Board',
                'Timeline View'
            ]
        },
        {
            id: 'search',
            name: 'Search Interface',
            description: 'Different search and filtering approaches',
            plannedVariants: [
                'Simple Search',
                'Advanced Filters',
                'Visual Query Builder',
                'AI-Powered Search'
            ]
        },
        {
            id: 'dashboard',
            name: 'Dashboard Layout',
            description: 'Different dashboard and overview designs',
            plannedVariants: [
                'Minimal Dashboard',
                'Detailed Overview',
                'Widget-based',
                'Analytics Focus'
            ]
        }
    ];
}