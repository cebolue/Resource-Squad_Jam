import React, { useMemo, useState, useCallback, useRef, useEffect } from "react";

const YEARS = [2026, 2027, 2028];
const CURRENT_SPRINT_CODE = "IT-06-01";
const STORAGE_KEY = "agile-capacity-planner-v2";
const TEAM_SCALE_TARGET = 20;

const DEPARTMENTS = [
  { key: "DS", label: "Data Scientist" },
  { key: "DD", label: "Data Developers" },
  { key: "VA", label: "Visualization Analyst" },
  { key: "PO", label: "Product Owners" },
  { key: "SC", label: "Scrum Coordinators" },
];

const QUARTER_TEMPLATE = [
  { id: "Q1", label: "Q1 - Jan to Mar", sprints: ["IT-01-01", "IT-01-02", "IT-02-01", "IT-02-02", "IT-03-01", "IT-03-02", "IT-03-03"] },
  { id: "Q2", label: "Q2 - Apr to Jun", sprints: ["IT-04-01", "IT-04-02", "IT-05-01", "IT-05-02", "IT-06-01", "IT-06-02"] },
  { id: "Q3", label: "Q3 - Jul to Sep", sprints: ["IT-07-01", "IT-07-02", "IT-08-01", "IT-08-02", "IT-09-01", "IT-09-02", "IT-09-03"] },
  { id: "Q4", label: "Q4 - Oct to Dec", sprints: ["IT-10-01", "IT-10-02", "IT-11-01", "IT-11-02", "IT-12-01", "IT-12-02"] },
];

const SPRINT_DATE_MAP = {
  "IT-01-01": "Dec 29 - Jan 09",
  "IT-01-02": "Jan 12 - Jan 23",
  "IT-02-01": "Jan 26 - Feb 06",
  "IT-02-02": "Feb 09 - Feb 20",
  "IT-03-01": "Feb 23 - Mar 06",
  "IT-03-02": "Mar 09 - Mar 20",
  "IT-03-03": "Mar 23 - Apr 03",
  "IT-04-01": "Apr 06 - Apr 17",
  "IT-04-02": "Apr 20 - May 01",
  "IT-05-01": "May 04 - May 15",
  "IT-05-02": "May 18 - May 29",
  "IT-06-01": "Jun 01 - Jun 12",
  "IT-06-02": "Jun 15 - Jun 26",
  "IT-07-01": "Jun 29 - Jul 10",
  "IT-07-02": "Jul 13 - Jul 24",
  "IT-08-01": "Jul 27 - Aug 07",
  "IT-08-02": "Aug 10 - Aug 21",
  "IT-09-01": "Aug 24 - Sep 04",
  "IT-09-02": "Sep 07 - Sep 18",
  "IT-09-03": "Sep 21 - Oct 02",
  "IT-10-01": "Oct 05 - Oct 16",
  "IT-10-02": "Oct 19 - Oct 30",
  "IT-11-01": "Nov 02 - Nov 13",
  "IT-11-02": "Nov 16 - Nov 27",
  "IT-12-01": "Nov 30 - Dec 11",
  "IT-12-02": "Dec 14 - Dec 25",
};

const ALL_SPRINT_CODES = QUARTER_TEMPLATE.flatMap((q) => q.sprints);
const RESOURCE_PLAN_ROWS = 10;

let idCount = 1;
function nextId(prefix) {
  idCount += 1;
  return `${prefix}_${Date.now()}_${idCount}`;
}

function createEmptyResourceEntries() {
  return Array.from({ length: RESOURCE_PLAN_ROWS }, (_, idx) => ({
    name: idx === RESOURCE_PLAN_ROWS - 1 ? "Need" : "",
    percent: 0,
  }));
}

function createEmptyResources() {
  return Object.fromEntries(
    DEPARTMENTS.map((d) => [d.key, Object.fromEntries(ALL_SPRINT_CODES.map((s) => [s, createEmptyResourceEntries()]))])
  );
}

function allocMap(pattern) {
  return Object.fromEntries(ALL_SPRINT_CODES.map((s) => [s, { ...pattern }]));
}

function createProduct(name, pattern = { DS: 0, DD: 0, VA: 0, PO: 0, SC: 0 }) {
  const resources = createEmptyResources();
  DEPARTMENTS.forEach((dept) => {
    ALL_SPRINT_CODES.forEach((sprintCode) => {
      resources[dept.key][sprintCode][0] = {
        ...resources[dept.key][sprintCode][0],
        percent: Number(pattern[dept.key] || 0),
      };
    });
  });

  return {
    id: nextId("product"),
    name,
    allocations: allocMap(pattern),
    resources,
    doneFromSprint: null,
  };
}

function createTeam(name, products = []) {
  return {
    id: nextId("team"),
    name,
    expanded: true,
    products,
  };
}

function createBaseValueStream() {
  return {
    id: nextId("vs"),
    name: "Reliability, Maintenance & Turnarounds",
    expanded: true,
    teams: [
      createTeam("Equipment Analytics", [
        createProduct("Sustainment", { DS: 70, DD: 90, VA: 70, PO: 100, SC: 50 }),
        createProduct("FIA", { DS: 0, DD: 30, VA: 0, PO: 30, SC: 0 }),
        createProduct("ME/MW Furnace DeCoke", { DS: 0, DD: 20, VA: 0, PO: 50, SC: 10 }),
      ]),
    ],
  };
}

const SPRINT_PRESET_CODE = "IT-06-01";

const REQUIRED_VALUE_STREAMS = [
  {
    valueStream: "Integrated Value Chain",
    team: "Trailblazers",
    products: ["LNPT", "SIT"],
  },
  {
    valueStream: "Production Peformance",
    team: "Pathfinders",
    products: ["Sustainment"],
  },
  {
    valueStream: "Innovation and Sustainability",
    team: "Innovation",
    products: ["Co-Scientist"],
  },
  {
    valueStream: "Digitalization and Governance",
    team: "Digital Factory",
    products: ["Digital Factory"],
  },
];

const REQUIRED_SPRINT_ASSIGNMENTS = [
  { dept: "DS", resource: "David", product: "LNPT", percent: 100 },
  { dept: "DS", resource: "Kris", product: "FIA", percent: 100 },
  { dept: "DS", resource: "Vahid", product: "Digital Factory", percent: 100 },
  { dept: "DS", resource: "Dylan", product: "Co-Scientist", percent: 100 },

  { dept: "DD", resource: "Ose", product: "LNPT", percent: 100 },
  { dept: "DD", resource: "Adarsh", product: "GS DSG", percent: 100 },
  { dept: "DD", resource: "Claire", product: "2D DMS Map", percent: 50 },
  { dept: "DD", resource: "Heena H", product: "2D DMS Map", percent: 100 },
  { dept: "DD", resource: "Claire", product: "Co-Scientist", percent: 50 },

  { dept: "VA", resource: "Doug", product: "LNPT", percent: 100 },
  { dept: "VA", resource: "Sushant", product: "FIA", percent: 50 },
  { dept: "VA", resource: "Sushant", product: "2D DMS Map", percent: 50 },
  { dept: "VA", resource: "Pokuri", product: "2D DMS Map", percent: 100 },
  { dept: "VA", resource: "Colin", product: "GS DSG", percent: 100 },
  { dept: "VA", product: "Co-Scientist", percent: 50, isNeed: true },

  { dept: "PO", resource: "Nico", product: "LNPT", percent: 100 },
  { dept: "PO", resource: "Moe", product: "FIA", percent: 100 },
  { dept: "PO", resource: "Shayan", product: "Co-Scientist", percent: 100 },
  { dept: "PO", resource: "Jordan", product: "2D DMS Map", percent: 100 },
  { dept: "PO", resource: "Renee", product: "GS DSG", percent: 100 },

  { dept: "SC", resource: "Jide", product: "LNPT", percent: 33 },
  { dept: "SC", resource: "Jide", product: "GS DSG", percent: 33 },
  { dept: "SC", resource: "Jide", product: "Co-Scientist", percent: 33 },
  { dept: "SC", resource: "Christian", product: "FIA", percent: 30 },
  { dept: "SC", resource: "Christian", product: "2D DMS Map", percent: 30 },
  { dept: "SC", resource: "Christian", product: "Digital Factory", percent: 40 },
];

function sameName(a, b) {
  return String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();
}

function findValueStreamByName(streams, name) {
  return (streams || []).find((vs) => sameName(vs.name, name));
}

function findTeamByName(vs, name) {
  return (vs?.teams || []).find((team) => sameName(team.name, name));
}

