// src/ui/AdvancedSearch.ts
import { useAppStore } from "../store";
import { createButton } from "./Button";
import { Note, SearchFilters } from "../../shared/types";
import { NoteService } from "../services/NoteService";
import { createCollapsibleSection } from "../lib/ProgressiveDisclosure";
import "./AdvancedSearch.css";

export function createAdvancedSearch(): HTMLElement {
  const {
    notes,
    ontology,
    searchQuery,
    searchFilters,
    setSearchQuery,
    setSearchFilters,
    setCurrentNote,
  } = useAppStore.getState();

  const container = document.createElement("div");
  container.className = "advanced-search";

  // Header
  const header = document.createElement("div");
  header.className = "advanced-search-header";

  const title = document.createElement("h2");
  title.textContent = "🔍 Advanced Search";
  header.appendChild(title);

  const toggleButton = createButton({
    label: "Hide Filters",
    onClick: () => toggleFilters(),
    variant: "secondary",
  });
  header.appendChild(toggleButton);
  container.appendChild(header);

  // Main search input
  const searchSection = document.createElement("div");
  searchSection.className = "search-section";

  const searchInput = document.createElement("input");
  searchInput.type = "search";
  searchInput.className = "main-search-input";
  searchInput.placeholder = "Search notes, tags, or content...";
  searchInput.value = searchQuery;

  searchInput.oninput = (e) => {
    const query = (e.target as HTMLInputElement).value;
    setSearchQuery(query);
    performSearch();
  };

  searchSection.appendChild(searchInput);
  container.appendChild(searchSection);

  // Filters container
  const filtersContainer = document.createElement("div");
  filtersContainer.className = "filters-container";

  // Quick filters (always visible)
  const quickFilters = document.createElement("div");
  quickFilters.className = "quick-filters";

  const quickFiltersTitle = document.createElement("h3");
  quickFiltersTitle.textContent = "⚡ Quick Filters";
  quickFilters.appendChild(quickFiltersTitle);

  const quickFilterButtons = document.createElement("div");
  quickFilterButtons.className = "quick-filter-buttons";

  const quickFilterOptions = [
    { label: "📝 Recent", filter: { dateRange: "week" } },
    { label: "⭐ Favorites", filter: { favorites: true } },
    { label: "🏷️ Tagged", filter: { hasAnyTags: true } },
    { label: "📊 With Values", filter: { hasAnyValues: true } },
    { label: "📁 Uncategorized", filter: { hasNoTags: true } },
    { label: "🤖 AI Generated", filter: { aiGenerated: true } },
  ];

  quickFilterOptions.forEach((option) => {
    const button = createButton({
      label: option.label,
      onClick: () => applyQuickFilter(option.filter),
      variant: "secondary",
    });
    quickFilterButtons.appendChild(button);
  });

  quickFilters.appendChild(quickFilterButtons);
  filtersContainer.appendChild(quickFilters);

  // Advanced filters (collapsible)
  const advancedFiltersContent = document.createElement("div");
  advancedFiltersContent.className = "advanced-filters-content";

  // Tags filter
  const tagsFilter = createTagsFilter();
  advancedFiltersContent.appendChild(tagsFilter);

  // Date range filter
  const dateFilter = createDateFilter();
  advancedFiltersContent.appendChild(dateFilter);

  // Content type filter
  const contentFilter = createContentFilter();
  advancedFiltersContent.appendChild(contentFilter);

  // Values filter
  const valuesFilter = createValuesFilter();
  advancedFiltersContent.appendChild(valuesFilter);

  // Create collapsible advanced filters
  const advancedFiltersCollapsible = createCollapsibleSection(
    "🔧 Advanced Filters",
    advancedFiltersContent,
    {
      expanded: false,
      persistent: true,
      storageKey: "advanced-search-filters-expanded",
      expandText: "Show advanced filters",
      collapseText: "Hide advanced filters",
    },
  );

  filtersContainer.appendChild(advancedFiltersCollapsible);
  container.appendChild(filtersContainer);

  // Search results
  const resultsContainer = document.createElement("div");
  resultsContainer.className = "search-results";
  container.appendChild(resultsContainer);

  // Search stats
  const searchStats = document.createElement("div");
  searchStats.className = "search-stats";
  container.appendChild(searchStats);

  let filtersVisible = true;

  function toggleFilters() {
    filtersVisible = !filtersVisible;
    filtersContainer.style.display = filtersVisible ? "block" : "none";
    toggleButton.textContent = filtersVisible ? "Hide Filters" : "Show Filters";
  }

  function applyQuickFilter(filter: any) {
    setSearchFilters({ ...searchFilters, ...filter });
    performSearch();
  }

  function createTagsFilter(): HTMLElement {
    const container = document.createElement("div");
    container.className = "filter-group";

    const label = document.createElement("label");
    label.textContent = "Tags";
    container.appendChild(label);

    const tagsInput = document.createElement("input");
    tagsInput.type = "text";
    tagsInput.placeholder = "Enter tags (comma-separated): #ai, #project";
    tagsInput.value = searchFilters.tags?.join(", ") || "";

    tagsInput.onchange = () => {
      const tags = tagsInput.value
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
        .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`));

      setSearchFilters({
        ...searchFilters,
        tags: tags.length > 0 ? tags : undefined,
      });
      performSearch();
    };

    container.appendChild(tagsInput);

    // Tag suggestions
    const suggestions = document.createElement("div");
    suggestions.className = "tag-suggestions";

    const allTags = new Set<string>();
    Object.values(notes).forEach((note) => {
      note.tags.forEach((tag) => allTags.add(tag));
    });

    const popularTags = Array.from(allTags).slice(0, 10);
    popularTags.forEach((tag) => {
      const tagButton = document.createElement("button");
      tagButton.className = "tag-suggestion";
      tagButton.textContent = tag;
      tagButton.onclick = () => {
        const currentTags = tagsInput.value
          ? tagsInput.value.split(",").map((t) => t.trim())
          : [];
        if (!currentTags.includes(tag)) {
          currentTags.push(tag);
          tagsInput.value = currentTags.join(", ");
          tagsInput.onchange();
        }
      };
      suggestions.appendChild(tagButton);
    });

    container.appendChild(suggestions);
    return container;
  }

  function createDateFilter(): HTMLElement {
    const container = document.createElement("div");
    container.className = "filter-group";

    const label = document.createElement("label");
    label.textContent = "Date Range";
    container.appendChild(label);

    const dateRange = document.createElement("select");
    const options = [
      { value: "", label: "Any time" },
      { value: "today", label: "Today" },
      { value: "week", label: "This week" },
      { value: "month", label: "This month" },
      { value: "year", label: "This year" },
      { value: "custom", label: "Custom range" },
    ];

    options.forEach((option) => {
      const opt = document.createElement("option");
      opt.value = option.value;
      opt.textContent = option.label;
      opt.selected = searchFilters.dateRange === option.value;
      dateRange.appendChild(opt);
    });

    dateRange.onchange = () => {
      const value = dateRange.value;
      setSearchFilters({
        ...searchFilters,
        dateRange: value || undefined,
        customDateStart: undefined,
        customDateEnd: undefined,
      });

      customDateInputs.style.display = value === "custom" ? "flex" : "none";
      performSearch();
    };

    container.appendChild(dateRange);

    // Custom date inputs
    const customDateInputs = document.createElement("div");
    customDateInputs.className = "custom-date-inputs";
    customDateInputs.style.display = "none";

    const startDateInput = document.createElement("input");
    startDateInput.type = "date";
    startDateInput.onchange = () => {
      setSearchFilters({
        ...searchFilters,
        customDateStart: startDateInput.value || undefined,
      });
      performSearch();
    };

    const endDateInput = document.createElement("input");
    endDateInput.type = "date";
    endDateInput.onchange = () => {
      setSearchFilters({
        ...searchFilters,
        customDateEnd: endDateInput.value || undefined,
      });
      performSearch();
    };

    customDateInputs.appendChild(startDateInput);
    customDateInputs.appendChild(endDateInput);
    container.appendChild(customDateInputs);

    return container;
  }

  function createContentFilter(): HTMLElement {
    const container = document.createElement("div");
    container.className = "filter-group";

    const label = document.createElement("label");
    label.textContent = "Content Type";
    container.appendChild(label);

    const checkboxes = document.createElement("div");
    checkboxes.className = "checkbox-group";

    const contentTypes = [
      { key: "hasImages", label: "Contains images" },
      { key: "hasLinks", label: "Contains links" },
      { key: "hasCode", label: "Contains code" },
      { key: "hasMarkdown", label: "Markdown formatted" },
      { key: "longForm", label: "Long form (>500 chars)" },
      { key: "shortForm", label: "Short form (<100 chars)" },
    ];

    contentTypes.forEach((type) => {
      const checkboxContainer = document.createElement("label");
      checkboxContainer.className = "checkbox-label";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = (searchFilters as any)[type.key] || false;
      checkbox.onchange = () => {
        setSearchFilters({
          ...searchFilters,
          [type.key]: checkbox.checked || undefined,
        });
        performSearch();
      };

      checkboxContainer.appendChild(checkbox);
      checkboxContainer.append(type.label);
      checkboxes.appendChild(checkboxContainer);
    });

    container.appendChild(checkboxes);
    return container;
  }

  function createValuesFilter(): HTMLElement {
    const container = document.createElement("div");
    container.className = "filter-group";

    const label = document.createElement("label");
    label.textContent = "Properties";
    container.appendChild(label);

    const valuesInput = document.createElement("input");
    valuesInput.type = "text";
    valuesInput.placeholder = "property:value, status:complete";

    const currentValues = searchFilters.values;
    if (currentValues) {
      const valueStrings = Object.entries(currentValues).map(
        ([k, v]) => `${k}:${v}`,
      );
      valuesInput.value = valueStrings.join(", ");
    }

    valuesInput.onchange = () => {
      const valueString = valuesInput.value.trim();
      if (!valueString) {
        setSearchFilters({ ...searchFilters, values: undefined });
      } else {
        const values: { [key: string]: string } = {};
        valueString.split(",").forEach((pair) => {
          const [key, value] = pair.split(":").map((s) => s.trim());
          if (key && value) {
            values[key] = value;
          }
        });
        setSearchFilters({
          ...searchFilters,
          values: Object.keys(values).length > 0 ? values : undefined,
        });
      }
      performSearch();
    };

    container.appendChild(valuesInput);
    return container;
  }

  async function performSearch() {
    const state = useAppStore.getState();
    const { searchQuery, searchFilters, ontology, notes } = state;

    try {
      const results = await NoteService.semanticSearch(
        searchQuery,
        ontology,
        searchFilters,
        Object.values(notes),
      );

      renderResults(results);
      updateSearchStats(results.length, Object.values(notes).length);
    } catch (error) {
      console.error("Search failed:", error);
      renderResults([]);
      updateSearchStats(0, Object.values(notes).length);
    }
  }

  function renderResults(results: Note[]) {
    resultsContainer.innerHTML = "";

    if (results.length === 0) {
      const emptyState = document.createElement("div");
      emptyState.className = "empty-results";
      emptyState.innerHTML = `
        <div class="empty-results-content">
          <div class="empty-results-icon">🔍</div>
          <h3>No Results Found</h3>
          <p>Try adjusting your search terms or filters.</p>
        </div>
      `;
      resultsContainer.appendChild(emptyState);
      return;
    }

    results.forEach((note) => {
      const resultCard = createResultCard(note);
      resultsContainer.appendChild(resultCard);
    });
  }

  function createResultCard(note: Note): HTMLElement {
    const card = document.createElement("div");
    card.className = "result-card";
    card.onclick = () => setCurrentNote(note.id);

    const header = document.createElement("div");
    header.className = "result-header";

    const title = document.createElement("h3");
    title.textContent = note.title || "Untitled";
    header.appendChild(title);

    const date = document.createElement("span");
    date.className = "result-date";
    date.textContent = new Date(note.updatedAt).toLocaleDateString();
    header.appendChild(date);

    card.appendChild(header);

    // Content preview
    const content = document.createElement("p");
    content.className = "result-content";
    const plainText = note.content.replace(/<[^>]*>/g, ""); // Strip HTML
    content.textContent =
      plainText.length > 150 ? plainText.substring(0, 150) + "..." : plainText;
    card.appendChild(content);

    // Tags
    if (note.tags.length > 0) {
      const tagsContainer = document.createElement("div");
      tagsContainer.className = "result-tags";

      note.tags.slice(0, 5).forEach((tag) => {
        const tagSpan = document.createElement("span");
        tagSpan.className = "result-tag";
        tagSpan.textContent = tag;
        tagsContainer.appendChild(tagSpan);
      });

      if (note.tags.length > 5) {
        const moreSpan = document.createElement("span");
        moreSpan.className = "result-tag more-tags";
        moreSpan.textContent = `+${note.tags.length - 5} more`;
        tagsContainer.appendChild(moreSpan);
      }

      card.appendChild(tagsContainer);
    }

    return card;
  }

  function updateSearchStats(resultCount: number, totalCount: number) {
    searchStats.innerHTML = `
      <span class="search-stats-text">
        Found <strong>${resultCount}</strong> of <strong>${totalCount}</strong> notes
      </span>
    `;
  }

  // Initial search
  performSearch();

  return container;
}
