import React, { useMemo, useState, useCallback } from "react";

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
  { key: "AR", label: "Architect" },
  { key: "PA", label: "P - APP" },
];

const QUARTER_TEMPLATE = [
  { id: "Q1", label: "Q1 - Jan to Mar", sprints: ["IT-01-01", "IT-01-02", "IT-02-01", "IT-02-02", "IT-03-01", "IT-03-02", "IT-03-03"] },
  { id: "Q2", label: "Q2 - Apr to Jun", sprints: ["IT-04-01", "IT-04-02", "IT-05-01", "IT-05-02", "IT-06-01", "IT-06-02"] },
  { id: "Q3", label: "Q3 - Jul to Sep", sprints: ["IT-07-01", "IT-07-02", "IT-08-01", "IT-08-02", "IT-09-01", "IT-09-02", "IT-09-03"] },
  { id: "Q4", label: "Q4 - Oct to Dec", sprints: ["IT-10-01", "IT-10-02", "IT-11-01", "IT-11-02", "IT-12-01", "IT-12-02"] },
];

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

function createProduct(name, pattern = { DS: 0, DD: 0, VA: 0, PO: 0, SC: 0, AR: 0, PA: 0 }) {
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
        createProduct("Sustainment", { DS: 70, DD: 90, VA: 70, PO: 100, SC: 50, AR: 20, PA: 15 }),
        createProduct("FIA", { DS: 0, DD: 30, VA: 0, PO: 30, SC: 0, AR: 10, PA: 0 }),
        createProduct("ME/MW Furnace DeCoke", { DS: 0, DD: 20, VA: 0, PO: 50, SC: 10, AR: 15, PA: 10 }),
      ]),
    ],
  };
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
        AR: Number(raw.AR || 0),
        PA: Number(raw.PA || 0),
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
      return [yr, normalizedStreams];
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

