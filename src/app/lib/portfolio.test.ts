/**
 * portfolio.test.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Unit tests for the public portfolio helpers (issue #169): tolerant parsing,
 * display-order sorting, and category derivation.
 *
 * Run with: npx vitest run src/app/lib/portfolio.test.ts
 */

import { describe, it, expect } from "vitest";
import {
  deriveCategories,
  parsePortfolioProject,
  sortByOrder,
  type PortfolioProject,
} from "./portfolio";

describe("parsePortfolioProject", () => {
  const base = {
    title: "VeritasAI",
    description: "Deepfake detection SaaS.",
    category: "SaaS",
    industry: "AI & Cybersecurity",
    imageUrl: "/portfolio/veritas.png",
    technologies: ["React", "FastAPI"],
    projectUrl: "https://veritas.example",
    githubUrl: "",
    order: 2,
  };

  it("parses a well-formed document", () => {
    const p = parsePortfolioProject("a", base);
    expect(p).not.toBeNull();
    expect(p).toMatchObject({
      id: "a",
      title: "VeritasAI",
      category: "SaaS",
      order: 2,
    });
    expect(p!.technologies).toEqual(["React", "FastAPI"]);
  });

  it("drops a document with no title", () => {
    expect(parsePortfolioProject("b", { ...base, title: "  " })).toBeNull();
    expect(parsePortfolioProject("c", { ...base, title: undefined })).toBeNull();
  });

  it("defaults missing/invalid fields safely", () => {
    const p = parsePortfolioProject("d", { title: "Bare" });
    expect(p).toMatchObject({
      description: "",
      category: "Other",
      industry: "",
      imageUrl: "",
      projectUrl: "",
      githubUrl: "",
      order: 0,
    });
    expect(p!.technologies).toEqual([]);
  });

  it("filters non-string technologies", () => {
    const p = parsePortfolioProject("e", {
      ...base,
      technologies: ["React", 42, null, "Vite"],
    });
    expect(p!.technologies).toEqual(["React", "Vite"]);
  });
});

describe("sortByOrder", () => {
  const make = (title: string, order: number): PortfolioProject => ({
    id: title,
    title,
    description: "",
    category: "",
    industry: "",
    imageUrl: "",
    technologies: [],
    projectUrl: "",
    githubUrl: "",
    order,
  });

  it("orders by display order ascending, breaking ties by title", () => {
    const ordered = [
      make("Zeta", 1),
      make("Alpha", 1),
      make("First", 0),
    ].sort(sortByOrder);
    expect(ordered.map((p) => p.title)).toEqual(["First", "Alpha", "Zeta"]);
  });
});

describe("deriveCategories", () => {
  const make = (category: string): PortfolioProject => ({
    id: category,
    title: category,
    description: "",
    category,
    industry: "",
    imageUrl: "",
    technologies: [],
    projectUrl: "",
    githubUrl: "",
    order: 0,
  });

  it("returns 'All' first, then the unique categories sorted", () => {
    expect(
      deriveCategories([make("SaaS"), make("Business"), make("SaaS")]),
    ).toEqual(["All", "Business", "SaaS"]);
  });

  it("returns just 'All' when there are no projects", () => {
    expect(deriveCategories([])).toEqual(["All"]);
  });
});