function findProductByName(streams, name) {
  for (const vs of streams || []) {
    for (const team of vs.teams || []) {
      const found = (team.products || []).find((product) => sameName(product.name, name));
      if (found) {
        return found;
      }
    }
  }
  return null;
}

function ensureRequiredValueStreams(streams) {
  REQUIRED_VALUE_STREAMS.forEach((preset) => {
    let vs = findValueStreamByName(streams, preset.valueStream);
    if (!vs) {
      vs = {
        id: nextId("vs"),
        name: preset.valueStream,
        expanded: true,
        teams: [],
      };
      streams.push(vs);
    }

    let team = findTeamByName(vs, preset.team);
    if (!team) {
      team = {
        id: nextId("team"),
        name: preset.team,
        expanded: true,
        products: [],
      };
      vs.teams = [...(vs.teams || []), team];
    }

    preset.products.forEach((productName) => {
      const existingInTeam = (team.products || []).find((product) => sameName(product.name, productName));
      const existingGlobal = findProductByName(streams, productName);
      if (!existingInTeam && !existingGlobal) {
        team.products = [...(team.products || []), createProduct(productName)];
      }
    });
  });

  return streams;
}

function updateProductAllocationFromResources(product, deptKey, sprintCode) {
  const rows = getResourceEntries(product, deptKey, sprintCode);
  const assignedTotal = rows
    .slice(0, RESOURCE_PLAN_ROWS - 1)
    .reduce((sum, row) => sum + Number(row?.percent || 0), 0);

  const allocations = { ...(product.allocations || {}) };
  allocations[sprintCode] = {
    ...(allocations[sprintCode] || { DS: 0, DD: 0, VA: 0, PO: 0, SC: 0 }),
    [deptKey]: assignedTotal,
  };
  product.allocations = allocations;
}

function upsertNamedResourceForSprint(product, deptKey, sprintCode, resourceName, percent) {
  const deptMap = { ...(product.resources?.[deptKey] || {}) };
  const rows = getResourceEntries(product, deptKey, sprintCode).map((entry) => ({ ...entry }));
  const targetName = String(resourceName || "").trim();
  if (!targetName) return;

  let idx = rows
    .slice(0, RESOURCE_PLAN_ROWS - 1)
    .findIndex((row) => sameName(row?.name, targetName));

  if (idx < 0) {
    idx = rows
      .slice(0, RESOURCE_PLAN_ROWS - 1)
      .findIndex((row) => !String(row?.name || "").trim() && Number(row?.percent || 0) === 0);
  }

  if (idx < 0) {
    idx = RESOURCE_PLAN_ROWS - 2;
  }

  rows[idx] = {
    ...rows[idx],
    name: targetName,
    percent: Number(percent || 0),
  };

  deptMap[sprintCode] = rows;
  product.resources = {
    ...(product.resources || {}),
    [deptKey]: deptMap,
  };
  updateProductAllocationFromResources(product, deptKey, sprintCode);
}

function setNeedForSprint(product, deptKey, sprintCode, percent) {
  const deptMap = { ...(product.resources?.[deptKey] || {}) };
  const rows = getResourceEntries(product, deptKey, sprintCode).map((entry) => ({ ...entry }));
  rows[RESOURCE_PLAN_ROWS - 1] = {
    ...(rows[RESOURCE_PLAN_ROWS - 1] || { name: "Need", percent: 0 }),
    name: "Need",
    percent: Number(percent || 0),
  };

  deptMap[sprintCode] = rows;
  product.resources = {
    ...(product.resources || {}),
    [deptKey]: deptMap,
  };
  updateProductAllocationFromResources(product, deptKey, sprintCode);
}

function applyRequiredSprintAssignments(streams) {
  REQUIRED_SPRINT_ASSIGNMENTS.forEach((assignment) => {
    const product = findProductByName(streams, assignment.product);
    if (!product) return;

    if (assignment.isNeed) {
      setNeedForSprint(product, assignment.dept, SPRINT_PRESET_CODE, assignment.percent);
      return;
    }

    upsertNamedResourceForSprint(
      product,
      assignment.dept,
      SPRINT_PRESET_CODE,
      assignment.resource,
      assignment.percent
    );
  });

  return streams;
}

function applyRequiredPlannerDefaults(streams, year) {
  if (year !== 2026) return streams;

  const cloned = (streams || []).map((vs) => ({
    ...vs,
    teams: (vs.teams || []).map((team) => ({
      ...team,
      products: (team.products || []).map((product) => ensureProductShape({ ...product })),
    })),
  }));

  ensureRequiredValueStreams(cloned);
  applyRequiredSprintAssignments(cloned);
  return cloned;
}

function initialYearData() {
  return [createBaseValueStream()];
}

function ensureProductShape(product) {
  const normalizedAllocations = Object.fromEntries(
    ALL_SPRINT_CODES.map((sprintCode) => {
      const raw = product.allocations?.[sprintCode] || {};
      const mapped = {
        DS: Number(raw.DS || 0),
        DD: Number(raw.DD ?? raw.DE ?? 0),
        VA: Number(raw.VA ?? raw.FE ?? 0),
        PO: Number(raw.PO || 0),
        SC: Number(raw.SC || 0),
      };
      return [sprintCode, mapped];
    })
  );

  const normalizedResources = Object.fromEntries(
    DEPARTMENTS.map((dept) => {
      const deptResources = product.resources?.[dept.key] || {};
      const sprintMap = Object.fromEntries(
        ALL_SPRINT_CODES.map((sprintCode) => {
          const entries = deptResources[sprintCode];
          const allocVal = Number(normalizedAllocations[sprintCode]?.[dept.key] || 0);
          const fallback = createEmptyResourceEntries();
          fallback[0] = { ...fallback[0], percent: allocVal };

          if (!Array.isArray(entries)) {
            return [sprintCode, fallback];
          }

          const merged = entries.length >= RESOURCE_PLAN_ROWS
            ? entries.slice(0, RESOURCE_PLAN_ROWS)
            : [...entries, ...createEmptyResourceEntries().slice(entries.length)];

          const nonNeedSum = merged
            .slice(0, RESOURCE_PLAN_ROWS - 1)
            .reduce((sum, entry) => sum + Number(entry?.percent || 0), 0);

          if (nonNeedSum === 0 && allocVal > 0) {
            merged[0] = { ...merged[0], percent: allocVal };
          }

          return [sprintCode, merged];
        })
      );
      return [dept.key, sprintMap];
    })
  );

  return {
    ...product,
    allocations: normalizedAllocations,
    resources: normalizedResources,
    doneFromSprint: ALL_SPRINT_CODES.includes(product.doneFromSprint) ? product.doneFromSprint : null,
  };
}

function normalizeDataByYear(rawByYear) {
  const base = {
    2026: initialYearData(),
    2027: initialYearData(),
    2028: initialYearData(),
  };

  if (!rawByYear || typeof rawByYear !== "object") {
    return base;
  }

  return Object.fromEntries(
    YEARS.map((yr) => {
      const streams = Array.isArray(rawByYear[yr]) ? rawByYear[yr] : initialYearData();
      const normalizedStreams = streams.map((vs) => ({
        ...vs,
        teams: Array.isArray(vs.teams)
          ? vs.teams.map((team) => ({
              ...team,
              products: Array.isArray(team.products) ? team.products.map(ensureProductShape) : [],
            }))
          : [],
      }));
      return [yr, applyRequiredPlannerDefaults(normalizedStreams, yr)];
    })
  );
}

function sprintToneClass(sprintCode) {
  if (sprintCode.startsWith("IT-01") || sprintCode.startsWith("IT-02") || sprintCode.startsWith("IT-03")) return "q1-tone";
  if (sprintCode.startsWith("IT-04") || sprintCode.startsWith("IT-05") || sprintCode.startsWith("IT-06")) return "q2-tone";
  if (sprintCode.startsWith("IT-07") || sprintCode.startsWith("IT-08") || sprintCode.startsWith("IT-09")) return "q3-tone";
  return "q4-tone";
}

function quarterHeadClass(quarterId) {
  if (quarterId === "Q1") return "q1-head";
  if (quarterId === "Q2") return "q2-head";
  if (quarterId === "Q3") return "q3-head";
  return "q4-head";
}

function getSprintIndex(sprintCode) {
  return ALL_SPRINT_CODES.indexOf(sprintCode);
}

function isProductDeliveredAtSprint(product, sprintCode) {
  if (!product?.doneFromSprint) return false;
  const doneIdx = getSprintIndex(product.doneFromSprint);
  const sprintIdx = getSprintIndex(sprintCode);
  if (doneIdx < 0 || sprintIdx < 0) return false;
  return sprintIdx >= doneIdx;
}

