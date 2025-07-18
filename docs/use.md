# Notention User Guide

Welcome to Notention! This guide will help you get started with using the app for decentralized note-taking and network
matching.

## 1. Introduction

Notention is a lightweight, client-side Progressive Web App (PWA) for decentralized note-taking. It allows you to
create, organize, and share notes with rich semantic structure. It's designed to be offline-first, meaning you can use
it even without an internet connection. Your data is stored locally on your device, and you can choose to share it with
others using the decentralized Nostr protocol.

Key features include:

- **Offline-first PWA**: Install it on your phone or desktop and use it anywhere.
- **Semantic Notes**: Go beyond simple text with tags, values, and templates.
- **Nostr Integration**: Share your notes and discover content on a decentralized network.
- **Privacy-focused**: You control your data.

## 2. Getting Started

### Installation (PWA)

As a Progressive Web App, Notention can be installed directly from your browser.

- **On Desktop**: Look for an "Install" icon in your browser's address bar.
- **On Mobile**: Your browser should prompt you to "Add to Home Screen".

Once installed, the app will be available on your device just like a native application and will work offline.

### Account Setup

Your identity in Notention is managed by a Nostr keypair.

1. On first launch, you will be greeted by an account creation wizard.
2. You can choose to **generate a new keypair** or **import an existing Nostr private key**.
3. **Crucially, you must back up your private key.** Store it in a secure location, like a password manager. This key is
   the only way to recover your account if you switch devices or lose access.

### Basic Interface Overview

The Notention interface is designed to be simple and intuitive.

- **Sidebar**: On the left (or at the bottom on mobile), you'll find tabs to navigate between your **Notes**, the *
  *Ontology Editor**, the **Network** panel, and **Settings**.
- **Note Editor**: This is the main area where you will create and edit your notes.
- **Panels**: The Network panel contains views for network matches, a public feed, and direct messages.

## 3. Core Note-Taking

### Creating Your First Note

1. Navigate to the "Notes" tab in the sidebar.
2. Click the "New Note" button.
3. The editor will open, allowing you to start typing.

### Using the Rich Text Editor

The editor supports standard formatting options:

- Bold and Italic text.
- Bulleted and numbered lists.
- Hyperlinks.

You can use Markdown-like syntax, such as `*text*` for italic.

### Semantic Elements

This is where Notention shines. You can embed structured data directly into your notes.

- **Inline Tags**: Use `#Topic` or `@Person` to categorize your notes. These tags are linked to your ontology.
- **Key-Value Pairs**: Add metadata like `due::2024-12-31`.
- **Templates**: Apply predefined structures to your notes, like a "Meeting Note" template that includes fields for
  `Attendees` and `Date`.

### Managing Notes

You have several options for managing your notes:

- **Saving**: Notes are saved automatically as you type.
- **Editing**: Click on any note in your list to open it in the editor.
- **Deleting, Pinning, and Archiving**: These options are available for each note in the note list.

### Organizing Notes

- **Folders**: You can create a hierarchy of folders to organize your notes.
- **Tags**: Use tags to create another layer of organization, independent of folders.

## 4. The Ontology System

### What is Ontology?

Your ontology is your personal, editable dictionary of concepts and their relationships. For example, you can define
that `#AI` is a parent concept of `#MachineLearning`.

### Viewing and Editing Your Ontology

- Navigate to the "Ontology" tab in the sidebar.
- Here you can see your ontology as a tree.
- You can add new concepts, define relationships between them, and add attributes (like `due::date`).

### How Ontology Enhances Tags and Search

When you search for a tag, Notention uses the ontology to find related notes. A search for `#AI` will also return notes
tagged with `#MachineLearning`. This allows for powerful, semantic searching of your knowledge base.

## 5. Nostr Integration

### Understanding Nostr and Relays

Nostr is a simple, open protocol that enables a global, decentralized, and censorship-resistant social network. Data is
sent to "relays," which are simple servers that store and forward messages. See `relays.md` for more information on how
to connect to public and private relays.

### Publishing Notes to Nostr

You can control the visibility of each note:

- **Draft**: The note is only stored locally on your device.
- **Private**: The note is encrypted and shared with specific users on Nostr.
- **Published**: The note is shared publicly on the Nostr network.

### Privacy Settings for Sharing

In the settings panel, you can configure what information is shared publicly.

### Network Matching and Public Feed

- **Network Matching**: Notention will find notes on the network that are related to yours, based on your ontology.
- **Public Feed**: You can view a feed of public notes from the Nostr network.

### Direct Messages

You can send and receive encrypted direct messages with other Nostr users.

## 6. Advanced Features

### Semantic Search

Use your ontology to perform powerful searches. For example, if you have a `due::date` attribute in your ontology, you
can search for all notes with a due date in a specific range.

### AI Enhancements (Optional)

If you have a local AI model (like Ollama) running, you can enable AI features in the settings:

- **Auto-tagging**: Let the AI suggest tags for your notes.
- **Summarization**: Generate a summary of a long note.

### Importing/Exporting Data

You can export your notes and ontology as JSON files for backup or migration.

## 7. Settings and Configuration

- **Theme**: Choose between light and dark mode.
- **Nostr Relay Management**: Add and remove Nostr relays.
- **AI Service Configuration**: Set up your connection to a local AI model.
- **Privacy Controls**: Manage your data sharing preferences.

## 8. Troubleshooting

If you encounter any issues, please check the project's GitHub page for existing bug reports or to file a new one.

## 9. Data Backup and Security

- **Back up your Nostr Private Key**: This is the most important step to keep your account secure.
- **Understand Local vs. Networked Data**: Be mindful of what you share publicly.
- **Syncing Data with Nostr**: Publishing notes to Nostr provides a form of backup, but you should still regularly
  export your data.

Thank you for using Notention!
