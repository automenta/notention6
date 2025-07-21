import { Note, OntologyTree } from "../../shared/types";
import { OntologyService } from "../services/ontology";

export function createInvertedIndex(
  notes: Note[],
  ontology: OntologyTree,
): Record<string, string[]> {
  const index: Record<string, string[]> = {};
  for (const note of notes) {
    const tags = new Set(
      note.tags.flatMap((t) => OntologyService.getSemanticMatches(ontology, t)),
    );
    for (const tag of tags) {
      if (!index[tag]) {
        index[tag] = [];
      }
      index[tag].push(note.id);
    }
  }
  return index;
}