function parsePct(raw) {
  const num = Number(String(raw).replace("%", ""));
  if (Number.isNaN(num) || num < 0) return 0;
  if (num > 100) return 100;
  return Math.round(num / 10) * 10;
}

function getSprintDeptTotalsForValueStream(vs, sprintCode) {
  const totals = Object.fromEntries(DEPARTMENTS.map((d) => [d.key, 0]));

  vs.teams.forEach((team) => {
    team.products.forEach((product) => {
      const alloc = product.allocations?.[sprintCode] || {};
      DEPARTMENTS.forEach((dept) => {
        totals[dept.key] += Number(alloc[dept.key] || 0);
      });
    });
  });

  return totals;
}

function getProductDeptPercent(product, deptKey, sprintCode) {
  const entries = getResourceEntries(product, deptKey, sprintCode);
  return entries
    .slice(0, RESOURCE_PLAN_ROWS - 1)
    .reduce((sum, entry) => sum + Number(entry?.percent || 0), 0);
}

function getProductNeedPercent(product, deptKey, sprintCode) {
  const entries = getResourceEntries(product, deptKey, sprintCode);
  const need = entries[RESOURCE_PLAN_ROWS - 1];
  return Number(need?.percent || 0);
}

function getTeamDeptTotals(team, sprintCode) {
  const totals = Object.fromEntries(DEPARTMENTS.map((d) => [d.key, 0]));
  team.products.forEach((product) => {
    DEPARTMENTS.forEach((dept) => {
      totals[dept.key] += getProductDeptPercent(product, dept.key, sprintCode);
    });
  });
  return totals;
}

function getTeamNeedFlags(team, sprintCode) {
  const flags = Object.fromEntries(DEPARTMENTS.map((d) => [d.key, false]));
  team.products.forEach((product) => {
    DEPARTMENTS.forEach((dept) => {
      if (getProductNeedPercent(product, dept.key, sprintCode) > 0) {
        flags[dept.key] = true;
      }
    });
  });
  return flags;
}

function getValueStreamDeptTotals(vs, sprintCode) {
  const totals = Object.fromEntries(DEPARTMENTS.map((d) => [d.key, 0]));
  vs.teams.forEach((team) => {
    const teamTotals = getTeamDeptTotals(team, sprintCode);
    DEPARTMENTS.forEach((dept) => {
      totals[dept.key] += teamTotals[dept.key];
    });
  });
  return totals;
}

function getValueStreamNeedFlags(vs, sprintCode) {
  const flags = Object.fromEntries(DEPARTMENTS.map((d) => [d.key, false]));
  vs.teams.forEach((team) => {
    const teamFlags = getTeamNeedFlags(team, sprintCode);
    DEPARTMENTS.forEach((dept) => {
      if (teamFlags[dept.key]) {
        flags[dept.key] = true;
      }
    });
  });
  return flags;
}

function getResourceEntries(product, deptKey, sprintCode) {
  const raw = product.resources?.[deptKey]?.[sprintCode];
  if (Array.isArray(raw)) {
    return raw;
  }

  const fallback = createEmptyResourceEntries();
  if (typeof raw === "string" && raw.trim()) {
    fallback[0] = { name: raw.trim(), percent: 0 };
  }

  return fallback;
}

function normalizeResourceName(name) {
  return String(name || "").trim().toLowerCase();
}

function buildGlobalNamedTotalsBySprint(streams, sprintCodes) {
  const bySprint = {};

  sprintCodes.forEach((sprintCode) => {
    const byDept = Object.fromEntries(DEPARTMENTS.map((dept) => [dept.key, {}]));

    (streams || []).forEach((vs) => {
      (vs.teams || []).forEach((team) => {
        (team.products || []).forEach((product) => {
          DEPARTMENTS.forEach((dept) => {
            const rows = getResourceEntries(product, dept.key, sprintCode).slice(0, RESOURCE_PLAN_ROWS - 1);
            rows.forEach((row) => {
              const normalized = normalizeResourceName(row?.name);
              if (!normalized) return;
              const pct = Number(row?.percent || 0);
              byDept[dept.key][normalized] = Number(byDept[dept.key][normalized] || 0) + pct;
            });
          });
        });
      });
    });

    bySprint[sprintCode] = byDept;
  });

  return bySprint;
}

function hasTeamMaxedResource(team, deptKey, sprintCode, globalBySprint) {
  const totals = globalBySprint?.[sprintCode]?.[deptKey] || {};
  const products = team?.products || [];

  return products.some((product) => {
    const rows = getResourceEntries(product, deptKey, sprintCode).slice(0, RESOURCE_PLAN_ROWS - 1);
    return rows.some((row) => {
      const name = normalizeResourceName(row?.name);
      if (!name) return false;
      const pct = Number(row?.percent || 0);
      return pct > 0 && Number(totals[name] || 0) === 100;
    });
  });
}

function hasValueStreamMaxedResource(vs, deptKey, sprintCode, globalBySprint) {
  const teams = vs?.teams || [];
  return teams.some((team) => hasTeamMaxedResource(team, deptKey, sprintCode, globalBySprint));
}

function isNamedRowOverloaded(row, deptKey, sprintCode, globalBySprint) {
  const totals = globalBySprint?.[sprintCode]?.[deptKey] || {};
  const name = normalizeResourceName(row?.name);
  if (!name) return false;
  const pct = Number(row?.percent || 0);
  return pct > 0 && Number(totals[name] || 0) > 100;
}

function hasProductOverloadedResource(product, deptKey, sprintCode, globalBySprint) {
  const rows = getResourceEntries(product, deptKey, sprintCode).slice(0, RESOURCE_PLAN_ROWS - 1);
  return rows.some((row) => isNamedRowOverloaded(row, deptKey, sprintCode, globalBySprint));
}

function hasTeamOverloadedResource(team, deptKey, sprintCode, globalBySprint) {
  const products = team?.products || [];
  return products.some((product) => hasProductOverloadedResource(product, deptKey, sprintCode, globalBySprint));
}

function hasValueStreamOverloadedResource(vs, deptKey, sprintCode, globalBySprint) {
  const teams = vs?.teams || [];
  return teams.some((team) => hasTeamOverloadedResource(team, deptKey, sprintCode, globalBySprint));
}

function getAssignedResourceRows(product, deptKey, sprintCode) {
  const entries = getResourceEntries(product, deptKey, sprintCode);
  const assigned = entries
    .slice(0, RESOURCE_PLAN_ROWS - 1)
    .map((entry) => ({
      name: String(entry?.name || "").trim() || "Unassigned",
      percent: Number(entry?.percent || 0),
      isNeed: false,
    }));

  const need = Number(entries[RESOURCE_PLAN_ROWS - 1]?.percent || 0);
  assigned.push({
    name: "Need",
    percent: need,
    isNeed: true,
  });

  return assigned;
}

function buildSprintInsights(streams, sprintCode) {
  const namedTotals = {};
  const needs = [];

  (streams || []).forEach((vs) => {
    (vs.teams || []).forEach((team) => {
      (team.products || []).forEach((product) => {
        DEPARTMENTS.forEach((dept) => {
          const entries = getResourceEntries(product, dept.key, sprintCode);
          const namedRows = entries.slice(0, RESOURCE_PLAN_ROWS - 1);

          namedRows.forEach((row) => {
            const normalized = normalizeResourceName(row?.name);
            const displayName = String(row?.name || "").trim();
            const pct = Number(row?.percent || 0);
            if (!normalized || pct <= 0) return;

            const resourceKey = `${dept.key}::${normalized}`;
            if (!namedTotals[resourceKey]) {
              namedTotals[resourceKey] = {
                deptKey: dept.key,
                name: displayName,
                total: 0,
                spots: [],
              };
            }

            namedTotals[resourceKey].total += pct;
            namedTotals[resourceKey].spots.push({
              teamName: team.name,
              productName: product.name,
              pct,
            });
          });

          const needPct = Number(entries[RESOURCE_PLAN_ROWS - 1]?.percent || 0);
          if (needPct > 0) {
            needs.push(`${dept.key} need ${needPct}% in ${team.name} / ${product.name}`);
          }
        });
      });
    });
  });

  const resources = Object.values(namedTotals);

  const overAllocated = resources
    .filter((resource) => resource.total > 100)
    .map((resource) => {
      const spotSummary = resource.spots
        .map((spot) => `${spot.teamName} / ${spot.productName} (${spot.pct}%)`)
        .join(", ");
      return `${resource.name} (${resource.deptKey}) ${resource.total}% -> ${spotSummary}`;
    });

  const underAllocated = resources
    .filter((resource) => resource.total < 100)
    .map((resource) => `${resource.name} (${resource.deptKey}) ${resource.total}%`);

  return {
    overAllocated,
    needs,
    underAllocated,
  };
}

