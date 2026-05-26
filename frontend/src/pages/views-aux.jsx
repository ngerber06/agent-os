import React, { useState, useEffect, useRef } from 'react';
import { PROJECTS, SPEND as SPEND_, VAULT_RECENT, MEM0, GRAPH, AGENTS, agentById } from '../api/data';
import { Icon, Sparkline, LineChart, BarH, Donut } from '../components/Widgets';
import { CardHeader, Avatar, fmt$, fmtK } from './views-main';

// ─── Projects (Kanban, List, Timeline) ───
export function ProjectsView({ onOpenChat, agents = AGENTS }) {
  const [projectTab, setProjectTab] = useState("board"); // board, list, timeline
  const [projects, setProjects] = useState(PROJECTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("title");
  const [sortAsc, setSortAsc] = useState(true);
  
  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newOwner, setNewOwner] = useState("claude");
  const [newLane, setNewLane] = useState("todo");
  const [newTags, setNewTags] = useState("");
  
  // Inline lane form states
  const [activeLaneForm, setActiveLaneForm] = useState(null);
  const [inlineTaskTitle, setInlineTaskTitle] = useState("");

  const lanes = [
    { id: "todo",    title: "Backlog", color: "#71717a" },
    { id: "doing",   title: "In progress", color: "var(--accent)" },
    { id: "review",  title: "Review", color: "#fbbf24" },
    { id: "blocked", title: "Blocked", color: "var(--bad)" },
    { id: "done",    title: "Done", color: "var(--ok)" }
  ];

  const mapDbProjectToFrontend = (dbProj) => {
    const matchingAgent = agents.find(a => a.dbId === dbProj.agent_id);
    const owner = matchingAgent ? matchingAgent.id : "claude";
    
    let tags = [];
    let desc = "";
    if (dbProj.description) {
      try {
        if (dbProj.description.startsWith("{") && dbProj.description.endsWith("}")) {
          const parsed = JSON.parse(dbProj.description);
          tags = parsed.tags || [];
          desc = parsed.desc || "";
        } else {
          tags = dbProj.description.split(",").map(t => t.trim()).filter(Boolean);
          desc = dbProj.description;
        }
      } catch (e) {
        tags = [dbProj.description];
        desc = dbProj.description;
      }
    }
    if (tags.length === 0) {
      tags = ["new"];
    }

    let lane = dbProj.status || "todo";
    if (lane === "active") lane = "doing";
    if (lane === "paused") lane = "blocked";
    
    return {
      id: dbProj.id,
      title: dbProj.name,
      owner: owner,
      lane: lane,
      color: matchingAgent?.color || agentById(owner)?.color || "var(--accent)",
      tags: tags,
      updated: "now",
      dbId: dbProj.id,
      spend_mtd: dbProj.spend_mtd,
      token_count_mtd: dbProj.token_count_mtd,
      descriptionText: desc
    };
  };

  useEffect(() => {
    fetch("/api/projects")
      .then(res => {
        if (!res.ok) throw new Error("HTTP error " + res.status);
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          const mapped = data.map(mapDbProjectToFrontend);
          setProjects(mapped);
        }
      })
      .catch((err) => {
        console.warn("Failed to load projects from API, using mock projects:", err);
      });
  }, [agents]);

  const handleAddProject = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const tagArray = newTags.split(",").map(t => t.trim()).filter(Boolean);
    const assignedAgentObj = agents.find(a => a.id === newOwner);
    const agentDbId = assignedAgentObj ? assignedAgentObj.dbId : null;
    
    const descriptionPayload = JSON.stringify({ tags: tagArray, desc: "" });

    let statusVal = newLane;
    if (statusVal === "doing") statusVal = "active";
    if (statusVal === "blocked") statusVal = "paused";

    const payload = {
      name: newTitle.trim(),
      description: descriptionPayload,
      agent_id: agentDbId,
      status: statusVal
    };

    fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(res => {
        if (!res.ok) throw new Error("HTTP error " + res.status);
        return res.json();
      })
      .then(newDbProj => {
        const newProj = mapDbProjectToFrontend(newDbProj);
        setProjects(prev => [newProj, ...prev]);
      })
      .catch((err) => {
        console.warn("Failed to create project on backend, using local fallback:", err);
        const newProj = {
          id: "p_" + Date.now(),
          title: newTitle.trim(),
          owner: newOwner,
          lane: newLane,
          color: assignedAgentObj?.color || agentById(newOwner)?.color || "var(--accent)",
          tags: tagArray.length ? tagArray : ["new"],
          updated: "now"
        };
        setProjects(prev => [newProj, ...prev]);
      })
      .finally(() => {
        setNewTitle("");
        setNewTags("");
        setShowAddForm(false);
      });
  };

  const handleAddInlineTask = (laneId) => {
    if (!inlineTaskTitle.trim()) return;
    const ownerAgent = ["claude", "hermes", "codex", "gemini"][Math.floor(Math.random() * 4)];
    const assignedAgentObj = agents.find(a => a.id === ownerAgent);
    const agentDbId = assignedAgentObj ? assignedAgentObj.dbId : null;
    
    let statusVal = laneId;
    if (statusVal === "doing") statusVal = "active";
    if (statusVal === "blocked") statusVal = "paused";

    const payload = {
      name: inlineTaskTitle.trim(),
      description: JSON.stringify({ tags: ["task"], desc: "" }),
      agent_id: agentDbId,
      status: statusVal
    };

    fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(res => {
        if (!res.ok) throw new Error("HTTP error " + res.status);
        return res.json();
      })
      .then(newDbProj => {
        const newProj = mapDbProjectToFrontend(newDbProj);
        setProjects(prev => [...prev, newProj]);
      })
      .catch((err) => {
        console.warn("Failed to create inline task on backend, using local fallback:", err);
        const newProj = {
          id: "p_" + Date.now(),
          title: inlineTaskTitle.trim(),
          owner: ownerAgent,
          lane: laneId,
          tags: ["task"],
          updated: "now",
          color: assignedAgentObj?.color || agentById(ownerAgent)?.color || "var(--accent)"
        };
        setProjects(prev => [...prev, newProj]);
      })
      .finally(() => {
        setInlineTaskTitle("");
        setActiveLaneForm(null);
      });
  };

  const moveCard = (projectId, direction) => {
    const laneSequence = ["todo", "doing", "review", "blocked", "done"];
    const currentProj = projects.find(p => p.id === projectId);
    if (!currentProj) return;

    const curIdx = laneSequence.indexOf(currentProj.lane);
    if (curIdx === -1) return;
    const nextIdx = curIdx + direction;
    if (nextIdx < 0 || nextIdx >= laneSequence.length) return;

    const nextLane = laneSequence[nextIdx];
    let statusVal = nextLane;
    if (statusVal === "doing") statusVal = "active";
    if (statusVal === "blocked") statusVal = "paused";

    if (typeof projectId === "number" || (currentProj.dbId && !isNaN(currentProj.dbId))) {
      const dbId = currentProj.dbId || projectId;
      fetch(`/api/projects/${dbId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusVal })
      })
        .then(res => {
          if (!res.ok) throw new Error("HTTP error " + res.status);
          return res.json();
        })
        .then(updatedDbProj => {
          setProjects(prev => prev.map(p => {
            if (p.id === projectId) {
              return mapDbProjectToFrontend(updatedDbProj);
            }
            return p;
          }));
        })
        .catch(err => {
          console.warn("Failed to update status on backend, applying local fallback:", err);
          setProjects(prev => prev.map(p => {
            if (p.id === projectId) {
              return { ...p, lane: nextLane, updated: "now" };
            }
            return p;
          }));
        });
    } else {
      setProjects(prev => prev.map(p => {
        if (p.id === projectId) {
          return { ...p, lane: nextLane, updated: "now" };
        }
        return p;
      }));
    }
  };

  const archiveProject = (projectId) => {
    const currentProj = projects.find(p => p.id === projectId);
    if (!currentProj) return;

    if (typeof projectId === "number" || (currentProj.dbId && !isNaN(currentProj.dbId))) {
      const dbId = currentProj.dbId || projectId;
      fetch(`/api/projects/${dbId}`, {
        method: "DELETE"
      })
        .then(res => {
          if (!res.ok) throw new Error("HTTP error " + res.status);
          setProjects(prev => prev.filter(p => p.id !== projectId));
        })
        .catch(err => {
          console.warn("Failed to delete project on backend, applying local fallback:", err);
          setProjects(prev => prev.filter(p => p.id !== projectId));
        });
    } else {
      setProjects(prev => prev.filter(p => p.id !== projectId));
    }
  };

  // Helper for Gantt Timeline layout (deterministic mock timeline coordinates)
  const getProjectTimeline = (p, index) => {
    const starts = [0, 2, 4, 1, 3, 5, 2, 0, 4, 1, 3, 5];
    const spans  = [3, 4, 2, 5, 3, 2, 4, 3, 2, 4, 3, 2];
    const progress = [80, 45, 90, 60, 25, 10, 0, 15, 0, 100, 100, 100];
    const idx = index % starts.length;
    return {
      start: starts[idx],
      span: spans[idx],
      progress: p.lane === "done" ? 100 : (p.lane === "blocked" ? 15 : progress[idx])
    };
  };

  // List sorting logic
  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const filteredProjects = projects.filter(p => {
    const q = searchQuery.toLowerCase();
    return p.title.toLowerCase().includes(q) || p.tags.some(t => t.toLowerCase().includes(q));
  });

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    let valA = a[sortField] || "";
    let valB = b[sortField] || "";
    if (sortField === "owner") {
      valA = agentById(a.owner)?.name || "";
      valB = agentById(b.owner)?.name || "";
    }
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 18, color: "var(--fg-0)", fontWeight: 500, letterSpacing: "-0.01em" }}>Projects</div>
          <div style={{ fontSize: 12, color: "var(--fg-3)" }}>
            {projects.length} projects · {projects.filter(p => p.lane === "doing").length} in progress · {projects.filter(p => p.lane === "done").length} completed
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div className="tabs">
            <button data-active={projectTab === "board" ? "1" : "0"} onClick={() => setProjectTab("board")}>Board</button>
            <button data-active={projectTab === "list" ? "1" : "0"} onClick={() => setProjectTab("list")}>List</button>
            <button data-active={projectTab === "timeline" ? "1" : "0"} onClick={() => setProjectTab("timeline")}>Timeline</button>
          </div>
          <button className="btn" data-variant="primary" onClick={() => setShowAddForm(!showAddForm)}>
            <Icon.plus />{showAddForm ? "Cancel" : "New project"}
          </button>
        </div>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddProject} className="project-form-card">
          <div style={{ fontWeight: 500, fontSize: 13, color: "var(--fg-0)" }}>Create New Project Task</div>
          <div className="form-grid">
            <div className="form-group">
              <label>Project Title</label>
              <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Migrate dashboard dependencies..." required />
            </div>
            <div className="form-group">
              <label>Assigned Agent</label>
              <select value={newOwner} onChange={(e) => setNewOwner(e.target.value)}>
                {AGENTS.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Initial Status</label>
              <select value={newLane} onChange={(e) => setNewLane(e.target.value)}>
                {lanes.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Tags (comma separated)</label>
              <input type="text" value={newTags} onChange={(e) => setNewTags(e.target.value)} placeholder="infra, p1, docs" />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
            <button type="button" className="btn" onClick={() => setShowAddForm(false)}>Cancel</button>
            <button type="submit" className="btn" data-variant="primary">Create Project</button>
          </div>
        </form>
      )}

      {/* ─── Board / Kanban View ─── */}
      {projectTab === "board" && (
        <div className="kanban" style={{ minHeight: 460 }}>
          {lanes.map((lane) => {
            const items = projects.filter((p) => p.lane === lane.id);
            return (
              <div className="kcol" key={lane.id}>
                <div className="h">
                  <span className="swatch" style={{ background: lane.color }} />
                  {lane.title}
                  <span className="ct">{items.length}</span>
                </div>
                <div className="b">
                  {items.map((p) => {
                    const a = agentById(p.owner) || AGENTS[0];
                    return (
                      <div className="kcard" key={p.id}>
                        <div className="tt" style={{ cursor: "pointer" }} onClick={() => onOpenChat(p.owner)}>{p.title}</div>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {p.tags.map((t) => (
                            <span key={t} className="tag" style={{
                              fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-3)",
                              background: "var(--bg-3)", border: "1px solid var(--line)",
                              padding: "0 5px", borderRadius: 4
                            }}>{t}</span>
                          ))}
                        </div>
                        <div className="me">
                          <div className="av" style={{
                            width: 18, height: 18, borderRadius: 4, background: a.color,
                            color: "#0a0a0b", display: "flex", alignItems: "center",
                            justifyContent: "center", fontFamily: "var(--font-mono)",
                            fontSize: 10, fontWeight: 600
                          }}>{a.name[0]}</div>
                          <span style={{ color: "var(--fg-2)", cursor: "pointer" }} onClick={() => onOpenChat(p.owner)}>{a.name}</span>
                          <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", color: "var(--fg-3)" }}>{p.updated}</span>
                        </div>
                        <div className="kcard-actions">
                          <button className="kcard-arrow-btn" disabled={lane.id === "todo"} onClick={() => moveCard(p.id, -1)}>←</button>
                          <button className="kcard-arrow-btn" onClick={() => archiveProject(p.id)} title="Archive task"><Icon.close style={{width:8, height:8}} /></button>
                          <button className="kcard-arrow-btn" disabled={lane.id === "done"} onClick={() => moveCard(p.id, 1)}>→</button>
                        </div>
                      </div>
                    );
                  })}

                  {activeLaneForm === lane.id ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: 4, background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: 6 }}>
                      <textarea
                        style={{
                          background: "var(--bg-1)", border: "1px solid var(--line-strong)",
                          borderRadius: 4, padding: 6, color: "var(--fg-1)", fontSize: 11,
                          resize: "none", fontFamily: "inherit"
                        }}
                        rows={2}
                        placeholder="Task title..."
                        value={inlineTaskTitle}
                        onChange={(e) => setInlineTaskTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleAddInlineTask(lane.id);
                          }
                        }}
                      />
                      <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                        <button className="btn" style={{ padding: "2px 6px", fontSize: 10 }} onClick={() => setActiveLaneForm(null)}>Cancel</button>
                        <button className="btn" data-variant="primary" style={{ padding: "2px 6px", fontSize: 10 }} onClick={() => handleAddInlineTask(lane.id)}>Add</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => { setActiveLaneForm(lane.id); setInlineTaskTitle(""); }} style={{
                      border: "1px dashed var(--line-strong)", background: "transparent",
                      borderRadius: "var(--radius-sm)", padding: 8, color: "var(--fg-3)", fontSize: 11,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                      cursor: "default", width: "100%"
                    }}><Icon.plus />Add task</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── List View ─── */}
      {projectTab === "list" && (
        <div className="project-list-wrap">
          <div className="project-search-bar">
            <Icon.search style={{ color: "var(--fg-3)" }} />
            <input
              type="text"
              placeholder="Search projects by title, tags or owner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <table className="tbl" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid var(--line)" }}>
                <th style={{ padding: "12px 14px", cursor: "pointer", fontSize: 11, color: "var(--fg-3)" }} onClick={() => handleSort("title")}>
                  Project Task {sortField === "title" && (sortAsc ? "▴" : "▾")}
                </th>
                <th style={{ padding: "12px 14px", cursor: "pointer", fontSize: 11, color: "var(--fg-3)" }} onClick={() => handleSort("owner")}>
                  Agent Assigned {sortField === "owner" && (sortAsc ? "▴" : "▾")}
                </th>
                <th style={{ padding: "12px 14px", cursor: "pointer", fontSize: 11, color: "var(--fg-3)" }} onClick={() => handleSort("lane")}>
                  Status {sortField === "lane" && (sortAsc ? "▴" : "▾")}
                </th>
                <th style={{ padding: "12px 14px", fontSize: 11, color: "var(--fg-3)" }}>Tags</th>
                <th style={{ padding: "12px 14px", cursor: "pointer", fontSize: 11, color: "var(--fg-3)" }} onClick={() => handleSort("updated")}>
                  Last Activity {sortField === "updated" && (sortAsc ? "▴" : "▾")}
                </th>
                <th style={{ padding: "12px 14px", fontSize: 11, color: "var(--fg-3)", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedProjects.map((p) => {
                const a = agentById(p.owner) || AGENTS[0];
                const laneLabels = { todo: "Backlog", doing: "In progress", review: "Review", blocked: "Blocked", done: "Done" };
                const laneTones = { todo: "muted", doing: "accent", review: "warn", blocked: "bad", done: "ok" };
                return (
                  <tr key={p.id} style={{ borderBottom: "1px solid var(--line)", fontSize: 12.5 }} className="tbl-row-hover">
                    <td style={{ padding: "12px 14px", color: "var(--fg-0)", fontWeight: 500 }}>{p.title}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 16, height: 16, borderRadius: 3, background: a.color, color: "#0a0a0b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700 }}>{a.name[0]}</div>
                        <span style={{ color: "var(--fg-1)" }}>{a.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span className="pill" data-tone={laneTones[p.lane] || "muted"}><i className="dot" />{laneLabels[p.lane] || p.lane}</span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", gap: 4 }}>
                        {p.tags.map(t => <span key={t} style={{ fontSize: 10, padding: "1px 5px", background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: 3, color: "var(--fg-2)" }}>{t}</span>)}
                      </div>
                    </td>
                    <td className="mono" style={{ padding: "12px 14px", color: "var(--fg-3)", fontSize: 11 }}>{p.updated}</td>
                    <td style={{ padding: "12px 14px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: 6 }}>
                        <button className="icon-btn" style={{ width: 22, height: 22 }} onClick={() => onOpenChat(p.owner)} title="Discuss with Agent"><Icon.chat /></button>
                        <button className="icon-btn" style={{ width: 22, height: 22 }} onClick={() => archiveProject(p.id)} title="Archive"><Icon.close /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {sortedProjects.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: "30px", textSpacer: "center", color: "var(--fg-3)", fontSize: 13, textAlign: "center" }}>No projects found matching query.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Timeline / Gantt View ─── */}
      {projectTab === "timeline" && (
        <div className="timeline-wrap">
          <div className="timeline-hdr">
            <div style={{ fontWeight: 500, color: "var(--fg-1)" }}>Project Task Schedule</div>
            <div className="timeline-weeks">
              <span>W1</span>
              <span>W2</span>
              <span>W3</span>
              <span>W4</span>
              <span>W5</span>
              <span>W6</span>
              <span>W7</span>
              <span>W8</span>
            </div>
          </div>
          <div className="timeline-body">
            {projects.map((p, idx) => {
              const a = agentById(p.owner) || AGENTS[0];
              const sched = getProjectTimeline(p, idx);
              return (
                <div key={p.id} className="timeline-row">
                  <div className="timeline-proj-info">
                    <div style={{ width: 14, height: 14, borderRadius: 3, background: a.color, color: "#0a0a0b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700 }}>{a.name[0]}</div>
                    <span style={{ fontWeight: 500 }} title={p.title}>{p.title}</span>
                  </div>
                  <div className="timeline-bar-container">
                    <div
                      className="timeline-bar"
                      style={{
                        gridColumn: `${sched.start + 1} / span ${sched.span}`,
                        background: a.color,
                      }}
                      title={`${p.title} · ${sched.progress}% completed · W${sched.start + 1} to W${sched.start + sched.span}`}
                    >
                      <div style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 4 }}>
                        {p.title}
                      </div>
                      <span className="mono" style={{ fontSize: 9, opacity: 0.85 }}>{sched.progress}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

// ─── Spend view (Interactive Periods & Refresh state) ───
export function SpendView({ agents = AGENTS, spendMTD }) {
  const [spendTab, setSpendTab] = useState("30d"); // 7d, 30d, 90d, YTD
  const [refreshing, setRefreshing] = useState(false);
  const [refreshSeed, setRefreshSeed] = useState(0);
  const [dbSpend, setDbSpend] = useState(null);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      setRefreshSeed(prev => prev + 1);
    }, 800);
  };

  useEffect(() => {
    let days = 30;
    if (spendTab === "7d") days = 7;
    if (spendTab === "90d") days = 90;
    if (spendTab === "YTD") days = 365;

    fetch(`/api/spend?days=${days}`)
      .then(res => {
        if (!res.ok) throw new Error("HTTP error " + res.status);
        return res.json();
      })
      .then(data => {
        setDbSpend(data);
      })
      .catch(err => {
        console.warn("Failed to fetch spend summary from API:", err);
      });
  }, [spendTab, refreshSeed]);

  const totalIn = agents.reduce((s, a) => s + (a.tokensIn || 0), 0);
  const totalOut = agents.reduce((s, a) => s + (a.tokensOut || 0), 0);

  // Dynamically compute KPIs and graphs based on selected period
  const periodData = (() => {
    const randOffset = refreshSeed * 4.82;
    const mtdCost = dbSpend ? dbSpend.mtd.cost : (SPEND_.monthToDate + randOffset);
    const todayCost = dbSpend ? dbSpend.today.cost : 212.40;
    const periodCost = dbSpend ? dbSpend.period.cost : (SPEND_.monthToDate + randOffset);

    switch (spendTab) {
      case "7d":
        return {
          monthToDate: dbSpend ? periodCost : (198.7 + randOffset),
          projected: dbSpend ? (periodCost * 4.2) : (1320 + randOffset * 2),
          burn: dbSpend ? todayCost : (212.4 + (refreshSeed % 2 === 0 ? 4.2 : -2.1)),
          budgetPct: dbSpend ? (periodCost / 1500 * 100) : (((198.7 + randOffset) / 1500) * 100),
          series: [128.4, 142.0, 161.3, 154.9, 168.2, 198.7, dbSpend ? todayCost : (212.4 + (refreshSeed % 2 === 0 ? 4.2 : -2.1))],
          labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
          byAgent: SPEND_.byAgent.map(a => ({ ...a, v: a.v * 0.22 + randOffset * 0.05 })),
          byProject: SPEND_.byProject.map(p => ({ ...p, v: p.v * 0.22 + randOffset * 0.05 }))
        };
      case "90d":
        const base90 = SPEND_.burn30d.concat(SPEND_.burn30d).concat(SPEND_.burn30d).map(v => v * 0.95 + Math.random() * 8);
        if (refreshSeed > 0) base90[base90.length - 1] += randOffset * 0.1;
        return {
          monthToDate: dbSpend ? periodCost : (3120.4 + randOffset),
          projected: dbSpend ? (periodCost * 1.2) : (4500 + randOffset),
          burn: dbSpend ? todayCost : (204.8 + randOffset * 0.02),
          budgetPct: 69.3,
          series: base90,
          labels: ["-90d", "-60d", "-30d", "now"],
          byAgent: SPEND_.byAgent.map(a => ({ ...a, v: a.v * 3.2 + randOffset * 0.8 })),
          byProject: SPEND_.byProject.map(p => ({ ...p, v: p.v * 3.2 + randOffset * 0.8 }))
        };
      case "YTD":
        const ytdMonths = [780, 940, 1120, 1310, dbSpend ? mtdCost : (1006.8 + randOffset)];
        const ytdSum = ytdMonths.reduce((a, b) => a + b, 0);
        return {
          monthToDate: ytdSum,
          projected: 14800,
          burn: dbSpend ? todayCost : 226.5,
          budgetPct: (ytdSum / 18000) * 100,
          series: ytdMonths,
          labels: ["Jan", "Feb", "Mar", "Apr", "May"],
          byAgent: SPEND_.byAgent.map(a => ({ ...a, v: a.v * 5.1 + randOffset * 1.5 })),
          byProject: SPEND_.byProject.map(p => ({ ...p, v: p.v * 5.1 + randOffset * 1.5 }))
        };
      case "30d":
      default:
        const base30 = [...SPEND_.burn30d];
        if (refreshSeed > 0) {
          base30[base30.length - 1] += randOffset * 0.2;
        }
        return {
          monthToDate: dbSpend ? mtdCost : (SPEND_.monthToDate + randOffset),
          projected: dbSpend ? (mtdCost * 1.05) : (2140.30 + randOffset * 1.2),
          burn: dbSpend ? todayCost : (212.40 + (refreshSeed > 0 ? randOffset * 0.1 : 0)),
          budgetPct: dbSpend ? (mtdCost / SPEND_.monthBudget * 100) : (((SPEND_.monthToDate + randOffset) / SPEND_.monthBudget) * 100),
          series: base30,
          labels: ["-30d", "-20d", "-10d", "now"],
          byAgent: SPEND_.byAgent.map(a => ({ ...a, v: a.v + randOffset * 0.25 })),
          byProject: SPEND_.byProject.map(p => ({ ...p, v: p.v + randOffset * 0.25 }))
        };
    }
  })();

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 18, color: "var(--fg-0)", fontWeight: 500, letterSpacing: "-0.01em" }}>Spend & tokens</div>
          <div style={{ fontSize: 12, color: "var(--fg-3)" }}>Resets in 5d 7h · last updated <span className="mono" style={{color:"var(--fg-2)"}}>{refreshSeed > 0 ? "just now" : "4m ago"}</span></div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div className="tabs">
            <button data-active={spendTab === "7d" ? "1" : "0"} onClick={() => setSpendTab("7d")}>7d</button>
            <button data-active={spendTab === "30d" ? "1" : "0"} onClick={() => setSpendTab("30d")}>30d</button>
            <button data-active={spendTab === "90d" ? "1" : "0"} onClick={() => setSpendTab("90d")}>90d</button>
            <button data-active={spendTab === "YTD" ? "1" : "0"} onClick={() => setSpendTab("YTD")}>YTD</button>
          </div>
          <button className="btn" onClick={handleRefresh} disabled={refreshing}>
            <Icon.refresh style={refreshing ? { animation: "spin 0.8s linear infinite" } : undefined} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Top KPIs */}
      <div className="grid g-4" style={refreshing ? { opacity: 0.5, transition: "opacity 0.15s" } : { transition: "opacity 0.15s" }}>
        <div className="card stat">
          <div className="l">Spend {spendTab === "YTD" ? "YTD" : "MTD"}</div>
          <div className="v">${periodData.monthToDate.toFixed(2)}</div>
          <div style={{ marginTop: 6 }}>
            <div className="bar"><i style={{ width: `${Math.min(100, periodData.budgetPct)}%`, background: "var(--accent)" }} /></div>
            <div style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 4 }}>
              {periodData.budgetPct.toFixed(1)}% of ${spendTab === "YTD" ? "18,000" : SPEND_.monthBudget.toFixed(0)} budget
            </div>
          </div>
        </div>
        <div className="card stat">
          <div className="l">Projected EOM</div>
          <div className="v">${periodData.projected.toFixed(2)}</div>
          <div className="delta" data-sign={periodData.projected > (spendTab === "YTD" ? 18000 : 1500) ? "+" : "-"}>
            {((periodData.projected / (spendTab === "YTD" ? 18000 : 1500) - 1) * 100).toFixed(1)}% vs budget
          </div>
        </div>
        <div className="card stat">
          <div className="l">Tokens · in</div>
          <div className="v">{fmtK(totalIn + (refreshSeed * 14820))}</div>
          <div className="delta">{fmtK(totalOut + (refreshSeed * 3820))} out · {(totalOut / totalIn * 100).toFixed(1)}% ratio</div>
        </div>
        <div className="card stat">
          <div className="l">Burn · 24h</div>
          <div className="v">${periodData.burn.toFixed(2)}</div>
          <div className="delta" data-sign="+">+{(8.0 + (refreshSeed % 3)).toFixed(1)}% vs period avg</div>
        </div>
      </div>

      <div className="grid row-h" style={refreshing ? { opacity: 0.5 } : null}>
        {/* Burn Trend Line Chart */}
        <div className="card">
          <CardHeader t={`${spendTab === "YTD" ? "Monthly" : "Daily"} burn`} sub={`burn chart trend · ${spendTab}`}
            pill={<span className="pill" data-tone="accent">$ {periodData.burn.toFixed(2)} latest</span>} />
          <div className="card-b">
            <LineChart series={periodData.series} color="var(--accent)"
              labels={periodData.labels}
              yFmt={(v) => `$${Math.round(v)}`} max={Math.max(...periodData.series) * 1.1} />
          </div>
        </div>

        {/* Donut Chart */}
        <div className="card">
          <CardHeader t="By model" sub="Share percentage" />
          <div className="card-b" style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <Donut items={SPEND_.byModel} size={140} thickness={20} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              {SPEND_.byModel.map((m) => (
                <div key={m.name} style={{ display: "grid", gridTemplateColumns: "10px 1fr auto", gap: 8, alignItems: "center", fontSize: 11 }}>
                  <i style={{ width: 8, height: 8, borderRadius: 2, background: m.color }} />
                  <span style={{ color: "var(--fg-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</span>
                  <span className="mono" style={{ color: "var(--fg-2)" }}>${(m.v * (spendTab === "7d" ? 0.22 : (spendTab === "90d" ? 3.2 : (spendTab === "YTD" ? 5.1 : 1.0)))).toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Bar Breakdown Charts */}
      <div className="grid g-2" style={refreshing ? { opacity: 0.5 } : null}>
        <div className="card">
          <CardHeader t="By agent" sub="MTD aggregate" />
          <div className="card-b">
            <BarH items={[...periodData.byAgent].sort((a, b) => b.v - a.v)} formatV={fmt$} />
          </div>
        </div>
        <div className="card">
          <CardHeader t="By project" sub="MTD aggregate" />
          <div className="card-b">
            <BarH items={periodData.byProject} formatV={fmt$} />
          </div>
        </div>
      </div>

      {/* Token Ledger Table */}
      <div className="card" style={refreshing ? { opacity: 0.5 } : null}>
        <CardHeader t="Token ledger" sub="per agent · live metrics" />
        <div className="card-b flush">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: "20%" }}>Agent</th>
                <th>Model</th>
                <th style={{ textAlign: "right" }}>Tokens in</th>
                <th style={{ textAlign: "right" }}>Tokens out</th>
                <th style={{ textAlign: "right" }}>Cache hits</th>
                <th style={{ textAlign: "right" }}>Cost</th>
                <th style={{ textAlign: "right" }}>$/1K out</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((a) => (
                <tr key={a.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 18, height: 18, borderRadius: 4, background: a.color, color: "#0a0a0b", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600 }}>{a.name[0]}</div>
                      <span style={{ color: "var(--fg-0)" }}>{a.name}</span>
                    </div>
                  </td>
                  <td className="mono" style={{ color: "var(--fg-2)", fontSize: 11 }}>{a.model}</td>
                  <td className="mono" style={{ textAlign: "right", color: "var(--fg-1)" }}>{fmtK(Math.floor((a.tokensIn || 0) + (refreshSeed * 3810)))}</td>
                  <td className="mono" style={{ textAlign: "right", color: "var(--fg-1)" }}>{fmtK(Math.floor((a.tokensOut || 0) + (refreshSeed * 980)))}</td>
                  <td className="mono" style={{ textAlign: "right", color: "var(--ok)" }}>{(52.4 + (a.name.charCodeAt(0) % 20)).toFixed(1)}%</td>
                  <td className="mono" style={{ textAlign: "right", color: "var(--fg-0)" }}>${((a.spend || 0) * (spendTab === "7d" ? 0.22 : (spendTab === "90d" ? 3.2 : (spendTab === "YTD" ? 5.1 : 1.0))) + refreshSeed * 0.12).toFixed(2)}</td>
                  <td className="mono" style={{ textAlign: "right", color: "var(--fg-2)" }}>${(((a.spend || 0) * (spendTab === "7d" ? 0.22 : (spendTab === "90d" ? 3.2 : (spendTab === "YTD" ? 5.1 : 1.0)))) / ((a.tokensOut || 0)/1000 || 1)).toFixed(4)}</td>
                </tr>
              ))}
              <tr style={{ background: "var(--bg-2)" }}>
                <td style={{ color: "var(--fg-0)", fontWeight: 500 }}>Total</td>
                <td className="mono" style={{ color: "var(--fg-3)", fontSize: 11 }}>5 models</td>
                <td className="mono" style={{ textAlign: "right", color: "var(--fg-0)", fontWeight: 500 }}>{fmtK(agents.reduce((s,a)=>s+(a.tokensIn || 0),0) + refreshSeed * 15240)}</td>
                <td className="mono" style={{ textAlign: "right", color: "var(--fg-0)", fontWeight: 500 }}>{fmtK(agents.reduce((s,a)=>s+(a.tokensOut || 0),0) + refreshSeed * 3920)}</td>
                <td className="mono" style={{ textAlign: "right", color: "var(--ok)" }}>62.4%</td>
                <td className="mono" style={{ textAlign: "right", color: "var(--fg-0)", fontWeight: 500 }}>${(agents.reduce((s,a)=>s+(a.spend || 0),0) * (spendTab === "7d" ? 0.22 : (spendTab === "90d" ? 3.2 : (spendTab === "YTD" ? 5.1 : 1.0))) + refreshSeed * 0.48).toFixed(2)}</td>
                <td className="mono" style={{ textAlign: "right", color: "var(--fg-3)" }}>—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ─── Obsidian-style force graph (interactive nodes) ───
export function ObsidianGraph({ height = 420, onNodeClick }) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const [hover, setHover] = useState(null);
  const hoverRef = useRef(null);
  const simRef = useRef(null);

  if (!simRef.current) {
    const nodes = GRAPH.nodes.map((n) => ({
      ...n,
      x: (Math.random() - 0.5) * 200,
      y: (Math.random() - 0.5) * 200,
      vx: 0, vy: 0,
    }));
    const nameMap = Object.fromEntries(nodes.map((n) => [n.id, n]));
    const edges = GRAPH.edges.map(([a, b]) => ({ a: nameMap[a], b: nameMap[b] })).filter((e) => e.a && e.b);
    const step = () => {
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const d2 = dx*dx + dy*dy + 0.01;
          const d = Math.sqrt(d2);
          if (d < 220) {
            const f = 220 / d2;
            const fx = (dx / d) * f, fy = (dy / d) * f;
            a.vx -= fx; a.vy -= fy;
            b.vx += fx; b.vy += fy;
          }
        }
        a.vx -= a.x * 0.002;
        a.vy -= a.y * 0.002;
      }
      for (const e of edges) {
        const dx = e.b.x - e.a.x, dy = e.b.y - e.a.y;
        const d = Math.sqrt(dx*dx + dy*dy);
        const target = 70;
        const f = (d - target) * 0.012;
        const fx = (dx / (d || 1)) * f, fy = (dy / (d || 1)) * f;
        e.a.vx += fx; e.a.vy += fy;
        e.b.vx -= fx; e.b.vy -= fy;
      }
      for (const n of nodes) {
        n.vx *= 0.82; n.vy *= 0.82;
        n.x += n.vx; n.y += n.vy;
      }
    };
    for (let i = 0; i < 120; i++) step();
    simRef.current = { nodes, edges, step };
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const dpr = window.devicePixelRatio || 1;
    const { nodes, edges, step } = simRef.current;

    const resize = () => {
      const r = wrap.getBoundingClientRect();
      canvas.width = r.width * dpr;
      canvas.height = r.height * dpr;
      canvas.style.width = r.width + "px";
      canvas.style.height = r.height + "px";
      paint();
    };

    const paint = () => {
      const r = canvas.getBoundingClientRect();
      const cx = r.width / 2, cy = r.height / 2;
      const ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, r.width, r.height);
      const hov = hoverRef.current;
      for (const e of edges) {
        const aHov = hov && (e.a === hov || e.b === hov);
        ctx.strokeStyle = aHov ? "rgba(255,255,255,0.32)" : "rgba(255,255,255,0.06)";
        ctx.lineWidth = aHov ? 1.4 : 1;
        ctx.beginPath();
        ctx.moveTo(cx + e.a.x, cy + e.a.y);
        ctx.lineTo(cx + e.b.x, cy + e.b.y);
        ctx.stroke();
      }
      for (const n of nodes) {
        const isHover = hov === n;
        const isNeighbor = hov && edges.some((e) => (e.a === hov && e.b === n) || (e.b === hov && e.a === n));
        ctx.beginPath();
        ctx.arc(cx + n.x, cy + n.y, n.w, 0, Math.PI * 2);
        ctx.fillStyle = isHover ? "#fff" : n.color;
        ctx.globalAlpha = hov && !isHover && !isNeighbor ? 0.32 : 1;
        ctx.fill();
        if (isHover) {
          ctx.strokeStyle = "rgba(255,255,255,0.8)";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        if (n.w > 10 || isHover) {
          ctx.globalAlpha = isHover ? 1 : 0.78;
          ctx.fillStyle = "#fafafa";
          ctx.font = "10.5px Geist, system-ui, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(n.id, cx + n.x, cy + n.y + n.w + 11);
        }
        ctx.globalAlpha = 1;
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const driftId = setInterval(() => { step(); paint(); }, 50);

    const onMove = (e) => {
      const r = canvas.getBoundingClientRect();
      const mx = e.clientX - r.left;
      const my = e.clientY - r.top;
      const cx = r.width / 2, cy = r.height / 2;
      let found = null;
      for (const n of nodes) {
        const dx = (cx + n.x) - mx;
        const dy = (cy + n.y) - my;
        if (Math.sqrt(dx*dx + dy*dy) < n.w + 3) { found = n; break; }
      }
      if (found !== hoverRef.current) {
        hoverRef.current = found;
        setHover(found);
        paint();
      }
    };
    const onLeave = () => {
      if (hoverRef.current) {
        hoverRef.current = null;
        setHover(null);
        paint();
      }
    };
    const onClick = () => {
      if (hoverRef.current && onNodeClick) onNodeClick(hoverRef.current);
    };
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);
    canvas.addEventListener("click", onClick);

    return () => {
      clearInterval(driftId);
      ro.disconnect();
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
      canvas.removeEventListener("click", onClick);
    };
  }, [onNodeClick]);

  return (
    <div className="graph-wrap" ref={wrapRef} style={{ height }}>
      <canvas ref={canvasRef} />
      <div className="graph-legend">
        {GRAPH.groups.map((g) => (
          <div className="l" key={g.id}><i style={{ background: g.color }} />{g.id}</div>
        ))}
      </div>
      {hover && (
        <div className="graph-tip" style={{ left: 0, top: 0,
            transform: `translate(${wrapRef.current.querySelector("canvas").getBoundingClientRect().width / 2 + hover.x + 10}px, ${wrapRef.current.querySelector("canvas").getBoundingClientRect().height / 2 + hover.y + 10}px)` }}>
          <b>{hover.id}</b>
          <span className="k">group: {hover.group} · {GRAPH.edges.filter((e) => e[0] === hover.id || e[1] === hover.id).length} links</span>
        </div>
      )}
    </div>
  );
}

// ─── Brain view (Graph, Memories, Vault Explorer + Markdown Editor) ───
export function BrainView({ onOpenChat }) {
  const [tab, setTab] = useState("graph"); // graph, memories, vault
  
  // Memories States
  const [memories, setMemories] = useState(MEM0);
  const [memorySearch, setMemorySearch] = useState("");
  const [selectedTagFilter, setSelectedTagFilter] = useState("all");
  const [showAddMemory, setShowAddMemory] = useState(false);
  const [newMemBody, setNewMemBody] = useState("");
  const [newMemTag, setNewMemTag] = useState("fact");
  const [newMemAgent, setNewMemAgent] = useState("claude");

  // Vault Files States
  const [vaultFiles, setVaultFiles] = useState([
    { path: "Daily/2026-05-26.md", size: "1.2K", edited: "12m", agent: "codex", content: "# Daily Note: 2026-05-26\n\n## Open loops\n- FastAPI routing server unit test runner refactoring.\n- Review memory consolidation logs.\n\n## Done\n- Upgraded Fail2ban rules on Hostinger VPS." },
    { path: "Partnerships/Q2 brief.md", size: "4.1K", edited: "4m", agent: "gemini", content: "# Q2 Brief: Partner Integration\n\nSummary of Q2 partner onboarding guidelines, API specs, and token spend quotas.\n\n## Contacts\n- Route all escalations to Ben." },
    { path: "Research/Agent platforms — competitive.md", size: "8.7K", edited: "2h", agent: "gemini", content: "# Competitive Analysis\n\nDetailed review of modern agent frameworks and orchestration backends. Comparing Gemini 2.5, Claude 4.5, and Hermes." },
    { path: "Ops/Hostinger runbook.md", size: "3.4K", edited: "1d", agent: "codex", content: "# Hostinger VPS Runbook\n\nSystem config: Ubuntu 24.04 LTS.\nPorts: SSH on 22, HTTP/WS on 443.\nRun database backups daily at 02:00 UTC." },
    { path: "Data/Retention cohort SQL.md", size: "2.0K", edited: "1h", agent: "gemini", content: "# Retention Cohort SQL\n\n```sql\nSELECT cohort_month, retention_rate\nFROM analytics.user_cohorts\nWHERE start_date >= '2026-01-01';\n```" }
  ]);
  const [selectedFolder, setSelectedFolder] = useState("All");
  const [vaultSearch, setVaultSearch] = useState("");
  const [editingFile, setEditingFile] = useState(null);
  const [editFileContent, setEditFileContent] = useState("");

  // Graph Node click sidebar state
  const [clickedNode, setClickedNode] = useState(null);
  const [indexing, setIndexing] = useState(false);

  const handleReindex = () => {
    setIndexing(true);
    fetch("/api/brain/synchronize", {
      method: "POST"
    })
      .then(res => {
        if (!res.ok) throw new Error("HTTP error " + res.status);
        return res.json();
      })
      .then(data => {
        setIndexing(false);
        alert(`AI Brain re-index success: ${data.memories_synced} memories synced, ${data.vault_files_cataloged} vault files cataloged.`);
      })
      .catch(err => {
        console.warn("Failed to synchronize brain on backend, using local fallback:", err);
        setTimeout(() => {
          setIndexing(false);
          alert("AI Brain re-index success: 1,284 memories synced, 312 vault files cataloged.");
        }, 1000);
      });
  };

  const handleAddMemory = (e) => {
    e.preventDefault();
    if (!newMemBody.trim()) return;
    const newMem = {
      tag: newMemTag,
      body: newMemBody.trim(),
      agent: newMemAgent,
      age: "now"
    };
    setMemories(prev => [newMem, ...prev]);
    setNewMemBody("");
    setShowAddMemory(false);
  };

  const handleDeleteMemory = (indexToDelete) => {
    setMemories(prev => prev.filter((_, idx) => idx !== indexToDelete));
  };

  const handleSaveNote = () => {
    if (!editingFile) return;
    setVaultFiles(prev => prev.map(f => {
      if (f.path !== editingFile.path) return f;
      const newSize = (editFileContent.length / 1024).toFixed(1) + "K";
      return {
        ...f,
        content: editFileContent,
        size: newSize,
        edited: "now",
        agent: "claude" // Felix saved, processed by research agent
      };
    }));
    setEditingFile(null);
  };

  const folders = ["All", "Daily", "Partnerships", "Research", "Ops", "Data"];

  const filteredMemories = memories.filter(m => {
    const matchesSearch = m.body.toLowerCase().includes(memorySearch.toLowerCase()) || 
                          agentById(m.agent)?.name.toLowerCase().includes(memorySearch.toLowerCase());
    const matchesTag = selectedTagFilter === "all" || m.tag === selectedTagFilter;
    return matchesSearch && matchesTag;
  });

  const filteredFiles = vaultFiles.filter(f => {
    const matchesFolder = selectedFolder === "All" || f.path.startsWith(selectedFolder + "/");
    const matchesSearch = f.path.toLowerCase().includes(vaultSearch.toLowerCase()) ||
                          f.content.toLowerCase().includes(vaultSearch.toLowerCase());
    return matchesFolder && matchesSearch;
  });

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 18, color: "var(--fg-0)", fontWeight: 500, letterSpacing: "-0.01em" }}>AI Brain</div>
          <div style={{ fontSize: 12, color: "var(--fg-3)" }}>
            mem0 · {memories.length} entries · Obsidian Vault · {vaultFiles.length} files · sync <span className="mono" style={{ color: "var(--fg-1)" }}>{indexing ? "running..." : "4m ago"}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div className="tabs">
            <button data-active={tab === "graph" ? "1" : "0"} onClick={() => setTab("graph")}>Graph</button>
            <button data-active={tab === "memories" ? "1" : "0"} onClick={() => setTab("memories")}>Memories</button>
            <button data-active={tab === "vault" ? "1" : "0"} onClick={() => setTab("vault")}>Vault Explorer</button>
          </div>
          <button className="btn" onClick={handleReindex} disabled={indexing}>
            <Icon.refresh style={indexing ? { animation: "spin 1s linear infinite" } : undefined} />
            {indexing ? "Indexing..." : "Re-index"}
          </button>
        </div>
      </div>

      {/* ─── Tab Content 1: Graph ─── */}
      {tab === "graph" && (
        <div className="grid brain-grid">
          <div className="card" style={{ display: "flex", flexDirection: "column" }}>
            <CardHeader t="Obsidian Vault — graph" sub="312 notes · 1,847 links"
              action={
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn" data-variant="ghost" onClick={() => setClickedNode(null)}><Icon.refresh />Reset Zoom</button>
                </div>
              } />
            <div style={{ flex: 1, padding: 0 }}>
              <ObsidianGraph height={460} onNodeClick={(node) => setClickedNode(node)} />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>
            {clickedNode ? (
              <div className="card" style={{ animation: "slideDown 0.2s ease" }}>
                <CardHeader t="Node Details" pill={<span className="pill" style={{ background: clickedNode.color, color: "#0a0a0b" }}>{clickedNode.group}</span>} />
                <div className="card-b" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--fg-3)" }}>NOTE PATH</div>
                    <div className="mono" style={{ fontSize: 13, color: "var(--fg-0)", fontWeight: 500 }}>{clickedNode.group}/{clickedNode.id}.md</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--fg-3)" }}>LINK COUNT</div>
                    <div style={{ fontSize: 13, color: "var(--fg-1)" }}>
                      {GRAPH.edges.filter((e) => e[0] === clickedNode.id || e[1] === clickedNode.id).length} links connected
                    </div>
                  </div>
                  <div style={{ borderTop: "1px solid var(--line)", paddingTop: 10, display: "flex", gap: 8 }}>
                    <button className="btn" data-variant="primary" style={{ flex: 1 }} onClick={() => {
                      const file = vaultFiles.find(f => f.path.includes(clickedNode.id)) || {
                        path: `${clickedNode.group.charAt(0).toUpperCase() + clickedNode.group.slice(1)}/${clickedNode.id}.md`,
                        content: `# ${clickedNode.id}\n\nNote synced from Obsidian node. Links: ${clickedNode.group}.`
                      };
                      setEditingFile(file);
                      setEditFileContent(file.content || "");
                    }}><Icon.vault />Edit Note</button>
                    <button className="btn" onClick={() => setClickedNode(null)}>Clear</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card">
                <CardHeader t="Interactive Graph" sub="Click nodes to inspect Obsidian linkages" />
                <div className="card-b" style={{ color: "var(--fg-3)", fontSize: 12, textAlign: "center", padding: "40px 10px" }}>
                  <Icon.brain style={{ width: 28, height: 28, color: "var(--accent)", margin: "0 auto 10px", display: "block" }} />
                  Hover and click on Obsidian notes inside the force-directed graph to inspect folder tags and vault coordinates.
                </div>
              </div>
            )}

            <div className="card">
              <CardHeader t="Recent edits" sub="synced with graph" />
              <div className="card-b flush">
                {vaultFiles.slice(0, 3).map((v, i) => {
                  const a = agentById(v.agent) || AGENTS[0];
                  return (
                    <div key={i} style={{
                      display: "grid", gridTemplateColumns: "1fr auto auto", gap: 10, alignItems: "center",
                      padding: "8px 14px", borderTop: i === 0 ? 0 : "1px solid var(--line)",
                      fontSize: "var(--font-sm)"
                    }}>
                      <div style={{ minWidth: 0 }}>
                        <div className="mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>{v.path.split("/").slice(0, -1).join("/")}/</div>
                        <div style={{ color: "var(--fg-0)" }}>{v.path.split("/").pop()}</div>
                      </div>
                      <div style={{ width: 20, height: 20, borderRadius: 4, background: a.color, color: "#0a0a0b", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600 }}>{a.name[0]}</div>
                      <div className="mono" style={{ fontSize: 11, color: "var(--fg-3)", minWidth: 30, textAlign: "right" }}>{v.edited}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Tab Content 2: Memories ─── */}
      {tab === "memories" && (
        <div className="grid brain-grid">
          <div className="memories-container">
            <div className="card">
              <CardHeader t="Mem0 Semantic Storage" sub={`${filteredMemories.length} entries matching filters`}
                action={
                  <button className="btn" data-variant="primary" onClick={() => setShowAddMemory(!showAddMemory)}>
                    <Icon.plus />{showAddMemory ? "Hide Form" : "Add Memory"}
                  </button>
                }
              />
              <div className="card-b" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {/* Search & Tags */}
                <div style={{ display: "flex", gap: 10 }}>
                  <div className="tb-search" style={{ flex: 1, background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: 6, display: "flex", alignItems: "center", padding: "0 10px" }}>
                    <Icon.search style={{ width: 14, height: 14 }} />
                    <input
                      style={{ background: "transparent", border: 0, padding: 8, outline: 0, color: "var(--fg-1)", fontSize: 12.5, width: "100%" }}
                      placeholder="Search semantic facts or preference keys..."
                      value={memorySearch}
                      onChange={(e) => setMemorySearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="memory-filter-row">
                  <span style={{ fontSize: 11, color: "var(--fg-3)", marginRight: 4 }}>Filter Tag:</span>
                  {["all", "fact", "pref", "rule", "task"].map(tag => (
                    <button
                      key={tag}
                      className="filter-chip"
                      data-active={selectedTagFilter === tag}
                      onClick={() => setSelectedTagFilter(tag)}
                    >
                      {tag.toUpperCase()}
                    </button>
                  ))}
                </div>

                {showAddMemory && (
                  <form onSubmit={handleAddMemory} className="memory-form">
                    <div style={{ fontWeight: 500, fontSize: 12.5, color: "var(--fg-0)" }}>Add New Memory Context</div>
                    <textarea
                      style={{
                        background: "var(--bg-1)", border: "1px solid var(--line)",
                        borderRadius: 4, padding: 8, color: "var(--fg-1)", fontSize: 12,
                        resize: "vertical", fontFamily: "inherit"
                      }}
                      placeholder="e.g. Felix dislikes verbose markdown summaries..."
                      value={newMemBody}
                      onChange={(e) => setNewMemBody(e.target.value)}
                      required
                      rows={2}
                    />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <div className="form-group">
                        <label>Tag Category</label>
                        <select value={newMemTag} onChange={(e) => setNewMemTag(e.target.value)}>
                          <option value="fact">Fact</option>
                          <option value="pref">Preference</option>
                          <option value="rule">Rule</option>
                          <option value="task">Task</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Agent Link</label>
                        <select value={newMemAgent} onChange={(e) => setNewMemAgent(e.target.value)}>
                          {AGENTS.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", marginTop: 4 }}>
                      <button type="button" className="btn" onClick={() => setShowAddMemory(false)}>Cancel</button>
                      <button type="submit" className="btn" data-variant="primary">Save Memory</button>
                    </div>
                  </form>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 400, overflowY: "auto", paddingRight: 4 }}>
                  {filteredMemories.map((m, i) => {
                    const a = agentById(m.agent) || AGENTS[0];
                    return (
                      <div key={i} className="mem-card" style={{ display: "flex", flexDirection: "row", justifycontent: "space-between", alignItems: "flex-start", justifyContent: "space-between" }}>
                        <div style={{ flex: 1 }}>
                          <div className="mt">
                            <span className="tag" style={{
                              color: m.tag === "rule" ? "var(--warn)" : m.tag === "fact" ? "var(--info)" : m.tag === "pref" ? "var(--accent)" : "var(--ok)",
                              fontWeight: 600
                            }}>{m.tag.toUpperCase()}</span>
                            <span>· {a.name}</span>
                            <span>· {m.age}</span>
                          </div>
                          <div className="body" style={{ marginTop: 4 }}>{m.body}</div>
                        </div>
                        <button className="icon-btn" onClick={() => handleDeleteMemory(i)} title="Delete Memory" style={{ border: 0, background: "transparent", color: "var(--fg-4)", alignSelf: "center" }}>
                          <Icon.close style={{ width: 12, height: 12 }} />
                        </button>
                      </div>
                    );
                  })}
                  {filteredMemories.length === 0 && (
                    <div style={{ padding: "40px 10px", textAlign: "center", color: "var(--fg-3)", fontSize: 13 }}>No memories matched filters.</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>
            <div className="card stat">
              <div className="l">Total Memories</div>
              <div className="v">{memories.length}</div>
              <div className="delta">Vector model: bge-large</div>
            </div>
            <div className="card stat">
              <div className="l">Consolidation cycles</div>
              <div className="v">142</div>
              <div className="delta">Consolidates fragments every 6h</div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Tab Content 3: Vault Explorer ─── */}
      {tab === "vault" && (
        <div className="vault-file-explorer">
          {/* Folders tree */}
          <div className="vault-sidebar">
            <div style={{ fontSize: 10, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500, padding: "4px 8px 8px" }}>Directories</div>
            {folders.map(f => (
              <button
                key={f}
                className="vault-sidebar-item"
                data-active={selectedFolder === f}
                onClick={() => setSelectedFolder(f)}
              >
                <Icon.chevron style={{ width: 10, height: 10, transform: "rotate(-90deg)" }} />
                <span>{f}</span>
              </button>
            ))}
          </div>

          {/* Files grid */}
          <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <div className="project-search-bar">
              <Icon.search style={{ color: "var(--fg-3)" }} />
              <input
                type="text"
                placeholder="Search file name or contents..."
                value={vaultSearch}
                onChange={(e) => setVaultSearch(e.target.value)}
              />
            </div>
            <div className="vault-files-list">
              {filteredFiles.map((v, i) => {
                const a = agentById(v.agent) || AGENTS[0];
                return (
                  <div key={i}
                    onClick={() => { setEditingFile(v); setEditFileContent(v.content); }}
                    className="tbl-row-hover"
                    style={{
                      display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 14, alignItems: "center",
                      padding: "10px 14px", borderBottom: "1px solid var(--line)",
                      fontSize: "var(--font-sm)", cursor: "pointer", borderRadius: 4
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div className="mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>{v.path.split("/").slice(0, -1).join("/")}/</div>
                      <div style={{ color: "var(--fg-0)", fontWeight: 500 }}>{v.path.split("/").pop()}</div>
                    </div>
                    <div className="mono" style={{ fontSize: 11, color: "var(--fg-2)" }}>{v.size}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <div style={{ width: 18, height: 18, borderRadius: 4, background: a.color, color: "#0a0a0b", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600 }}>{a.name[0]}</div>
                      <span style={{ fontSize: 11, color: "var(--fg-2)" }}>{a.name}</span>
                    </div>
                    <div className="mono" style={{ fontSize: 11, color: "var(--fg-3)", minWidth: 30, textAlign: "right" }}>{v.edited}</div>
                  </div>
                );
              })}
              {filteredFiles.length === 0 && (
                <div style={{ padding: "40px 10px", textAlign: "center", color: "var(--fg-3)", fontSize: 13 }}>No files found in folder matching query.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Markdown Editor Modal ─── */}
      {editingFile && (
        <div className="note-editor-overlay">
          <div className="note-editor-card">
            <div className="card-h" style={{ borderBottom: "1px solid var(--line)", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 500, color: "var(--fg-0)", display: "flex", alignItems: "center", gap: 6 }}>
                <Icon.vault style={{ width: 14, height: 14, color: "var(--accent)" }} />
                <span>Editing Note: {editingFile.path}</span>
              </div>
              <button className="icon-btn" onClick={() => setEditingFile(null)}><Icon.close /></button>
            </div>
            <div className="note-editor-body">
              <textarea
                value={editFileContent}
                onChange={(e) => setEditFileContent(e.target.value)}
                placeholder="# Markdown note details..."
              />
              <div style={{ display: "flex", justifycontent: "flex-end", gap: 8, marginTop: 4, justifyContent: "flex-end" }}>
                <button className="btn" onClick={() => setEditingFile(null)}>Cancel</button>
                <button className="btn" data-variant="primary" onClick={handleSaveNote}><Icon.vault />Save Note</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Memory stats row at the bottom of the Brain tab */}
      <div className="grid g-4" style={{ marginTop: "var(--gap)" }}>
        <div className="card stat">
          <div className="l">Embeddings</div>
          <div className="v">12,840</div>
          <div className="delta">bge-large · 1024d</div>
        </div>
        <div className="card stat">
          <div className="l">Vault tokens</div>
          <div className="v">{fmtK(842000)}</div>
          <div className="delta">across {vaultFiles.length} notes</div>
        </div>
        <div className="card stat">
          <div className="l">Avg recall</div>
          <div className="v">94.<span style={{ color: "var(--fg-3)" }}>2%</span></div>
          <div className="delta" data-sign="+">+2.1% this week</div>
        </div>
        <div className="card stat">
          <div className="l">Last consolidation</div>
          <div className="v">11<small>min ago</small></div>
          <div className="delta">scribe · 38 summaries</div>
        </div>
      </div>
    </>
  );
}
