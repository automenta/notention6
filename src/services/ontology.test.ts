import { describe, it, expect } from "vitest";
import { OntologyService } from "./ontology";
import { OntologyTree } from "../../shared/types";

describe("OntologyService", () => {
  const initialOntology: OntologyTree = {
    nodes: {
      "node-1": { id: "node-1", label: "#Technology", children: ["node-2"] },
      "node-2": {
        id: "node-2",
        label: "#AI",
        parentId: "node-1",
        children: ["node-3"],
      },
      "node-3": { id: "node-3", label: "#NLP", parentId: "node-2", children: [] },
    },
    rootIds: ["node-1"],
  };

  it("should create a new node", () => {
    const node = OntologyService.createNode("New Node");
    expect(node.label).toBe("#New Node");
    expect(node.children).toEqual([]);
  });

  it("should add a node to the ontology", () => {
    const newNode = OntologyService.createNode("New Node");
    const ontology = OntologyService.addNode(initialOntology, newNode);
    expect(ontology.nodes[newNode.id]).toBe(newNode);
    expect(ontology.rootIds).toContain(newNode.id);
  });

  it("should remove a node from the ontology", () => {
    const ontology = OntologyService.removeNode(initialOntology, "node-2");
    expect(ontology.nodes["node-2"]).toBeUndefined();
    expect(ontology.nodes["node-1"].children).not.toContain("node-2");
  });

  it("should update a node in the ontology", () => {
    const updates = { label: "#ArtificialIntelligence" };
    const ontology = OntologyService.updateNode(
      initialOntology,
      "node-2",
      updates,
    );
    expect(ontology.nodes["node-2"].label).toBe("#ArtificialIntelligence");
  });

  it("should get semantic matches for a tag", () => {
    const matches = OntologyService.getSemanticMatches(initialOntology, "#NLP");
    expect(matches).toEqual(
      expect.arrayContaining(["#NLP", "#AI", "#Technology"]),
    );
  });

  it("should get all tags from the ontology", () => {
    const tags = OntologyService.getAllTags(initialOntology);
    expect(tags).toEqual(
      expect.arrayContaining(["#Technology", "#AI", "#NLP"]),
    );
  });
});