function parsePct(raw) {
  const num = Number(String(raw).replace("%", ""));
  if (Number.isNaN(num) || num < 0) return 0;
  if (num > 300) return 300;
  return Math.round(num);
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

function ResourceGroup({ totals, needs, onToggleResource, isResourceOpen }) {
  return (
    <div className="pct-edit-wrap">
      {DEPARTMENTS.map((dept) => (
        <button
          key={dept.key}
          type="button"
          className={`pct-edit-line pct-chip${isResourceOpen(dept.key) ? " is-open" : ""}${needs?.[dept.key] ? " has-need" : ""}`}
          onClick={() => onToggleResource(dept.key)}
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

  const allSprints = useMemo(
    () => QUARTER_TEMPLATE.flatMap((q) => q.sprints.map((s) => ({ code: s, quarter: q.id }))),
    []
  );

  const currentSprints = useMemo(() => {
    if (selectedSprints.size === 0) return allSprints;
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
  const teamCount = useMemo(
    () => streams.reduce((sum, vs) => sum + (Array.isArray(vs.teams) ? vs.teams.length : 0), 0),
    [streams]
  );

  const updateCurrentYear = useCallback(
    (updater) => {
      setDataByYear((prev) => {
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
    setDataByYear(nextByYear);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextByYear));
  }, []);

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

  const addValueStream = useCallback(() => {
    const name = window.prompt("Value Stream name");
    if (!name || !name.trim()) return;
    updateCurrentYear((rows) => [...rows, { id: nextId("vs"), name: name.trim(), expanded: true, teams: [] }]);
  }, [updateCurrentYear]);

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

  const resetWorkbookModel = useCallback(() => {
    if (!window.confirm("Reset all years back to the one-team Excel template?")) return;
    replaceAllYears(normalizeDataByYear(null));
  }, [replaceAllYears]);

  const editValueStream = useCallback(
    (vsId, currentName) => {
      const name = window.prompt("Edit Value Stream", currentName);
      if (!name || !name.trim()) return;
      updateCurrentYear((rows) => rows.map((vs) => (vs.id === vsId ? { ...vs, name: name.trim() } : vs)));
    },
    [updateCurrentYear]
  );

  const removeValueStream = useCallback(
    (vsId) => {
      if (!window.confirm("Remove this Value Stream?")) return;
      updateCurrentYear((rows) => rows.filter((vs) => vs.id !== vsId));
    },
    [updateCurrentYear]
  );

  const addTeam = useCallback(
    (vsId) => {
      const name = window.prompt("Team name");
      if (!name || !name.trim()) return;
      updateCurrentYear((rows) =>
        rows.map((vs) =>
          vs.id !== vsId ? vs : { ...vs, teams: [...vs.teams, { id: nextId("team"), name: name.trim(), expanded: true, products: [] }] }
        )
      );
    },
    [updateCurrentYear]
  );

  const editTeam = useCallback(
    (vsId, teamId, currentName) => {
      const name = window.prompt("Edit Team", currentName);
      if (!name || !name.trim()) return;
      updateCurrentYear((rows) =>
        rows.map((vs) =>
          vs.id !== vsId
            ? vs
            : {
                ...vs,
                teams: vs.teams.map((t) => (t.id === teamId ? { ...t, name: name.trim() } : t)),
              }
        )
      );
    },
    [updateCurrentYear]
  );

  const removeTeam = useCallback(
    (vsId, teamId) => {
      if (!window.confirm("Remove this Team?")) return;
      updateCurrentYear((rows) =>
        rows.map((vs) =>
          vs.id !== vsId ? vs : { ...vs, teams: vs.teams.filter((t) => t.id !== teamId) }
        )
      );
    },
    [updateCurrentYear]
  );

  const addProduct = useCallback(
    (vsId, teamId) => {
      const name = window.prompt("Product name");
      if (!name || !name.trim()) return;
      updateCurrentYear((rows) =>
        rows.map((vs) =>
          vs.id !== vsId
            ? vs
            : {
                ...vs,
                teams: vs.teams.map((t) =>
                  t.id !== teamId ? t : { ...t, products: [...t.products, createProduct(name.trim())] }
                ),
              }
        )
      );
    },
    [updateCurrentYear]
  );

  const editProduct = useCallback(
    (vsId, teamId, productId, currentName) => {
      const name = window.prompt("Edit Product", currentName);
      if (!name || !name.trim()) return;
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
                        products: t.products.map((p) => (p.id === productId ? { ...p, name: name.trim() } : p)),
                      }
                ),
              }
        )
      );
    },
    [updateCurrentYear]
  );

  const removeProduct = useCallback(
    (vsId, teamId, productId) => {
      if (!window.confirm("Remove this Product?")) return;
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
    [updateCurrentYear]
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
    [updateCurrentYear]
  );

  const toggleResourceRow = useCallback((yearKey, productId, deptKey) => {
    const key = `${yearKey}-${productId}-${deptKey}`;
    setOpenResourceRows((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

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
        <span className="zoom-helper">Zoom rule: previous sprint + selected sprint + next 3 sprints</span>
        <button type="button" className="add-vs-btn" onClick={scaleTeamsFromTemplate}>Scale to 20 Teams</button>
        <button type="button" className="add-vs-btn" onClick={resetWorkbookModel}>Reset Template</button>
        <span className="pill">Teams: {teamCount}</span>
      </div>

      <div className="grid-root">
        <div className="grid-scroll">
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
                  <th key={s.code} className={`th-sprint ${sprintToneClass(s.code)}${s.code === CURRENT_SPRINT_CODE ? " th-current" : ""}${selectedSprints.has(s.code) ? " sprint-selected" : ""}`} onClick={() => toggleSprintSelection(s.code)} style={{cursor: 'pointer'}}>
                    {s.code}
                  </th>
                ))}
              </tr>

              <tr>
                <th className="th-dept sticky-col">Parameters: DS, DD, VA, PO, SC, Architect, P-APP</th>
                {currentSprints.map((s) => (
                  <th key={s.code} className={`th-dept-fill ${sprintToneClass(s.code)}`} />
                ))}
              </tr>
            </thead>

            <tbody>
              {streams.map((vs) => (
                <React.Fragment key={vs.id}>
                  <tr className="vs-row">
                    <td className="vs-cell sticky-col">
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
                          {!vs.expanded && (
                            <div className="vs-rollup-line">
                              {DEPARTMENTS.map((dept) => (
                                <span key={dept.key} className={`vs-rollup-item${needFlags[dept.key] ? " has-need" : ""}`} title={`${dept.label} total`}>
                                  <strong>{dept.key}</strong>
                                  <em>{Math.round(totals[dept.key])}%</em>
                                  {needFlags[dept.key] ? <i className="need-dot" aria-label="Need detected" /> : null}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {vs.expanded && vs.teams.map((team) => (
                    <React.Fragment key={team.id}>
                      <tr className="team-row">
                        <td className="team-cell sticky-col">
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
                                {DEPARTMENTS.map((dept) => (
                                  <span key={dept.key} className={`vs-rollup-item${teamNeedFlags[dept.key] ? " has-need" : ""}`} title={`${dept.label} total`}>
                                    <strong>{dept.key}</strong>
                                    <em>{Math.round(teamTotals[dept.key])}%</em>
                                    {teamNeedFlags[dept.key] ? <i className="need-dot" aria-label="Need detected" /> : null}
                                  </span>
                                ))}
                              </div>
                            </td>
                          );
                        })}
                      </tr>

                      {team.expanded && team.products.map((product) => (
                        <React.Fragment key={product.id}>
                          <tr className="product-row">
                            <td className="product-cell sticky-col">
                              <span className="indent level-product" />
                              <span className="name-product">{product.name}</span>
                              <span className="row-actions">
                                <button type="button" className="icon-btn" onClick={() => editProduct(vs.id, team.id, product.id, product.name)} title="Edit Product">✎</button>
                                <button type="button" className="icon-btn danger" onClick={() => removeProduct(vs.id, team.id, product.id)} title="Remove Product">✕</button>
                              </span>
                            </td>

                            {currentSprints.map((s) => (
                              <td key={s.code} className={`data-cell ${sprintToneClass(s.code)}${s.code === CURRENT_SPRINT_CODE ? " current-col" : ""}`}>
                                <ResourceGroup
                                  totals={Object.fromEntries(DEPARTMENTS.map((dept) => [dept.key, getProductDeptPercent(product, dept.key, s.code)]))}
                                  needs={Object.fromEntries(DEPARTMENTS.map((dept) => [dept.key, getProductNeedPercent(product, dept.key, s.code) > 0]))}
                                  onToggleResource={(deptKey) => toggleResourceRow(year, product.id, deptKey)}
                                  isResourceOpen={(deptKey) => Boolean(openResourceRows[`${year}-${product.id}-${deptKey}`])}
                                />
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
                                  <strong>{dept.label}</strong>
                                  <span className="resource-hint">Enter names for each sprint</span>
                                </td>
                                {currentSprints.map((s) => (
                                  <td key={s.code} className={`resource-input-cell ${sprintToneClass(s.code)}${s.code === CURRENT_SPRINT_CODE ? " current-col" : ""}`}>
                                    <div className="resource-plan-grid">
                                      <div className="resource-plan-head">
                                        <span>Name</span>
                                        <span>%</span>
                                      </div>
                                      {getResourceEntries(product, dept.key, s.code).map((entry, idx) => {
                                        const isNeedRow = idx === RESOURCE_PLAN_ROWS - 1;
                                        return (
                                          <div key={`${dept.key}-${s.code}-${idx}`} className={`resource-plan-row${isNeedRow ? " is-need" : ""}`}>
                                            {isNeedRow ? (
                                              <span className="need-label">Need</span>
                                            ) : (
                                              <input
                                                className="resource-input"
                                                value={entry.name || ""}
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
                                              max="300"
                                              value={entry.percent ?? 0}
                                              onChange={(e) =>
                                                updateResourcePlanEntry(vs.id, team.id, product.id, dept.key, s.code, idx, "percent", e.target.value)
                                              }
                                            />
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </td>
                                ))}
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
    </div>
  );
}