function ResourceGroup({ totals, needs, overloads, onToggleResource, isResourceOpen, readOnly }) {
  return (
    <div className={`pct-edit-wrap${readOnly ? " is-readonly" : ""}`}>
      {DEPARTMENTS.map((dept) => (
        <button
          key={dept.key}
          type="button"
          className={`pct-edit-line pct-chip${isResourceOpen(dept.key) ? " is-open" : ""}${needs?.[dept.key] ? " has-need" : ""}${overloads?.[dept.key] ? " is-overloaded" : ""}`}
          onClick={() => {
            if (readOnly) return;
            onToggleResource(dept.key);
          }}
          title={`Open ${dept.label} resource plan`}
        >
          <span>{dept.key}</span>
          <strong>{Math.round(Number(totals?.[dept.key] || 0))}</strong>
          <em>%</em>
          {needs?.[dept.key] ? <i className="need-dot" aria-label="Need detected" /> : null}
        </button>
      ))}
    </div>
  );
}

export default function App() {
  const [year, setYear] = useState(2026);
  const [dataByYear, setDataByYear] = useState(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return normalizeDataByYear(null);
    }

    try {
      return normalizeDataByYear(JSON.parse(stored));
    } catch {
      return normalizeDataByYear(null);
    }
  });
  const [openResourceRows, setOpenResourceRows] = useState({});
  const [selectedSprints, setSelectedSprints] = useState(new Set());
  const [fullScreenSprintCode, setFullScreenSprintCode] = useState(null);
  const [nameDialog, setNameDialog] = useState({
    open: false,
    title: "",
    label: "",
    placeholder: "",
    submitLabel: "Save",
    value: "",
    onSubmit: null,
  });
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    message: "",
    confirmLabel: "Confirm",
    onConfirm: null,
  });
  const [doneSprintDialog, setDoneSprintDialog] = useState({
    open: false,
    vsId: null,
    teamId: null,
    productId: null,
    productName: "",
    value: CURRENT_SPRINT_CODE,
  });
  const historyRef = useRef([]);
  const gridScrollRef = useRef(null);

  const allSprints = useMemo(
    () => QUARTER_TEMPLATE.flatMap((q) => q.sprints.map((s) => ({ code: s, quarter: q.id }))),
    []
  );

  const currentSprints = useMemo(() => {
    if (selectedSprints.size === 0) {
      return allSprints;
    }
    const visibleIndexes = new Set();

    allSprints.forEach((sprint, index) => {
      if (!selectedSprints.has(sprint.code)) return;

      const start = Math.max(0, index - 1);
      const end = Math.min(allSprints.length - 1, index + 3);

      for (let i = start; i <= end; i += 1) {
        visibleIndexes.add(i);
      }
    });

    return allSprints.filter((_, index) => visibleIndexes.has(index));
  }, [allSprints, selectedSprints]);

  const streams = dataByYear[year] || [];
  const sprintInsightsByCode = useMemo(
    () => Object.fromEntries(currentSprints.map((s) => [s.code, buildSprintInsights(streams, s.code)])),
    [currentSprints, streams]
  );

  useEffect(() => {
    if (selectedSprints.size !== 0) return;
    const container = gridScrollRef.current;
    if (!container) return;

    const target = container.querySelector(`[data-sprint-code="${CURRENT_SPRINT_CODE}"]`);
    if (!target) return;

    const leftOffset = Math.max(0, target.offsetLeft - 320);
    container.scrollTo({ left: leftOffset, behavior: "smooth" });
  }, [selectedSprints, year]);
  const globalNamedTotalsBySprint = useMemo(
    () => buildGlobalNamedTotalsBySprint(streams, ALL_SPRINT_CODES),
    [streams]
  );
  const fullScreenSprintData = useMemo(() => {
    if (!fullScreenSprintCode) return [];

    return streams
      .map((vs) => {
        const teams = vs.teams
          .map((team) => {
            const products = team.products
              .map((product) => {
                const departments = DEPARTMENTS
                  .map((dept) => ({
                    ...dept,
                    rows: getAssignedResourceRows(product, dept.key, fullScreenSprintCode),
                  }))
                  .filter((dept) => dept.rows.length > 0);

                if (!departments.length) return null;
                return {
                  id: product.id,
                  name: product.name,
                  departments,
                };
              })
              .filter(Boolean);

            if (!products.length) return null;
            return {
              id: team.id,
              name: team.name,
              products,
            };
          })
          .filter(Boolean);

        if (!teams.length) return null;
        return {
          id: vs.id,
          name: vs.name,
          teams,
        };
      })
      .filter(Boolean);
  }, [fullScreenSprintCode, streams]);
  const teamCount = useMemo(
    () => streams.reduce((sum, vs) => sum + (Array.isArray(vs.teams) ? vs.teams.length : 0), 0),
    [streams]
  );

  const updateCurrentYear = useCallback(
    (updater) => {
      setDataByYear((prev) => {
        historyRef.current = [prev, ...historyRef.current].slice(0, 30);
        const next = {
          ...prev,
          [year]: updater(prev[year] || []),
        };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    [year]
  );

  const replaceAllYears = useCallback((nextByYear) => {
    historyRef.current = [dataByYear, ...historyRef.current].slice(0, 30);
    setDataByYear(nextByYear);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextByYear));
  }, [dataByYear]);

  const toggleVS = useCallback(
    (vsId) => updateCurrentYear((rows) => rows.map((vs) => (vs.id === vsId ? { ...vs, expanded: !vs.expanded } : vs))),
    [updateCurrentYear]
  );

  const toggleTeam = useCallback(
    (vsId, teamId) =>
      updateCurrentYear((rows) =>
        rows.map((vs) =>
          vs.id !== vsId
            ? vs
            : {
                ...vs,
                teams: vs.teams.map((t) => (t.id === teamId ? { ...t, expanded: !t.expanded } : t)),
              }
        )
      ),
    [updateCurrentYear]
  );

  const closeNameDialog = useCallback(() => {
    setNameDialog((prev) => ({ ...prev, open: false }));
  }, []);

  const openNameDialog = useCallback((config) => {
    setNameDialog({
      open: true,
      title: config.title || "Edit Name",
      label: config.label || "Name",
      placeholder: config.placeholder || "Enter name",
      submitLabel: config.submitLabel || "Save",
      value: config.initialValue || "",
      onSubmit: config.onSubmit || null,
    });
  }, []);

  const handleNameDialogSave = useCallback(() => {
    const trimmed = String(nameDialog.value || "").trim();
    if (!trimmed) return;
    const submitAction = nameDialog.onSubmit;
    setNameDialog((prev) => ({ ...prev, open: false }));
    if (typeof submitAction === "function") {
      submitAction(trimmed);
    }
  }, [nameDialog]);

  const closeConfirmDialog = useCallback(() => {
    setConfirmDialog((prev) => ({ ...prev, open: false }));
  }, []);

  const openConfirmDialog = useCallback((config) => {
    setConfirmDialog({
      open: true,
      title: config.title || "Please Confirm",
      message: config.message || "Are you sure you want to continue?",
      confirmLabel: config.confirmLabel || "Confirm",
      onConfirm: config.onConfirm || null,
    });
  }, []);

  const handleConfirmDialogProceed = useCallback(() => {
    const action = confirmDialog.onConfirm;
    setConfirmDialog((prev) => ({ ...prev, open: false }));
    if (typeof action === "function") {
      action();
    }
  }, [confirmDialog]);

  const closeDoneSprintDialog = useCallback(() => {
    setDoneSprintDialog((prev) => ({ ...prev, open: false }));
  }, []);

  const openDoneSprintDialog = useCallback((vsId, teamId, product) => {
    setDoneSprintDialog({
      open: true,
      vsId,
      teamId,
      productId: product.id,
      productName: product.name || "Product",
      value: product.doneFromSprint || CURRENT_SPRINT_CODE,
    });
  }, []);

  const addValueStream = useCallback(() => {
    openNameDialog({
      title: "Add New Value Stream",
      label: "Value Stream Name",
      placeholder: "Example: Integrated Value Chain",
      submitLabel: "Add Value Stream",
      initialValue: "",
      onSubmit: (name) => {
        updateCurrentYear((rows) => [...rows, { id: nextId("vs"), name, expanded: true, teams: [] }]);
      },
    });
  }, [openNameDialog, updateCurrentYear]);

  const scaleTeamsFromTemplate = useCallback(() => {
    const raw = window.prompt("How many teams do you want in total?", String(TEAM_SCALE_TARGET));
    if (!raw || !raw.trim()) return;

    const desired = Number(raw);
    if (!Number.isFinite(desired) || desired < 1) return;

    updateCurrentYear((rows) => {
      const nextRows = Array.isArray(rows) ? [...rows] : [];
      const baseVs = nextRows[0] || createBaseValueStream();
      const sourceTeam = baseVs.teams[0] || createTeam("Equipment Analytics", []);
      const cloneCount = Math.max(0, Math.floor(desired) - baseVs.teams.length);

      const clones = Array.from({ length: cloneCount }, (_, idx) => {
        const labelIndex = baseVs.teams.length + idx + 1;
        return {
          ...sourceTeam,
          id: nextId("team"),
          name: `Equipment Analytics ${labelIndex}`,
          expanded: false,
          products: sourceTeam.products.map((product) =>
            ensureProductShape({
              ...product,
              id: nextId("product"),
              name: product.name,
            })
          ),
        };
      });

      const mergedVs = {
        ...baseVs,
        teams: [...baseVs.teams, ...clones],
      };

      if (nextRows.length === 0) {
        return [mergedVs];
      }

      nextRows[0] = mergedVs;
      return nextRows;
    });
  }, [updateCurrentYear]);

  const cloneEntries = useCallback((entries = []) => entries.map((entry) => ({ ...entry })), []);

  const copyFromPreviousSprint = useCallback((targetSprintCode) => {
    const sprintIndex = ALL_SPRINT_CODES.indexOf(targetSprintCode);
    if (sprintIndex <= 0) {
      return;
    }
    const prevSprintCode = ALL_SPRINT_CODES[sprintIndex - 1];

    updateCurrentYear((rows) =>
      rows.map((vs) => ({
        ...vs,
        teams: vs.teams.map((team) => ({
          ...team,
          products: team.products.map((product) => {
            if (isProductDeliveredAtSprint(product, targetSprintCode)) {
              return product;
            }

            const nextResources = { ...product.resources };

            DEPARTMENTS.forEach((dept) => {
              const deptMap = { ...(nextResources[dept.key] || {}) };
              const prevEntries = getResourceEntries(product, dept.key, prevSprintCode);
              deptMap[targetSprintCode] = cloneEntries(prevEntries);
              nextResources[dept.key] = deptMap;
            });

            return {
              ...product,
              resources: nextResources,
            };
          }),
        })),
      }))
    );
  }, [cloneEntries, updateCurrentYear]);

  const setProductDoneFromSprint = useCallback(
    (vsId, teamId, productId, nextDoneSprint) => {
      updateCurrentYear((rows) =>
        rows.map((vs) =>
          vs.id !== vsId
            ? vs
            : {
                ...vs,
                teams: vs.teams.map((team) =>
                  team.id !== teamId
                    ? team
                    : {
                        ...team,
                        products: team.products.map((product) => {
                          if (product.id !== productId) return product;

                          if (!nextDoneSprint) {
                            return {
                              ...product,
                              doneFromSprint: null,
                            };
                          }

                          const cutoff = getSprintIndex(nextDoneSprint);
                          const nextResources = { ...product.resources };
                          const nextAllocations = { ...product.allocations };

                          DEPARTMENTS.forEach((dept) => {
                            const deptMap = { ...(nextResources[dept.key] || {}) };
                            ALL_SPRINT_CODES.forEach((code, idx) => {
                              if (idx < cutoff) return;
                              deptMap[code] = createEmptyResourceEntries();
                              nextAllocations[code] = {
                                ...(nextAllocations[code] || {}),
                                [dept.key]: 0,
                              };
                            });
                            nextResources[dept.key] = deptMap;
                          });

                          return {
                            ...product,
                            doneFromSprint: nextDoneSprint,
                            resources: nextResources,
                            allocations: nextAllocations,
                          };
                        }),
                      }
                ),
              }
        )
      );
    },
    [updateCurrentYear]
  );

  const saveDoneSprintDialog = useCallback(() => {
    if (!doneSprintDialog.value || !ALL_SPRINT_CODES.includes(doneSprintDialog.value)) {
      return;
    }

    setProductDoneFromSprint(
      doneSprintDialog.vsId,
      doneSprintDialog.teamId,
      doneSprintDialog.productId,
      doneSprintDialog.value
    );
    setDoneSprintDialog((prev) => ({ ...prev, open: false }));
  }, [doneSprintDialog, setProductDoneFromSprint]);

  const handleProductDoneButton = useCallback(
    (vsId, teamId, product) => {
      if (product.doneFromSprint) {
        setProductDoneFromSprint(vsId, teamId, product.id, null);
        return;
      }

      openDoneSprintDialog(vsId, teamId, product);
    },
    [openDoneSprintDialog, setProductDoneFromSprint]
  );

  const revertLastChange = useCallback(() => {
    if (!historyRef.current.length) return;
    const [previous, ...rest] = historyRef.current;
    historyRef.current = rest;
    setDataByYear(previous);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(previous));
  }, []);

  const editValueStream = useCallback(
    (vsId, currentName) => {
      openNameDialog({
        title: "Edit Value Stream",
        label: "Value Stream Name",
        placeholder: "Update value stream name",
        submitLabel: "Save Changes",
        initialValue: currentName || "",
        onSubmit: (name) => {
          updateCurrentYear((rows) => rows.map((vs) => (vs.id === vsId ? { ...vs, name } : vs)));
        },
      });
    },
    [openNameDialog, updateCurrentYear]
  );

  const removeValueStream = useCallback(
    (vsId) => {
      openConfirmDialog({
        title: "Remove Value Stream",
        message: "This will remove the value stream and all its teams and products.",
        confirmLabel: "Remove",
        onConfirm: () => {
          updateCurrentYear((rows) => rows.filter((vs) => vs.id !== vsId));
        },
      });
    },
    [openConfirmDialog, updateCurrentYear]
  );

  const addTeam = useCallback(
    (vsId) => {
      openNameDialog({
        title: "Add New Team",
        label: "Team Name",
        placeholder: "Example: Trailblazers",
        submitLabel: "Add Team",
        initialValue: "",
        onSubmit: (name) => {
          updateCurrentYear((rows) =>
            rows.map((vs) =>
              vs.id !== vsId ? vs : { ...vs, teams: [...vs.teams, { id: nextId("team"), name, expanded: true, products: [] }] }
            )
          );
        },
      });
    },
    [openNameDialog, updateCurrentYear]
  );

  const editTeam = useCallback(
    (vsId, teamId, currentName) => {
      openNameDialog({
        title: "Edit Team",
        label: "Team Name",
        placeholder: "Update team name",
        submitLabel: "Save Changes",
        initialValue: currentName || "",
        onSubmit: (name) => {
          updateCurrentYear((rows) =>
            rows.map((vs) =>
              vs.id !== vsId
                ? vs
                : {
                    ...vs,
                    teams: vs.teams.map((t) => (t.id === teamId ? { ...t, name } : t)),
                  }
            )
          );
        },
      });
    },
    [openNameDialog, updateCurrentYear]
  );

  const removeTeam = useCallback(
    (vsId, teamId) => {
      openConfirmDialog({
        title: "Remove Team",
        message: "This will remove the team and all products under it.",
        confirmLabel: "Remove",
        onConfirm: () => {
          updateCurrentYear((rows) =>
            rows.map((vs) =>
              vs.id !== vsId ? vs : { ...vs, teams: vs.teams.filter((t) => t.id !== teamId) }
            )
          );
        },
      });
    },
    [openConfirmDialog, updateCurrentYear]
  );

  const addProduct = useCallback(
    (vsId, teamId) => {
      openNameDialog({
        title: "Add New Product",
        label: "Product Name",
        placeholder: "Example: Co-Scientist",
        submitLabel: "Add Product",
        initialValue: "",
        onSubmit: (name) => {
          updateCurrentYear((rows) =>
            rows.map((vs) =>
              vs.id !== vsId
                ? vs
                : {
                    ...vs,
                    teams: vs.teams.map((t) =>
                      t.id !== teamId ? t : { ...t, products: [...t.products, createProduct(name)] }
                    ),
                  }
            )
          );
        },
      });
    },
    [openNameDialog, updateCurrentYear]
  );

  const editProduct = useCallback(
    (vsId, teamId, productId, currentName) => {
      openNameDialog({
        title: "Edit Product",
        label: "Product Name",
        placeholder: "Update product name",
        submitLabel: "Save Changes",
        initialValue: currentName || "",
        onSubmit: (name) => {
          updateCurrentYear((rows) =>
            rows.map((vs) =>
              vs.id !== vsId
                ? vs
                : {
                    ...vs,
                    teams: vs.teams.map((t) =>
                      t.id !== teamId
                        ? t
                        : {
                            ...t,
                            products: t.products.map((p) => (p.id === productId ? { ...p, name } : p)),
                          }
                    ),
                  }
            )
          );
        },
      });
    },
    [openNameDialog, updateCurrentYear]
  );

  const removeProduct = useCallback(
    (vsId, teamId, productId) => {
      openConfirmDialog({
        title: "Remove Product",
        message: "This will remove the product and all sprint allocations under it.",
        confirmLabel: "Remove",
        onConfirm: () => {
          updateCurrentYear((rows) =>
            rows.map((vs) =>
              vs.id !== vsId
                ? vs
                : {
                    ...vs,
                    teams: vs.teams.map((t) =>
                      t.id !== teamId ? t : { ...t, products: t.products.filter((p) => p.id !== productId) }
                    ),
                  }
            )
          );
        },
      });
    },
    [openConfirmDialog, updateCurrentYear]
  );

  const updateAllocation = useCallback(
    (vsId, teamId, productId, sprintCode, deptKey, rawValue) => {
      const nextPct = parsePct(rawValue);
      updateCurrentYear((rows) =>
        rows.map((vs) =>
          vs.id !== vsId
            ? vs
            : {
                ...vs,
                teams: vs.teams.map((t) =>
                  t.id !== teamId
                    ? t
                    : {
                        ...t,
                        products: t.products.map((p) =>
                          p.id !== productId
                            ? p
                            : {
                                ...p,
                                allocations: {
                                  ...p.allocations,
                                  [sprintCode]: {
                                    ...(p.allocations[sprintCode] || {}),
                                    [deptKey]: nextPct,
                                  },
                                },
                              }
                        ),
                      }
                ),
              }
        )
      );
    },
    [updateCurrentYear]
  );

  const updateResourcePlanEntry = useCallback(
    (vsId, teamId, productId, deptKey, sprintCode, rowIndex, field, rawValue) => {
      const nextValue = field === "percent" ? parsePct(rawValue) : String(rawValue);

      const currentRows = dataByYear[year] || [];
      const currentVs = currentRows.find((row) => row.id === vsId);
      const currentTeam = currentVs?.teams?.find((t) => t.id === teamId);
      const currentProduct = currentTeam?.products?.find((p) => p.id === productId);
      if (isProductDeliveredAtSprint(currentProduct, sprintCode)) {
        return;
      }

      if (field === "name" && rowIndex !== RESOURCE_PLAN_ROWS - 1) {
        updateCurrentYear((rows) =>
          rows.map((vs) => ({
            ...vs,
            teams: vs.teams.map((t) => ({
              ...t,
              products: t.products.map((p) => ({
                ...p,
                resources: {
                  ...p.resources,
                  [deptKey]: {
                    ...(p.resources[deptKey] || {}),
                    [sprintCode]: getResourceEntries(p, deptKey, sprintCode).map((entry, idx) => {
                      if (idx !== rowIndex) return entry;
                      return {
                        ...entry,
                        name: nextValue,
                      };
                    }),
                  },
                },
              })),
            })),
          }))
        );
        return;
      }

      updateCurrentYear((rows) =>
        rows.map((vs) =>
          vs.id !== vsId
            ? vs
            : {
                ...vs,
                teams: vs.teams.map((t) =>
                  t.id !== teamId
                    ? t
                    : {
                        ...t,
                        products: t.products.map((p) =>
                          p.id !== productId
                            ? p
                            : {
                                ...p,
                                resources: {
                                  ...p.resources,
                                  [deptKey]: {
                                    ...(p.resources[deptKey] || {}),
                                    [sprintCode]: getResourceEntries(p, deptKey, sprintCode).map((entry, idx) => {
                                      if (idx !== rowIndex) return entry;
                                      if (idx === RESOURCE_PLAN_ROWS - 1 && field === "name") return entry;
                                      return {
                                        ...entry,
                                        [field]: nextValue,
                                      };
                                    }),
                                  },
                                },
                              }
                        ),
                      }
                ),
              }
        )
      );
    },
    [dataByYear, updateCurrentYear, year]
  );

  const toggleResourceRow = useCallback((yearKey, productId, deptKey) => {
    const key = `${yearKey}-${productId}-${deptKey}`;
    setOpenResourceRows((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const openTeamDeptResources = useCallback(
    (vsId, teamId, deptKey, sprintCode) => {
      const currentRows = dataByYear[year] || [];
      const vs = currentRows.find((item) => item.id === vsId);
      if (!vs) return;

      const team = (vs.teams || []).find((item) => item.id === teamId);
      if (!team) return;

      setOpenResourceRows((prev) => {
        const next = { ...prev };
        (team.products || []).forEach((product) => {
          next[`${year}-${product.id}-${deptKey}`] = true;
        });
        return next;
      });

      // Ensure the full hierarchy is visible when a team chip is clicked.
      updateCurrentYear((rows) =>
        rows.map((row) =>
          row.id !== vsId
            ? row
            : {
                ...row,
                expanded: true,
                teams: row.teams.map((t) =>
                  t.id !== teamId
                    ? t
                    : {
                        ...t,
                        expanded: true,
                      }
                ),
              }
        )
      );

      if (sprintCode) {
        setSelectedSprints((prev) => {
          const next = new Set(prev);
          next.add(sprintCode);
          return next;
        });
      }
    },
    [dataByYear, updateCurrentYear, year]
  );

  const toggleSprintSelection = useCallback((sprintCode) => {
    setSelectedSprints((prev) => {
      const next = new Set(prev);
      if (next.has(sprintCode)) {
        next.delete(sprintCode);
      } else {
        next.add(sprintCode);
      }
      return next;
    });
  }, []);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark"><span /></div>
          <div>
            <div className="brand-name">BOROUGE INTERNATIONAL</div>
            <div className="brand-title">Squad Jam Resource Planning</div>
          </div>
        </div>

        <div className="topbar-meta">
          <label className="year-picker" htmlFor="yearSel">Year</label>
          <select id="yearSel" className="year-select" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <span className="pill pill-success">Active Sprint: {CURRENT_SPRINT_CODE}</span>
          <span className="avatar">CE</span>
        </div>
      </header>

      <div className="toolbar">
        <span className="hint">Click department chips inside a sprint cell to expand names and percentages for that parameter. Click a sprint header to zoom/filter.</span>
        <span className="zoom-helper">Default view: current sprint + next 3. Zoom on select: previous + selected + next 3</span>
        <button type="button" className="add-vs-btn" onClick={scaleTeamsFromTemplate}>Scale to 20 Teams</button>
        <span className="pill">Teams: {teamCount}</span>
      </div>

      <div className="grid-root">
        <div className="grid-scroll" ref={gridScrollRef}>
          <table className={`resource-table${selectedSprints.size > 0 ? ' sprints-filtered' : ''}`}>
            <colgroup>
              <col className="col-name" />
              {currentSprints.map((s) => (
                <col key={s.code} className="col-sprint" />
              ))}
            </colgroup>

            <thead>
              <tr>
                <th className="th-name sticky-col">Value Streams / Teams / Products</th>
                {QUARTER_TEMPLATE.map((q) => (
                  <th key={q.id} colSpan={q.sprints.length} className={`th-quarter ${quarterHeadClass(q.id)}`}>
                    {q.label}
                  </th>
                ))}
              </tr>

              <tr>
                <th className="th-sprint-blank sticky-col" />
                {currentSprints.map((s) => (
                  <th key={s.code} data-sprint-code={s.code} className={`th-sprint ${sprintToneClass(s.code)}${s.code === CURRENT_SPRINT_CODE ? " th-current" : ""}${selectedSprints.has(s.code) ? " sprint-selected" : ""}`} onClick={() => toggleSprintSelection(s.code)} style={{cursor: 'pointer'}}>
                    <div className="sprint-code">{s.code}</div>
                    <div className="sprint-date">{SPRINT_DATE_MAP[s.code] || ""}</div>
                    <div className="sprint-actions">
                      <button
                        type="button"
                        className="sprint-action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyFromPreviousSprint(s.code);
                        }}
                      >
                        Copy Last
                      </button>
                      <button
                        type="button"
                        className="sprint-action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          revertLastChange();
                        }}
                      >
                        Revert
                      </button>
                      <button
                        type="button"
                        className="sprint-action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFullScreenSprintCode(s.code);
                        }}
                      >
                        Full Screen
                      </button>
                    </div>
                  </th>
                ))}
              </tr>

              <tr>
                <th className="th-dept sticky-col">Parameters: DS, DD, VA, PO, SC</th>
                {currentSprints.map((s) => (
                  <th key={s.code} className={`th-dept-fill ${sprintToneClass(s.code)}`} />
                ))}
              </tr>
            </thead>

            <tbody>
              <tr className="insight-row">
                <td className="insight-cell sticky-col">
                  <strong>Sprint Insights</strong>
                  <span className="resource-hint">1) Over-allocation 2) Need 3) Under 100%</span>
                </td>
                {currentSprints.map((s) => {
                  const insights = sprintInsightsByCode[s.code] || { overAllocated: [], needs: [], underAllocated: [] };
                  const overItems = insights.overAllocated.length ? insights.overAllocated : ["None"];
                  const needItems = insights.needs.length ? insights.needs : ["None"];
                  const underItems = insights.underAllocated.length ? insights.underAllocated : ["None"];

                  return (
                    <td key={`insight-${s.code}`} className={`insight-content-cell ${sprintToneClass(s.code)}${s.code === CURRENT_SPRINT_CODE ? " current-col" : ""}`}>
                      <ol className="insight-list">
                        <li className={`insight-item insight-over${insights.overAllocated.length === 0 ? " insight-empty" : ""}`}>
                          <strong>Over-Allocated:</strong>
                          <ul className="insight-sublist">
                            {overItems.map((item, idx) => (
                              <li key={`over-${s.code}-${idx}`}>{item}</li>
                            ))}
                          </ul>
                        </li>
                        <li className={`insight-item insight-need${insights.needs.length === 0 ? " insight-empty" : ""}`}>
                          <strong>Need:</strong>
                          <ul className="insight-sublist">
                            {needItems.map((item, idx) => (
                              <li key={`need-${s.code}-${idx}`}>{item}</li>
                            ))}
                          </ul>
                        </li>
                        <li className={`insight-item insight-under${insights.underAllocated.length === 0 ? " insight-empty" : ""}`}>
                          <strong>Under 100%:</strong>
                          <ul className="insight-sublist">
                            {underItems.map((item, idx) => (
                              <li key={`under-${s.code}-${idx}`}>{item}</li>
                            ))}
                          </ul>
                        </li>
                      </ol>
                    </td>
                  );
                })}
              </tr>

              {streams.map((vs) => (
                <React.Fragment key={vs.id}>
                  <tr className="vs-row">
                    <td className="vs-cell sticky-col swimlane-root">
                      <button type="button" className="toggle-btn" onClick={() => toggleVS(vs.id)}>{vs.expanded ? "▾" : "▸"}</button>
                      <span className="name-main">{vs.name}</span>
                      <span className="row-actions">
                        <button type="button" className="icon-btn" onClick={() => editValueStream(vs.id, vs.name)} title="Edit Value Stream">✎</button>
                        <button type="button" className="icon-btn" onClick={() => addTeam(vs.id)} title="Add Team">+ Team</button>
                        <button type="button" className="icon-btn danger" onClick={() => removeValueStream(vs.id)} title="Remove Value Stream">✕</button>
                      </span>
                    </td>
                    {currentSprints.map((s) => {
                      const totals = getValueStreamDeptTotals(vs, s.code);
                      const needFlags = getValueStreamNeedFlags(vs, s.code);
                      return (
                        <td key={s.code} className={`fill-vs ${sprintToneClass(s.code)}${s.code === CURRENT_SPRINT_CODE ? " current-col" : ""}`}>
                          <div className="vs-rollup-line">
                            {DEPARTMENTS.map((dept) => {
                              const overloaded = hasValueStreamOverloadedResource(vs, dept.key, s.code, globalNamedTotalsBySprint);
                              const maxed = hasValueStreamMaxedResource(vs, dept.key, s.code, globalNamedTotalsBySprint);

                              return (
                                <span
                                  key={dept.key}
                                  className={`vs-rollup-item vs-summary-btn${needFlags[dept.key] ? " has-need" : ""}${overloaded ? " is-overloaded" : ""}${!overloaded && maxed ? " is-maxed" : ""}`}
                                  title={`${dept.label} total`}
                                >
                                  <strong>{dept.key}</strong>
                                  <em>{Math.round(totals[dept.key])}%</em>
                                  {needFlags[dept.key] ? <i className="need-dot" aria-label="Need detected" /> : null}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {vs.expanded && vs.teams.map((team) => (
                    <React.Fragment key={team.id}>
                      <tr className="team-row">
                        <td className="team-cell sticky-col swimlane-team">
                          <span className="indent level-team" />
                          <button type="button" className="toggle-btn" onClick={() => toggleTeam(vs.id, team.id)}>{team.expanded ? "▾" : "▸"}</button>
                          <span className="name-team">{team.name}</span>
                          <span className="row-actions">
                            <button type="button" className="icon-btn" onClick={() => editTeam(vs.id, team.id, team.name)} title="Edit Team">✎</button>
                            <button type="button" className="icon-btn" onClick={() => addProduct(vs.id, team.id)} title="Add Product">+ Product</button>
                            <button type="button" className="icon-btn danger" onClick={() => removeTeam(vs.id, team.id)} title="Remove Team">✕</button>
                          </span>
                        </td>
                        {currentSprints.map((s) => {
                          const teamTotals = getTeamDeptTotals(team, s.code);
                          const teamNeedFlags = getTeamNeedFlags(team, s.code);
                          return (
                            <td key={s.code} className={`fill-team ${sprintToneClass(s.code)}${s.code === CURRENT_SPRINT_CODE ? " current-col" : ""}`}>
                              <div className="vs-rollup-line">
                                {DEPARTMENTS.map((dept) => {
                                  const overloaded = hasTeamOverloadedResource(team, dept.key, s.code, globalNamedTotalsBySprint);
                                  const maxed = hasTeamMaxedResource(team, dept.key, s.code, globalNamedTotalsBySprint);

                                  return (
                                    <button
                                      key={dept.key}
                                      type="button"
                                      className={`vs-rollup-item${teamNeedFlags[dept.key] ? " has-need" : ""}${overloaded ? " is-overloaded" : ""}${!overloaded && maxed ? " is-maxed" : ""}`}
                                      title={`${dept.label} total`}
                                      onClick={() => openTeamDeptResources(vs.id, team.id, dept.key, s.code)}
                                    >
                                      <strong>{dept.key}</strong>
                                      <em>{Math.round(teamTotals[dept.key])}%</em>
                                      {teamNeedFlags[dept.key] ? <i className="need-dot" aria-label="Need detected" /> : null}
                                    </button>
                                  );
                                })}
                              </div>
                            </td>
                          );
                        })}
                      </tr>

                      {team.expanded && team.products.map((product) => (
                        <React.Fragment key={product.id}>
                          <tr className="product-row">
                            <td className="product-cell sticky-col swimlane-product">
                              <span className="indent level-product" />
                              <span className="name-product">{product.name}</span>
                              <span className="row-actions">
                                <button
                                  type="button"
                                  className={`icon-btn product-done-btn${product.doneFromSprint ? " is-done" : ""}`}
                                  onClick={() => handleProductDoneButton(vs.id, team.id, product)}
                                  title={product.doneFromSprint ? `Done from ${product.doneFromSprint}` : "Set product done sprint"}
                                >
                                  {product.doneFromSprint ? `Done ${product.doneFromSprint}` : "Mark Done"}
                                </button>
                                <button type="button" className="icon-btn" onClick={() => editProduct(vs.id, team.id, product.id, product.name)} title="Edit Product">✎</button>
                                <button type="button" className="icon-btn danger" onClick={() => removeProduct(vs.id, team.id, product.id)} title="Remove Product">✕</button>
                              </span>
                            </td>

                            {currentSprints.map((s) => (
                              <td key={s.code} className={`data-cell ${sprintToneClass(s.code)}${s.code === CURRENT_SPRINT_CODE ? " current-col" : ""}${isProductDeliveredAtSprint(product, s.code) ? " is-delivered" : ""}`}>
                                {(() => {
                                  const productTotals = Object.fromEntries(
                                    DEPARTMENTS.map((dept) => [dept.key, getProductDeptPercent(product, dept.key, s.code)])
                                  );
                                  const productNeeds = Object.fromEntries(
                                    DEPARTMENTS.map((dept) => [dept.key, getProductNeedPercent(product, dept.key, s.code) > 0])
                                  );
                                  const productOverloads = Object.fromEntries(
                                    DEPARTMENTS.map((dept) => [dept.key, hasProductOverloadedResource(product, dept.key, s.code, globalNamedTotalsBySprint)])
                                  );

                                  return (
                                <ResourceGroup
                                  totals={productTotals}
                                  needs={productNeeds}
                                  overloads={productOverloads}
                                  onToggleResource={(deptKey) => toggleResourceRow(year, product.id, deptKey)}
                                  isResourceOpen={(deptKey) => Boolean(openResourceRows[`${year}-${product.id}-${deptKey}`])}
                                  readOnly={isProductDeliveredAtSprint(product, s.code)}
                                />
                                  );
                                })()}
                              </td>
                            ))}
                          </tr>

                          {DEPARTMENTS.map((dept) => {
                            const openKey = `${year}-${product.id}-${dept.key}`;
                            if (!openResourceRows[openKey]) return null;
                            return (
                              <tr key={openKey} className="resource-row" data-dept={dept.key}>
                                <td className="resource-cell sticky-col">
                                  <span className="indent level-resource" />
                                  <button
                                    type="button"
                                    className="resource-collapse-btn"
                                    onClick={() => toggleResourceRow(year, product.id, dept.key)}
                                    title={`Collapse ${dept.label}`}
                                  >
                                    {dept.label}
                                  </button>
                                  <span className="resource-hint">Enter names for each sprint</span>
                                </td>
                                {currentSprints.map((s) => {
                                  const deptOverloaded = hasProductOverloadedResource(product, dept.key, s.code, globalNamedTotalsBySprint);
                                  const isDeliveredSprint = isProductDeliveredAtSprint(product, s.code);

                                  return (
                                  <td key={s.code} className={`resource-input-cell ${sprintToneClass(s.code)}${s.code === CURRENT_SPRINT_CODE ? " current-col" : ""}${isDeliveredSprint ? " is-delivered" : ""}`}>
                                    <div className={`resource-plan-grid${deptOverloaded ? " is-overloaded" : ""}`}>
                                      <div className="resource-plan-head">
                                        <span>Name</span>
                                        <span>%</span>
                                      </div>
                                      {getResourceEntries(product, dept.key, s.code).map((entry, idx) => {
                                        const isNeedRow = idx === RESOURCE_PLAN_ROWS - 1;
                                        const isActiveResource = String(entry?.name || "").trim() && Number(entry?.percent || 0) >= 10;
                                        return (
                                          <div key={`${dept.key}-${s.code}-${idx}`} className={`resource-plan-row${isNeedRow ? " is-need" : ""}${!isNeedRow && !isActiveResource ? " is-muted" : ""}`}>
                                            {isNeedRow ? (
                                              <span className="need-label">Need</span>
                                            ) : (
                                              <input
                                                className={`resource-input${isNamedRowOverloaded(entry, dept.key, s.code, globalNamedTotalsBySprint) ? " is-overloaded-name" : ""}`}
                                                value={entry.name || ""}
                                                disabled={isDeliveredSprint}
                                                onChange={(e) =>
                                                  updateResourcePlanEntry(vs.id, team.id, product.id, dept.key, s.code, idx, "name", e.target.value)
                                                }
                                                placeholder={`Name ${idx + 1}`}
                                              />
                                            )}
                                            <input
                                              type="number"
                                              className={`resource-pct-input${isNeedRow ? " need-pct" : ""}`}
                                              min="0"
                                              max="100"
                                              step="10"
                                              value={entry.percent ?? 0}
                                              disabled={isDeliveredSprint}
                                              onChange={(e) =>
                                                updateResourcePlanEntry(vs.id, team.id, product.id, dept.key, s.code, idx, "percent", e.target.value)
                                              }
                                            />
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      ))}
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid-footer">
          <button type="button" className="add-vs-btn-footer" onClick={addValueStream}>+ Add Value Stream</button>
        </div>
      </div>

      {fullScreenSprintCode ? (
        <div className="sprint-fullscreen-overlay" onClick={() => setFullScreenSprintCode(null)}>
          <div className="sprint-fullscreen-panel" onClick={(e) => e.stopPropagation()}>
            <div className="sprint-fullscreen-head">
              <div>
                <div className="sprint-fullscreen-title">{fullScreenSprintCode}</div>
                <div className="sprint-fullscreen-date">{SPRINT_DATE_MAP[fullScreenSprintCode] || ""}</div>
              </div>
              <button type="button" className="sprint-fullscreen-close" onClick={() => setFullScreenSprintCode(null)}>
                Close
              </button>
            </div>

            <div className="sprint-fullscreen-body">
              {fullScreenSprintData.length === 0 ? (
                <div className="sprint-empty">No assigned resources in this sprint.</div>
              ) : (
                fullScreenSprintData.map((vs) => (
                  <section key={vs.id} className="fs-vs-block">
                    <h2 className="fs-vs-name">{vs.name}</h2>
                    {vs.teams.map((team) => (
                      <div key={team.id} className="fs-team-block">
                        <h3 className="fs-team-name">{team.name}</h3>
                        {team.products.map((product) => (
                          <div key={product.id} className="fs-product-block">
                            <div className="fs-product-name">{product.name}</div>
                            <div className="fs-dept-grid">
                              {product.departments.map((dept) => (
                                <div key={`${product.id}-${dept.key}`} className="fs-dept-card">
                                  <div className="fs-dept-title">{dept.key} - {dept.label}</div>
                                  {dept.rows.map((row, idx) => (
                                    <div key={`${product.id}-${dept.key}-${idx}`} className={`fs-row${row.isNeed ? " is-need" : ""}`}>
                                      <span>{row.name}</span>
                                      <strong>{row.percent}%</strong>
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </section>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}

      {nameDialog.open ? (
        <div className="name-dialog-overlay" onClick={closeNameDialog}>
          <div className="name-dialog-panel" onClick={(e) => e.stopPropagation()}>
            <div className="name-dialog-head">
              <div className="name-dialog-eyebrow">Planner Update</div>
              <h3>{nameDialog.title}</h3>
              <p>Use clear naming so reporting and sprint insights remain consistent.</p>
            </div>

            <form
              className="name-dialog-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleNameDialogSave();
              }}
            >
              <label htmlFor="nameDialogInput">{nameDialog.label}</label>
              <input
                id="nameDialogInput"
                value={nameDialog.value}
                onChange={(e) => setNameDialog((prev) => ({ ...prev, value: e.target.value }))}
                placeholder={nameDialog.placeholder}
                autoFocus
              />

              <div className="name-dialog-actions">
                <button type="button" className="name-dialog-btn ghost" onClick={closeNameDialog}>Cancel</button>
                <button type="submit" className="name-dialog-btn primary" disabled={!String(nameDialog.value || "").trim()}>
                  {nameDialog.submitLabel}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {confirmDialog.open ? (
        <div className="name-dialog-overlay" onClick={closeConfirmDialog}>
          <div className="name-dialog-panel" onClick={(e) => e.stopPropagation()}>
            <div className="name-dialog-head">
              <div className="name-dialog-eyebrow">Confirmation</div>
              <h3>{confirmDialog.title}</h3>
              <p>{confirmDialog.message}</p>
            </div>

            <div className="name-dialog-form">
              <div className="name-dialog-actions">
                <button type="button" className="name-dialog-btn ghost" onClick={closeConfirmDialog}>Cancel</button>
                <button type="button" className="name-dialog-btn danger" onClick={handleConfirmDialogProceed}>
                  {confirmDialog.confirmLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {doneSprintDialog.open ? (
        <div className="name-dialog-overlay" onClick={closeDoneSprintDialog}>
          <div className="name-dialog-panel" onClick={(e) => e.stopPropagation()}>
            <div className="name-dialog-head">
              <div className="name-dialog-eyebrow">Product Done</div>
              <h3>Set Done-From Sprint</h3>
              <p>{doneSprintDialog.productName}: choose the sprint from which this product is considered done.</p>
            </div>

            <form
              className="name-dialog-form"
              onSubmit={(e) => {
                e.preventDefault();
                saveDoneSprintDialog();
              }}
            >
              <label htmlFor="doneSprintSelect">Sprint Code</label>
              <select
                id="doneSprintSelect"
                value={doneSprintDialog.value}
                onChange={(e) => setDoneSprintDialog((prev) => ({ ...prev, value: e.target.value }))}
                autoFocus
              >
                {ALL_SPRINT_CODES.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>

              <div className="name-dialog-actions">
                <button type="button" className="name-dialog-btn ghost" onClick={closeDoneSprintDialog}>Cancel</button>
                <button type="submit" className="name-dialog-btn primary">Apply</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
